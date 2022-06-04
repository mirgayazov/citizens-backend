import {cities, citizens} from "./initial-data.js";
import db from "./server.js";
import {
    createCitizenQuery,
    createCityQuery,
    createGroupQuery, getAll, getCitizenGroupsQuery, getClusterQuery, getNamesByType,
} from "./citizens/citizens-sql.js";
import pkg from 'lodash';

const {chunk, isEqual} = pkg;

export const loadData = () => {
    cities.forEach(city => {
        db.one(createCityQuery, [city.id, city.name, city.data])
            .then(() => {
                let cluster = citizens.filter(citizen => citizen.groups.find(group => group["type"] === "city").name.split(' ')[0] === city.name);
                cluster = cluster.map(citizen => {
                    citizen.city_id = city.id
                    return citizen
                })
                cluster.forEach(citizen => {
                    db.one(createCitizenQuery, [citizen.name, citizen.city_id])
                        .then((result) => {
                            citizen.groups.forEach(group => {
                                db.one(createGroupQuery, [result.id, group.type, group.name])
                                    .then((result) => {
                                        console.log(result)
                                    })
                            })
                        })
                })
            })
    })
};

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
        let prefix = output[i - 1] ?? '';
        output.push(prefix + `["${arr[i]}"]`)
    }

    return output
}

export const groupByChain = async () => {
    let allCitizens = await db.any(getAll);
    let citizens = [];

    // const chain = ['city', 'district', 'street'];
    // const chain = ['district', 'city', 'street'];
    const chain = ['street', 'district', 'city'];

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
    for (let i = 0; i < combinations.length; i++) {
        let combination = combinations[i];
        let streetCitizens = eval(`hierarchy${combination}`);
        streetCitizens = streetCitizens.filter(citizen => {
            let x = citizen.groups.sort();
            let y = parseCombination(combination).sort();
            return isEqual(x, y)
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
                    result${key} = {}
                }
            `)
        }
    }

    for (let i = 0; i < targetArrays.length; i++) {
        let address = targetArrays[i];
        let keys = address[0];
        let lastKey= keys[keys.length-1];
        eval(`result${lastKey} = address[1]`)
    }

    console.log(JSON.stringify(result))
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
