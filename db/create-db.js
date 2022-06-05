import pgPromise from "pg-promise";
import * as dotenv from "dotenv";

dotenv.config({path: '../.env'});

const pgp = pgPromise({});
const db = pgp(`postgres://postgres:${process.env.PG_PASSWORD}@localhost:5432/`);

db.connect()
    .then(async () => {
        try {
            await db.any('create database "citizens"')
            console.log('database created')
            pgp.end()
        } catch (e) {
            await db.any('drop database "citizens"')
            console.log('database deleted')
            pgp.end()
        }
    })
    .catch(err => {
        console.log(err);
    });
