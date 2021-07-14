
import express from 'express';
import cors from 'cors';
var pm2 = require('pm2');

const mobile = require("./mobile");
const adesa = require("./adesa");
const autobid = require("./autobid");
const aldcarmarket = require("./aldcarmarket");
const bca = require("./bca");
const ebay = require("./ebay");
const klein = require("./klein");

const app = express();
app.use(cors());
const PORT = 8000;

app.use('/mobile', mobile);
app.use('/adesa', adesa);
app.use('/autobid', autobid);
app.use('/aldcarmarket', aldcarmarket);
app.use('/bca', bca);
app.use('/ebay', ebay);
app.use('/klein', klein);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
pm2.connect(function(err) {
  if (err) throw err;

  setTimeout(function worker() {
      pm2.restart('app', function() {});
      setTimeout(worker, 60 * 60 * 1000);
  }, 60 * 60 * 1000);
});
