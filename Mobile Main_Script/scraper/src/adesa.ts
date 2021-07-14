import got from "got";
import { Connection } from 'mysql2/promise';

import BrandModelMatcher from "./brandmodelMatcher";
import { databases, connectToDB } from "./db";
import { getUserAgent } from "./proxy";
import { delay } from './common';

let connection: Connection;
const client = got.extend({
  headers: {
    'user-agent': getUserAgent()
  }
})


async function getGearboxes() {
  const [result]: any = await connection.execute("SELECT * FROM mobilecrawler.gearbox");
  const gearboxes: { [key: string]: { id: number, r: RegExp } } = {};
  for (const gearbox of result) {
    gearboxes[gearbox.name] = { id: gearbox.id, r: new RegExp(gearbox.name, 'i') };
  }
  return gearboxes;
}

async function getFuels() {
  const [result]: any = await connection.execute("SELECT id, adesa_name as name FROM mobilecrawler.fuel WHERE adesa_name IS NOT NULL");
  const fuels: { [key: string]: { id: number, r: RegExp } } = {};
  for (const fuel of result) {
    fuels[fuel.name] = { id: fuel.id, r: new RegExp(fuel.name, 'i') };
  }
  return fuels;
}

async function getLeathers() {
  const [result]: any = await connection.execute("SELECT * FROM mobilecrawler.leathers");
  const leathers: { [key: string]: { id: number, r: RegExp } } = {};
  for (const leather of result) {
    leathers[leather.name] = { id: leather.id, r: new RegExp(leather.name, 'i') };
  }
  return leathers;
}

async function getAuctionBatchIds() {
  const auctionBatchIds = new Set<string>();
  const json: any = await client.post("https://www.adesa.eu/de/findcarv6/AuctionBatchesSearch", {
    json: {
      "query":{},
      "Paging": {
        "PageNumber":1,
        "ItemsPerPage":150
      },
      "Sort": {
        "Field":"EndDateForBatches",
        "Direction":"ascending",
        "SortType":"Field"
      },
      "FacetRequest":["All"]
    }
  }).json();
  const ids: string[] = json.AuctionBatches.map(el => el.AuctionBatchId);
  ids.forEach(id => auctionBatchIds.add(id));
  try {
    await connection.query("INSERT IGNORE INTO auction_batch (batch_id, note, country_id) VALUES ?",
    [json.AuctionBatches.map(el => [el.AuctionBatchId, el.AuctionBatchNameList.de, el.CountryId])]);
  } catch (error) {
    console.log(error);
  }
  
  return auctionBatchIds;
}

async function getCountries() {
  const json: any = await client.get("https://www.adesa.eu/en/homev6/labels?language=de&prefixes=IsCocAvailable%2CIsRegDocAvailable%2CExtraDeliveryInfo.Spain%2CPickUP.italia%2CDocDeliveryDelay.Spain%2CLPG.Netherlands%2CCNG.%2CIsDocDeliveryWithCar%2CSpecDmg%2Ccarbroken.%2Cdamagekind.%2Ccardamage.%2CTechDmg.%2CSpecDmg.%2Ccommon.%2Cfooter.%2Cmodal.%2Cpopup.%2Cnavigation.%2CsimilarCars.%2Ctoast.%2CvehicleAlreadySold.%2CvehicleAuctionClosed.%2CvehicleDetails.%2Cauctionprocess.CountryCostBPMHint%2Clogin.%2CforgotPassword.%2CpasswordSent.%2Chomepage.%2CcarSearch%2CcarSearchV2.%2Csearchcars.%2Cpromotions.BuyNextGet150%2Cpromotions.promo1%2Cpromotions.promo2%2Crecommendation.%2CmakeModel.%2CfuelType.%2Ctransmission.%2Cmileage.%2CregistrationYear.%2CengineSize.%2Cpower.%2CbodyType.%2Cprice.%2Cequipment.%2CcarColor.%2CoriginCountry.%2Ccountry.%2Cseller.%2Cdamage.%2CemissionStandard.%2CauctionType.%2Cxtime.%2ChighAssignment.%2CvatRegime.%2Cresults.%2Ccardetail.%2Cco2.%2Cheadline.%2Ccombo.%2CsavedSearches.%2CadvancedSearch.%2Cauctions.%2Csignup.%2Cbrowsecars.title%2Cmybids.%2Cmeta.%2CbidModal.%2Cxtimedashboard.%2CpremiumOffer.%2Ctour.%2CorderCompletion.%2Cmeta.").json();
  const countries = Object.keys(json.country).map(id => [id, json.country[id]]);
  if (countries.length) {
    try {
      await connection.query('INSERT IGNORE INTO country (country_id, name) VALUES ?', [countries]);
    } catch (error) {
      console.log(error);
    }
  }
}

async function getAuctionIds(auctionBatchIds: Set<string>) {
  const auctionIds = new Set<string>();
  for (const id of auctionBatchIds.values()) {
    const json: any = await client.post("https://www.adesa.eu/de/findcarv6/search", {
      json: {
        "query": {
          "MakeModels": [],
          "AuctionBatchId": id
        },
        "FacetRequest": ["CleanMake","FuelGroupSearch","GearboxGroupSearch","PremiumOffer","CleanModel"],
        "Sort":{"Field":"BatchStartDateForSorting","Direction":"ascending","SortType":"Field"},
        "Paging":{"PageNumber":1,"ItemsPerPage":150},
        "UniqueSearchLogId":"2a6d7d17-6e37-476e-98eb-2d77a682bb8b",
        "SavedSearchId":null,
        "PageUrl":`https://www.adesa.eu/de/findcar?auctionBatchId=${id}`
  
      }}).json();
      if(json.Auctions) {
        const ids = json.Auctions.map(el => el.AuctionId);
        console.log(ids);
        ids.forEach(id => auctionIds.add(id));
      }
    await delay(3000);
  }
  console.log(auctionIds.size);
  return auctionIds;
}

async function scrapeCars(auctionIds: Set<string>) {
  const matcher = await BrandModelMatcher.init();
  const gearboxes = await getGearboxes();
  const leathers = await getLeathers();
  const fuels = await getFuels();
  for (const id of auctionIds.values()) {
    const auction = {
      auction_id: null, batch_id: null, end_date: null, price: null, title: null, fuel: null, power: null, first_registration: null, gearbox: null, mileage: null, navigation: false, four_wheel: false, leather: null, car_brand: null, car_model: null, seats: null, damages: null,
    }
    const car: any = await client.get(`https://www.adesa.eu/de/carv6/auction/${id}`).json();
    const specials: any = await client.get(`https://www.adesa.eu/de/carv6/alloptions?auctionId=${id}`).json();
    auction.auction_id = car.AuctionId;
    auction.title = car.CarTitleList.de;
    auction.end_date = car.BatchEndDate ? car.BatchEndDate : null;
    auction.price = car.BarometerPrices && car.BarometerPrices.length ? car.BarometerPrices.filter(el => el.Sequence == car.BarometerRecommendedPrice.RecommendedIndex)[0].Price : null;
    auction.first_registration = car.DateFirstRegistration ? car.DateFirstRegistration : null;
    auction.mileage = car.Mileage ? parseInt(car.Mileage.replace(".", "")) : null;
    auction.fuel = car.FuelGroup ? car.FuelGroup : null;
    if (car.EtgOptionList) {
      for (const feature of car.EtgOptionList) {
        if (feature.OptionID == 755203) auction.four_wheel = true;
        if (feature.OptionId == 754305) auction.navigation = true;
        for (const { id, r } of Object.values(leathers)) {
          if (feature.Name.match(r)) auction.leather = id;
        }
      }
    }
    if (car.GearboxGroup) {
      for (const { id, r } of Object.values(gearboxes)) {
        if (car.GearboxGroup.match(r)) auction.gearbox = id;
      }
    }
    if (car.FuelGroupSearch) {
      for (const { id, r } of Object.values(fuels)) {
        if (car.FuelGroupSearch.match(r)) auction.fuel = id;
      }
    }
    auction.power = car.Kw ? parseInt(car.Kw.split(" (")[1]) : null;
    auction.seats = car.Places ? car.Places : null;
    auction.damages = car.CarReportsList ? car.CarReportsList.filter(el => el.Url !== "").map(el => el.Url).join(",") : null;
    auction.batch_id = car.AuctionBatchId;
    await connection.query("INSERT IGNORE INTO auction_batch (batch_id) VALUES (?)", [auction.batch_id]);
    const { matched_brand, matched_model } = matcher.match(auction.title);
    auction.car_brand = matched_brand;
    auction.car_model = matched_model;
    console.log(auction);
    const a = Object.entries(auction);
    const columns = a.map(([column, value]) => column).join(", ");
    const placeholders = a.map(([column, value]) => "?").join(", ");
    const values = a.map(([column, value]) => value);
    await connection.query(`INSERT INTO auction (${columns}) VALUES (${placeholders}) as new ON DUPLICATE KEY UPDATE end_date=new.end_date, price=new.price, first_registration=new.first_registration, mileage=new.mileage, fuel=new.fuel, gearbox=new.gearbox, power=new.power, seats=new.seats, damages=new.damages, title=new.title, four_wheel=new.four_wheel, navigation=new.navigation, leather=new.leather`,
    [...values]);

    if (specials.ImportantOptionList) {
      if(specials.ImportantOptionList.length == 1){
        const feature = specials.ImportantOptionList[0];
        const [results]: any = await connection.query('INSERT INTO top_feature (feature_name) VALUES (?)', [feature.Value]);
        const feature_id = results.insertId;
        await connection.query('INSERT IGNORE INTO auction_feature (feature_id, auction_id) VALUES (?,?)', [feature_id, auction.auction_id]);
      } else{
        for (const feature of specials.ImportantOptionList) {
          try {
            const [results]: any = await connection.query('INSERT INTO top_feature (feature_name) VALUES (?)', [feature.Value]);
            const feature_id = results.insertId;
            await connection.query('INSERT IGNORE INTO auction_feature (feature_id, auction_id) VALUES (?,?)', [feature_id, auction.auction_id]);
          } 
          catch (error) {
            const [results] = await connection.query('SELECT feature_id FROM top_feature WHERE feature_name = ?', [feature.Value]);
            const feature_id = results[0].feature_id;
            await connection.query('INSERT IGNORE INTO auction_feature (feature_id, auction_id) VALUES (?,?)', [feature_id, auction.auction_id]);
          }
        }
      }
      
    }
    await delay(3000);
  }
}

async function crawlAdesa() {
  connection = await connectToDB(databases.adesa);
  const auctionBatchIds = await getAuctionBatchIds();
  await getCountries();
  const auctionIds = await getAuctionIds(auctionBatchIds);
  console.log("Number of cars", auctionIds.size);
  await scrapeCars(auctionIds);
  await delay(5000);
  await connection.end();
}

crawlAdesa().then(() => console.log("Finished"));
