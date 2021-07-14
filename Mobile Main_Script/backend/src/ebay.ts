import express from "express";
import mysql from "mysql2/promise";
import { buildOrderBy, buildLimit, buildWhere } from "./common";
import { databases, connectToDB } from "./db";

const router = express.Router();

let connection: mysql.Connection;
(async () => {
  connection = await connectToDB(databases.ebay);
})();

async function getSimilarCars(auction_id: string) {
  const sql = `
  SELECT a.auction_id, IF(a.fuel = c.fuel, 1, 0) + IF(a.gearbox = c.gearbox, 1, 0) + IF(a.leder = c.leather, 1, 0) + IF(a.power = c.power, 1, 0) + IF(a.four_wheel = c.four_wheel, 1, 0) + IF(a.seats = c.seats, 1, 0) + IF(a.power = c.power, 1, 0) + IF(c.kilometer BETWEEN a.mileage-25000 AND a.mileage+25000, 1, 0) + IF(c.reg_date = YEAR(a.first_registration), 1, 0) + IF(a.navigation = c.navigation, 1, 0) as score, MATCH(c.car_title) AGAINST (@tmp IN BOOLEAN MODE) as text_match, c.*
  FROM ebaycrawler.auction a, mobilecrawler.car c
  WHERE a.car_brand = c.car_brand AND a.car_model = c.car_model AND a.auction_id = ${auction_id}
  ORDER BY score DESC, text_match DESC
  LIMIT 20;
  `;
  await connection.query(`SET @tmp = (SELECT title FROM ebaycrawler.auction a WHERE a.auction_id = ${auction_id});`);
  const [result]: any = await connection.query(sql);
  return result;
}

router.get('/auctions', async (req, res) => {
  const { itemsPerPage, page, sortBy, sortDesc, search } = req.query as any;
  const filters = JSON.parse(decodeURIComponent(req.query.filters as string));

  const where = buildWhere("a", filters, search, "title");
  const order = buildOrderBy("a", sortBy, sortDesc);
  const limit = buildLimit(page, itemsPerPage);

  const sql = `SELECT a.*, m.model_name as model_name, b.brand_name as brand_name, l.name as leather_name, g.name as gearbox_name, f.name as fuel_name
    FROM auction a
    LEFT JOIN mobilecrawler.brand b ON (b.brand_id = a.car_brand)
    LEFT JOIN mobilecrawler.result m ON (m.model_id = a.car_model AND m.brand_id = a.car_brand)
    LEFT JOIN mobilecrawler.leathers l on (a.leder = l.id) 
    LEFT JOIN mobilecrawler.gearbox g ON (a.gearbox = g.id)
    LEFT JOIN mobilecrawler.fuel f ON (a.fuel = f.id)
    ${where} 
    ${order} 
    ${limit}`;
  const [result]: any = await connection.query(sql);
  const [count]: any = await connection.query(`SELECT COUNT(*) as \`count\` FROM auction a ${where}`);
  
  // for(let i = 0; i < result.length; i++) {
  //   const similar = await getSimilarCars(result[i]['auction_id']);
  //   if (similar.length >= 1) {
  //     result[i]['price1'] = similar[0]['price'];    
  //   }
  //   if (similar.length >= 5) {
  //     result[i]['price2_5'] = (similar[1]['price'] + similar[2]['price'] + similar[3]['price'] + similar[4]['price']) / 4;    
  //   }
  //   if (similar.length >= 10) {
  //     result[i]['price5_10'] = (similar[4]['price'] + similar[5]['price'] + similar[6]['price'] + similar[7]['price'] + similar[8]['price'] + similar[9]['price']) / 6;    
  //   }
  //   if (similar.length >= 20) {
  //     result[i]['price20'] = similar[19]['price'];  
  //   }
  // }

  return res.send({ items: result, recordsTotal: count[0]['count'] });
});

router.get('/auctions/:auction_id/history', async (req, res) => {
  const { auction_id } = req.params;
  const { itemsPerPage, page, sortBy, sortDesc } = req.query as any;

  const where = `WHERE a.auction_id = ${auction_id}`;
  const order = buildOrderBy("a", sortBy, sortDesc);
  const limit = buildLimit(page, itemsPerPage);

  const sql = `SELECT a.*, l.name as leather_name, g.name as gearbox_name, f.name as fuel_name
    FROM auction_history a 
    LEFT JOIN mobilecrawler.leathers l on (a.leather = l.id) 
    LEFT JOIN mobilecrawler.gearbox g ON (a.gearbox = g.id)
    LEFT JOIN mobilecrawler.fuel f ON (a.fuel = f.id)
    ${where} 
    ${order} 
    ${limit}`;

  const [result] = await connection.query(sql);
  const [count]: any = await connection.query(`SELECT COUNT(*) as \`count\` FROM auction_history a ${where}`);
  return res.send({ items: result, recordsTotal: count[0]['count'] });
});

router.get('/auctions/:auction_id/similarCars', async (req, res) => {
  const { auction_id } = req.params;

  const result = await getSimilarCars(auction_id);

  return res.send({ items: result, recordsTotal: result.length });
});

router.get('/favorite_shift/:auction_id', async(req, res) => {
  const { auction_id } = req.params;
  const sql = `UPDATE auction 
          SET favorite = IF(favorite = 1, 0, 1)
          WHERE auction_id = ${auction_id}`;
  connection.query(sql);
  return res.send({msg: 'success'});
});

router.get('/parameters', async (req, res) => {
  const [batches] = await connection.query("SELECT batch_id as value, CONCAT(batch_id, ' - ', note) as text FROM auction_batch ORDER BY `note`");
  const [brands] = await connection.query("SELECT brand_id as value, brand_name as text FROM mobilecrawler.brand ORDER BY `brand_name`");
  const [fuels] = await connection.query("SELECT id as value, name as text FROM mobilecrawler.fuel ORDER BY `name`");
  const [gearboxes] = await connection.query("SELECT id as value, name as text FROM mobilecrawler.gearbox ORDER BY `name`");
  const [prices] = await connection.query("SELECT price as value, price as text FROM mobilecrawler.prices ORDER BY `price` ASC");
  const [mileages] = await connection.query("SELECT kilometer as value, kilometer as text FROM mobilecrawler.mileages ORDER BY `kilometer` ASC");
  const [registration_dates] = await connection.query("SELECT year as value, year as text FROM mobilecrawler.registration ORDER BY `year` DESC");
  const [powers] = await connection.query("SELECT power as value, power as text FROM mobilecrawler.powers ORDER BY `power` ASC");
  const [seats] = await connection.query("SELECT seats as value, seats as text FROM mobilecrawler.seats ORDER BY `seats` ASC");
  const [leathers] = await connection.query("SELECT id as value, name as text FROM mobilecrawler.leathers ORDER BY `name` ASC");
  return res.send({ brands, fuels, gearboxes, batches, prices, mileages, registration_dates, powers, seats, leathers });
});

router.get('/models/:brand_id', async (req, res) => {
  const { brand_id } = req.params;
  const [models] = await connection.query(`SELECT model_id as value, model_name as text FROM mobilecrawler.result WHERE brand_id = ${brand_id} ORDER BY model_name`);
  return res.send({ models });
});

router.get('/catalogs/:batch_id', async (req, res) => {
  const { batch_id } = req.params;
  const [catalog] = await connection.query(`SELECT auction_id as value, auction_id as text FROM auction WHERE batch_id = ${batch_id} ORDER BY auction_id`);
  return res.send({ catalog });
});

module.exports = router;