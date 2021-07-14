import puppeteer from 'puppeteer-extra';
import { Cluster } from "puppeteer-cluster";
const mysql = require('mysql');
require('dotenv').config({ path: '../.env' });

const connection = mysql.createConnection({ 
    host: process.env.DB_HOST, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASS, 
    database: process.env.DB_MOBILE
});
connection.connect();

puppeteer.use(require('puppeteer-extra-plugin-stealth')());
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    connection.query('UPDATE info SET last_scrape_start = CURRENT_TIMESTAMP()', async function (err, results, fields) {
        if(err) console.log(err);
    });

    const fuels = {};
    connection.query("SELECT * FROM fuel", function (error, results, fields) {
        for(const result of results) {
            fuels[result.name] = result.id;
        }
    })
    const gearboxes = {};
    connection.query("SELECT * FROM gearbox", function (error, results, fields) {
        for(const result of results) {
            gearboxes[result.name] = result.id;
        }
    })
    const leathers = {};
    connection.query("SELECT * FROM leathers", function (error, results, fields) {
        for(const result of results) {
            leathers[result.name] = result.id;
        }
    })
    await delay(2000);

    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 5,
        monitor: true,
        workerCreationDelay: 200,
        puppeteer,
        timeout: 60000,
        puppeteerOptions: {
            headless: true,
            timeout: 60000, 
            defaultViewport: {
                width: 1920,
                height: 1080
            }
        }
    });

    await cluster.task(async ({ page, data: { url, car_id } }) => {
        try {
            await page.goto(url, { waitUntil: "domcontentloaded" });
            const category = (await page.$("#rbt-category-v")) ? (await page.$eval("#rbt-category-v", el => el.innerText.trim())) : "";
            const fuel = (await page.$("#rbt-fuel-v")) ? (await page.$eval("#rbt-fuel-v", el => el.innerText.trim())) : null;
            const four_wheel = (await page.$x("//p[contains(., 'Allradantrieb')]")).length ? true : false;
            const gearbox = (await page.$("#rbt-transmission-v")) ? (await page.$eval("#rbt-transmission-v", el => el.innerText.trim())) : null;
            const leather = (await page.$("#rbt-interior-v")) ? (await page.$eval("#rbt-interior-v", el => el.split(",")[0])) : false;
            const navigation = (await page.$x("//p[contains(., 'Navigationssystem')]")).length ? true : false;
            const panoramic_roof = (await page.$x("//p[contains(., 'Panorama-Dach')]")).length ? true : false;
            const seats = (await page.$("#rbt-numSeats-v")) ? (await page.$eval("#rbt-numSeats-v", el => Number(el.innerText.trim()))) : null;
            connection.query('UPDATE car SET category = ?, fuel = ?, four_wheel = ?, gearbox = ?, leather = ?, navigation = ?, panoramic_roof = ?, seats = ? WHERE car_id = ?',
            [category, fuels[fuel], four_wheel, gearboxes[gearbox], leathers[leather], navigation, panoramic_roof, seats, car_id], async function (err, results, fields) {
                if(err) console.log(err);
            })
        }
        catch(err) {
            console.log(err)
        }
    });
    
    const query = connection.query('SELECT car_id, car_url FROM car');
    query
    .on('error', function(err) {
        console.log(err);
    })
    .on('result', function(row) {
        cluster.queue({ url: row.car_url, car_id: row.car_id });
    });

    await cluster.idle();
    await cluster.close();
    await delay(60000);
    connection.query('UPDATE info SET last_scrape_end = CURRENT_TIMESTAMP()', async function (err, results, fields) {
        if(err) console.log(err);
    });
    connection.end();
})();