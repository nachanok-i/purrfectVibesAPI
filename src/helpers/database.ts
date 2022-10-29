import mysql from 'mysql';
import { config } from "dotenv"
config()
export const dbConnection = mysql.createPool({
    connectionLimit : 10,
    host     : process.env.DB_HOST, // MYSQL HOST NAME
    user     : process.env.DB_USER, // MYSQL USERNAME
    password : process.env.DB_PASS, // MYSQL PASSWORD
    database : process.env.DB_DATABASE // MYSQL DB NAME
})