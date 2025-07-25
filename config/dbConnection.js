// dbConnection.js
import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const getConnection = () => {
    return mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
    });

};

export default getConnection;
