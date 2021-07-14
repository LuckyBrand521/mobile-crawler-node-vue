import os, scrapy, requests, json, csv
import logging
import traceback
from selenium import webdriver
import time
import re
import pymysql
from scraper_api import ScraperAPIClient
from lxml import etree

mode = 2 #input("Select MODE: 1) normal 2) selenium\n> ")
client = ScraperAPIClient("e9da83be4b3b5dd335a257f8586687b7")

class MobilededbspiderSpider(scrapy.Spider):
    name = 'mobilededb'
    allowed_domains = ['mobile.de', 'suchen.mobile.de']

    custom_settings = {
        'DOWNLOAD_DELAY': 1,
        'LOG_LEVEL': "INFO"
    }

    headers = {
        'authority': 'm.mobile.de',
        'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
        'sec-ch-ua-mobile': '?0',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
        'accept': '*/*',
        'sec-fetch-site': 'same-site',
        'sec-fetch-mode': 'no-cors',
        'sec-fetch-dest': 'script',
        #'referer': 'https://suchen.mobile.de/fahrzeuge/search.html?vc=Car&dam=0&sfmr=false',
        'accept-language': 'en-US,en;q=0.9',
    }

    fuel_dict = {1:"Benzin", 2:"Diesel", 3:"Hybrid Benzin/Elektro", 4:"Hybrid"}
    gearbox_dict = {1:"Manual",2:"Automatic", 3:"Schaltung", 5:"6-Gang-Schaltgetriebe", 4:"Automatik", 6:"Manuelles Getriebe", 7:"5-Gang-Schaltgetriebe", 8:"Schaltgetriebe"}
    db = None
    db_config = {"host": "localhost",
        "port": 3306,
        "user": "root",
        "password": "",
        "database": "adesacrawler"}

    options = webdriver.ChromeOptions()
    options.add_argument("--headless")
    options.add_argument("--user-agent=%s" %headers["user-agent"])
    

    def __init__(self):
        self.db = pymysql.connect(host=self.db_config["host"], 
            port=self.db_config["port"], 
            user=self.db_config["user"], 
            password=self.db_config["password"],
            database=self.db_config["database"],
            autocommit=True)


    def load_input(self):
        cursor = self.db.cursor()
        input_list = []
        try:
            cursor.execute("SELECT * FROM auction WHERE result IS NULL")
            headers = [t[0] for t in cursor.description]
            data_lines = cursor.fetchall()
            for data_item in data_lines:
                data_dict = {}
                for i in range(0, len(headers)):
                    data_dict[headers[i]] = data_item[i]
                input_list.append(data_dict)
        except:
            logging.info("Failed to load input data from database.")
            logging.info("---------------------------DETAIL------------------------")
            logging.info(traceback.format_exc())
            logging.info("\r\n\r\n")
        finally:
            cursor.close()

        return input_list

    def create_web_driver(self):
        return webdriver.Chrome(options=self.options)
        
    def start_requests(self):

        fake_url = "https://%s" %self.allowed_domains[0]
        fake_request = scrapy.Request(fake_url, callback=self.fake_response)
        yield fake_request
    def get_brand_model_ids(self, old_brand, old_model):
        mydb = pymysql.connect(
            host = self.db_config["host"],
            user = self.db_config["user"],
            password = self.db_config["password"],
            port = self.db_config["port"],
            database = 'mobilecrawler',
        )
        try:
            mycursor = mydb.cursor()
            mycursor.execute("select brand_name from brand where brand_id="+ str(old_brand))
            brand_name = mycursor.fetchone()
            mycursor.execute("select model_name, id from model where brand_id=%s and model_id=%s", (old_brand, old_model))
            [model_name, old_id] = mycursor.fetchone()
            mycursor.execute("select brand_id, model_id from result where brand_name=%s and (model_name=%s or model_name=%s)", (brand_name[0], model_name, '    '+model_name))
            [new_brand, new_model] = mycursor.fetchone()
            return [new_brand, new_model]
        except Exception as e:
            print(e)
            return [old_brand, old_model]
    def fake_response(self, response):

        input_data = self.load_input()
        logging.info("\r\nThere are %d lines to check!\r\n" %len(input_data))
        start_index = 0
        if os.path.exists("current_index.txt"):
            with open("current_index.txt", "r") as r:
                start_index = int(r.read())
        print("Start from index %d." %start_index)
        working_index = 0
        for input_row in input_data:
            # working_index = working_index + 1
            # if working_index < start_index:
            #     continue

            # with open("current_index.txt", "w") as w:
            #     w.write(str(working_index))
            # print("\r\n\r\nVisiting index %d.\r\n" %working_index)
            #logging.info(">>>> DEBUG - Input line.\n")
            #logging.info(input_row)
                    
            if input_row["car_brand"] is None or input_row["car_model"] is None:
                print(f"Unknown Marke or Model - {input_row['car_brand']}, {input_row['car_model']}")
                continue

            search_param_list = []
            search_param_list.append("dam=0")
            search_param_list.append("isSearchRequest=true")
            search_param_list.append("s=Car")
            search_param_list.append("sfmr=false")
            search_param_list.append("vc=Car")
            search_param_list.append("cn=DE")
            search_param_list.append("sortOption.sortBy=searchNetGrossPrice")
            search_param_list.append("sortOption.sortOrder=ASCENDING")
            param_list = list()
            param_list.append("damageUnrepaired=NO_DAMAGE_UNREPAIRED")
            param_list.append("email=on")
            param_list.append("isSearchRequest=false")
            param_list.append("scopeId=C")
            param_list.append("sfmr=false")
            param_list.append("cn=DE")
            if input_row["car_brand"]:
                try:
                    param_list.append(f"makeModelVariant1.makeId={input_row['car_brand']}")
                            
                    if input_row["car_model"]:
                        try:
                            param_list.append(f"makeModelVariant1.modelId={input_row['car_model']}")
                            special = input_row['special']
                            if not input_row['special']:
                                special = ''
                            search_param_list.append(f"ms={input_row['car_brand']}%3B{input_row['car_model']}%3B%3B{special}%3B") #ms=8800;49;;;
                        except:
                            print(f"Not Found {input_row['car_model']} Modell.")
                except:
                    print(f"Not Found {input_row['car_brand']} Marke.")
            if input_row["fuel"] and input_row["fuel"] in self.fuel_dict:
                if self.fuel_dict[input_row["fuel"]] == "Benzin":
                    param_list.append("fuels=PETROL")
                    search_param_list.append("ft=PETROL")
                elif self.fuel_dict[input_row["fuel"]] == "Diesel":
                    param_list.append("fuels=DIESEL")
                    search_param_list.append("ft=DIESEL")
                elif input_row["fuel"] in self.fuel_dict and self.fuel_dict[input_row["fuel"]] == "Hybrid (Benzin/Elektro)":
                    param_list.append("fuels=HYBRID")
                    search_param_list.append("ft=HYBRID")
            if input_row["first_registration"]:
                input_year = input_row["first_registration"].year
                #param_list.append(f"maxFirstRegistrationDate={input_year}") # keep bis empty.
                param_list.append(f"minFirstRegistrationDate={input_year}")
                search_param_list.append(f"fr={input_year}%3A")
                
            if input_row["power"]: 
                min_kw_value = int((input_row['power'] - 3) / 1.36) # I search on the internet, 1KW=1.36PS
                max_kw_value = int((input_row["power"] + 3) / 1.36)
                # the order affect the result.
                param_list.append(f"minPowerAsArray={input_row['power'] - 3}")
                param_list.append("minPowerAsArray=PS")
                # Set the high bound of the range to low + 9.
                param_list.append(f"maxPowerAsArray={input_row['power'] + 3}")
                param_list.append("maxPowerAsArray=PS")
                search_param_list.append(f"pw={min_kw_value}%3A{max_kw_value}")
            if input_row["mileage"]:
                # if the from value need to setup also, uncomment below 2 lines code.
                # comment the followed 2 lines code. 

                #param_list.append(f"minMileage={input_row["mileage"]}")
                #search_param_list.append(f"ml={input_row['mileage']}%3A{input_row['mileage']+25000}")
                param_list.append(f"maxMileage={input_row['mileage']+25000}")
                search_param_list.append(f"ml=%3A{input_row['mileage']+25000}")

                
            if input_row["four_wheel"] == 1:
                param_list.append("features=FOUR_WHEEL_DRIVE")
                search_param_list.append("fe=FOUR_WHEEL_DRIVE")
            if input_row["gearbox"]:
                if self.gearbox_dict[input_row["gearbox"]] == "Manual":
                #if "Schaltgetriebe" in input_row["Getriebe"]:
                    param_list.append("transmissions=MANUAL_GEAR")
                    search_param_list.append("tr=MANUAL_GEAR")
                elif self.gearbox_dict[input_row["gearbox"]] == "Automatic":
                #elif "Automatik" in input_row["Getriebe"]:
                    param_list.append("transmissions=AUTOMATIC_GEAR")
                    search_param_list.append("tr=AUTOMATIC_GEAR")


            if input_row["navigation"] == 1:
                param_list.append("features=NAVIGATION_SYSTEM")
                search_param_list.append("fe=NAVIGATION_SYSTEM")


            if input_row["panoramic_roof"] == 1:
                param_list.append("features=PANORAMIC_GLASS_ROOF")
                search_param_list.append("fe=PANORAMIC_GLASS_ROOF")


            if input_row["leather"] == 1:
                param_list.append("interior=LEATHER")
                search_param_list.append("it=LEATHER")

                param_list.append("interior=PARTIAL_LEATHER")
                search_param_list.append("it=PARTIAL_LEATHER")

                param_list.append("interior=ALCANTARA")
                search_param_list.append("it=ALCANTARA")


            if input_row["four_wheel"] == 1:
                param_list.append("features=FOUR_WHEEL_DRIVE")
                search_param_list.append("fe=FOUR_WHEEL_DRIVE")


            if input_row["seats"]:
                if input_row["seats"] > 5:
                    # seats number: min = max. 
                    param_list.append(f"minSeats={input_row['seats']}")
                    search_param_list.append(f"sc={input_row['seats']}%3A")

            if input_row["size"]:
                if "Kombi" in input_row["size"]:
                    param_list.append("categories=EstateCar")
                    search_param_list.append("c=EstateCar")
                elif "Coupé" in input_row["size"]:
                    param_list.append("categories=SportsCar")
                    search_param_list.append("c=SportsCar")
                elif "Limousine" in input_row["size"]:
                    param_list.append("categories=Limousine")
                    search_param_list.append("c=Limousine")
                elif "Cabriolet" in input_row["size"]:
                    param_list.append("categories=Cabrio")
                    search_param_list.append("c=Cabrio")
                


            search_url = f"https://suchen.mobile.de/fahrzeuge/search.html?{'&'.join(search_param_list)}"
            count_url = f'https://suchen.mobile.de/fahrzeuge/count.json?{"&".join(param_list)}'
            # temp_url = search_url.replace(':', '%3A')
            search_url = search_url.replace(';', '%3B')
            input_row["result"] = search_url

            logging.info("Search url %s." %search_url)
            logging.info("Count url %s." %count_url)

            driver = None
            try:
                content_text = response.text
                if mode == 2:
                    logging.info("\r\n\r\nRunning in mode#2 - selenium.\r\n")
                    driver = self.create_web_driver()
                    driver.get(count_url)
                    time.sleep(1)
                    content_text = driver.find_element_by_xpath("//body/pre").text
                    
                #logging.info(">>>>>BEGIN TEST INFORMATION<<<<<")
                #logging.info(content_text)
                #logging.info(">>>>>END TEST INFORMATION<<<<<")
                content_json = json.loads(content_text)
                count = content_json["numResultsTotal"]
                input_row["count"] = count
                print("Count :", count)
                if count == 0:
                    input_row["price_1"] = None
                    input_row["price_2_5"] = None
                    input_row["price_5_10"] = None
                    input_row["price_20"] = None
                else:
                    content = client.get(search_url).text
                    tree = etree.HTML(content)
                    refresh_node = tree.xpath("//meta[@http-equiv='refresh' and @content]")
                    refresh_url = ""
                    if refresh_node is not None and len(refresh_node) > 0:
                        logging.info("Get referesh URL")
                        refresh_url = refresh_node[0].get("content").split("'")[-2]
                        refresh_url = "https://%s%s" %(self.allowed_domains[-1], refresh_url)
                        content = client.get(refresh_url).text

                    tree = etree.HTML(content)
                    result_xpath = "//div[@class='cBox cBox--content cBox--resultList']//div[starts-with(@class,'cBox-body')]/a[@data-ad-id]//span[@class='h3 u-block']"
                    result_nodes = tree.xpath(result_xpath)
                    if len(result_nodes) == 0:
                        logging.warn("\r\n\r\n>>> Count is larger than 0, but price list is empty, double check!\r\n")
                        input_row["price_1"] = None
                        input_row["price_2_5"] = None
                        input_row["price_5_10"] = None
                        input_row["price_20"] = None
                    else:
                        result_list = [t.text.split()[0] for t in result_nodes]
                        result_list = [int(t.replace(".", "")) for t in result_list]
                        logging.info("refresh url - %s" %refresh_url)
                        logging.info(result_list)
                        input_row["price_1"] = result_list[0]
                        lst_2_5 = result_list[1:5]
                        if len(lst_2_5) > 0: 
                            input_row["price_2_5"] = int(sum(lst_2_5)/len(lst_2_5))
                        lst_5_10 = result_list[5:10]
                        if len(lst_5_10) > 0:
                            input_row["price_5_10"] = int(sum(lst_5_10)/len(lst_5_10))
                        input_row["price_20"] = None if len(result_list) < 20 else result_list[-1]

                self.update_result(input_row)
            except:
                logging.info("Error %s" %traceback.format_exc())
            finally:
                if driver is not None:
                    driver.quit()


    def update_result(self, input_row):
        
        # it only update 4 prices in previous code, so this variable tell the script whether to run it or not.
        # if all prices are empty, then don't run the sql
        # now it also update count and result (to store the URL and count)
        # so the sql always run
        execute_it = True
        update_sql_segments = []
        update_sql_segments.append("UPDATE auction SET ")
        update_sql_segments.append("result='%s', " %input_row["result"])
        update_sql_segments.append("count=%d," %input_row["count"])
        if input_row["price_1"] is not None:
            update_sql_segments.append("price_1=%d, " %input_row["price_1"])
            execute_it = True
        if input_row["price_2_5"] is not None:
            update_sql_segments.append("price_2_5=%d, " %input_row["price_2_5"])
            execute_it = True
        if input_row["price_5_10"] is not None:
            update_sql_segments.append("price_5_10=%d, " %input_row["price_5_10"])
            execute_it = True
        if input_row["price_20"] is not None:
            update_sql_segments.append("price_20=%d, " %input_row["price_20"])
            execute_it = True

        update_sql_segments[-1] = update_sql_segments[-1].strip().strip(',')
        update_sql_segments.append("where auction_id=%d;" %input_row["auction_id"])
        cursor = self.db.cursor()
        update_sql = "\n".join(update_sql_segments)
        try:
            if execute_it:
                logging.info(update_sql)
                cursor.execute(update_sql)
                logging.info("%d is updated." %input_row["auction_id"])
            else:
                logging.info("No results for %d." %input_row["auction_id"])
        except:
            logging.error("Failed to update auction %d due to %s." %(input_row["auction_id"], traceback.format_exc()))
        finally:
            cursor.close()


    def close(self, reason):
        if os.path.exists("current_index.txt"):
            os.remove("current_index.txt")
        logging.info("Spider complete! Close db connection now.")
        self.db.commit()
        self.db.close()


