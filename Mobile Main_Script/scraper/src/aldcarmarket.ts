import got from "got";
import { Connection } from "mysql2/promise";

import BrandModelMatcher from "./brandmodelMatcher";
import { databases, connectToDB } from "./db";
import { getProxy, getUserAgent } from "./proxy";
import { CookieJar } from "tough-cookie";
import { delay } from './common';

export interface Vehicle {
  Make: string;
  Mileage: number;
  Model: string;
  RegistrationDate: Date;
  ThumbnailUrlLink: string;
  CachedThumbnailUrlLink: string;
  Vin: string;
  HighlightOrder?: number;
}

export interface Sale {
  CountryIsoCode: string;
  CountryName: string;
  Description: string;
  EndDate: string;
  EndDateLocal: Date;
  EndDateLocalToDisplay: string;
  IsExtended: boolean;
  SaleCode: string;
  SaleId: number;
  SaleName: string;
  SaleStatus: number;
  SaleType: number;
  SaleTypeDisplayName: string;
  StartDate: Date;
  StartDateLocal: Date;
  StartDateLocalToDisplay: string;
  Vehicles: Vehicle[];
  VehiclesCount: number;
  RemainingVehicles?: any;
  IsPreviewDisabled: boolean;
  IsLocal: boolean;
  BidValidationToken?: any;
  IsStartingSoon: boolean;
  IsEndingSoon: boolean;
  IsSignUpAllowed: boolean;
  ErrorMessageCountryExportNotAllowed?: any;
}

export interface Sales {
  Sales: Sale[];
  LocalSales: any[];
  OtherSales: any[];
  PrivateSales: any[];
  Leads?: any;
  CountryName: string;
  UserFullName: string;
  DisplayOtherSales: boolean;
  MessageBanner?: any;
  PageTitle?: any;
  PageDescription?: any;
}

export interface Picture {
  Name: string;
  ThumbnailUrlLink: string;
  PictureUrlLink: string;
  CachedThumbnailUrlLink: string;
  CachedPictureUrlLink: string;
}

export interface Tax {
  Value: number;
  Type: string;
  IsRatio: boolean;
}

export interface Auction {
  MarketingFlags: any[];
  EndDateSaleToDisplay?: any;
  AuctionClockVehicleStatus?: any;
  City?: any;
  ZipCode?: any;
  CanDoOffer: boolean;
  SaleId: number;
  VehicleId: number;
  Vin?: any;
  Make: string;
  Model: string;
  Version: string;
  Mileage: number;
  RegistrationDate: Date;
  RegistrationNumber?: any;
  FuelType: string;
  Gearbox: string;
  TotalOptionPrice?: any;
  DamageAmount?: any;
  Pictures: Picture[];
  DefaultImage: string;
  CachedDefaultImage: string;
  CurrencySymbol: string;
  TraderCurrentOffer?: any;
  CurrentOffer?: any;
  OffersCount: number;
  StockLocation?: any;
  LotNumber: number;
  SaleConditionId: number;
  SaleCode: string;
  EndDateSaleForTheVehicle: string;
  StartDateSale: Date;
  SaleType: number;
  SaleTypeDisplayName: string;
  SaleOptions: number;
  SaleStatus: number;
  IsWatched: boolean;
  MyCurrentOffer?: any;
  CanAddToWatchlist: boolean;
  IsSold: boolean;
  BuyNowPrice?: any;
  AwardedTraderId?: any;
  IsWon: boolean;
  IsWithdrawn: boolean;
  CurrentOfferModel?: any;
  Auction?: any;
  HasAutomaticBid: boolean;
  RecommendationAlgorithm: number;
  ExtendedSaleType: number;
  IsTransportOfferAvailable: boolean;
  TransportPrice?: any;
  Comment?: any;
  ShouldDisplayReservePrice: boolean;
  VehicleStartDateTime: Date;
  AuctionClockNextDatetimeStep?: any;
  StartingPrice?: any;
  AuctionClockTimeStep?: any;
  Reports?: any;
  Documents?: any;
  CountryIsoCode: string;
  AllTaxesIncluded: boolean;
  Taxes: Tax[];
  CountryDefaultCulture: string;
  LastCurrentTraderBidNumber?: any;
  IsTaxDisplayActive: boolean;
  HasOptions: boolean;
  BidValidationToken?: any;
  BuyNowPriceDisplay: string;
  TotalOptionPriceDisplay: string;
  DamageAmountDisplay: string;
  StartingPriceDisplay: string;
  TransportPriceDisplay: string;
}

export interface AuctionDetails {
  Vin?: any;
  Options: string;
  Equipments?: any;
  Version: string;
  Body: string;
  DoorsCount: number;
  SeatsCount: number;
  Category: string;
  RegistrationNumber?: any;
  TotalOptionPrice?: any;
  Currency: string;
  DamageAmount?: any;
  BodyColor: string;
  InteriorColor: string;
  ModelYear: number;
  Mileage: number;
  Gearbox: string;
  FuelType: string;
  EnginePower: number;
  PowerKw: string;
  CubicEnginePower: number;
  CylindersCount?: any;
  FiscalPower?: any;
  EmissionClass: string;
  ArgusPrice1?: any;
  ArgusPrice2?: any;
  Documents?: any;
  Reports?: any;
  AdditionalDescription?: any;
  MajorOptions?: any;
  Comment?: any;
  VehicleId: number;
  VehicleSubsidiaryId: number;
  ArgusPrice1Display: string;
  ArgusPrice2Display: string;
  DamageAmountDisplay: string;
  TotalOptionPriceDisplay: string;
}

let connection: Connection;
let leathers: { [key: string]: { id: number, r: RegExp } };
let fuels: { [key: string]: { id: number, r: RegExp } };
let gearboxes: { [key: string]: { id: number, r: RegExp } };
let matcher: BrandModelMatcher;

const cookies = new CookieJar();
cookies.setCookieSync('CMCountry=124', 'https://www.aldcarmarket.com/');

const client = got.extend({
  headers: {
    'user-agent': getUserAgent(),
  },
  cookieJar: cookies,
})

function getTimeStamp() {
  return Math.floor(Date.now() / 1000).toString();
}

const navigationRe = new RegExp(/Navi/i);
const panoramicRe = new RegExp(/Panorama/i);
const fourWheelRe = new RegExp(/Allrad/i);

async function getLeathers() {
  const [result]: any = await connection.query("SELECT * FROM mobilecrawler.leathers");
  const leathers: { [key: string]: { id: number, r: RegExp } } = {};
  for (const leather of result) {
    leathers[leather.name] = { id: leather.id, r: new RegExp(leather.name, 'i') };
  }
  return leathers;
};


async function getGearboxes() {
  const [result]: any = await connection.execute("SELECT id, aldcar_name as name FROM mobilecrawler.gearbox WHERE aldcar_name IS NOT NULL");
  const gearboxes: { [key: string]: { id: number, r: RegExp } } = {};
  for (const gearbox of result) {
    gearboxes[gearbox.name] = { id: gearbox.id, r: new RegExp(gearbox.name, 'i') };
  }
  return gearboxes;
};

async function getFuels() {
  const [result]: any = await connection.execute("SELECT id, name FROM mobilecrawler.fuel WHERE name IS NOT NULL");
  const fuels: { [key: string]: { id: number, r: RegExp } } = {};
  for (const fuel of result) {
    fuels[fuel.name] = { id: fuel.id, r: new RegExp(fuel.name, 'i') };
  }
  return fuels;
};


async function getAuctionBatch() {
  try {
    const response: Sales = await client.get(`https://www.aldcarmarket.com/front/sales/getsales/?_=${getTimeStamp()}`).json();
    for (const sale of response.Sales) {
      if (sale.SaleType === 0) { //Auction
        const { CountryIsoCode, EndDate, SaleCode, Description } = sale;
        await connection.query(`INSERT IGNORE INTO auction_batch (batch_id, country, end_date, note) VALUES (?, ?, ?, ?)`, [SaleCode, CountryIsoCode, EndDate.replace("Z", ""), Description]);
        await getAuction(SaleCode);
        await delay(1000);
      }
    }
  } catch (error) {
    console.log(`https://www.aldcarmarket.com/front/sales/getsales/?_=${getTimeStamp()}`);
    console.log(error);
  }
  
}

async function getAuction(batch_id: string) {
  let i = 0;
  try {
    while (true) {
      const response: Auction[] = await client.get(`https://www.aldcarmarket.com/front/sales/getsaleeventvehicles/?saleCode=${batch_id}&pageIndex=${i}&orderBy=0&direction=1&_=${getTimeStamp()}`).json();
      if (!response.length) break;
      for (const auction of response) {
        await getAuctionDetails(auction);
        await delay(1000);
      }
      i++;
    }
  } catch (error) {
    console.log(`https://www.aldcarmarket.com/front/sales/getsaleeventvehicles/?saleCode=${batch_id}&pageIndex=${i}&orderBy=0&direction=1&_=${getTimeStamp()}`)
    console.log(error);
  }
}


function checkSpecials(specials: string, auction) {
  if (specials.match(navigationRe)) auction.navigation = true;
  if (specials.match(panoramicRe)) auction.panoramic_roof = true;
  if (specials.match(fourWheelRe)) auction.four_wheel = true;
  for (const [leather, { id, r }] of Object.entries(leathers)) {
    if (specials.match(r)) auction.leather = id;
  }
}

async function getAuctionDetails(auction: Auction) {
  const { SaleConditionId, SaleCode: batch_id, VehicleId: auction_id, Make, Model, LotNumber: catalog_number, RegistrationDate: first_registration, EndDateSaleForTheVehicle: end_date } = auction;
  try {
    const response: AuctionDetails = await client.get(`https://www.aldcarmarket.com/front/sales/getvehicledetails/?saleConditionId=${SaleConditionId}&saleCode=${batch_id}&_=${getTimeStamp()}`).json();
    const { Mileage: mileage, EnginePower: power, ModelYear, SeatsCount: seats, Gearbox, FuelType, Version: version, AdditionalDescription, Options, Equipments } = response;
    const { matched_brand, matched_model } = matcher.match(`${Make} ${Model}`);
    const auction = { auction_id, batch_id, catalog_number, car_brand: matched_brand, car_model: matched_model, end_date: end_date.replace("Z", ""), first_registration, mileage, power, seats, fuel: null, gearbox: null, version, leather: null, navigation: false, panoramic_roof: false, four_wheel: false };
    for (const { id, r } of Object.values(gearboxes)) {
      if (Gearbox.match(r)) auction.gearbox = id;
    }
    for (const { id, r } of Object.values(fuels)) {
      if (FuelType.match(r)) auction.fuel = id;
    }
    if (AdditionalDescription) {
      checkSpecials(AdditionalDescription, auction);
    }
    if (Options) {
      checkSpecials(Options, auction);
    }
    if (Equipments) {
      checkSpecials(Equipments, auction);
    }
    console.log(auction);
    const a = Object.entries(auction);
    const columns = a.map(([column, value]) => column).join(", ");
    const placeholders = a.map(([column, value]) => "?").join(", ");
    const values = a.map(([column, value]) => value);
    await connection.query(`INSERT INTO auction (${columns}) VALUES (${placeholders}) as new ON DUPLICATE KEY UPDATE end_date=new.end_date, first_registration=new.first_registration, mileage=new.mileage, power=new.power, seats=new.seats, fuel=new.fuel, gearbox=new.gearbox, version=new.version, leather=new.leather, navigation=new.navigation, panoramic_roof=new.panoramic_roof, four_wheel=new.four_wheel`, [...values]);
  } catch (error) {
    console.log(`https://www.aldcarmarket.com/front/sales/getvehicledetails/?saleConditionId=${SaleConditionId}&saleCode=${batch_id}&_=${getTimeStamp()}`);
    console.log(error);
  }
}

async function main() {
  connection = await connectToDB(databases.aldcarmarket);
  fuels = await getFuels();
  gearboxes = await getGearboxes();
  leathers = await getLeathers();
  matcher = await BrandModelMatcher.init();
  
  await getAuctionBatch();

  console.log("Finished");
  await delay(5000);
  await connection.destroy();
}

main();