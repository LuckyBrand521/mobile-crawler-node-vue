import scrapy, random, os, json, traceback, datetime, re
import mysql.connector

base_path = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(os.path.dirname(os.path.dirname(base_path)), "db_config.json")

print(base_path)
print(config_path)

config = json.load(open(config_path))
if config["store"] == "DB":
    mydb = mysql.connector.connect(
        host = config["host"],
        user = config["user"],
        password = config["password"],
        port = config["port"],
        database = config["database"],
    )

    mycursor = mydb.cursor()
else:
    mycursor = None

def process_product_db(item):
    try:
        # check batch_id
        batch_existing_query = "SELECT batch_id FROM auction_batch WHERE note='' and country_id='de'"
        mycursor.execute(batch_existing_query)
        batch_result = batch_id = mycursor.fetchone()
        
        if batch_result:
            batch_id = batch_result[0]
        if not batch_id:
            # insert to `auction_batch` db.
            batch_insert_query = "INSERT INTO auction_batch (note, country_id) VALUES (%s, %s)"
            batch_insert_value = ("", "de")
            mycursor.execute(batch_insert_query, batch_insert_value)
            mydb.commit()
            batch_id = mycursor.lastrowid
        
        # check fuel_id
        fuel_existing_query = f"SELECT id FROM mobilecrawler.fuel WHERE name='{item['fuel']}'"
        mycursor.execute(fuel_existing_query)
        fuel_result = mycursor.fetchone()

        if fuel_result:
            fuel_id = fuel_result[0]
        else:
            fuel_id = 0

        # check gearbox_id
        gearbox_existing_query = f"SELECT id FROM mobilecrawler.gearbox WHERE name='{item['gearbox']}'"
        mycursor.execute(gearbox_existing_query)
        gearbox_result = mycursor.fetchone()

        if gearbox_result:
            gearbox_id = gearbox_result[0]
        else:
            gearbox_id = 0

        # check brand id
        brand_existing_query = f"SELECT brand_id FROM mobilecrawler.brand WHERE brand_name='{item['car_brand']}'"
        mycursor.execute(brand_existing_query)
        brand_result = mycursor.fetchone()

        if brand_result:
            brand_id = brand_result[0]
        else:
            brand_id = 0

        # check model_id
        model_existing_query = f"SELECT model_id FROM mobilecrawler.model WHERE model_name='{item['car_model']}' and brand_id={brand_id}"
        mycursor.execute(model_existing_query)
        model_result = mycursor.fetchone()
        
        if model_result:
            model_id = model_result[0]
        else:
            model_id = 0

        # insert to `auction` table.
        auction_insert_query = "INSERT INTO auction (title, end_date, price, first_registration, mileage, fuel, gearbox, power, navigation, batch_id, car_brand, car_model, link, four_wheel, size) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
        action_insert_value = (item["title"], item["end_date"], item["price"], item["first_registration"], item["mileage"], fuel_id, gearbox_id, item["power"], item["navigation"], item["batch_id"], brand_id, model_id, item["link"], item["four_wheel"], item["size"])
        mycursor.execute(auction_insert_query, action_insert_value)
        mydb.commit()

        auction_id = mycursor.lastrowid

        # insert to `history` table.
        history_insert_query = "INSERT INTO auction_history (end_date, price, first_registration, mileage, fuel, gearbox, power, navigation) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        action_insert_value = (item["end_date"], item["price"], item["first_registration"], item["mileage"], fuel_id, gearbox_id, item["power"], item["navigation"])
        mycursor.execute(history_insert_query, action_insert_value)
        mydb.commit()
    except:
        pass


user_agent_list = [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.72 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
    'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.71 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/21.0.1180.83 Safari/537.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
    'Mozilla/5.0 (Windows NT 5.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 6.0.1; RedMi Note 5 Build/RB3N5C; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/68.0.3440.91 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.143 Safari/537.36',
    'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/4',
    'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
    'Mozilla/5.0 (Windows NT 5.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
    'Mozilla/4.0 (compatible; MSIE 9.0; Windows NT 6.1)',
    'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
    'Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (Windows NT 6.2; WOW64; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/5.0)',
    'Mozilla/5.0 (Windows NT 6.3; WOW64; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)',
    'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)',
    'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; .NET CLR 2.0.50727; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729)'
]

class EbayAutomobileSpider(scrapy.Spider):
    name = '_EbayAutomobileSpider'
    allowed_domains = ['ebay.de']

    custom_settings = {
        'DOWNLOAD_DELAY': 2,
    }

    def start_requests(self):
        headers = {
            'authority': 'www.ebay.de',
            'user-agent': random.choice(user_agent_list),
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        }

        meta_new = {"Type": "Neu"}
        yield scrapy.Request('https://www.ebay.de/b/Automobile/9801/bn_1845328?rt=nc&listingOnly=1&_stpos=70173&LH_ItemCondition=1000', callback=self.parse_inventory, headers=headers, meta=meta_new)

        meta_used = {"Type": "Gebraucht"}
        yield scrapy.Request('https://www.ebay.de/b/Automobile/9801/bn_1845328?rt=nc&listingOnly=1&_stpos=70173&LH_ItemCondition=3000', callback=self.parse_inventory, headers=headers, meta=meta_used)

    def parse_inventory(self, response):
        db_product_base_item = {
            'title': "",
            'end_date': "",
            'price': "",
            'first_registration': "",
            'mileage': "",
            'fuel': "",
            'gearbox': "",
            'power': "",
            'size': "",
            'leather': "",
            'four_wheel': "",
            'navigation': "",
            'seats': "",
            'batch_id': "",
            'catalog_number': "",
            'damages': "",
            'car_brand': "",
            'car_model': "",
            'is_available': "",
            'LblPhysicalLocationValue': "",
            'price_1': "",
            'price_2_5': "",
            'price_5_10': "",
            'price_20': "",
        }
        
        for product_item in response.xpath("//div[contains(@class, 's-item__info')]"):
            try:
                product = db_product_base_item.copy()
                product["title"] = product_item.xpath(".//h3[@class='s-item__title']//text()").get().strip()
                restzeit = product_item.xpath(".//span[@class='s-item__time-left']//text()").get()
                if restzeit and restzeit.strip():
                    if re.search(r"(\d+)\s*T", restzeit):
                        days = int(re.search(r"(\d+)\s*T", restzeit).groups()[0])
                    else:
                        days = 0

                    if re.search(r"(\d+)\s*Std", restzeit):
                        hours = int(re.search(r"(\d+)\s*Std", restzeit).groups()[0])
                    else:
                        hours = 0

                    if re.search(r"(\d+)\s*Min", restzeit):
                        mins = int(re.search(r"(\d+)\s*Min", restzeit).groups()[0])
                    else:
                        mins = 0

                    if re.search(r"(\d+)\s*Sek", restzeit):
                        secs = int(re.search(r"(\d+)\s*Sek", restzeit).groups()[0])
                    else:
                        secs = 0
                    

                    current_time = datetime.datetime.now()
                    end_time = current_time + datetime.timedelta(days=days, hours=hours, minutes=mins, seconds=secs)
                    product["end_date"] = end_time.strftime("%Y-%m-%d %H:%M:%S")

                price = product_item.xpath(".//span[@class='s-item__price']//text()").get()
                if price and price.strip():
                    price = re.search(r"\d+", price.replace(".", "").split(",")[0]).group()
                    product["price"] = price

                product["link"] = product_item.xpath("./a[@class='s-item__link']/@href").get().strip()

                headers = {
                    'user-agent': random.choice(user_agent_list),
                    'referer': response.url,
                }
                yield scrapy.Request(product["link"], callback=self.parse_detail, headers=headers, meta={"product": product})
            except:
                traceback.print_exc()
                continue
        
        next_url = response.xpath("//a[@class='ebayui-pagination__control'][@rel='next']/@href").get()
        if next_url:
            headers = {
                'authority': 'www.ebay.de',
                'user-agent': random.choice(user_agent_list),
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'sec-fetch-site': 'same-origin',
                'referer': response.url,
            }
            yield response.follow(next_url.strip(), callback=self.parse_inventory, headers=headers, meta=response.meta)

    def parse_detail(self, response):
        product = response.meta["product"]

        for attr_table in response.xpath("//div[@class='itemAttr']//table"):
            for attr_tr in attr_table.xpath(".//tr"):
                for index, attr_td in enumerate(attr_tr.xpath("./td")):
                    index += 1
                    if attr_td.xpath("@class").get() == "attrLabels":
                        td_text = attr_td.xpath(".//text()").get()
                        if "Kraftstoff" in td_text:
                            fuel = "".join(attr_tr.xpath(f"./td[{index+1}]//text()").extract()).strip()
                            if "Elektro" in fuel:
                                fuel = "Hybrid"

                            product["fuel"] = fuel

                        elif "Marke" in td_text:
                            product["car_brand"] = "".join(attr_tr.xpath(f"./td[{index+1}]//text()").extract()).strip()

                        elif "Modell" in td_text:
                            product["car_model"] = "".join(attr_tr.xpath(f"./td[{index+1}]//text()").extract()).strip()

                        elif "Getriebe" in td_text:
                            gearbox = "".join(attr_tr.xpath(f"./td[{index+1}]//text()").extract()).strip()
                            if "Schaltung" in gearbox:
                                product["gearbox"] = "Schaltung"
                            else:
                                product["gearbox"] = gearbox

                        elif "Kilometerstand" in td_text:
                            mileage = "".join(attr_tr.xpath(f"./td[{index+1}]//text()").extract()).strip()
                            product["mileage"] = re.search(r"\d+", mileage.replace(".", "").split(",")[0]).group()

                        elif "Leistung" in td_text:
                            power = "".join(attr_tr.xpath(f"./td[{index+1}]//text()").extract()).strip()
                            if re.search(r"\d+\s*KW", power, re.I):
                                power = round(int(re.search(r"(\d+)\s*KW", power, re.I).groups()[0]) / 0.735499)
                            elif re.search(r"\d+\s*PS", power, re.I):
                                power = re.search(r"(\d+)\s*PS", power, re.I).groups()[0]
                            elif re.search(r"\d+", power):
                                power = re.search(r"\d+", power).group()
                            else:
                                power = 0

                            product["power"] = power

                        
                        elif "Typ" in td_text:
                            product["size"] = "".join(attr_tr.xpath(f"./td[{index+1}]//text()").extract()).strip()

                        elif "Antriebsart" in td_text:
                            four_wheel = "".join(attr_tr.xpath(f"./td[{index+1}]//text()").extract()).strip()

                            if re.search(r"Vierradantrieb|Allradantrieb", four_wheel, re.I):
                                product["four_wheel"] = True
                            else:
                                product["four_wheel"] = False
                            
                        elif "Navigation" in td_text:
                            navigation = "".join(attr_tr.xpath(f"./td[{index+1}]//text()").extract()).strip()
                            if "Navigationssystem" in navigation:
                                product["navigation"] = True
                            else:
                                product["navigation"] = False

                        elif "Erstzulassung" in td_text:
                            first_registration = "".join(attr_tr.xpath(f"./td[{index+1}]//text()").extract()).strip()
                            
                            if len(first_registration) >= 4:
                                product["first_registration"] = first_registration[:4]

        if config["store"] == "DB":
            print(product)
            process_product_db(product)
        else:
            yield product
