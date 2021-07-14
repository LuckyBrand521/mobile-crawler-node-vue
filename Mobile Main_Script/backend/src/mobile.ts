import express from "express";
import mysql from "mysql2/promise";
import { buildOrderBy, buildLimit, buildWhere } from "./common";
import { databases, connectToDB } from "./db";

const router = express.Router();

let connection: mysql.Connection;
(async () => {
  connection = await connectToDB(databases.mobile);
})();

interface Select {
  value: string, 
  text: string
}

interface Range {
  from: string, 
  to: string
}

interface CarQuery {
  page: string,
  itemsPerPage: string,
  sortBy: string,
  sortDesc: string,
  groupBy: string,
  groupDesc: string,
  mustSort: boolean,
  multiSort: boolean,
  search: string,
  filters: { 
    four_wheel: Select | null,
    leather: Select | null,
    navigation: Select | null,
    sliding_roof: Select | null,
    panoramic_roof: Select | null,
    parking_heater: Select | null,
    price: Range,
    power: Range,
    kilometer: Range,
    reg_date: Range,
    seats: Range,
  },
}

router.get('/cars', async (req, res) => {
  const { itemsPerPage, page, sortBy, sortDesc, search } = req.query as any;
  const filters = JSON.parse(decodeURIComponent(req.query.filters as string));

  const where = buildWhere("c", filters, search, "car_title");
  const order = buildOrderBy("c", sortBy, sortDesc);
  const limit = buildLimit(page, itemsPerPage);

  const sql = `SELECT c.*, m.model_name as model_name, b.brand_name as brand_name, g.name as gearbox_name, f.name as fuel_name, l.name as leather_name
      FROM car c
        JOIN model m ON (m.model_id = c.car_model AND m.brand_id = c.car_brand)
        JOIN brand b ON (m.brand_id = b.brand_id)
        LEFT JOIN gearbox g on (c.gearbox = g.id)
        LEFT JOIN fuel f on (c.fuel = f.id) 
        LEFT JOIN leathers l on (c.leather = l.id) 
      ${where} 
      ${order} 
      ${limit}`;

  const [result] = await connection.query(sql);
  const [count]: any = await connection.query(`SELECT COUNT(*) as \`count\` FROM car c ${where}`);
  return res.send({ items: result, recordsTotal: count[0]['count'] });
});

router.get('/cars/:car_id/history', async (req, res) => {
  const { car_id } = req.params;
  const { itemsPerPage, page, sortBy, sortDesc } = req.query as any;

  const where = `WHERE c.car_id = ${car_id}`;
  const order = buildOrderBy("c", sortBy, sortDesc);
  const limit = buildLimit(page, itemsPerPage);

  const sql = `SELECT c.*, m.model_name as model_name, b.brand_name as brand_name, g.name as gearbox_name, f.name as fuel_name, l.name as leather_name
      FROM car_history c
        JOIN result m ON (m.model_id = c.car_model AND m.brand_id = c.car_brand)
        JOIN brand b ON (m.brand_id = b.brand_id)
        LEFT JOIN gearbox g on (c.gearbox = g.id)
        LEFT JOIN fuel f on (c.fuel = f.id) 
        LEFT JOIN leathers l on (c.leather = l.id) 
      ${where} 
      ${order} 
      ${limit}`;

  const [result] = await connection.query(sql);
  const [count]: any = await connection.query(`SELECT COUNT(*) as \`count\` FROM car_history c ${where}`);
  return res.send({ items: result, recordsTotal: count[0]['count'] });
});

router.get('/parameters', async (req, res) => {
  const [fuels] = await connection.query("SELECT id as value, name as text FROM fuel ORDER BY `name`");
  const [gearboxes] = await connection.query("SELECT id as value, name as text FROM gearbox ORDER BY `name`");
  const [brands] = await connection.query("SELECT brand_id as value, brand_name as text FROM brand ORDER BY `brand_name`");
  const [prices] = await connection.query("SELECT price as value, price as text FROM prices ORDER BY `price` ASC");
  const [mileages] = await connection.query("SELECT kilometer as value, kilometer as text FROM mileages ORDER BY `kilometer` ASC");
  const [registration_dates] = await connection.query("SELECT year as value, year as text FROM registration ORDER BY `year` DESC");
  const [powers] = await connection.query("SELECT power as value, power as text FROM powers ORDER BY `power` ASC");
  const [seats] = await connection.query("SELECT seats as value, seats as text FROM seats ORDER BY `seats` ASC");
  const [leathers] = await connection.query("SELECT id as value, name as text FROM leathers ORDER BY `name` ASC");
  return res.send({ fuels, gearboxes, brands, prices, mileages, registration_dates, powers, seats, leathers });
});

router.get('/models/:brand_id', async (req, res) => {
  const { brand_id } = req.params;
  const [models] = await connection.query(`SELECT model_id as value, model_name as text FROM result WHERE brand_id = ${brand_id} ORDER BY model_name`);
  return res.send({ models });
});

module.exports = router;