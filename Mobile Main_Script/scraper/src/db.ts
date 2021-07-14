import mysql from "mysql2/promise";
require('dotenv').config({ path: '../.env' });

export const databases = {
    mobile: process.env.DB_MOBILE || "mobilecrawler",
    adesa: process.env.DB_ADESA || "adesacrawler",
    autobid: process.env.DB_AUTOBID || "autobidcrawler",
    aldcarmarket: process.env.DB_ALDCARMARKET || "aldcarmarketcrawler",
    bca: process.env.DB_BCA || "bca",
}

export async function connectToDB(database: string) {
    const connection = await mysql.createConnection({ 
        host: process.env.DB_HOST, 
        user: process.env.DB_USER, 
        password: process.env.DB_PASS, 
        database: database
    });
    return connection;
}
