import puppeteer from 'puppeteer-extra';
import useProxy from "puppeteer-page-proxy";

import BrandModelMatcher from "./brandmodelMatcher";
import { databases, connectToDB } from "./db";
import { getProxy, getUserAgent } from "./proxy";
import { delay } from './common';

puppeteer.use(require('puppeteer-extra-plugin-stealth')());
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')({
    customFn: getUserAgent
}));

interface Auction {
  car_brand: number | null, 
  car_model: number | null, 
  url: string | null, 
  auction_id: number | null, 
  batch_id: number | null, 
  end_date: string | null, 
  price: number | null, 
  catalog_number: number | null, 
  title: string | null, 
  fuel: number | null, 
  power: number | null, 
  first_registration: string | null, 
  gearbox: number | null, 
  mileage: number | null, 
  navigation: boolean, 
  panoramic_roof: boolean, 
  four_wheel: boolean, 
  leather: number | null,
  size: string | null,
  leder: number | null,
}

/* 
  This function fetches different types of leather from the database
*/
async function getLeathers(conn) {
  const [result]: any = await conn.execute("SELECT * FROM mobilecrawler.leathers");
  const leathers: { [key: string]: { id: number, r: RegExp } } = {};
  for (const leather of result) {
    leathers[leather.name] = { id: leather.id, r: new RegExp(leather.name, 'i') };
  }
  return leathers;
};

async function getGearboxes(conn) {
  const [result]: any = await conn.execute("SELECT * FROM mobilecrawler.gearbox");
  const gearboxes: { [key: string]: { id: number, r: RegExp } } = {};
  for (const gearbox of result) {
    gearboxes[gearbox.name] = { id: gearbox.id, r: new RegExp(gearbox.name, 'i') };
  }
  return gearboxes;
};

async function getFuels(conn) {
  const [result]: any = await conn.execute("SELECT id, autobid_name as name FROM mobilecrawler.fuel WHERE autobid_name IS NOT NULL");
  const fuels: { [key: string]: { id: number, r: RegExp } } = {};
  for (const fuel of result) {
    fuels[fuel.name] = { id: fuel.id, r: new RegExp(fuel.name, 'i') };
  }
  return fuels;
};

async function getTyps(conn) {
  const [result]: any = await conn.execute("SELECT * FROM mobilecrawler.typ");
  const typs: { [key: string]: {id:number, r:RegExp} } = {};
  for (const typ of result) {
      typs[typ.name] = {id: typ.id, r: new RegExp(typ.name, 'i')};
  }
  return typs;
};

function parseDateTime(date, time) {
  const [day, month, year] = date.split(".");
  const [hour, minute] = time.split(":");
  return `${year}-${month}-${day} ${hour}:${minute}:00`;
}

function parseDate(date) {
  const [month, year] = date.split("/");
  return `${year}-${month}-01`;
}


(async () => {
  const connection = await connectToDB(databases.autobid);

  const leathers = await getLeathers(connection);
  const fuels = await getFuels(connection);
  const gearboxes = await getGearboxes(connection);
  const typs = await getTyps(connection);
  const browser = await puppeteer.launch({ headless: true });

  const matcher = await BrandModelMatcher.init();

  const urlRe = new RegExp(/(?:id|auction)=(\d+)/);
  const mileageRe = new RegExp(/([0-9.]+)\s+km/i);
  const registrationRe = new RegExp(/(\d{2})\/(\d{4})/);
  const powerRe = new RegExp(/(\d+)\s+PS/i);
  const fourWheelRe = new RegExp(/Allrad/i);
  const auctionNumRe = new RegExp(/\d+/);
  const dateRe = new RegExp(/(\d{2})\.(\d{2})\.(\d{4})/);
  const timeRe = new RegExp(/(\d{2}):(\d{2})/);
  const navigationRe = new RegExp(/Navi/i);
  const panoramicRe = new RegExp(/Panorama/i);

  function checkGearbox(text: string, auction: Auction) {
    for (const [gearbox, { id, r }] of Object.entries(gearboxes)) {
      if (text.match(r)) auction.gearbox = id;
    }
  }

  function checkFuel(text: string, auction: Auction) {
    for (const [gearbox, { id, r }] of Object.entries(fuels)) {
      if (text.match(r)) auction.fuel = id;
    }
  }

  function checkSpecials(specials: string, auction: Auction) {
    if (specials.match(navigationRe)) auction.navigation = true;
    if (specials.match(panoramicRe)) auction.panoramic_roof = true;
    for (const [leather, { id, r }] of Object.entries(leathers)) {
      if (specials.match(r)) auction.leather = id;
    }
  }
  
  function checkTyp(text: string, auction: Auction) {
    for (const [typ, { id, r }] of Object.entries(typs)) {
        if (text.match(r))
            auction.size = typ;
    }
  }

  function checkLeder(text: string, auction: Auction) {
    if(text.match(/Leder/g))
      auction.leder = 1;
  }
  /* 
    This function returns URLs of auctions
  */
  async function getAuctions() {
    const page = await browser.newPage();
    await page.goto("https://autobid.de/?action=auctions&L=0", { waitUntil: "networkidle2" });
    await page.click("#uc-btn-accept-banner");
    let national = false;
    const urls: string[] = [];
    for (const el of await page.$$("span.s_terminseite > *")) {
      const text: string = await el.evaluate(node => node.innerText.trim());
      const type: string = await el.evaluate(node => node.tagName);
      if (type === "H2" && text === "National") {
        national = true;
      }
      else if (type === "H2" && text !== "National") {
        national = false;
      }
      else if (type === "DIV" && national) {
        urls.push(...(await el.$$eval("div.term_box_day", divs => divs.map(div => div.getAttribute('href')))));
      }
    }
    await page.close();
    return urls;
  }
  
  async function scrapeAuction(url) {
    const page = await browser.newPage();
    const proxy = await getProxy();
    console.log(proxy);
    await page.setRequestInterception(true);
    page.on('request', async request => {
      if (request.resourceType() === 'document' || request.resourceType() === 'script' || request.resourceType() === 'xhr') {
        await useProxy(request, proxy);
      } else {
        request.abort();
      }
    });
    await page.goto(url, { waitUntil: "networkidle2" });
    if (await page.$("div.nlogin-container")) return; // If it's login page then skip
  
    if (url.includes("alphabet.autobid.de")) await scrapeAlphabet(page);
    else if (url.includes("bmw.autobid.de")) await scrapeBMW(page);
    else if (url.includes("vwn.autobid.de")) await scrapeVWN(page);
    else await scrapeNormal(page);
    await page.close();
  }
  
  async function scrapeBMW(page) {
    while (true) {
      try {
        console.log(page.url());
        const auction: Auction = {
          car_brand: null, car_model: null, url: null, auction_id: null, batch_id: null, end_date: null, leder: 0, price: null, catalog_number: null, title: null, fuel: null, power: null, first_registration: null, gearbox: null, mileage: null, navigation: false, panoramic_roof: false, four_wheel: false, leather: null, size: ''
        }
        auction.url = page.url();
        auction.auction_id = parseInt(page.url().match(urlRe)[1]);
        auction.price = await page.$eval("span#p-call-price", el => parseInt(el.innerText.replace(".", "")));
        auction.catalog_number = await page.$eval("div.bar_div_auto_big h1", el => parseInt(el.innerText.split(": ")[1]));
        auction.title = await page.$eval("div.bar_div_auto_big p", el => el.innerText.trim());

        const auctionInfo = await page.$eval("span.div_menu_p div", el => el.innerHTML);
        const carInfo = await page.$eval("div.bar_div_auto_big", el => el.innerText);
        const carSpecials = await (await page.$$("div.bar_div_auto_big"))[1].$eval("p", el => el.innerText);
    
        console.log("BMW");
        
        await insertDB(auction, auctionInfo, carInfo, carSpecials);
    
        if (await page.$("div.bit_pager_div_lista_samochodow a[style] + a")) {
          await Promise.all([
            page.click("div.bit_pager_div_lista_samochodow a[style] + a"),
            page.waitForNavigation({ waitUntil: "networkidle2" }),
          ]);
        }
        else break;
      } catch (error) {
        console.log(error);
        if (await page.$("div.bit_pager_div_lista_samochodow a[style] + a")) {
          await Promise.all([
            page.click("div.bit_pager_div_lista_samochodow a[style] + a"),
            page.waitForNavigation({ waitUntil: "networkidle2" }),
          ]);
        }
        else break;
        continue;
      }
    }
  }
  
  async function scrapeVWN(page) {
    while (true) {
      try {
        console.log(page.url());
        const auction: Auction = {
          car_brand: null, car_model: null, url: null, auction_id: null, batch_id: null, end_date: null, price: null, leder: 0, catalog_number: null, title: null, fuel: null, power: null, first_registration: null, gearbox: null, mileage: null, navigation: false, panoramic_roof: false, four_wheel: false, leather: null, size: ''
        }
        auction.url = page.url();
        auction.auction_id = parseInt(page.url().match(urlRe)[1]);
        auction.price = await page.$eval("span#p-call-price", el => parseInt(el.innerText.replace(".", "")));
        auction.catalog_number = await page.$eval("div.premium_aplet_l_belka", el => parseInt(el.innerText.split(": ")[1]));
        auction.title = await page.$eval("div.premium_aplet_l_pole_t p", el => el.innerText.trim());

        const auctionInfo = await page.$eval("td.premium_menu_left div", el => el.innerText);
        const carInfo = await page.$eval("div.premium_aplet_l_pole_t", el => el.innerText);
        const carSpecials = await page.$eval("div.premium_aplet_l_belka2", el => el.innerText);
      
        console.log("VWN");
        
        await insertDB(auction, auctionInfo, carInfo, carSpecials);

        if (await page.$("span.a + span")) {
          await Promise.all([
            page.click("span.a + span"),
            page.waitForNavigation({ waitUntil: "networkidle2" }),
          ]);
        }
        else break;
      } catch (error) {
        console.log(error);
        if (await page.$("span.a + span")) {
          await Promise.all([
            page.click("span.a + span"),
            page.waitForNavigation({ waitUntil: "networkidle2" }),
          ]);
        }
        else break;
        continue;
      }
    }
  }
  
  async function scrapeAlphabet(page) {
    while (true) {
      try {
        console.log(page.url());
        const auction: Auction = {
          car_brand: null, car_model: null, url: null, auction_id: null, batch_id: null, end_date: null, price: null, leder: 0, catalog_number: null, title: null, fuel: null, power: null, first_registration: null, gearbox: null, mileage: null, navigation: false, panoramic_roof: false, four_wheel: false, leather: null, size: ''
        }
        auction.url = page.url();
        auction.auction_id = parseInt(page.url().match(urlRe)[1]);
        auction.price = await page.$eval("span#p-call-price", el => parseInt(el.innerText.replace(".", "")));
        auction.catalog_number = await page.$eval("div.bar_div_auto_big h1", el => parseInt(el.innerText.split(": ")[1]));
        auction.title = await page.$eval("div.bar_div_auto_big p.bar_car_brand", el => el.innerText.trim());

        const auctionInfo = await page.$eval("div.manu_info", el => el.innerHTML);
        const carInfo = await page.$eval("div.bar_div_auto_big span.bar_p_color", el => el.innerText);
        const carSpecials = await (await page.$$("div.bar_div_auto_big"))[2].$eval("span.bar_p_color p", el => el.innerText);
    
        console.log("ALPHABET");
        
        await insertDB(auction, auctionInfo, carInfo, carSpecials);
    
        if (await page.$("div.bit_pager_div_lista_samochodow a[class] + a")) {
          await Promise.all([
            page.click("div.bit_pager_div_lista_samochodow a[class] + a"),
            page.waitForNavigation({ waitUntil: "networkidle2" }),
          ]);
        }
        else break;
      } catch (error) {
        console.log(error);
        if (await page.$("div.bit_pager_div_lista_samochodow a[class] + a")) {
          await Promise.all([
            page.click("div.bit_pager_div_lista_samochodow a[class] + a"),
            page.waitForNavigation({ waitUntil: "networkidle2" }),
          ]);
        }
        else break;
        continue;
      }
    }
  }
  
  async function scrapeNormal(page) {
    while (true) {
      try {
        console.log(page.url());
        const auction: Auction = {
          car_brand: null, car_model: null, url: null, auction_id: null, batch_id: null, end_date: null, price: null, leder: 0, catalog_number: null, title: null, fuel: null, power: null, first_registration: null, gearbox: null, mileage: null, navigation: false, panoramic_roof: false, four_wheel: false, leather: null, size: ''
        }
        auction.url = page.url();
        auction.auction_id = parseInt(page.url().match(urlRe)[1]);
        auction.price = await page.$eval("span#js_bidpanel_price_call_price", el => parseInt(el.innerText.replace(".", "")));
        auction.catalog_number = await page.$eval("div.car_box h1", el => parseInt(el.innerText.split(": ")[1]));
        auction.title = await page.$eval("h3.hb1", el => el.innerText);

        const auctionInfo = await page.$eval("div.nav-side div", el => el.innerHTML);
        const carInfo = await page.$eval("div.box_data", el => el.innerText);
        const carSpecials = carInfo;
        
        console.log("NORMAL");
        await insertDB(auction, auctionInfo, carInfo, carSpecials);

        if (await page.$("span.ar_r a")) {
          await Promise.all([
            page.click("span.ar_r a"),
            page.waitForNavigation({ waitUntil: "networkidle2" }),
          ]);
        }
        else break;
      }
      catch (error) {
        console.log(error);
        if (await page.$("span.ar_r a")) {
          await Promise.all([
            page.click("span.ar_r a"),
            page.waitForNavigation({ waitUntil: "networkidle2" }),
          ]);
        }
        else break;
        continue;
      }
    }
  }
  
  async function insertDB(auction: Auction, auctionInfo: string, carInfo: string, carSpecials: string) {
    try {
      auction.batch_id = auctionInfo.match(auctionNumRe) ? parseInt(auctionInfo.match(auctionNumRe)[0]) : null;
      auction.end_date = auctionInfo.match(dateRe) && auctionInfo.match(timeRe) ? parseDateTime(auctionInfo.match(dateRe)[0], auctionInfo.match(timeRe)[0]) : null;
      checkFuel(carInfo, auction);
      checkGearbox(carInfo, auction);
      checkTyp(carInfo, auction);
      checkLeder(carInfo, auction);
      const { matched_brand, matched_model } = matcher.match(auction.title);
      auction.car_brand = matched_brand;
      auction.car_model = matched_model;
      auction.power = carInfo.match(powerRe) ? parseInt(carInfo.match(powerRe)[1]) : null;
      auction.first_registration = carInfo.match(registrationRe) ? parseDate(carInfo.match(registrationRe)[0]) : null;
      auction.mileage = carInfo.match(mileageRe) ? parseInt(carInfo.match(mileageRe)[1].replace(".", "")) : null;
      auction.four_wheel = carInfo.match(fourWheelRe) ? true : false;
      checkSpecials(carSpecials, auction);
      console.log(auction);
      const a = Object.entries(auction);
      const columns = a.map(([column, value]) => column).join(", ");
      const placeholders = a.map(([column, value]) => "?").join(", ");
      const values = a.map(([column, value]) => value);
      await connection.execute(`INSERT INTO auction (${columns}) VALUES (${placeholders}) as new ON DUPLICATE KEY UPDATE title=new.title, end_date=new.end_date, price=new.price, first_registration=new.first_registration, mileage=new.mileage, fuel=new.fuel, gearbox=new.gearbox, power=new.power, navigation=new.navigation, panoramic_roof=new.panoramic_roof, four_wheel=new.four_wheel, leather=new.leather, url=new.url`, [...values]);
    } catch (err) {
      console.log(err);
    }
  }
  
  const urls = await getAuctions();
  console.log(urls);
  
  for (const url of urls) {
    await scrapeAuction(url);
  }

  console.log("Finish");
  await delay(5000);
  connection.destroy();
  await browser.close();
})();

