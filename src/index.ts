import express, { Application, Request, Response, NextFunction, ErrorRequestHandler } from "express"
import { Server } from "http"
import createHttpError from "http-errors"
import { config } from "dotenv"
import bodyParser from "body-parser"
import cors from "cors";

import { dbConnection } from "./helpers/database"
import { createSerialNumber } from "./helpers/serialNumber"

config()

const app: Application = express()

const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
    credentials: true,
};

app.use(cors(corsOptions));

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*') // update to match the domain you will make the request from
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept',
    )
    next()
})

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())

app.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.send("Hello from index")
    // fetch("https://3fab-49-228-75-35.ap.ngrok.io/warranty").then(req => req.text()).then(console.log)
})

app.get('/test', (req: Request, res: Response, next: NextFunction) => {
    dbConnection.getConnection((err, connection) => {
        if (err) throw err
        console.log(`connected as id ${connection.threadId}`);
        connection.query('SELECT * from user', (err, rows) => {
            connection.release()
            if (!err) {
                res.send(rows)
            } else {
                console.log(err)
            }
        })
    })
})

app.post('/warranty/register', (req: Request, res: Response) => {
    dbConnection.getConnection((err, connection) => {
        if (err) {
            console.log(err);
            res.sendStatus(500);
            return;
        }
        const { serialNumber, orderId, firstName, lastName, email, phoneNumber } = req.body
        console.log(`connected as id ${connection.threadId}`);
        // check isRegistered
        connection.query('SELECT isRegistered FROM `serialNumber` WHERE `serialNumber` = ?', [serialNumber], (err, rows) => {
            if (rows.length != 0) {
                if (rows[0].isRegistered) {
                    return res
                        .status(400)
                        .send({ error: true, message: 'Serial number already registered' });
                }
                else {
                    // register serial number
                    connection.query('SELECT `id` FROM `user` WHERE `email`=?', [email], (err, rows) => {
                        if (rows.length == 0) {
                            connection.query('INSERT INTO `user` (`firstName`, `lastName`, `email`, `phoneNumber`) VALUES(?,?,?,?)', [firstName, lastName, email, phoneNumber], (err, rows) => {
                                if (err) {
                                    console.log(err);
                                    res.sendStatus(500);
                                    return;
                                }
                            })
                        }
                        else if (rows.length > 1) {
                            console.log("Duplicate email: ", [email]);
                        }
                        else if (err) {
                            console.log(err);
                            res.sendStatus(500);
                            return;
                        }
                        connection.query('INSERT INTO `warranty` (`userId`, `serialNumber`, `orderId`) SELECT `id`, ?, ? FROM `user` WHERE `email`=? ', [serialNumber, orderId, email], (err, rows) => {
                            if (err) {
                                console.log(err);
                                res.sendStatus(500);
                                return;
                            }
                            // set isRegistered to TRUE
                            connection.query('UPDATE `serialNumber` SET `isRegistered` = 1 WHERE `serialNumber` = ?', [serialNumber], (err, rows) => {
                                if (err) {
                                    console.log(err);
                                    res.sendStatus(500);
                                    return;
                                }
                            })
                        })
                    })
                    connection.release()
                    res.sendStatus(201)
                }
            }
            else if (err) {
                console.log(err);
                res.sendStatus(500);
                return;
            }
            else {
                return res
                    .status(400)
                    .send({ error: true, message: 'Invalid serial number' });
            }
        })
    })
})

app.get('/warranty/:serialNumber', (req: Request, res: Response, next: NextFunction) => {
    let serialNumber = req.params.serialNumber;
    if (!serialNumber) {
        return res
            .status(400)
            .send({ error: true, message: 'Please provide serial number' })
    }
    else {
        dbConnection.getConnection((err, connection) => {
            if (err) throw err
            console.log(`connected as id ${connection.threadId}`);
            // check exist serial number
            connection.query('SELECT isRegistered FROM `serialNumber` WHERE `serialNumber` = ?', [serialNumber], (err, rows) => {
                if (rows.length != 0) {
                    if (rows[0].isRegistered) {
                        // slice SN
                        const _serie = serialNumber.slice(0, 3);
                        const _stoneCode = serialNumber.slice(3, 4);
                        const _materialCode = serialNumber.slice(4, 5);
                        console.log(_serie, _stoneCode, _materialCode);
                        
                        // return warranty detail
                        connection.query('SELECT warranty.serialNumber, warranty.orderId, user.firstName, user.lastName, user.email, user.phoneNumber FROM warranty INNER JOIN user ON warranty.userId = user.Id WHERE warranty.serialNumber = ?', [serialNumber], (err, rows) => {
                            if (!err) {
                                connection.release()
                                res.status(201)
                                res.send(rows)
                            } else {
                                console.log(err)
                                res.sendStatus(500);
                                return;
                            }
                        })
                    }
                    else {
                        return res
                            .status(400)
                            .send({ error: true, message: 'Serial number unregistered' });
                    }
                }
                else if (err) {
                    console.log(err);
                    res.sendStatus(500);
                    return;
                }
                else {
                    return res
                        .status(400)
                        .send({ error: true, message: 'Invalid serial number' });
                }
            })
        })
    }
})

app.post('/warranty/admin/createSerialNumber', (req: Request, res: Response) => {
    const { serie, stoneCode, materialCode } = req.body
    createSerialNumber(serie, stoneCode, materialCode);
    res.sendStatus(200);
})


app.use((req: Request, res: Response, next: NextFunction) => {
    next(new createHttpError.NotFound())
})

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    res.status(err.status || 500)
    res.send({
        status: err.status || 500,
        message: err.message,
    })
}

app.use(errorHandler)

const PORT: Number = Number(process.env.PORT) || 3000
const server: Server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})