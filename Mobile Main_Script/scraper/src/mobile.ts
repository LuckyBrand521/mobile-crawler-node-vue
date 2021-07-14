import puppeteer from 'puppeteer-extra';
import { Cluster } from "puppeteer-cluster";
import { exec } from "child_process";
import { getProxy, getUserAgent } from "./proxy";
import useProxy from "puppeteer-page-proxy";
import { databases, connectToDB } from "./db";
import { delay } from "./common";
import { Connection } from "mysql2/promise";
import { LaunchOptions, Page } from "puppeteer";
//const http = require('http');
//const prom_client = require('prom-client');
//const gauge = new prom_client.Gauge({ name: 'scraping_percentage', help: 'Percentage of website scraped' });
//gauge.set(0);

let connection: Connection;
let cookies = "";

puppeteer.use(require('puppeteer-extra-plugin-stealth')());
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')({
    customFn: getUserAgent
}))

const id_regex = /id=([0-9]+)/;
const BASE_URL = "https://suchen.mobile.de";

interface CarOptions {
    brand: string, 
    model?: string, 
    yearFrom?: string, 
    yearTo?: string, 
    mileageFrom?: string, 
    mileageTo?: string, 
    usage?: string, 
    priceFrom?: string, 
    priceTo?: string, 
    count?: number
}

interface Parameters {
    brands: {
        [key: string]: string;
    }, 
    models: {
        [key: string]: { 
            [key: string]: string 
        } 
    }, 
    filters: {
        prices: number[], 
        years: number[], 
        mileages: number[] 
    } 
}

async function getNewCookies() {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] } as LaunchOptions);
    const page = await browser.newPage();
    await page.goto("https://www.mobile.de/", { waitUntil: "domcontentloaded" });
    const cookie = await page.cookies();
    const newCookies = cookie.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    cookies = newCookies;
    await browser.close();
}

function urlBuilder({ brand, model="", yearFrom="", yearTo="", mileageFrom="", mileageTo="", usage="", priceFrom="", priceTo="", count=1 }: CarOptions): string {
    const params = new URLSearchParams({
        "isSearchRequest": "true",
        "scopeId": "C",
        "damageUnrepaired": "NO_DAMAGE_UNREPAIRED",
        "sfmr": "false",
        "minPrice": priceFrom,
        "maxPrice": priceTo,
        "minFirstRegistrationDate": yearFrom,
        "maxFirstRegistrationDate": yearTo,
        "makeModelVariant1.makeId": brand,
        "makeModelVariant1.modelId": model,
        "minMileage": mileageFrom,
        "maxMileage": mileageTo,
        "usage": usage,
        "pageNumber": String(count),
    });
    return `${BASE_URL}/fahrzeuge/search.html?${params.toString()}`;
}

function getCarNumber({ brand, model="", yearFrom="", yearTo="", mileageFrom="", mileageTo="", usage="", priceFrom="", priceTo="" }: CarOptions): Promise<number> {
    return new Promise(function (resolve, reject) {
        const params = new URLSearchParams({
            "isSearchRequest": "true",
            "scopeId": "C",
            "damageUnrepaired": "NO_DAMAGE_UNREPAIRED",
            "sfmr": "false",
            "minPrice": priceFrom,
            "maxPrice": priceTo,
            "minFirstRegistrationDate": yearFrom,
            "maxFirstRegistrationDate": yearTo,
            "climatisation": "",
            "adLimitation": "",
            "makeModelVariant1.makeId": brand,
            "makeModelVariant1.modelId": model,
            "makeModelVariant1.modelDescription": "",
            "minMileage": mileageFrom,
            "maxMileage": mileageTo,
            "usage": usage,
            "minPowerAsArray": "KW",
            "maxPowerAsArray": "KW",
        });
        exec(`curl -s --location --request GET '${BASE_URL}/fahrzeuge/count.json?${params.toString()}' \
        --header 'authority: suchen.mobile.de' \
        --header 'pragma: no-cache' \
        --header 'cache-control: no-cache' \
        --header 'accept: application/json, text/plain, */*' \
        --header 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36' \
        --header 'accept-language: en-US,en;q=0.9' \
        --header 'cookie: ${cookies}' \
        --header 'Connection: keep-alive'`, 
        async (error, stdout, stderr) => {
            if(error) reject(error);
            else {
                try {
                    resolve(parseInt(JSON.parse(stdout)['numResultsTotal']));
                } catch (error) {
                    await getNewCookies();
                    console.log('Changed cookies');
                    resolve(await getCarNumber({ brand, model, yearFrom, yearTo, mileageFrom, mileageTo, usage, priceFrom, priceTo }));
                }
            }
        })
    });
}

async function getPageCount({ page, data: url }: { page: Page, data: string }) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const pages = await page.$$eval('ul.pagination span', buttons => buttons.map(btn => Number(btn.textContent)).filter(num => !Number.isNaN(num)));
    const max = Math.max(...pages);
    return Number.isFinite(max) ? max : 1;
}

async function getParameters() {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] } as LaunchOptions);
    const page = await browser.newPage();
    await page.goto("https://www.mobile.de/", { waitUntil: "domcontentloaded" });
    await delay(2000);
    const brandSelect = await page.$("#qsmakeBuy");
    const modelSelect = await page.$("#qsmodelBuy");
    const brands: {[key: string]: string} = {};
    const models: {[key: string]: { [key: string]: string } } = {};
    for(const brand of await brandSelect.$$("option[value]:not([value=''])")) {
        const brand_id = await brand.evaluate<(el) => string>((el: HTMLOptionElement) => el.value);
        const name = await brand.evaluate<(el) => string>(b => b.innerText);
        brands[brand_id] = name;
        await connection.execute('INSERT IGNORE INTO brand (brand_id, brand_name) VALUES (?,?)', [brand_id, name]);
    }
    for(const brand_id in brands) {
        await brandSelect.$eval<any>(`option[value='${brand_id}']`, (option: any) => option.selected = true);
        await brandSelect.evaluate<(el) => string>(b => b.dispatchEvent(new Event("change")));
        await delay(200);
        const models_brand: {[key: string]: string} = {};
        for(const model of await modelSelect.$$("option[value]:not([data-modelgroup]):not([value=''])")) {
            const model_id = await model.evaluate<(el) => string>(el => el.value);
            const model_name = await model.evaluate<(el) => string>(b => b.innerText.trim())
            models_brand[model_id] = model_name;
            await connection.execute('INSERT IGNORE INTO model (model_id, model_name, brand_id) VALUES (?,?,?)', [model_id, model_name, brand_id]);
        }
        models[brand_id] = models_brand;
    }
    const years: number[] = [];
    for(const yearEl of await page.$$("#qsfrgwrp select option[value]:not([value=''])")) {
        years.push(Number(await yearEl.evaluate<(el) => string>(el => el.value)));
    }
    const mileages: number[] = [];
    for(const milEl of await page.$$("#qsmilwrp select option[value]:not([value=''])")) {
        mileages.push(Number(await milEl.evaluate<(el) => string>(el => el.value)));
    }
    const prices: number[] = [];
    for(const priceEl of await page.$$("#qsprcwrp select option[value]:not([value=''])")) {
        prices.push(Number(await priceEl.evaluate<(el) => string>(el => el.value)));
    }
    const filters = {
        prices,
        years,
        mileages,
    };
    await browser.close();
    return { brands, models, filters };
}


(async () => {
    console.log("SCRAPER LAUNCHING...");
    connection = await connectToDB(databases.mobile);
    await connection.execute('UPDATE info SET last_scrape_start = CURRENT_TIMESTAMP()');

    /*http.createServer(async function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(await prom_client.register.metrics());
    }).listen(8085);*/

    console.log("GETTING INFORMATION ABOUT BRANDS, MODELS...");
    const caroptions: CarOptions[] = [];
    const { brands, models, filters }: Parameters = await getParameters();

    let modelsCount = 0;
    Object.values(models).forEach(el => modelsCount += Object.keys(el).length);
    let tmpcounter = 0;

    async function filterBrands(usage: "USED" | "NEW") {
        //console.log("Brand filtering");
        for (const brand in brands) {
            await filterModels(brand, usage);
        }
    }
    

    async function filterModels(brand, usage) {
        //console.log("Model filtering");
        for (const model in models[brand]) {
            const carNum = await getCarNumber({ brand, model, usage });
            //console.log(`Brand: ${brand}, Model: ${model}, Cars: ${carNum}`);
            if(carNum > 1000) {
                if(usage === "USED") {
                    await filterRegistration({ brand, model, usage });
                }
                else if(usage === "NEW") {
                    await filterPrice({ brand, model, usage });
                }
            }
            else {
                const pageCount = Math.ceil(carNum / 20);
                for (let count = 1; count <= pageCount; count++) {
                    caroptions.push({ brand, model, count, usage });
                }
            }
            tmpcounter++;
            console.log(`${tmpcounter}/${modelsCount} models filtered. All pages: ${caroptions.length}`);
        }
    }

    async function filterRegistration(parameters) {
        //console.log("Year filtering");
        const years = filters['years'];
        for (let i = 0; i < years.length; i++) {
            const year = years[i];
            let carNum = await getCarNumber({ ...parameters, yearFrom: year, yearTo: year });
            //console.log("Year:", year, "Cars:", carNum);
            if(carNum > 1000) {
                //Additional Filter
                await filterPrice({ ...parameters, yearFrom: year, yearTo: year });
            }
            else {
                let filterCount = carNum;
                let isFinished = true;
                let j: number;
                const yearTo = year;
                for (j = i+1; j < years.length; j++) {
                    //console.log("Current filter count:", filterCount);
                    const yearFrom = years[j];
                    carNum = await getCarNumber({ ...parameters, yearFrom: yearFrom, yearTo: yearTo });
                    //console.log("Year from:", yearFrom, "Year to:", yearTo, "Cars:", carNum);
                    if(filterCount + carNum > 1000) {
                        //console.log(`filter with ${yearTo} and ${years[j-1]}`);
                        const pageCount = Math.ceil(filterCount / 20);
                        for (let count = 1; count <= pageCount; count++) {
                            caroptions.push({ ...parameters, yearTo: yearTo, yearFrom: years[j-1], count });
                        }
                        i = j-1;
                        isFinished = false;
                        break;
                    }
                    filterCount += carNum;
                }
                if(isFinished) {
                    //console.log(`filter with ${yearTo} and ${years[j-1]}`);
                    const pageCount = Math.ceil(filterCount / 20);
                    for (let count = 1; count <= pageCount; count++) {
                        caroptions.push({ ...parameters, yearTo: yearTo, yearFrom: years[j-1], count });
                    }
                    break;
                }
            }
        }
    }

    async function filterPrice(parameters) {
        //console.log("Price filter");
        const prices = filters['prices'];
        for (let i = 0; i < prices.length; i++) {
            const priceFrom = prices[i];
            let j: number;
            let isFinished = true;
            let carNum: number;
            let pageCount: number;
            for (j = i+1; j < prices.length; j++) {
                const priceTo = prices[j];
                carNum = await getCarNumber({ ...parameters, priceFrom, priceTo });
                //console.log(`Price From: ${priceFrom}, Price To: ${priceTo}, Cars: ${carNum}`);
                if(carNum > 1000) {
                    if(priceFrom === prices[j-1]) {
                        if(parameters.usage === "USED") {
                            await filterMileage({ ...parameters, priceFrom, priceTo });
                        }
                        else {
                            console.log("WE NEED ANOTHER FILTER!", { ...parameters, priceFrom, priceTo });
                            for (let count = 1; count <= 50; count++) {
                                caroptions.push({ ...parameters, priceFrom, priceTo, count });
                            }
                        }
                        i = j-1;
                    }
                    else {
                        //console.log(`Filter with ${priceFrom} and ${prices[j-1]}`);
                        carNum = await getCarNumber({ ...parameters, priceFrom, priceTo: prices[j-1] });
                        pageCount = Math.ceil(carNum / 20);
                        for (let count = 1; count <= pageCount; count++) {
                            caroptions.push({ ...parameters, priceFrom, priceTo: prices[j-1], count });
                        }
                        i = j-2;
                    }
                    isFinished = false;
                    break;
                }
            }
            if(isFinished) {
                //console.log(`Filter with ${priceFrom} and ${prices[j-1]}`);
                carNum = await getCarNumber({ ...parameters, priceFrom, priceTo: prices[j-1] });
                pageCount = Math.ceil(carNum / 20);
                for (let count = 1; count <= pageCount; count++) {
                    caroptions.push({ ...parameters, priceFrom, priceTo: prices[j-1], count });
                }
                break;
            }
        }
    }

    async function filterMileage(parameters) {
        //console.log("Mileage filter");
        const mileages = filters['mileages'];
        for (let i = 0; i < mileages.length; i++) {
            const mileageFrom = mileages[i];
            let j;
            let isFinished = true;
            let carNum;
            let pageCount;
            for (j = i+1; j < mileages.length; j++) {
                const mileageTo = mileages[j];
                carNum = await getCarNumber({ ...parameters, mileageFrom, mileageTo });
                //console.log(`Mileage From: ${mileageFrom}, Mileage To: ${mileageTo}, Cars: ${carNum}`);
                if(carNum > 1000) {
                    if(mileageFrom === mileages[j-1]) {
                        console.log("WE NEED ANOTHER FILTER!", { ...parameters, mileageFrom, mileageTo });
                        for (let count = 1; count <= 50; count++) {
                            caroptions.push({ ...parameters, mileageFrom, mileageTo, count });
                        }
                        i = j-1;
                    }
                    else {
                        //console.log(`Filter with ${mileageFrom} and ${mileages[j-1]}`);
                        carNum = await getCarNumber({ ...parameters, mileageFrom, mileageTo: mileages[j-1] });
                        pageCount = Math.ceil(carNum / 20);
                        for (let count = 1; count <= pageCount; count++) {
                            caroptions.push({ ...parameters, mileageFrom, mileageTo: mileages[j-1], count });
                        }
                        i = j-2;
                    }
                    isFinished = false;
                    break;
                }
            }
            if(isFinished) {
                //console.log(`Filter with ${mileageFrom} and ${mileages[j-1]}`);
                carNum = await getCarNumber({ ...parameters, mileageFrom, mileageTo: mileages[j-1] });
                pageCount = Math.ceil(carNum / 20);
                for (let count = 1; count <= pageCount; count++) {
                    caroptions.push({ ...parameters, mileageFrom, mileageTo: mileages[j-1], count });
                }
                break;
            }
        }
    }

    console.log("FILTERING USED CARS...");
    await filterBrands("USED");
    console.log("FILTERING NEW CARS...");
    await filterBrands("NEW");

    console.log("SCRAPING STARTING");

    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 5,
        monitor: true,
        workerCreationDelay: 500,
        puppeteer,
        timeout: 60000,
        retryLimit: 0,
        retryDelay: 500,
        puppeteerOptions: {
            headless: true,
            timeout: 60000, 
            args: ['--no-sandbox'],
            defaultViewport: {
                width: 1920,
                height: 1080
            }
        } as LaunchOptions
    });

    cluster.on('taskerror', (err, data) => {
        console.log(`Error crawling: ${err.message}`)
        console.log(data);
    });

    await cluster.task(async ({ page, data }: { page: Page, data: CarOptions }) => {
        const { brand, model, usage } = data;
        const url = urlBuilder(data);
        if(data.count > 50) {
            throw new Error("Page number is higher than 50!");
        }
        await page.setViewport({ width: 1920, height: 1080 });
        await page.emulateTimezone("Europe/Berlin");
        await page.goto(url, { waitUntil: "networkidle2" });
        if((await page.$x("//h2[contains(., 'Are you a human?')]")).length) {
            throw new Error("BOT DETECTED!");
        }
        for (const car of await page.$$("div.cBox--resultList div.cBox-body--resultitem")) {
            const url = await car.$eval<any>("a", (a: any) => a.href);
            const id = url.match(id_regex)[1];
            const title = await car.$eval<any>("div.headline-block", (div: any) => div.innerText);
            const price = (await car.$("div.price-block span.h3")) ? await car.$eval<any>("div.price-block span.h3", (div: any) => parseInt(div.innerText.replace(".",""))) : null;
            let [reg, mil, pow] = await car.$eval<any>("div.rbt-regMilPow", (div: any) => div.innerText.split(", "));
            reg = reg.includes("/") ? Number(reg.split("/")[1]) : null;
            mil = mil ? parseInt(mil.replace(".", "")) : null;
            //Don't touch this, it's working weird!
            const re = new RegExp('[0-9]+', 'g');
            if(pow && re.exec(pow)) {
                const matche = re.exec(pow)[0];
                pow = parseInt(matche);
            }
            else pow = null;
            //console.log(id, price, reg, mil, pow);
            await connection.execute('INSERT INTO car (car_id, car_title, car_url, car_brand, car_model, kilometer, reg_date, power, price, car_usage) VALUES (?,?,?,?,?,?,?,?,?,?) as new ON DUPLICATE KEY UPDATE kilometer=new.kilometer, reg_date=new.reg_date, power=new.power, price=new.price',
            [id, title, url, brand, model, mil, reg, pow, price, usage]);
        }
    });

    
    for (const caroption of caroptions) {
        cluster.queue(caroption);
    }

    await cluster.idle();
    await cluster.close();
    await delay(60000);
    await connection.execute('UPDATE info SET last_scrape_end = CURRENT_TIMESTAMP()');
    await connection.end();
})();

process.on('SIGINT', function() {
    process.exit();
});