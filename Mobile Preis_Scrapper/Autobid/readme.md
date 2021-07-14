# install needed python libraries
	`pip install requests`
	`pip install scrapy`
	`pip install selenium`
	`pip install lxml`
	`pip install pymysql`
	`pip install logging`
	`pip install scraperapi-sdk`

# setup scraperapi key in the code.
	`open mobilede_db_Spider.py`
	`line#12 - client = ScraperAPIClient("<the_api>"), put the api key to this line`

# setup database information (for connection)
	`open mobilede_db_Spider.py`
	`line#39-44: db_config = {"host": "localhost",
        "port": 3306,
        "user": "root",
        "password": "mysql",
        "database": "adesacrawler"}`
	`edit this dict accordingly.`

# add new columns to auction table.
	`set the schema `adesacrawler` to default schema`
	`add_columns_sql.sql`

# Download chromedriver.exe and put into the project path.
	`Go to https://chromedriver.chromium.org/downloads`
	`Check your chrome browser version, latest is 90, so download 90.xxx version`
	`I put the version chromedriver I used in the project folder.`

# run spider
	`scrapy crawl mobilededb`

# Input mode
	`2 options: 1) normal 2) ChromeDriver`
	`Ups, bist Du ein Mensch? / Are you a human? - When I run 1), I got this error`
	`So I add mode 2), visit the URL with chromedriver, problem resolved.`


