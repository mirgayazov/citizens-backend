import db from "../server.js";
import {getAll, getCitizenGroupsQuery, getNamesByType, getUniqueTypesQuery} from "./citizens-sql.js";
import pkg from 'lodash';

const {chunk} = pkg;

/*
  Фунцкия кластеризует массив однотипных объектов по полю (ключу).
  Clusters - аккумулирует сгруппированные данные.
*/
const groupBy = (array, key) => {
    return array.reduce((clusters, currentElement) => {
        (clusters[currentElement[key]] = clusters[currentElement[key]] || []).push(currentElement);
        return clusters;
    }, {});
};

/*
  Функция возвращает массив имен групп, к которым гражданин принадлежит.
*/
const getCitizenGroups = async (citizenId) => {
    let groups = await db.any(getCitizenGroupsQuery, [citizenId]);
    return Array.from(groups, g => g.name)
}

/*
  Функция на базе массива:
  [ 'Санкт-Петербург г.', 'Светлановский пр-т', 'дом 42б' ]
  генерирует структуру:
  [
  '["Санкт-Петербург г."]',
  '["Санкт-Петербург г."]["nodes"]',
  '["Санкт-Петербург г."]["nodes"]["Светлановский пр-т"]',
  '["Санкт-Петербург г."]["nodes"]["Светлановский пр-т"]["nodes"]',
  '["Санкт-Петербург г."]["nodes"]["Светлановский пр-т"]["nodes"]["дом 42б"]',
  '["Санкт-Петербург г."]["nodes"]["Светлановский пр-т"]["nodes"]["дом 42б"]["nodes"]'
  ]
  Зачем? -> требуется для отображения дерева на фронте.
*/
const generate = (array) => {
    let output = [];

    for (let i = 0; i < array.length; i++) {
        let prefix = output[output.length - 1] ?? '';
        output.push(prefix + `["${array[i]}"]`);
        output.push(output[output.length - 1] + `["nodes"]`);
    }

    return output
}

/*
  Функция на базе цепочки:
  # ['city','street','home']
  строит все возможные комбинации:
  [
  '["Воронеж г."]["Воронежская ул."]["дом 24в"]',
  '["Воронеж г."]["Воронежская ул."]["дом 42а"]',
  '["Воронеж г."]["Воронежская ул."]["дом 42б"]',
   .........
  '["Москва г."]["Нарвская ул."]["дом 24в"]',
  '["Москва г."]["Нарвская ул."]["дом 42а"]',
  '["Москва г."]["Нарвская ул."]["дом 42б"]'
  ]
*/
export const getCombinations = async (chain, context) => {
    let names = [];
    for (let i = 0; i < chain.length; i++) {
        let filter = chain[i];
        let currentNames;
        if (!context) {
            currentNames = await db.any(getNamesByType(filter));
        } else {
            currentNames = context.filter(el => el.type === filter)
            currentNames = currentNames.map(x => x.name)
            currentNames = [...new Set(currentNames)]
            currentNames = currentNames.map(x => ({name: x}))
        }
        names.push(Array.from(currentNames, n => `["${n.name}"]`))
    }

    /*
      Функция на базе двух текущих массивов фильтров генерирует все комбинации.
    */
    const makeCombinations = (arr1, arr2) => {
        let combinations = [];

        for (let i = 0; i < arr1.length; i++) {
            for (let j = 0; j < arr2.length; j++) {
                combinations.push(`${arr1[i]}${arr2[j]}`)
            }
        }

        return combinations
    }

    // Обрабатываем массивы фильтров попарно, последний элемент массива names - аккумулятор.
    while (names.length > 1) {
        let [arr1, arr2] = chunk(names, 2)[0];
        let combinations = makeCombinations(arr1, arr2);
        names.shift()
        names.shift()
        names.unshift(combinations);
    }

    console.log(names[0].length)
    return names[0]
};

/*
  Функция строит объект на базе массива.
  ? -> На фронте структура дерева ожидает объект, а не массив.
*/
const createObjFrom = (arr) => {
    return arr.reduce((acc, cur) => ({...acc, [cur.citizenId ?? cur.id]: cur}), {})
}

/*
  Содержится ли массив what в массиве where.
*/
const contains = (where, what) => {
    for (let i = 0; i < what.length; i++) {
        if (where.indexOf(what[i]) === -1) return false;
    }
    return true;
}

/*
  Функция парсит комбинацию и трансформирует в массив.
*/
const parseCombination = (comb) => {
    // let output = comb.replaceAll('', '#');
    let output = comb.replace(/"]\["/g, '#');
    return output.substring(2, output.length - 2).split('#')
};

/*
  Функция, генерирующая иерархию по заднной цепочке.
  ['city','street','home'] -> 3 записи в таблице для одного жителя
*/
export const generateCitizensHierarchy = async (chain, context, keyNames) => {
    let allCitizens;

    if (context) {
        allCitizens = context
    } else {
        allCitizens = await db.any(getAll);
    }

    let citizens = [];

    for (let i = 0; i < chain.length; i++) {
        let filter = chain[i];
        // Фильтруем всех жителей по критерию # city
        let data = allCitizens.filter(c => c.type === filter);

        /*
          Если текущий фильтр последний в цепочке, то для каждого из этих жителей
          из базы подтягиваем массив содержащий имена групп, к которым они принадлежат
        */
        if (i === chain.length - 1) {
            let newLast = []

            for (let i = 0; i < data.length; i++) {
                let oldC = data[i];
                let groups;

                if (!context) {
                    groups = await getCitizenGroups(oldC.citizenId);
                } else {
                    groups = allCitizens.filter(c => c.id === oldC.id);
                    groups = groups.map(row => row.name)
                }

                let newC = {...oldC, groups}
                newLast.push(newC);
            }

            citizens.push(groupBy(newLast, 'name'))
        } else {
            citizens.push(groupBy(data, 'name'))
        }
    }

    /*
      Для каждой вышестоящей подгруппы,
      (в лоб) ставится в соответсвие группа у которой индекс фильтра выше.
      То есть кластер #0 - жители разбитые по первому фильтру - city:
      {
        "Москва": [...],
        "Воронеж": [...],
        ...
      }
      ---
      кластер #1 - жители разбитые по улицам:
      {
        "Гашека": [...],
        "Ленина": [...],
      }
    */
    for (let i = 0; i < citizens.length - 1; i++) {
        let group = citizens[i];

        for (const groupKey in group) {
            group[groupKey] = citizens[i + 1]
        }
    }

    /*
      hierarchy - на данном этапе не отсортированная иерархия с целевой структурой фильтрации.
    */
    const hierarchy = citizens[0];
    let combinations = await getCombinations(chain, context);
    let targetArrays = [];

    /*
      этап сортировки (фильтрации)
    */
    for (let i = 0; i < combinations.length; i++) {
        let combination = combinations[i];
        let streetCitizens = eval(`hierarchy${combination}`);

        // для каждого адреса фильруем жителей, которые на самом деле не живут по нему.
        streetCitizens = streetCitizens.filter(citizen => {
            let x = citizen.groups.sort();
            let y = parseCombination(combination).sort();
            // return isEqual(x, y)
            return contains(x, y)
        })

        // если кто-то живет добавляем в массив вместе с сгенерированной структурой целевого адреса
        if (streetCitizens.length) {
            targetArrays.push([generate(parseCombination(combination)), streetCitizens])
        }
    }

    // result - конечная иерархия, строится на базе targetArrays.
    let result = {}
    for (let i = 0; i < targetArrays.length; i++) {
        let addressWithCitizens = targetArrays[i];
        let keys = addressWithCitizens[0]; // иерархия адреса (см. выход функции generate())

        // создаем пустую структуру иерархии
        for (let j = 0; j < keys.length; j++) {
            let key = keys[j];
            eval(`
                if (!result${key}) {
                    result${key} = {
                        label: (() => {
                            let ind = key.split('').lastIndexOf('[');
                            return key.substring(ind + 2, key.length - 2)
                        })(),
                        index: j / 2,
                        nodes: {}
                    }
                }
            `)
        }
    }

    // заполняем иерархию жителями
    for (let i = 0; i < targetArrays.length; i++) {
        let address = targetArrays[i];
        let keys = address[0];
        let lastKey = keys[keys.length - 1];

        let citizens = address[1].map(citizen => {
            let label = '';

            if (citizen.citizenName) {
                label = citizen.citizenName
            } else {
                for (let j = 0; j < keyNames.length; j++) {
                    let key = keyNames[j];

                    if (!j) {
                        label += '[' + citizen[key] + ']: '
                    } else {
                        label += '' + citizen[key] + ', '
                    }
                }
                for (const key of keyNames) {
                }
            }
            label = label.substring(0, label.length-2)
            return {
                ...citizen,
                label
            }
        })
        eval(`result${lastKey} = createObjFrom(citizens)`)
    }


    for (let i = 0; i < targetArrays.length; i++) {
        let addressWithCitizens = targetArrays[i];
        let keys = addressWithCitizens[0]; // иерархия адреса (см. выход функции generate())

        for (let j = 0; j < keys.length; j++) {
            let key = keys[j];
            eval(`
                if (result${key} && (j % 2 === 0)) {
                    result${key}.label = result${key}.hasGroupsInfo ? result${key}.label : result${key}.label + '  #групп: ' + Object.keys(result${key}.nodes).length + ', '
                    result${key}.hasGroupsInfo = true;
                }
            `)
        }
    }

    for (let i = 0; i < targetArrays.length; i++) {
        let addressWithCitizens = targetArrays[i];
        let keys = addressWithCitizens[0]; // иерархия адреса (см. выход функции generate())

        for (let j = 0; j < keys.length; j++) {
            let key = keys[j];
            let last = keys[keys.length - 1];
            eval(`
                if (result${key} && (j % 2 === 0)) {
                    result${key}.count = result${key}.count ? result${key}.count + Object.keys(result${last}).length : Object.keys(result${last}).length
                    result${key}.label = result${key}.label + ' %сущностей: ' + result${key}.count
                }
            `)
        }
    }

    for (let i = 0; i < targetArrays.length; i++) {
        let addressWithCitizens = targetArrays[i];
        let keys = addressWithCitizens[0]; // иерархия адреса (см. выход функции generate())

        for (let j = 0; j < keys.length; j++) {
            let key = keys[j];
            eval(`
                if (result${key} && (j % 2 === 0)) {
                    result${key}.label = result${key}.label.substring(0, result${key}.label.indexOf('%')) + result${key}.label.substring(result${key}.label.lastIndexOf('%') + 1)
                }
            `)
        }
    }

    return result
};

const getUniqueTypes = async () => await db.any(getUniqueTypesQuery);

export default {generateCitizensHierarchy, getUniqueTypes}
