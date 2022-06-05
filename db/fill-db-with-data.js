import {cities, citizens} from "./data.js";
import {createCitizenQuery, createCityQuery, createGroupQuery} from "../citizens/citizens-sql.js";
import pgPromise from "pg-promise";
import * as dotenv from "dotenv";

dotenv.config({path: '../.env'});

// Тестовые данные для расширения цепочки кластеризации
const countries = ['country', ['Россия', 'Украина', 'Беларусь']];
const houses = ['home', ['дом 42б', 'дом 42а', 'дом 24в', 'дом 24в']];
const clusters = [countries, houses];

const getRandomFrom = array => array[Math.floor(Math.random() * array.length)];

const initialize = async () => {
    citizens.forEach(citizen => {
        clusters.forEach(cluster => {
            let [type, values] = cluster;
            citizen.groups.push({
                type,
                name: getRandomFrom(values)
            })
        })
    })

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

const pgp = pgPromise({});
let db = pgp(`postgres://postgres:${process.env.PG_PASSWORD}@localhost:5432/citizens`);

db.connect()
    .then(async () => {
        await initialize()
        console.log('database filled')
    })
    .catch(err => {
        console.log(err);
    });
