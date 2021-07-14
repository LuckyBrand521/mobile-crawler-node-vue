/*
SQLyog Community v13.1.6 (64 bit)
MySQL - 10.4.19-MariaDB : Database - bca
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`bca` /*!40100 DEFAULT CHARACTER SET utf8 */;

USE `bca`;

/*Table structure for table `auction` */

DROP TABLE IF EXISTS `auction`;

CREATE TABLE `auction` (
  `favorite` tinyint(1) DEFAULT 0,
  `count` int(11) DEFAULT NULL,
  `result` text DEFAULT NULL,
  `auction_id` varchar(100) NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `car_brand` int(11) DEFAULT NULL,
  `car_model` int(11) DEFAULT NULL,
  `special` varchar(255) DEFAULT NULL,
  `size` text DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `first_registration` date DEFAULT NULL,
  `mileage` int(11) DEFAULT NULL,
  `fuel` tinyint(4) DEFAULT NULL,
  `gearbox` tinyint(4) DEFAULT NULL,
  `power` smallint(6) DEFAULT NULL,
  `price_1` int(11) DEFAULT NULL,
  `price_2_5` int(11) DEFAULT NULL,
  `price_5_10` int(11) DEFAULT NULL,
  `price_20` int(11) DEFAULT NULL,
  `four_wheel` tinyint(1) DEFAULT 0,
  `leather` tinyint(1) DEFAULT 0,
  `navigation` tinyint(1) DEFAULT 0,
  `heating` tinyint(1) DEFAULT 0,
  `panoramic_roof` tinyint(1) DEFAULT 0,
  `seats` tinyint(1) DEFAULT NULL,
  `batch_id` varchar(100) DEFAULT NULL,
  `catalog_number` varchar(50) DEFAULT NULL,
  `url` text DEFAULT NULL,
  `is_available` tinyint(4) DEFAULT 1,
  `version` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`auction_id`),
  UNIQUE KEY `auction_auction_id_uindex` (`auction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `auction` */

/*Table structure for table `auction_batch` */

DROP TABLE IF EXISTS `auction_batch`;

CREATE TABLE `auction_batch` (
  `batch_id` varchar(100) NOT NULL,
  `country` varchar(10) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `type` text DEFAULT NULL,
  `name` text DEFAULT NULL,
  `location` text DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  PRIMARY KEY (`batch_id`),
  UNIQUE KEY `auction_batch_batch_id_uindex` (`batch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `auction_batch` */

/*Table structure for table `auction_history` */

DROP TABLE IF EXISTS `auction_history`;

CREATE TABLE `auction_history` (
  `date` timestamp NOT NULL DEFAULT current_timestamp(),
  `auction_id` varchar(100) NOT NULL,
  `end_date` datetime DEFAULT NULL,
  `version` varchar(100) DEFAULT NULL,
  `fuel` tinyint(4) DEFAULT NULL,
  `power` smallint(6) DEFAULT NULL,
  `mileage` int(11) DEFAULT NULL,
  `first_registration` date DEFAULT NULL,
  `navigation` tinyint(4) DEFAULT NULL,
  `panoramic_roof` tinyint(4) DEFAULT NULL,
  `leather` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`auction_id`,`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `auction_history` */

/* Trigger structure for table `auction` */

DELIMITER $$

/*!50003 DROP TRIGGER*//*!50032 IF EXISTS */ /*!50003 `add_to_history_insert` */$$

/*!50003 CREATE */ /*!50017 DEFINER = 'root'@'localhost' */ /*!50003 TRIGGER `add_to_history_insert` AFTER INSERT ON `auction` FOR EACH ROW BEGIN
    INSERT INTO bca.auction_history (auction_id, end_date, version, fuel, power, mileage, first_registration, navigation, panoramic_roof, leather) VALUES (NEW.auction_id, NEW.end_date, NEW.version, NEW.fuel, NEW.power, NEW.mileage, NEW.first_registration, NEW.navigation, NEW.panoramic_roof, NEW.leather);
END */$$


DELIMITER ;

/* Trigger structure for table `auction` */

DELIMITER $$

/*!50003 DROP TRIGGER*//*!50032 IF EXISTS */ /*!50003 `add_to_history_update` */$$

/*!50003 CREATE */ /*!50017 DEFINER = 'root'@'localhost' */ /*!50003 TRIGGER `add_to_history_update` AFTER UPDATE ON `auction` FOR EACH ROW BEGIN
    INSERT INTO bca.auction_history (auction_id, end_date, version, fuel, power, mileage, first_registration, navigation, panoramic_roof, leather) VALUES (NEW.auction_id, NEW.end_date, NEW.version, NEW.fuel, NEW.power, NEW.mileage, NEW.first_registration, NEW.navigation, NEW.panoramic_roof, NEW.leather);
END */$$


DELIMITER ;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
