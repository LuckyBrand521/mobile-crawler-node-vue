from seleniumwire import webdriver 
from selenium import webdriver as WD
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains
import requests
import json, random
import jsonpath
import pandas as pd
import csv
import time
import sys
import os
from datetime import datetime, timezone
from requestium import Session, Keys

options = Options()
# options.headless = True
options.binary_location = r"C:\Program Files\Mozilla Firefox\firefox.exe"
executable_path = "geckodriver.exe"
proxy_options = {
    'proxy': {
        'http': f'http://scraperapi:e9da83be4b3b5dd335a257f8586687b7@proxy-server.scraperapi.com:8001',
        'no_proxy': 'localhost,127.0.0.1'
    }
}
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
options = webdriver.ChromeOptions()
# options.add_argument("--headless")
options.add_argument("--user-agent=%s" %random.choice(user_agent_list))

driver = webdriver.Firefox(options=options, executable_path=executable_path,seleniumwire_options=proxy_options)
# driver = webdriver.Chrome("./chromedriver.exe", options=options)
driver.set_window_size(960, 640)
dataFrame = pd.DataFrame()# set dataFrame variable
item_index = 0
category_page_index = 1
filter_tags = ["GetViewModel", "FilterVehicleResults"]
category_url = "https://de.bca-europe.com/buyer/facetedSearch/saleCalendar?bq=%7Csalecountry_exact:DE&currentFacet=salecountry_exact"
driver.get("https://de.bca-europe.com/buyer/facetedSearch/saleCalendar?bq=%7Csalecountry_exact:DE&currentFacet=salecountry_exact")# set url    
while 1:
    try:# wait for new window
        WebDriverWait(driver, 60).until(EC.visibility_of_element_located((By.CLASS_NAME, "layout__main-inner")))
        print('waiting done')
        time.sleep(10)
        
        category_list = driver.find_element_by_class_name('layout__main-inner').find_elements_by_xpath("//div[@class='listing ng-scope']")
        print(len(category_list))
        for li_index in range(len(category_list)):
            print(driver.find_element_by_class_name('layout__main-inner').find_elements_by_xpath("//div[@class='listing ng-scope']")[li_index].find_element_by_class_name('listing__title').find_element_by_tag_name('a').get_attribute('class'))    
            if driver.find_element_by_class_name('layout__main-inner').find_elements_by_xpath("//div[@class='listing ng-scope']")[li_index].find_element_by_class_name('listing__title').find_element_by_tag_name('a').get_attribute('class') != 'listing__link ng-binding ng-scope':
                continue;    
            driver.execute_script("arguments[0].scrollIntoView();", driver.find_element_by_class_name('layout__main-inner').find_elements_by_xpath("//div[@class='listing ng-scope']")[li_index].find_element_by_class_name('listing__title').find_element_by_tag_name('a'))
            time.sleep(1)
            product_url = driver.find_element_by_class_name('layout__main-inner').find_elements_by_xpath("//div[@class='listing ng-scope']")[li_index].find_element_by_class_name('listing__title').find_element_by_tag_name("a").get_attribute('href')
            product = driver.find_element_by_class_name('layout__main-inner').find_elements_by_xpath("//div[@class='listing ng-scope']")[li_index].find_element_by_class_name('listing__title').find_element_by_tag_name("a").click()
            try:
                WebDriverWait(driver, 60).until(EC.visibility_of_element_located((By.CLASS_NAME, "layout__main-inner")))
                print('waiting done')
                time.sleep(10)
            except TimeoutException:
                print('network error')
            page = 1
            while 1:
                car_number = 0
                page_update = True
                car_url = ''
                cars_nodes = []
                car_count = []
                car_page_start_number = []
                current_product_url = driver.current_url
                try:
                    if page == 1:
                        driver.wait_for_request(filter_tags[0], timeout=60)
                    else:
                        print('page',page)
                        cars_nodes = []
                        driver.wait_for_request(filter_tags[1], timeout=60)
                except:
                    print("Failed to request page "+str(driver.current_url)+" after 15 seconds.")
                data_request = []
                for request in driver.requests:
                    if request.response and (filter_tags[0] in request.url or filter_tags[1] in request.url):
                        data_request.append(request)
                if len(data_request) > 0:
                    data_text = data_request[0].response.body
                    cars_json = json.loads(data_text)
                    cars_nodes = jsonpath.jsonpath(cars_json, "$.VehicleResults[*]")
                    car_count = jsonpath.jsonpath(cars_json,"$.TotalVehicles")
                    car_page_start_number = jsonpath.jsonpath(cars_json, "$.PageStartCount")
                while 1:
                    try:# wait for new window
                        if cars_nodes != False:
                            auction_id_node = jsonpath.jsonpath(cars_nodes[car_number], "$.RegistrationNumber")
                            dataFrame.at[item_index,"auction_id"] = "" if auction_id_node == False else auction_id_node[0]
                            catalog_number_node = jsonpath.jsonpath(cars_nodes[car_number], "$.LotNumber")
                            dataFrame.at[item_index,"catalog_number"] = "" if catalog_number_node == False else catalog_number_node[0]
                            end_date_node = jsonpath.jsonpath(cars_nodes[car_number], "$.SaleEndDateString")
                            end_date = "" if end_date_node == False else end_date_node[0]
                            try:
                                list_date = end_date.split()
                                date_array = list_date[0].split('.')
                                hour_array = list_date[1].split(':')
                                dataFrame.at[item_index,"end_date"] = date_array[2]+'-'+date_array[1]+'-'+date_array[0]+' '+list_date[1]
                            except:
                                dataFrame.at[item_index,"end_date"] = ''
                            brand_node = jsonpath.jsonpath(cars_nodes[car_number], "$.Make")
                            dataFrame.at[item_index,"car_brand"] = "" if brand_node == False else brand_node[0]
                            model_node = jsonpath.jsonpath(cars_nodes[car_number], "$.Model")
                            dataFrame.at[item_index,"car_model"] = "" if model_node == False else model_node[0]
                            dataFrame.at[item_index,"title"] = dataFrame.at[item_index,"car_brand"] + ' ' + dataFrame.at[item_index,"car_model"]
                            fuel_node = jsonpath.jsonpath(cars_nodes[car_number], "$.VehicleInfoColumns.3[1]")
                            dataFrame.at[item_index,"fuel"] = None if fuel_node == False else fuel_node[0].strip()
                            gearbox_node = jsonpath.jsonpath(cars_nodes[car_number], "$.VehicleInfoColumns.3[0]")
                            dataFrame.at[item_index,"gearbox"] = None if gearbox_node == False else gearbox_node[0].strip()
                            power_node = jsonpath.jsonpath(cars_nodes[car_number], "$.PowerPs")
                            dataFrame.at[item_index,"power"] = None 
                            if power_node != False:
                                try:
                                    dataFrame.at[item_index,"power"] = int(power_node[0])
                                except:
                                    dataFrame.at[item_index,"power"] = None
                            mileage_node = jsonpath.jsonpath(cars_nodes[car_number], "$.Mileage")
                            dataFrame.at[item_index,"mileage"] = None if mileage_node == False else mileage_node[0]
                            try:
                                dataFrame.at[item_index,"mileage"] = int(dataFrame.at[item_index,"mileage"])
                            except:
                                dataFrame.at[item_index,"mileage"] = None
                            first_register_node = jsonpath.jsonpath(cars_nodes[car_number], "$.RegistrationDate")
                            dataFrame.at[item_index,"first_registration"] = None if first_register_node == False else first_register_node[0].split()[0]
                            url_node = jsonpath.jsonpath(cars_nodes[car_number], "$.ViewLotUrl")
                            dataFrame.at[item_index,"url"] = "" if url_node == False else url_node[0]
                            try:
                                if car_number == 0:
                                    car_url = driver.find_element_by_class_name('layout__main-inner').find_elements_by_xpath("//div[@class='listing ng-scope']")[0].find_element_by_class_name('listing__title').find_element_by_tag_name("a").get_attribute('href')
                                    driver.get(str(car_url))
                                    WebDriverWait(driver, 60).until(EC.visibility_of_element_located((By.CLASS_NAME, "VehicleKeyInformation")))
                                    print('waiting done')
                                    time.sleep(10)
                                dataFrame.at[item_index,"size"] = ''
                                dataFrame.at[item_index,"four_wheel"] = '0'
                                dataFrame.at[item_index,"proof"] = '0'
                                dataFrame.at[item_index,"lether"] = '0'
                                dataFrame.at[item_index,"heating"] = '0'
                                print('------------------new window--------------------\n')
                                tr_list = driver.find_element_by_class_name('VehicleKeyInformation').find_elements_by_tag_name('tr')
                                for tr_index in range(len(tr_list)):
                                    if tr_list[tr_index].find_elements_by_tag_name('td')[0].text.strip().lower().replace(' ','') == 'antriebsart' and tr_list[tr_index].find_elements_by_tag_name('td')[1].text.strip().lower().replace(' ','') != '':
                                        dataFrame.at[item_index,"four_wheel"] = '1'
                                    if tr_list[tr_index].find_elements_by_tag_name('td')[0].text.strip().lower().replace(' ','') == 'karosserietyp':
                                        dataFrame.at[item_index,"size"] = tr_list[tr_index].find_elements_by_tag_name('td')[1].text.strip()
                                tr_list_infor = driver.find_element_by_class_name('VehicleInteriorInformation').find_elements_by_tag_name('tr')
                                for pr_index in range(len(tr_list_infor)):
                                    if tr_list_infor[pr_index].find_element_by_tag_name('td').text.strip().lower().replace(' ','') == 'standheizung':
                                        dataFrame.at[item_index,"heating"] = '1'
                                    if tr_list_infor[pr_index].find_element_by_tag_name('td').text.strip().lower().replace(' ','') == 'typinnenausstattung(generell)-leder':
                                        dataFrame.at[item_index,"lether"] = '1'
                                    if tr_list_infor[pr_index].find_element_by_tag_name('td').text.strip().lower().replace(' ','') == 'sonnendach-glasschiebedach':
                                        dataFrame.at[item_index,"proof"] = '1'
                                print(dataFrame)
                                car_number += 1
                                
                                writer = pd.ExcelWriter("2021_car_list.xlsx", engine='xlsxwriter')#make or get xlsx file that name is 2020_list
                                dataFrame.to_excel(writer, sheet_name='Sheet1', startrow=0, index=False)# set dataframe to file
                                writer.save()# save file
                                item_index = item_index+1

                                if car_number > 49 or car_number == car_count[0]-1:
                                    print('break')
                                    break
                                else:
                                    next_car = driver.find_element_by_id('ctl00_ctl00_LayoutMasterPage_WebPartManagerContent_NextAndPrevious_NextLink')
                                    next_car.click()
                                    try:
                                        WebDriverWait(driver, 60).until(EC.visibility_of_element_located((By.CLASS_NAME, "VehicleKeyInformation")))
                                        print('next car waiting done')
                                        time.sleep(5)
                                    except TimeoutException:
                                        print('next car network error')
                            except TimeoutException:
                                print('network error')
                    except TimeoutException:
                        print('network error')  
                print('next page')  
                del driver.requests     
                driver.get(str(current_product_url))
                try:# wait for new window
                    WebDriverWait(driver, 60).until(EC.visibility_of_element_located((By.CLASS_NAME, "layout__main-inner")))
                    print('waiting done')
                    time.sleep(10)
                    try:
                        page += 1
                        next = driver.find_element_by_xpath(f'//a[@class="nav__link nav__link--pagination ng-binding"][text()[contains(., "{page}")]]')
                        next.click()
                        try:# wait for new window
                            WebDriverWait(driver, 60).until(EC.visibility_of_element_located((By.CLASS_NAME, "layout__main-inner")))
                            print('waiting done')
                            time.sleep(10)
                        except TimeoutException:
                            print('network error')
                    except NoSuchElementException:
                        print('page break',page)
                        break
                except TimeoutException:
                    print('network error')
        try:
            category_page_index += 1
            next = driver.find_element_by_xpath(f'//a[@class="nav__link nav__link--pagination ng-binding"][text()[contains(., "{category_page_index}")]]')
            next.click()
            time.sleep(10)   
        except NoSuchElementException:
            break
    except TimeoutException:
        print('network error')
