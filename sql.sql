-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versione server:              10.4.32-MariaDB - mariadb.org binary distribution
-- S.O. server:                  Win64
-- HeidiSQL Versione:            12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dump della struttura del database officina_db
CREATE DATABASE IF NOT EXISTS `officina_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `officina_db`;

-- Dump della struttura di vista officina_db.activity_feed
-- Creazione di una tabella temporanea per risolvere gli errori di dipendenza della vista
CREATE TABLE `activity_feed` (
	`id` INT(11) NOT NULL,
	`username` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`type` ENUM('order','modification','restock','deduction') NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`item_name` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`quantity` INT(11) NOT NULL,
	`total_cost` DECIMAL(10,2) NULL,
	`description` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`created_at` TIMESTAMP NOT NULL,
	`full_name` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci'
);

-- Dump della struttura di tabella officina_db.activity_log
CREATE TABLE IF NOT EXISTS `activity_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `activity_type` enum('order','modification','restock','deduction') NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `amount` decimal(10,2) DEFAULT 0.00,
  `description` varchar(500) DEFAULT '',
  `reference_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- L’esportazione dei dati non era selezionata.

-- Dump della struttura di tabella officina_db.bot_status
CREATE TABLE IF NOT EXISTS `bot_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status` varchar(50) NOT NULL DEFAULT 'offline',
  `server_name` varchar(255) NOT NULL DEFAULT '',
  `uptime` varchar(100) NOT NULL DEFAULT '',
  `commands_per_hour` int(11) NOT NULL DEFAULT 0,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- L’esportazione dei dati non era selezionata.

-- Dump della struttura di procedura officina_db.CreateOrderWithInventoryUpdate
DELIMITER //
CREATE PROCEDURE `CreateOrderWithInventoryUpdate`(
    IN p_username VARCHAR(100),
    IN p_item_id INT,
    IN p_item_name VARCHAR(255),
    IN p_quantity INT,
    IN p_unit_price DECIMAL(10,2),
    IN p_total_cost DECIMAL(10,2),
    IN p_profit DECIMAL(10,2),
    IN p_description VARCHAR(500)
)
BEGIN
    DECLARE current_quantity INT DEFAULT 0;
    DECLARE new_quantity INT DEFAULT 0;
    DECLARE order_id INT DEFAULT 0;
    
    -- Inizia transazione
    START TRANSACTION;
    
    -- Verifica scorte disponibili
    SELECT quantity INTO current_quantity 
    FROM inventory 
    WHERE id = p_item_id;
    
    IF current_quantity < p_quantity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Scorte insufficienti';
    END IF;
    
    -- Calcola nuova quantità
    SET new_quantity = current_quantity - p_quantity;
    
    -- Crea ordine
    INSERT INTO orders (username, item_name, item_id, quantity, unit_price, total_cost, profit, description)
    VALUES (p_username, p_item_name, p_item_id, p_quantity, p_unit_price, p_total_cost, p_profit, p_description);
    
    SET order_id = LAST_INSERT_ID();
    
    -- Aggiorna inventario
    UPDATE inventory 
    SET quantity = new_quantity, updated_at = CURRENT_TIMESTAMP
    WHERE id = p_item_id;
    
    -- Log attività
    INSERT INTO activity_log (username, activity_type, item_name, quantity, amount, description, reference_id)
    VALUES (p_username, 'order', p_item_name, p_quantity, p_total_cost, p_description, order_id);
    
    -- Aggiorna guadagni giornalieri
    INSERT INTO daily_earnings (username, date, total_earnings, orders_count)
    VALUES (p_username, CURDATE(), p_profit, 1)
    ON DUPLICATE KEY UPDATE
        total_earnings = total_earnings + p_profit,
        orders_count = orders_count + 1,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Commit transazione
    COMMIT;
    
    SELECT order_id as new_order_id;
END//
DELIMITER ;

-- Dump della struttura di tabella officina_db.daily_earnings
CREATE TABLE IF NOT EXISTS `daily_earnings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `total_earnings` decimal(10,2) DEFAULT 0.00,
  `orders_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_date` (`username`,`date`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- L’esportazione dei dati non era selezionata.

-- Dump della struttura di tabella officina_db.employees
CREATE TABLE IF NOT EXISTS `employees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` enum('employee','admin') NOT NULL DEFAULT 'employee',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- L’esportazione dei dati non era selezionata.

-- Dump della struttura di tabella officina_db.employee_deductions
CREATE TABLE IF NOT EXISTS `employee_deductions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `modification_id` int(11) DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `is_paid` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `paid_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- L’esportazione dei dati non era selezionata.

-- Dump della struttura di tabella officina_db.inventory
CREATE TABLE IF NOT EXISTS `inventory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `category` enum('upper','lower') NOT NULL,
  `type` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `min_stock` int(11) NOT NULL DEFAULT 0,
  `purchase_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- L’esportazione dei dati non era selezionata.

-- Dump della struttura di vista officina_db.inventory_stats
-- Creazione di una tabella temporanea per risolvere gli errori di dipendenza della vista
CREATE TABLE `inventory_stats` (
	`category` ENUM('upper','lower') NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`type` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`item_count` BIGINT(21) NOT NULL,
	`total_quantity` DECIMAL(32,0) NULL,
	`low_stock_count` DECIMAL(22,0) NULL,
	`avg_purchase_price` DECIMAL(14,6) NULL
);

-- Dump della struttura di vista officina_db.inventory_with_prices
-- Creazione di una tabella temporanea per risolvere gli errori di dipendenza della vista
CREATE TABLE `inventory_with_prices` (
	`id` INT(11) NOT NULL,
	`name` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`category` ENUM('upper','lower') NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`type` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`quantity` INT(11) NOT NULL,
	`min_stock` INT(11) NOT NULL,
	`purchase_price` DECIMAL(10,2) NOT NULL,
	`created_at` TIMESTAMP NOT NULL,
	`updated_at` TIMESTAMP NOT NULL,
	`selling_price` DECIMAL(10,2) NULL,
	`profit_per_unit` DECIMAL(11,2) NULL,
	`stock_status` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_general_ci'
);

-- Dump della struttura di tabella officina_db.modifications
CREATE TABLE IF NOT EXISTS `modifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `item_id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `total_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `description` varchar(500) DEFAULT '',
  `operation_type` enum('add','subtract','restock') NOT NULL DEFAULT 'subtract',
  `discord_channel_id` varchar(100) DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- L’esportazione dei dati non era selezionata.

-- Dump della struttura di procedura officina_db.ModifyInventory
DELIMITER //
CREATE PROCEDURE `ModifyInventory`(
    IN p_username VARCHAR(100),
    IN p_item_id INT,
    IN p_item_name VARCHAR(255),
    IN p_quantity INT,
    IN p_total_cost DECIMAL(10,2),
    IN p_operation_type ENUM('add', 'subtract', 'restock'),
    IN p_description VARCHAR(500)
)
BEGIN
    DECLARE current_quantity INT DEFAULT 0;
    DECLARE new_quantity INT DEFAULT 0;
    DECLARE modification_id INT DEFAULT 0;
    
    -- Inizia transazione
    START TRANSACTION;
    
    -- Ottieni quantità corrente
    SELECT quantity INTO current_quantity 
    FROM inventory 
    WHERE id = p_item_id;
    
    -- Calcola nuova quantità basata sul tipo di operazione
    CASE p_operation_type
        WHEN 'add' THEN SET new_quantity = current_quantity + p_quantity;
        WHEN 'subtract' THEN 
            SET new_quantity = current_quantity - p_quantity;
            IF new_quantity < 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Scorte insufficienti';
            END IF;
        WHEN 'restock' THEN SET new_quantity = current_quantity + p_quantity;
    END CASE;
    
    -- Crea modifica
    INSERT INTO modifications (username, item_id, item_name, quantity, total_cost, operation_type, description)
    VALUES (p_username, p_item_id, p_item_name, p_quantity, p_total_cost, p_operation_type, p_description);
    
    SET modification_id = LAST_INSERT_ID();
    
    -- Aggiorna inventario
    UPDATE inventory 
    SET quantity = new_quantity, updated_at = CURRENT_TIMESTAMP
    WHERE id = p_item_id;
    
    -- Log attività
    INSERT INTO activity_log (username, activity_type, item_name, quantity, amount, description, reference_id)
    VALUES (p_username, 'modification', p_item_name, p_quantity, p_total_cost, p_description, modification_id);
    
    -- Se è una sottrazione, crea detrazione
    IF p_operation_type = 'subtract' AND p_total_cost > 0 THEN
        INSERT INTO employee_deductions (username, modification_id, amount)
        VALUES (p_username, modification_id, p_total_cost);
    END IF;
    
    -- Commit transazione
    COMMIT;
    
    SELECT modification_id as new_modification_id;
END//
DELIMITER ;

-- Dump della struttura di tabella officina_db.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `profit` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  `description` varchar(500) DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- L’esportazione dei dati non era selezionata.

-- Dump della struttura di tabella officina_db.salary_history
CREATE TABLE IF NOT EXISTS `salary_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` varchar(10) NOT NULL,
  `description` varchar(500) DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- L’esportazione dei dati non era selezionata.

-- Dump della struttura di tabella officina_db.selling_prices
CREATE TABLE IF NOT EXISTS `selling_prices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_name` varchar(255) NOT NULL,
  `selling_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `item_name` (`item_name`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- L’esportazione dei dati non era selezionata.

-- Rimozione temporanea di tabella e creazione della struttura finale della vista
DROP TABLE IF EXISTS `activity_feed`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `activity_feed` AS SELECT 
    al.id,
    al.username,
    al.activity_type as type,
    al.item_name,
    al.quantity,
    al.amount as total_cost,
    al.description,
    al.created_at,
    e.full_name
FROM activity_log al
LEFT JOIN employees e ON al.username = e.username
ORDER BY al.created_at DESC 
;

-- Rimozione temporanea di tabella e creazione della struttura finale della vista
DROP TABLE IF EXISTS `inventory_stats`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `inventory_stats` AS SELECT 
    category,
    type,
    COUNT(*) as item_count,
    SUM(quantity) as total_quantity,
    SUM(CASE WHEN quantity <= min_stock THEN 1 ELSE 0 END) as low_stock_count,
    AVG(purchase_price) as avg_purchase_price
FROM inventory
GROUP BY category, type 
;

-- Rimozione temporanea di tabella e creazione della struttura finale della vista
DROP TABLE IF EXISTS `inventory_with_prices`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `inventory_with_prices` AS SELECT 
    i.*,
    sp.selling_price,
    (sp.selling_price - i.purchase_price) as profit_per_unit,
    CASE 
        WHEN i.quantity <= i.min_stock THEN 'low'
        WHEN i.quantity <= i.min_stock * 1.5 THEN 'warning'
        ELSE 'good'
    END as stock_status
FROM inventory i
LEFT JOIN selling_prices sp ON i.name = sp.item_name 
;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
