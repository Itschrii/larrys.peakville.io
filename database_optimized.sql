-- =====================================================
-- DATABASE OTTIMIZZATO PER SISTEMA OFFICINA
-- =====================================================
-- Questo script crea un database completamente ottimizzato
-- con foreign keys, indici e relazioni corrette

-- Crea il database
CREATE DATABASE IF NOT EXISTS officina_db 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE officina_db;

-- =====================================================
-- TABELLA DIPENDENTI
-- =====================================================
DROP TABLE IF EXISTS employees;
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('employee', 'admin') NOT NULL DEFAULT 'employee',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
);

-- =====================================================
-- TABELLA INVENTARIO
-- =====================================================
DROP TABLE IF EXISTS inventory;
CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category ENUM('upper', 'lower') NOT NULL,
    type VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 0,
    purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_type (type),
    INDEX idx_quantity (quantity),
    INDEX idx_low_stock (quantity, min_stock)
);

-- =====================================================
-- TABELLA PREZZI DI VENDITA
-- =====================================================
DROP TABLE IF EXISTS selling_prices;
CREATE TABLE selling_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL UNIQUE,
    selling_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_item_name (item_name),
    INDEX idx_selling_price (selling_price)
);

-- =====================================================
-- TABELLA MODIFICHE INVENTARIO
-- =====================================================
DROP TABLE IF EXISTS modifications;
CREATE TABLE modifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    item_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    description VARCHAR(500) DEFAULT '',
    operation_type ENUM('add', 'subtract', 'restock') NOT NULL DEFAULT 'subtract',
    discord_channel_id VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (item_id) REFERENCES inventory(id) ON DELETE CASCADE,
    INDEX idx_username (username),
    INDEX idx_item_id (item_id),
    INDEX idx_created_at (created_at),
    INDEX idx_operation_type (operation_type)
);

-- =====================================================
-- TABELLA ORDINI
-- =====================================================
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    profit DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    description VARCHAR(500) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (item_id) REFERENCES inventory(id) ON DELETE CASCADE,
    INDEX idx_username (username),
    INDEX idx_item_id (item_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- TABELLA DETRAZIONI DIPENDENTI
-- =====================================================
DROP TABLE IF EXISTS employee_deductions;
CREATE TABLE employee_deductions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    modification_id INT,
    order_id INT,
    amount DECIMAL(10,2) NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    
    FOREIGN KEY (modification_id) REFERENCES modifications(id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_username (username),
    INDEX idx_is_paid (is_paid),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- TABELLA STORICO STIPENDI
-- =====================================================
DROP TABLE IF EXISTS salary_history;
CREATE TABLE salary_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date VARCHAR(10) NOT NULL, -- YYYY-MM-DD
    description VARCHAR(500) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_date (date),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- TABELLA GUADAGNI GIORNALIERI
-- =====================================================
DROP TABLE IF EXISTS daily_earnings;
CREATE TABLE daily_earnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    orders_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_date (username, date),
    INDEX idx_username (username),
    INDEX idx_date (date),
    INDEX idx_total_earnings (total_earnings)
);

-- =====================================================
-- TABELLA STATO BOT
-- =====================================================
DROP TABLE IF EXISTS bot_status;
CREATE TABLE bot_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status VARCHAR(50) NOT NULL DEFAULT 'offline',
    server_name VARCHAR(255) NOT NULL DEFAULT '',
    uptime VARCHAR(100) NOT NULL DEFAULT '',
    commands_per_hour INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_last_updated (last_updated)
);

-- =====================================================
-- TABELLA LOG ATTIVITÀ (PER ACTIVITY FEED OTTIMIZZATO)
-- =====================================================
DROP TABLE IF EXISTS activity_log;
CREATE TABLE activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    activity_type ENUM('order', 'modification', 'restock', 'deduction') NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    amount DECIMAL(10,2) DEFAULT 0.00,
    description VARCHAR(500) DEFAULT '',
    reference_id INT, -- ID dell'ordine o modifica di riferimento
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at),
    INDEX idx_reference_id (reference_id)
);

-- =====================================================
-- INSERIMENTO DATI INIZIALI
-- =====================================================

-- Admin di default
INSERT INTO employees (username, full_name, role, is_active) VALUES
('admin', 'Amministratore', 'admin', TRUE),
('raycooper', 'Ray Cooper', 'admin', TRUE);

-- Articoli di inventario
INSERT INTO inventory (name, category, type, quantity, min_stock, purchase_price) VALUES
-- MOTORI
('Motore 3 Cilindri', 'upper', 'motore', 3, 1, 175.00),
('Motore 4 Cilindri', 'upper', 'motore', 2, 1, 1500.00),
('Motore 8 Cilindri', 'upper', 'motore', 1, 1, 4000.00),
('Motore 12 Cilindri', 'upper', 'motore', 1, 1, 9000.00),

-- FRENI
('Freno a Tamburo', 'lower', 'freni', 10, 3, 50.00),
('Freno a Disco', 'lower', 'freni', 8, 2, 300.00),
('Freno in Ceramica', 'lower', 'freni', 5, 1, 600.00),
('Freno a Disco in Ceramica', 'lower', 'freni', 3, 1, 1000.00),

-- TRASMISSIONI
('Trasmissione Manuale', 'upper', 'trasmissione', 6, 2, 220.00),
('Trasmissione con Convertitore di Coppia', 'upper', 'trasmissione', 4, 1, 1600.00),
('Trasmissione a Doppia Frizione', 'upper', 'trasmissione', 2, 1, 3500.00),

-- BATTERIE
('Batteria al Piombo Acido', 'upper', 'batteria', 12, 4, 46.00),
('Batteria ad Alta Tensione', 'upper', 'batteria', 8, 2, 100.00),
('Batteria al Litio', 'upper', 'batteria', 6, 2, 220.00),

-- OLII
('Olio Minerale', 'upper', 'olio', 20, 5, 7.00),
('Olio Sintetico', 'upper', 'olio', 15, 3, 65.00),
('Olio a Bassa Viscosità', 'upper', 'olio', 10, 2, 120.00),

-- SOSPENSIONI
('Sospensioni a Balestra', 'lower', 'sospensioni', 8, 3, 48.00),
('Sospensioni Indipendenti', 'lower', 'sospensioni', 6, 2, 200.00),
('Sospensioni ad Aria', 'lower', 'sospensioni', 4, 1, 500.00),
('Sospensioni Idropneumatica', 'lower', 'sospensioni', 2, 1, 1100.00),

-- PNEUMATICI
('Pneumatici Serie', 'lower', 'gomme', 25, 8, 33.00),
('Pneumatici Rinforzato', 'lower', 'gomme', 15, 5, 120.00),
('Pneumatici Tela Acciaio', 'lower', 'gomme', 10, 3, 240.00),
('Pneumatici Tubeless', 'lower', 'gomme', 8, 2, 600.00);

-- Prezzi di vendita
INSERT INTO selling_prices (item_name, selling_price) VALUES
-- MOTORI
('Motore 3 Cilindri', 285.00),
('Motore 4 Cilindri', 2100.00),
('Motore 8 Cilindri', 5380.00),
('Motore 12 Cilindri', 12500.00),

-- FRENI
('Freno a Tamburo', 70.00),
('Freno a Disco', 420.00),
('Freno in Ceramica', 790.00),
('Freno a Disco in Ceramica', 1350.00),

-- TRASMISSIONI
('Trasmissione Manuale', 295.00),
('Trasmissione con Convertitore di Coppia', 2220.00),
('Trasmissione a Doppia Frizione', 4650.00),

-- BATTERIE
('Batteria al Piombo Acido', 78.00),
('Batteria ad Alta Tensione', 142.00),
('Batteria al Litio', 300.00),

-- OLII
('Olio Minerale', 28.00),
('Olio Sintetico', 90.00),
('Olio a Bassa Viscosità', 170.00),

-- SOSPENSIONI
('Sospensioni a Balestra', 78.00),
('Sospensioni Indipendenti', 275.00),
('Sospensioni ad Aria', 670.00),
('Sospensioni Idropneumatica', 1470.00),

-- PNEUMATICI
('Pneumatici Serie', 55.00),
('Pneumatici Rinforzato', 170.00),
('Pneumatici Tela Acciaio', 322.00),
('Pneumatici Tubeless', 790.00);

-- =====================================================
-- STORED PROCEDURES PER OPERAZIONI COMPLESSE
-- =====================================================

DELIMITER //

-- Procedura per creare un ordine e aggiornare l'inventario
CREATE PROCEDURE CreateOrderWithInventoryUpdate(
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
END //

-- Procedura per modificare inventario
CREATE PROCEDURE ModifyInventory(
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
END //

DELIMITER ;

-- =====================================================
-- VISTE PER QUERY OTTIMIZZATE
-- =====================================================

-- Vista per inventario con prezzi
CREATE VIEW inventory_with_prices AS
SELECT 
    i.*,
    sp.selling_price,
    (sp.selling_price - i.purchase_price) as profit_per_unit,
    CASE 
        WHEN i.quantity <= i.min_stock THEN 'low'
        WHEN i.quantity <= i.min_stock * 1.5 THEN 'warning'
        ELSE 'good'
    END as stock_status
FROM inventory i
LEFT JOIN selling_prices sp ON i.name = sp.item_name;

-- Vista per activity feed ottimizzato
CREATE VIEW activity_feed AS
SELECT 
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
ORDER BY al.created_at DESC;

-- Vista per statistiche inventario
CREATE VIEW inventory_stats AS
SELECT 
    category,
    type,
    COUNT(*) as item_count,
    SUM(quantity) as total_quantity,
    SUM(CASE WHEN quantity <= min_stock THEN 1 ELSE 0 END) as low_stock_count,
    AVG(purchase_price) as avg_purchase_price
FROM inventory
GROUP BY category, type;

-- =====================================================
-- TRIGGER PER AUDIT LOG
-- =====================================================

-- Trigger per log modifiche inventario
DELIMITER //
CREATE TRIGGER inventory_audit_trigger
AFTER UPDATE ON inventory
FOR EACH ROW
BEGIN
    IF OLD.quantity != NEW.quantity THEN
        INSERT INTO activity_log (username, activity_type, item_name, quantity, description, created_at)
        VALUES ('system', 'modification', NEW.name, NEW.quantity - OLD.quantity, 
                CONCAT('Quantità aggiornata da ', OLD.quantity, ' a ', NEW.quantity), NOW());
    END IF;
END //
DELIMITER ;

-- =====================================================
-- INDICI AGGIUNTIVI PER PERFORMANCE
-- =====================================================

-- Indici compositi per query frequenti
CREATE INDEX idx_orders_username_date ON orders(username, created_at);
CREATE INDEX idx_modifications_username_date ON modifications(username, created_at);
CREATE INDEX idx_activity_log_type_date ON activity_log(activity_type, created_at);
CREATE INDEX idx_daily_earnings_date_earnings ON daily_earnings(date, total_earnings);

-- =====================================================
-- FINE SCRIPT
-- =====================================================

SELECT 'Database ottimizzato creato con successo!' as status;
