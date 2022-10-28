import { readCsvFrom } from "./utils";

import { dbConnection } from "./database"

const path = './src/data/rNumber.csv';

export async function createSerialNumber(
    serie: string,
    stoneCode: string,
    materialCode: string
) {
    type dataFromCsv = {
        rNumber: number;
    }
    let amount: number;
    let serialNumber: string;
    console.log("importing csv file from path: ", path);
    const data = await readCsvFrom(path) as dataFromCsv[];
    dbConnection.getConnection((err, connection) => {
        if (err) throw err
        console.log(`connected as id ${connection.threadId}`);
        connection.query('SELECT `serie`, `stoneCode`, `materialCode`, `amount` FROM `product` WHERE `serie`=? AND `stoneCode`=? AND `materialCode`=?', [serie, stoneCode, materialCode], (err, rows) => {   
            if (!err) {
                if (rows.length == 1) {
                    amount = rows[0].amount;
                    serialNumber = serie + stoneCode + materialCode + data[amount].rNumber;
                    console.log(serialNumber, amount);
                    
                    connection.query('INSERT INTO `serialNumber` (serialNumber) VALUES (?)', [serialNumber], (err, rows) => {
                        if (!err) {
                            connection.query('UPDATE `product` SET `amount` = ? WHERE `serie`=? AND `stoneCode`=? AND `materialCode`=?', [+amount+1, serie, stoneCode, materialCode], (err, rows) => {
                                if (!err) {
                                    connection.release();
                                    console.log("Success");
                                    
                                }
                                else {
                                    console.log(err); 
                                }
                            })
                            
                            
                        }
                        else {
                            console.log(err); 
                        }
                    })
                }
                else {
                    console.log("Error: Duplicate products ", rows);           
                }
            } else {
                console.log(err)
            }
        })
    })
}