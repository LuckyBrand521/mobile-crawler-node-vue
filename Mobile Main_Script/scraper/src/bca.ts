import { HTTPResponse, LaunchOptions } from "puppeteer";
import puppeteer from "puppeteer-extra";
import xlsx, { WorkSheet } from "xlsx";
import fs from "fs";

import { delay } from "./common";
import { getUserAgent } from "./proxy";
import { databases, connectToDB } from "./db";
import { Connection } from "mysql2/promise";

const saveFolder = "./bca-xlsx/";
let connection: Connection;
const navigationRe = new RegExp(/Navi/i);
const panoramicRe = new RegExp(/Panorama/i);
let leathers: { [key: string]: { id: number, r: RegExp } };
let fuels: { [key: string]: { id: number, r: RegExp } };
let brands = {};
let models = {};

puppeteer.use(require('puppeteer-extra-plugin-stealth')());
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')({
    customFn: getUserAgent
}));

async function getLeathers() {
  const [result]: any = await connection.query("SELECT * FROM mobilecrawler.leathers");
  const leathers: { [key: string]: { id: number, r: RegExp } } = {};
  for (const leather of result) {
    leathers[leather.name] = { id: leather.id, r: new RegExp(leather.name, 'i') };
  }
  return leathers;
};

async function getFuels() {
  const [result]: any = await connection.execute("SELECT id, bca_name as name FROM mobilecrawler.fuel WHERE bca_name IS NOT NULL");
  const fuels: { [key: string]: { id: number, r: RegExp } } = {};
  for (const fuel of result) {
    fuels[fuel.name] = { id: fuel.id, r: new RegExp(fuel.name, 'i') };
  }
  return fuels;
};

async function getBrands() {
  const [results]: any = await connection.query("SELECT brand_id, brand_name FROM mobilecrawler.brand");
  for (const result of results) {
    const { brand_name, brand_id } = result;
    brands[brand_name] = brand_id;
    models[brand_id] = {};
  }
  const [results2]: any = await connection.query("SELECT model_id, model_name, brand_id FROM mobilecrawler.model");
  for (const result of results2) {
    const { model_name, model_id, brand_id } = result;
    models[brand_id][model_name] = model_id;
  }
}


const columns = {
  catalog_number: "B",
  auction_id: "C",
  car_brand: "D",
  car_model: "E",
  version: "G",
  fuel: "K",
  power: "N",
  mileage: "O",
  first_registration: "P",
  url: "AB",
  specials: "W"
}

function getAttribute(ws: WorkSheet, R: number, attribute: string) {
  return ws[xlsx.utils.encode_cell({c:xlsx.utils.decode_col(columns[attribute]), r:R})] ? ws[xlsx.utils.encode_cell({c:xlsx.utils.decode_col(columns[attribute]), r:R})].v.trim() : null;
}

async function scrapeXLSX(auctionBatch: {}) {
  const files = fs.readdirSync(saveFolder);
  for (const file of files) {
    const wb = xlsx.readFile(saveFolder + file);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const name = ws['C2'] ? ws['C2'].v : null;
    //const note = ws['C5'] ? ws['C5'].v : null;
    //const end_date = ws['F5'] ? ws['F5'].v : null;
    let batch_id: string = null;
    let end_date: string = null;
    if (auctionBatch[name]) {
      const { SaleId, SaleCountry, SaleDateDescription, SaleType, SaleName, SaleLocation, SaleFormatter: { EndDate } } = auctionBatch[name];
      batch_id = SaleId;
      end_date = (new Date(parseInt(EndDate.match(/Date\((\d+)\)/)[1]))).toISOString().replace("Z", "");
      await connection.query("INSERT IGNORE INTO auction_batch (batch_id, country, description, type, name, location, end_date) VALUES (?,?,?,?,?,?,?)",
      [SaleId, SaleCountry, SaleDateDescription, SaleType, SaleName, SaleLocation, end_date]);
    }
    for(let R = 7; true; R++) {
      if (ws[xlsx.utils.encode_cell({c:1, r:R})]) {
        const auction = { batch_id, auction_id: null, catalog_number: null, car_brand: null, car_model: null, version: null, end_date, fuel: null, power: null, mileage: null, first_registration: null, navigation: false, panoramic_roof: false, leather: null, url: null };
        auction.catalog_number = getAttribute(ws, R, "catalog_number");
        auction.auction_id = getAttribute(ws, R, "auction_id");
        const brand = getAttribute(ws, R, "car_brand");
        if (brands[brand]) {
          auction.car_brand = brands[brand];
          const model = getAttribute(ws, R, "car_model");
          if (models[auction.car_brand][model]) {
            auction.car_model = models[auction.car_brand][model];
          }
        }
        auction.version = `${getAttribute(ws, R, "car_brand")} ${getAttribute(ws, R, "car_model")} ${getAttribute(ws, R, "version")}`;
        const fuel = getAttribute(ws, R, "fuel");
        for (const { id, r } of Object.values(fuels)) {
          if (fuel.match(r)) auction.fuel = id;
        }
        auction.power = getAttribute(ws, R, "power") ? parseInt(getAttribute(ws, R, "power")) : null;
        auction.mileage = getAttribute(ws, R, "mileage") ? parseInt(getAttribute(ws, R, "mileage").replace(".", "")) : null;
        const date = getAttribute(ws, R, "first_registration") ? getAttribute(ws, R, "first_registration").split(".") : null;
        if (date.length === 3)
          auction.first_registration = `${date[2]}-${date[1]}-${date[0]}`;
        auction.url = getAttribute(ws, R, "url");
        const specials = getAttribute(ws, R, "specials");
        if (specials) {
          for (const { id, r } of Object.values(leathers)) {
            if (specials.match(r)) auction.leather = id;
          }
          if (specials.match(navigationRe)) auction.navigation = true;
          if (specials.match(panoramicRe)) auction.panoramic_roof = true;
        }
        //console.log(auction);
        const a = Object.entries(auction);
        const columns = a.map(([column, value]) => column).join(", ");
        const placeholders = a.map(([column, value]) => "?").join(", ");
        const values = a.map(([column, value]) => value);
        console.log(auction);
        await connection.query(`INSERT INTO auction (${columns}) VALUES (${placeholders}) as new ON DUPLICATE KEY UPDATE version=new.version, end_date=new.end_date, first_registration=new.first_registration, mileage=new.mileage, power=new.power, fuel=new.fuel, version=new.version, leather=new.leather, navigation=new.navigation, panoramic_roof=new.panoramic_roof`, [...values]);
      }
      else break;
    }
  }
}

async function crawl() {
  connection = await connectToDB(databases.bca);
  fuels = await getFuels();
  leathers = await getLeathers();
  await getBrands();
  const browser = await puppeteer.launch({ headless: true } as LaunchOptions);
  const page = await browser.newPage();
  let auctionBatch: any = {};
  let finished = false;
  page.on('response', async function (res: HTTPResponse) {
    if (res.url().startsWith("https://de.bca-europe.com/buyer/facetedSearch/GetSaleCalendarViewModel")) {
      const json = await res.json();
      if (json.SaleCalendarViewModel.length) {
        for (const {Name, Values} of json.SaleCalendarViewModel) {
          for (const val of Values) {
            auctionBatch[val.SaleFormatter.SaleName] = val;
          }
        }
      }
      else {
        finished = true;
      }
    }
  });

  let i = 1;
  while (!finished) {
    await page.goto(`https://de.bca-europe.com/buyer/facetedSearch/saleCalendar?page=${i}&bq=%7Csalecountry_exact:DE&currentFacet=salecountry_exact`, { waitUntil: "networkidle2" });
    i++;
    await delay(500);
  }

  if (!fs.existsSync(saveFolder)) {
    fs.mkdirSync(saveFolder);
  }
  else {
    fs.rmSync(saveFolder, { force: true, recursive: true });
    fs.mkdirSync(saveFolder);
  }
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: saveFolder,
  });

  for (const auction of Object.values<any>(auctionBatch)) {
    let files = fs.readdirSync(saveFolder).length;
    try {
      await page.goto(`https://de.bca-europe.com/${auction.SearchTargetUrl}`, { waitUntil: "networkidle2" });
      if (await page.waitForSelector('a[value="Export All"]', { timeout: 2000 })) {
        await page.$$eval('a[value="Export All"]', (el) => (el[1] as HTMLAnchorElement).click());
        while (true) {
          if (fs.readdirSync(saveFolder).length > files) break;
          await delay(500);
        }
      }
    }
    catch (err) {
      console.log(err);
    }
  }

  await scrapeXLSX(auctionBatch);

  await delay(10000);
  await browser.close();
}

crawl().then(() => console.log("Finished"));
//scrapeXLSX([]);