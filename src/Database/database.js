import { HOST, DB, USER, PASSWORD, DB_PORT } from "../config.js";
import { createPool } from "mysql2/promise";

export const pool = createPool({
    host: HOST,
    database: DB,
    user: USER,
    password: PASSWORD,
    port: DB_PORT
})
// console.log(HOST,DB,PASSWORD,USER,DB_PORT)