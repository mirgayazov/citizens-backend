
import db from "./server.js";
import {getAll, getCitizenGroupsQuery, getNamesByType} from "./citizens/citizens-sql.js";
import pkg from 'lodash';

const {chunk} = pkg;

const groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

const getCitizenGroups = async (citizenId) => {
    let groups = await db.any(getCitizenGroupsQuery, [citizenId]);
    return Array.from(groups, g => g.name)
}

const generate = (arr) => {
    let output = [];

    for (let i = 0; i < arr.length; i++) {
        let prefix = output[output.length - 1] ?? '';
        output.push(prefix + `["${arr[i]}"]`)

        output.push(output[output.length - 1] + `["nodes"]`)
        // output.push(prefix + `["${arr[i]}"]` + `["nodes"]`)
    }

    return output
}

export const generateCitizensHierarchy = async (chain) => {
    let allCitizens = await db.any(getAll);
    let citizens = [];

    // const chain = ['city', 'street'];
    // const chain = ['city', 'district'];
    // const chain = ['city','home','country'];
    // const chain = ['country', 'city', 'district', 'street', 'home'];

    for (let i = 0; i < chain.length; i++) {
        let filter = chain[i];
        let data = allCitizens.filter(c => c.type === filter);

        if (i === chain.length - 1) {
            let newLast = []

            for (let i = 0; i < data.length; i++) {
                let oldC = data[i];
                let groups = await getCitizenGroups(oldC.citizenId);
                let newC = {...oldC, groups}
                newLast.push(newC);
            }

            citizens.push(groupBy(newLast, 'name'))
        } else {
            citizens.push(groupBy(data, 'name'))
        }
    }

    for (let i = 0; i < citizens.length - 1; i++) {
        let group = citizens[i];
        for (const groupKey in group) {
            group[groupKey] = citizens[i + 1]
        }
    }
    const parseCombination = (comb) => {
        let output = comb.replaceAll('"]["', '#');
        return output.substring(2, output.length - 2).split('#')
    }
    const hierarchy = citizens[0];
    let combinations = await getCombinations(chain);
    let targetArrays = [];

    function contains(where, what) {
        for (let i = 0; i < what.length; i++) {
            if (where.indexOf(what[i]) === -1) return false;
        }
        return true;
    }

    for (let i = 0; i < combinations.length; i++) {
        let combination = combinations[i];
        let streetCitizens = eval(`hierarchy${combination}`);
        streetCitizens = streetCitizens.filter(citizen => {
            let x = citizen.groups.sort();
            let y = parseCombination(combination).sort();
            // return isEqual(x, y)
            return contains(x, y)
        })
        if (streetCitizens.length) {
            targetArrays.push([generate(parseCombination(combination)), streetCitizens])
        }
    }

    let result = {}
    for (let i = 0; i < targetArrays.length; i++) {
        let address = targetArrays[i];
        let keys = address[0];
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

    const createObjFrom = (arr) => {
        return arr.reduce((acc, cur) => ({...acc, [cur.citizenId]: cur}), {})
    }

    for (let i = 0; i < targetArrays.length; i++) {
        let address = targetArrays[i];
        let keys = address[0];
        let lastKey = keys[keys.length - 1];
        let citizens = address[1].map(citizen => {
            return {
                ...citizen,
                label: citizen.citizenName,
                nodes: {}
            }
        })
        eval(`result${lastKey} = createObjFrom(citizens)`)
    }


    return result
};

export const getCombinations = async (chain) => {
    let names = [];
    for (let i = 0; i < chain.length; i++) {
        let filter = chain[i];
        let currentNames = await db.any(getNamesByType(filter));
        names.push(Array.from(currentNames, n => `["${n.name}"]`))
    }

    const makeCombinations = (arr1, arr2) => {
        let combinations = [];

        for (let i = 0; i < arr1.length; i++) {
            for (let j = 0; j < arr2.length; j++) {
                combinations.push(`${arr1[i]}${arr2[j]}`)
            }
        }

        return combinations
    }

    while (names.length > 1) {
        let [arr1, arr2] = chunk(names, 2)[0];
        let combinations = makeCombinations(arr1, arr2);
        names.shift()
        names.shift()
        names.unshift(combinations);
    }

    return names[0]
};

export default {generateCitizensHierarchy}
