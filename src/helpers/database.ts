import mysql from 'mysql';
import { config } from "dotenv"
config()
export const dbConnection = mysql.createPool({
    connectionLimit : 10,
    host     : '192.168.1.137', // MYSQL HOST NAME
    user     : 'root', // MYSQL USERNAME
    password : process.env.DB_PASS, // MYSQL PASSWORD
    database : 'purrfectVibes' // MYSQL DB NAME
})