import mysql.connector
import re

db_list = ['adesacrawler', 'autobidcrawler', 'ebaycrawler', 'kleinanzeigencrawler']

special_strs = []
db2 = mysql.connector.connect(
    host = 'localhost',
    user = 'root',
    password = '',
    port = 3306,
    database = 'mobilecrawler',
)
cursor2 = db2.cursor()
load_special_query = 'select * from specials'
cursor2.execute(load_special_query)
special_strs = cursor2.fetchall()
db2.close()

load_auction_title_query = 'select auction_id, title from auction'
def is_in(str, pattern):
    return (1 if (' '+pattern.upper() in str.upper() or '"'+pattern.upper() in str.upper()) else 0 )
for db_name in db_list:
    print(db_name)
    mydb = mysql.connector.connect(
        host = 'localhost',
        user = 'root',
        password = '',
        port = 3306,
        database = db_name
    )
    mycursor = mydb.cursor(buffered=True)
    update_cursor = mydb.cursor(buffered=True)
    mycursor.execute(load_auction_title_query)
    title_row = mycursor.fetchone()
    while title_row is not None:
        id = title_row[0]
        title = title_row[1]
        if title:
            for name in special_strs:
                if is_in(title, name[1]):
                    set_query = "UPDATE auction SET special = '"+ name[1] +"' WHERE auction_id = " + str(id)
                    update_cursor.execute(set_query)
                    break
        title_row = mycursor.fetchone()
    mycursor.close()
    update_cursor.close()
    mydb.commit()
    mydb.close()
