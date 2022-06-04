import express, {json, urlencoded} from "express";
import pgPromise from "pg-promise";
import cors from "cors";
import * as dotenv from "dotenv";
import {groupByChain, loadData} from "./load-data.js";

dotenv.config()

const pgp = pgPromise({});
const db = pgp(`postgres://postgres:${process.env.PG_PASSWORD}@localhost:5432/citizens`);
const port = process.env.PORT || 5000;
const app = express();

app.use(json());
app.use(cors({credentials: true, origin: process.env.CLIENT_URL}));
app.use(urlencoded({limit: "5mb", extended: true}));
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.CLIENT_URL);
    res.setHeader("Access-Control-Allow-Credentials", true);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Access-Control-Allow-Headers"
    );
    next();
});

const router = express.Router();
app.use("/api", router);

// router.get("/tests/diagnostic/:courseId", authMiddleware, generateDiagnosticTest);
// router.get("/tests/general/:courseId", authMiddleware, generateGeneralTest);
// router.post("/tests", authMiddleware, generateTest);
// router.post("/tests/save-answers", authMiddleware, saveTestAnswers);
// router.post("/tests/history", authMiddleware, getTestingHistory);
// router.get("/has-active-configuration/:topicId", authMiddleware, hasActiveConfiguration);

db.connect()
    .then((obj) => {
        console.log(`Congratulations: database connected successfully!`);
        obj.done();
    })
    .then(() => {
        app.listen(port, () => {
            console.log(`API server started at: ${process.env.API_URL}`)
            // loadData()
            groupByChain()
        })
    })
    .catch(err => {
        console.log(`App crashed: database connection problem: `, err.message);
    });

export default db
