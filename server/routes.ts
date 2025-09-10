import express from "express";
import { db } from "./mysql-storage";
import {
  employees,
  insertEmployeeSchema,
  updateEmployeeSchema,
  inventory,
  insertInventorySchema,
  updateInventorySchema,
  modifications,
  employee_deductions,
  orders,
  salary_history,
  selling_prices,
  insertSellingPriceSchema,
  daily_earnings,
  insertDailyEarningSchema,
  activity_log,
  insertActivityLogSchema,
} from "@shared/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

const router = express.Router();

// ---------------------- Database Setup ----------------------
router.post("/reset-db", async (req, res) => {
  try {
    // Disabilita foreign key checks
    await db.execute(`SET FOREIGN_KEY_CHECKS = 0`);
    
    // Elimina tutte le tabelle esistenti (in ordine corretto)
    await db.execute(`DROP TABLE IF EXISTS activity_log`);
    await db.execute(`DROP TABLE IF EXISTS daily_earnings`);
    await db.execute(`DROP TABLE IF EXISTS selling_prices`);
    await db.execute(`DROP TABLE IF EXISTS employee_deductions`);
    await db.execute(`DROP TABLE IF EXISTS modifications`);
    await db.execute(`DROP TABLE IF EXISTS orders`);
    await db.execute(`DROP TABLE IF EXISTS salary_history`);
    await db.execute(`DROP TABLE IF EXISTS inventory`);
    await db.execute(`DROP TABLE IF EXISTS employees`);
    await db.execute(`DROP TABLE IF EXISTS bot_status`);
    
    // Riabilita foreign key checks
    await db.execute(`SET FOREIGN_KEY_CHECKS = 1`);
    
    res.json({ success: true, message: "Database reset successfully" });
  } catch (error) {
    console.error("Database reset error:", error);
    res.status(500).json({ error: "Failed to reset database" });
  }
});

router.post("/setup-db", async (req, res) => {
  try {
    // Crea il database se non esiste
    await db.execute(`CREATE DATABASE IF NOT EXISTS officina_db`);
    await db.execute(`USE officina_db`);
    
    // Crea le tabelle se non esistono
    await db.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        role ENUM('employee', 'admin') NOT NULL DEFAULT 'employee',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category ENUM('upper', 'lower') NOT NULL,
        type VARCHAR(255) NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        min_stock INT NOT NULL DEFAULT 0,
        purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS modifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        item_id INT NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        total_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        description VARCHAR(500) DEFAULT '',
        operation_type ENUM('add', 'subtract', 'restock') NOT NULL DEFAULT 'subtract',
        discord_channel_id VARCHAR(100) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS employee_deductions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        modification_id INT,
        order_id INT,
        amount DECIMAL(10,2) NOT NULL,
        is_paid BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        item_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        profit DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
        description VARCHAR(500) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS salary_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        date VARCHAR(10) NOT NULL,
        description VARCHAR(500) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS bot_status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        status VARCHAR(50) NOT NULL DEFAULT 'offline',
        server_name VARCHAR(255) NOT NULL DEFAULT '',
        uptime VARCHAR(100) NOT NULL DEFAULT '',
        commands_per_hour INT NOT NULL DEFAULT 0,
        last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS selling_prices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_name VARCHAR(255) NOT NULL UNIQUE,
        selling_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Crea tabella daily_earnings per i guadagni giornalieri
    await db.execute(`
      CREATE TABLE IF NOT EXISTS daily_earnings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        total_earnings DECIMAL(10,2) DEFAULT 0.00,
        orders_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_date (username, date)
      )
    `);

    // Crea tabella activity_log per il log delle attività
    await db.execute(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        activity_type ENUM('order', 'modification', 'restock', 'deduction') NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        amount DECIMAL(10,2) DEFAULT 0.00,
        description VARCHAR(500) DEFAULT '',
        reference_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crea un admin di default
    await db.execute(`
      INSERT IGNORE INTO employees (username, full_name, role, is_active) VALUES
      ('admin', 'Amministratore', 'admin', 1)
    `);

    // Aggiungi alcuni articoli di inventario di default
    await db.execute(`
      INSERT IGNORE INTO inventory (name, category, type, quantity, min_stock, purchase_price) VALUES
      -- MOTORI
      ('Motore 3 Cilindri', 'upper', 'motore', 3, 1, 0.00),
      ('Motore 4 Cilindri', 'upper', 'motore', 2, 1, 0.00),
      ('Motore 8 Cilindri', 'upper', 'motore', 1, 1, 0.00),
      ('Motore 12 Cilindri', 'upper', 'motore', 1, 1, 0.00),
      
      -- FRENI (PREZZI DI ACQUISTO CORRETTI)
      ('Freno a Tamburo', 'lower', 'freni', 10, 3, 50.00),
      ('Freno a Disco', 'lower', 'freni', 8, 2, 300.00),
      ('Freno in Ceramica', 'lower', 'freni', 5, 1, 600.00),
      ('Freno a Disco in Ceramica', 'lower', 'freni', 3, 1, 1000.00),
      
      -- TRASMISSIONI (PREZZI DI ACQUISTO CORRETTI)
      ('Trasmissione Manuale', 'upper', 'trasmissione', 6, 2, 220.00),
      ('Trasmissione con Convertitore di Coppia', 'upper', 'trasmissione', 4, 1, 1600.00),
      ('Trasmissione a Doppia Frizione', 'upper', 'trasmissione', 2, 1, 3500.00),
      
      -- BATTERIE (PREZZI DI ACQUISTO CORRETTI)
      ('Batteria al Piombo Acido', 'upper', 'batteria', 12, 4, 46.00),
      ('Batteria ad Alta Tensione', 'upper', 'batteria', 8, 2, 100.00),
      ('Batteria al Litio', 'upper', 'batteria', 6, 2, 220.00),
      
      -- OLII (PREZZI DI ACQUISTO CORRETTI)
      ('Olio Minerale', 'upper', 'olio', 20, 5, 7.00),
      ('Olio Sintetico', 'upper', 'olio', 15, 3, 65.00),
      ('Olio a Bassa Viscosità', 'upper', 'olio', 10, 2, 120.00),
      
      -- SOSPENSIONI (PREZZI DI ACQUISTO CORRETTI)
      ('Sospensioni a Balestra', 'lower', 'sospensioni', 8, 3, 48.00),
      ('Sospensioni Indipendenti', 'lower', 'sospensioni', 6, 2, 200.00),
      ('Sospensioni ad Aria', 'lower', 'sospensioni', 4, 1, 500.00),
      ('Sospensioni Idropneumatica', 'lower', 'sospensioni', 2, 1, 1100.00),
      
      -- PNEUMATICI
      ('Pneumatici Serie', 'lower', 'gomme', 25, 8, 0.00),
      ('Pneumatici Rinforzato', 'lower', 'gomme', 15, 5, 0.00),
      ('Pneumatici Tela Acciaio', 'lower', 'gomme', 10, 3, 0.00),
      ('Pneumatici Tubeless', 'lower', 'gomme', 8, 2, 0.00)
    `);

    // Aggiungi prezzi di vendita
    await db.execute(`
      INSERT IGNORE INTO selling_prices (item_name, selling_price) VALUES
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
      ('Pneumatici Tubeless', 790.00)
    `);

    res.json({ success: true, message: "Database initialized successfully" });
  } catch (error) {
    console.error("Database setup error:", error);
    res.status(500).json({ error: "Failed to setup database" });
  }
});

// ---------------------- Login ----------------------
router.post("/login", async (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    // Cerca se il dipendente esiste già
    let employee = await db.query.employees.findFirst({ 
      where: eq(employees.username, username.toLowerCase()) 
    });

    // Se non esiste, crealo automaticamente
    if (!employee) {
      console.log(`🆕 Creando nuovo dipendente: ${username}`);
      
      const newEmployee = await db.insert(employees).values({
        username: username.toLowerCase(),
        full_name: username, // Usa il nome come full_name di default
        role: "employee", // Ruolo di default
        is_active: true
      }).$returningId();

      // Recupera il dipendente appena creato
      employee = await db.query.employees.findFirst({ 
        where: eq(employees.id, newEmployee[0].id) 
      });

      console.log(`✅ Dipendente ${username} creato con successo`);
    }

    if (!employee) {
      return res.status(500).json({ error: "Failed to create/find employee" });
    }

    if (!employee.is_active) {
      return res.status(403).json({ error: "Employee account is inactive" });
    }

    res.json({
      success: true,
      employee: {
        id: employee.id.toString(),
        username: employee.username,
        fullName: employee.full_name,
        full_name: employee.full_name,
        role: employee.role,
        isActive: employee.is_active ? 1 : 0,
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------- Employees ----------------------
router.post("/employees", async (req, res) => {
  const parsed = insertEmployeeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const inserted = await db.insert(employees).values(parsed.data).$returningId();
  const employee = await db.query.employees.findFirst({ where: eq(employees.id, inserted[0].id) });
  res.json(employee);
});

router.put("/employees/:username", async (req, res) => {
  const { username } = req.params;
  const parsed = updateEmployeeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  await db.update(employees).set(parsed.data).where(eq(employees.username, username));
  const employee = await db.query.employees.findFirst({ where: eq(employees.username, username) });
  res.json(employee);
});

// ---------------------- Promote to Admin ----------------------
router.post("/employees/:username/promote", async (req, res) => {
  const { username } = req.params;
  
  try {
    await db.update(employees).set({ role: 'admin' }).where(eq(employees.username, username.toLowerCase()));
    const employee = await db.query.employees.findFirst({ where: eq(employees.username, username.toLowerCase()) });
    
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    
    res.json({ 
      success: true, 
      message: `${employee.full_name} è stato promosso ad admin`,
      employee 
    });
  } catch (error) {
    console.error("Promote error:", error);
    res.status(500).json({ error: "Failed to promote employee" });
  }
});

// ---------------------- Quick Admin Setup ----------------------
router.post("/setup-admin", async (req, res) => {
  try {
    // Promuovi il primo utente trovato ad admin
    const firstEmployee = await db.query.employees.findFirst();
    
    if (!firstEmployee) {
      return res.status(404).json({ error: "No employees found" });
    }
    
    await db.update(employees).set({ role: 'admin' }).where(eq(employees.id, firstEmployee.id));
    const updatedEmployee = await db.query.employees.findFirst({ where: eq(employees.id, firstEmployee.id) });
    
    res.json({ 
      success: true, 
      message: `${updatedEmployee?.full_name} è stato promosso ad admin`,
      employee: updatedEmployee 
    });
  } catch (error) {
    console.error("Setup admin error:", error);
    res.status(500).json({ error: "Failed to setup admin" });
  }
});

// ---------------------- Inventory ----------------------
router.get("/inventory", async (_req, res) => {
  const result = await db.query.inventory.findMany();
  res.json(result);
});

// ---------------------- Selling Prices ----------------------
router.get("/selling-prices", async (_req, res) => {
  const result = await db.query.selling_prices.findMany();
  res.json(result);
});

// ---------------------- Inventory with Prices ----------------------
router.get("/inventory-with-prices", async (_req, res) => {
  try {
    const inventoryItems = await db.query.inventory.findMany();
    const sellingPrices = await db.query.selling_prices.findMany();
    
    const itemsWithPrices = inventoryItems.map(item => {
      const sellingPrice = sellingPrices.find(sp => sp.item_name === item.name);
      return {
        ...item,
        selling_price: sellingPrice?.selling_price || "0.00",
        profit: sellingPrice ? 
          (parseFloat(sellingPrice.selling_price) - parseFloat(item.purchase_price)).toFixed(2) : 
          "0.00"
      };
    });
    
    res.json(itemsWithPrices);
  } catch (error) {
    console.error("Inventory with prices error:", error);
    res.status(500).json({ error: "Failed to get inventory with prices" });
  }
});

// ---------------------- Inventory Stats ----------------------
router.get("/inventory/stats", async (_req, res) => {
  try {
    const inventoryItems = await db.query.inventory.findMany();
    
    const upperParts = inventoryItems.filter(item => item.category === 'upper');
    const lowerParts = inventoryItems.filter(item => item.category === 'lower');
    
    const upperTotal = upperParts.reduce((sum, item) => sum + item.quantity, 0);
    const lowerTotal = lowerParts.reduce((sum, item) => sum + item.quantity, 0);
    
    const lowStock = inventoryItems.filter(item => item.quantity <= item.min_stock).length;
    
    // Conta le modifiche di oggi (semplificato)
    const todayModifications = 0; // Per ora mettiamo 0, possiamo implementare dopo
    
    const stats = {
      upperParts: { total: upperTotal, items: upperParts.length },
      lowerParts: { total: lowerTotal, items: lowerParts.length },
      lowStock,
      todayModifications
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.put("/inventory/:id", async (req, res) => {
  const { id } = req.params;
  const parsed = updateInventorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  await db.update(inventory).set(parsed.data).where(eq(inventory.id, Number(id)));
  const item = await db.query.inventory.findFirst({ where: eq(inventory.id, Number(id)) });
  res.json(item);
});

// ---------------------- Add Inventory Item ----------------------
router.post("/inventory", async (req, res) => {
  const parsed = insertInventorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  try {
    const inserted = await db.insert(inventory).values(parsed.data).$returningId();
    const item = await db.query.inventory.findFirst({ where: eq(inventory.id, inserted[0].id) });
    res.json(item);
  } catch (error) {
    console.error("Add inventory error:", error);
    res.status(500).json({ error: "Failed to add inventory item" });
  }
});

// ---------------------- Restock Inventory ----------------------
router.post("/inventory/:id/restock", async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  try {
    const item = await db.query.inventory.findFirst({ where: eq(inventory.id, Number(id)) });
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const newQuantity = Number(item.quantity) + Number(quantity);
    await db.update(inventory).set({ quantity: newQuantity }).where(eq(inventory.id, Number(id)));
    
    const updatedItem = await db.query.inventory.findFirst({ where: eq(inventory.id, Number(id)) });
    res.json(updatedItem);
  } catch (error) {
    console.error("Restock error:", error);
    res.status(500).json({ error: "Failed to restock item" });
  }
});

// ---------------------- Modifications ----------------------
router.post("/modifications", async (req, res) => {
  const { username, item_id, item_name, quantity, total_cost, description, discord_channel_id, operation_type } = req.body;

  // Validazione dei parametri
  if (!username || !item_id || !item_name || !quantity) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const itemId = Number(item_id);
  const quantityNum = Number(quantity);
  const totalCost = Number(total_cost) || 0;
  const opType = operation_type || 'subtract';

  if (isNaN(itemId) || isNaN(quantityNum)) {
    return res.status(400).json({ error: "Invalid numeric values" });
  }

  try {
    // Ottieni l'articolo corrente
    const item = await db.query.inventory.findFirst({ where: eq(inventory.id, itemId) });
    if (!item) {
      return res.status(404).json({ error: "Articolo non trovato" });
    }

    // Calcola nuova quantità
    let newQuantity;
    switch (opType) {
      case 'add':
        newQuantity = Number(item.quantity) + quantityNum;
        break;
      case 'subtract':
        newQuantity = Number(item.quantity) - quantityNum;
        if (newQuantity < 0) {
          return res.status(400).json({ error: "Scorte insufficienti" });
        }
        break;
      case 'restock':
        newQuantity = Number(item.quantity) + quantityNum;
        break;
      default:
        return res.status(400).json({ error: "Tipo di operazione non valido" });
    }

    // Crea modifica
    const inserted = await db
      .insert(modifications)
      .values({
        username,
        item_id: itemId,
        item_name,
        quantity: quantityNum,
        total_cost: String(totalCost),
        operation_type: opType,
        description: description || "",
        discord_channel_id: discord_channel_id || "",
      })
      .$returningId();

    const modification = await db.query.modifications.findFirst({ 
      where: eq(modifications.id, inserted[0].id) 
    });

    // Aggiorna inventario
    await db.update(inventory)
      .set({ quantity: newQuantity })
      .where(eq(inventory.id, itemId));

    // Log attività
    await db.insert(activity_log).values({
      username,
      activity_type: 'modification',
      item_name,
      quantity: quantityNum,
      amount: String(totalCost),
      description: description || "",
      reference_id: inserted[0].id,
    });

    // Se è una sottrazione, crea detrazione
    if (opType === 'subtract' && totalCost > 0) {
      await db.insert(employee_deductions).values({
        username,
        modification_id: inserted[0].id,
        amount: String(totalCost),
        is_paid: false,
      });
    }

    res.json(modification);
  } catch (error) {
    console.error("Modification error:", error);
    res.status(500).json({ error: "Failed to create modification" });
  }
});

// ---------------------- Get Modifications (Activity Feed) ----------------------
router.get("/modifications", async (_req, res) => {
  try {
    const result = await db.query.modifications.findMany({
      orderBy: (modifications, { desc }) => [desc(modifications.created_at)],
      limit: 50
    });
    res.json(result);
  } catch (error) {
    console.error("Get modifications error:", error);
    res.status(500).json({ error: "Failed to get modifications" });
  }
});

// ---------------------- Get Orders ----------------------
router.get("/orders", async (_req, res) => {
  try {
    const result = await db.query.orders.findMany({
      orderBy: (orders, { desc }) => [desc(orders.created_at)],
      limit: 50
    });
    res.json(result);
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ error: "Failed to get orders" });
  }
});

// ---------------------- Get Orders Statistics for Chart ----------------------
router.get("/orders/stats", async (_req, res) => {
  try {
    const orders = await db.query.orders.findMany({
      orderBy: (orders, { desc }) => [desc(orders.created_at)],
    });
    
    // Raggruppa per data (giorno)
    const dailyStats = orders.reduce((acc, order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, totalOrders: 0, totalRevenue: 0, totalProfit: 0 };
      }
      acc[date].totalOrders += 1;
      acc[date].totalRevenue += parseFloat(order.total_cost || '0');
      acc[date].totalProfit += parseFloat(order.total_profit || '0');
      return acc;
    }, {} as Record<string, any>);
    
    // Converti in array e ordina per data
    const statsArray = Object.values(dailyStats).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    res.json(statsArray);
  } catch (error) {
    console.error("Get orders stats error:", error);
    res.status(500).json({ error: "Failed to get orders statistics" });
  }
});

// ---------------------- Get All Activities (Activity Log) ----------------------
router.get("/activities", async (_req, res) => {
  try {
    // Usa la vista ottimizzata per l'activity feed
    const activities = await db.execute(`
      SELECT 
        al.id,
        al.username,
        al.activity_type as type,
        al.item_name,
        al.quantity,
        al.amount as total_cost,
        al.description,
        al.created_at,
        al.reference_id,
        e.full_name
      FROM activity_log al
      LEFT JOIN employees e ON al.username = e.username
      ORDER BY al.created_at DESC
      LIMIT 50
    `);
    
    res.json(activities[0]);
  } catch (error) {
    console.error("Get activities error:", error);
    res.status(500).json({ error: "Failed to get activities" });
  }
});

// ---------------------- Restock Inventory ----------------------
router.post("/inventory/restock", async (req, res) => {
  const { username, itemId, quantity, description } = req.body;

  if (!username || !itemId || !quantity) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const quantityNum = Number(quantity);
    
    // Verifica che l'articolo esista
    const inventoryItem = await db.query.inventory.findFirst({ 
      where: eq(inventory.id, itemId) 
    });
    
    if (!inventoryItem) {
      return res.status(404).json({ error: "Articolo non trovato" });
    }

    // Aggiorna inventario (aggiungi quantità)
    const newQuantity = Number(inventoryItem.quantity) + quantityNum;
    await db.update(inventory)
      .set({ quantity: newQuantity })
      .where(eq(inventory.id, itemId));

    // Crea modifica per il restock
    const inserted = await db
      .insert(modifications)
      .values({
        username,
        item_id: itemId,
        item_name: inventoryItem.name,
        quantity: quantityNum,
        total_cost: "0.00",
        operation_type: 'restock',
        description: description || `Restock di ${quantityNum} unità`,
      })
      .$returningId();

    const modification = await db.query.modifications.findFirst({ 
      where: eq(modifications.id, inserted[0].id) 
    });

    // Log attività
    await db.insert(activity_log).values({
      username,
      activity_type: 'restock',
      item_name: inventoryItem.name,
      quantity: quantityNum,
      amount: "0.00",
      description: description || `Restock di ${quantityNum} unità`,
      reference_id: inserted[0].id,
    });

    res.json({
      success: true,
      modification,
      newQuantity,
      message: `Restock completato: +${quantityNum} unità di ${inventoryItem.name}`
    });
  } catch (error) {
    console.error("Restock error:", error);
    res.status(500).json({ error: "Failed to restock inventory" });
  }
});

// ---------------------- Get Order Details ----------------------
router.get("/orders/:id", async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Trova l'ordine di riferimento
    const referenceOrder = await db.query.orders.findFirst({
      where: eq(orders.id, Number(orderId))
    });
    
    if (!referenceOrder) {
      return res.status(404).json({ error: "Ordine non trovato" });
    }

    // Trova tutti gli ordini dello stesso utente creati nello stesso momento (entro 1 minuto)
    const orderTime = new Date(referenceOrder.created_at);
    const timeStart = new Date(orderTime.getTime() - 60000); // 1 minuto prima
    const timeEnd = new Date(orderTime.getTime() + 60000);   // 1 minuto dopo

    const allOrders = await db.query.orders.findMany({
      where: (table, { and, eq, gte, lte }) => and(
        eq(table.username, referenceOrder.username),
        gte(table.created_at, timeStart),
        lte(table.created_at, timeEnd)
      ),
      orderBy: (table, { asc }) => [asc(table.created_at)]
    });

    // Ottieni dettagli del dipendente
    const employee = await db.query.employees.findFirst({
      where: eq(employees.username, referenceOrder.username)
    });

    // Calcola totali
    const totalAmount = allOrders.reduce((sum, order) => sum + parseFloat(order.total_cost || '0'), 0);
    const totalProfit = allOrders.reduce((sum, order) => sum + parseFloat(order.profit || '0'), 0);
    const totalQuantity = allOrders.reduce((sum, order) => sum + order.quantity, 0);

    // Crea un ordine virtuale che rappresenta l'intero ordine
    const virtualOrder = {
      id: referenceOrder.id,
      username: referenceOrder.username,
      created_at: referenceOrder.created_at,
      status: referenceOrder.status,
      total_amount: totalAmount,
      total_profit: totalProfit,
      total_quantity: totalQuantity,
      items_count: allOrders.length
    };

    res.json({
      order: virtualOrder,
      employee: employee ? {
        username: employee.username,
        full_name: employee.full_name,
        role: employee.role
      } : null,
      employeePayment: totalProfit,
      items: allOrders.map(order => ({
        item_name: order.item_name,
        quantity: order.quantity,
        unit_price: order.unit_price,
        total_cost: order.total_cost
      }))
    });
  } catch (error) {
    console.error("Get order details error:", error);
    res.status(500).json({ error: "Failed to get order details" });
  }
});

// ---------------------- Get All Employees (Admin Only) ----------------------
router.get("/employees", async (req, res) => {
  try {
    const { userRole } = req.query;
    
    // Solo admin può vedere tutti i dipendenti
    if (userRole !== 'admin') {
      return res.status(403).json({ error: "Accesso negato. Solo admin può visualizzare i dipendenti." });
    }

    const employeesList = await db.query.employees.findMany({
      where: eq(employees.is_active, true),
      orderBy: [desc(employees.created_at)]
    });

    // Per ogni dipendente, calcola le statistiche
    const employeesWithStats = await Promise.all(
      employeesList.map(async (emp) => {
        try {
          // Calcola guadagni totali
          const totalEarnings = await db.query.daily_earnings.findMany({
            where: eq(daily_earnings.username, emp.username || '')
          });
          const totalEarningsSum = totalEarnings.reduce((sum, earning) => 
            sum + parseFloat(earning.total_earnings || '0'), 0
          );

          // Calcola ordini totali
          const totalOrders = await db.query.orders.findMany({
            where: eq(orders.username, emp.username || '')
          });

          // Calcola guadagni di oggi (pagamenti da pagare al dipendente)
          const today = new Date().toISOString().split('T')[0];
          const todayEarnings = await db.query.daily_earnings.findFirst({
            where: (table, { and, eq }) => and(
              eq(table.username, emp.username || ''),
              eq(table.date, today)
            )
          });

          // Calcola profitto dell'azienda di oggi (vendita - acquisto)
          const todayOrders = await db.query.orders.findMany({
            where: (table, { and, eq, gte }) => and(
              eq(table.username, emp.username || ''),
              gte(table.created_at, new Date(today + 'T00:00:00.000Z'))
            )
          });

          // Calcola il profitto dell'azienda per ogni ordine
          let todayCompanyProfit = 0;
          for (const order of todayOrders) {
            // Il profitto dell'azienda è già calcolato nel campo 'profit' dell'ordine
            // (vendita - acquisto) * quantità
            const orderProfit = parseFloat(order.profit || '0');
            todayCompanyProfit += orderProfit;
          }

          return {
            ...emp,
            totalEarnings: totalEarningsSum, // Guadagni totali del dipendente
            totalOrders: totalOrders.length,
            todayEarnings: parseFloat(todayEarnings?.total_earnings || '0'), // Guadagni di oggi del dipendente
            todayCompanyProfit: todayCompanyProfit // Profitto dell'azienda di oggi
          };
        } catch (error) {
          console.error(`Error calculating stats for employee ${emp.username}:`, error);
          return {
            ...emp,
            totalEarnings: 0,
            totalOrders: 0,
            todayEarnings: 0,
            todayCompanyProfit: 0
          };
        }
      })
    );

    res.json(employeesWithStats);
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({ error: "Failed to get employees" });
  }
});

// ---------------------- Get Employee Daily Earnings (Admin Only) ----------------------
router.get("/employees/:username/earnings", async (req, res) => {
  try {
    const { userRole } = req.query;
    const { username } = req.params;
    
    // Solo admin può vedere i guadagni dei dipendenti
    if (userRole !== 'admin') {
      return res.status(403).json({ error: "Accesso negato. Solo admin può visualizzare i guadagni." });
    }

    const earnings = await db.query.daily_earnings.findMany({
      where: eq(daily_earnings.username, username),
      orderBy: (daily_earnings, { desc }) => [desc(daily_earnings.date)]
    });

    // Calcola totale guadagni
    const totalEarnings = earnings.reduce((sum, earning) => 
      sum + parseFloat(earning.total_earnings || '0'), 0
    );

    res.json({
      earnings,
      totalEarnings,
      totalDays: earnings.length
    });
  } catch (error) {
    console.error("Get employee earnings error:", error);
    res.status(500).json({ error: "Failed to get employee earnings" });
  }
});

// ---------------------- Fire Employee (Admin Only) ----------------------
router.post("/employees/:username/fire", async (req, res) => {
  try {
    const { userRole } = req.query;
    const { username } = req.params;
    const { reason } = req.body;
    
    // Solo admin può licenziare dipendenti
    if (userRole !== 'admin') {
      return res.status(403).json({ error: "Accesso negato. Solo admin può licenziare dipendenti." });
    }

    // Verifica che il dipendente esista
    const employee = await db.query.employees.findFirst({
      where: eq(employees.username, username)
    });

    if (!employee) {
      return res.status(404).json({ error: "Dipendente non trovato" });
    }

    if (employee.role === 'admin') {
      return res.status(400).json({ error: "Non puoi licenziare un amministratore" });
    }

    // Disattiva il dipendente
    await db.update(employees)
      .set({ is_active: false })
      .where(eq(employees.username, username));

    // Log attività
    await db.insert(activity_log).values({
      username: 'admin',
      activity_type: 'modification',
      item_name: 'Dipendente',
      quantity: 1,
      amount: "0.00",
      description: `Dipendente ${username} licenziato. Motivo: ${reason || 'Non specificato'}`,
    });

    res.json({
      success: true,
      message: `Dipendente ${username} licenziato con successo`
    });
  } catch (error) {
    console.error("Fire employee error:", error);
    res.status(500).json({ error: "Failed to fire employee" });
  }
});

// ---------------------- Orders ----------------------
router.post("/orders", async (req, res) => {
  const { username, items, totalAmount, totalProfit } = req.body;

  if (!username || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const createdOrders: any[] = [];
    let totalOrderAmount = 0;
    let totalOrderProfit = 0;
    
    // Crea ordini e aggiorna inventario per ogni item
    const orderItems = [];
    for (const item of items) {
      // Verifica scorte disponibili
      const inventoryItem = await db.query.inventory.findFirst({ 
        where: eq(inventory.id, item.itemId) 
      });
      
      if (!inventoryItem) {
        throw new Error(`Articolo ${item.itemName} non trovato`);
      }
      
      if (Number(inventoryItem.quantity) < Number(item.quantity)) {
        throw new Error(`Scorte insufficienti per ${item.itemName}. Disponibili: ${inventoryItem.quantity}, Richieste: ${item.quantity}`);
      }

      // Crea ordine
      const inserted = await db
        .insert(orders)
        .values({
          username,
          item_name: item.itemName,
          item_id: item.itemId,
          quantity: Number(item.quantity),
          unit_price: String(item.unitPrice || 0),
          total_cost: String(item.total),
          profit: String(item.profit || 0),
          status: 'completed',
          description: `Ordine per ${item.itemName}`,
        })
        .$returningId();

      const order = await db.query.orders.findFirst({ 
        where: eq(orders.id, inserted[0].id) 
      });
      
      if (order) {
        createdOrders.push(order);
        orderItems.push({
          id: inserted[0].id,
          item_name: item.itemName,
          quantity: Number(item.quantity),
          unit_price: item.unitPrice || 0,
          total: parseFloat(item.total)
        });
        const itemTotal = parseFloat(item.total) || 0;
        const itemProfit = parseFloat(item.profit || 0) || 0;
        totalOrderAmount += itemTotal;
        totalOrderProfit += itemProfit;
      }

      // Aggiorna inventario
      const newQuantity = Number(inventoryItem.quantity) - Number(item.quantity);
      await db.update(inventory)
        .set({ quantity: newQuantity })
        .where(eq(inventory.id, item.itemId));
    }

    // Crea una sola attività per l'intero ordine (usando il primo order ID come riferimento)
    if (createdOrders.length > 0) {
      const itemNames = orderItems.map(item => `${item.item_name} (${item.quantity}pz)`).join(', ');
      const totalAmount = orderItems.reduce((sum, item) => sum + Number(item.total), 0);
      await db.insert(activity_log).values({
        username,
        activity_type: 'order',
        item_name: `Ordine con ${orderItems.length} articoli`,
        quantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
        amount: totalAmount.toFixed(2),
        description: `Ordine: ${itemNames}`,
        reference_id: createdOrders[0].id, // Usa il primo order ID come riferimento
      });
    }

    // Aggiorna guadagni giornalieri
    const today = new Date().toISOString().split('T')[0];
    const existingEarning = await db.query.daily_earnings.findFirst({
      where: (table, { and, eq }) => and(
        eq(table.username, username),
        eq(table.date, today)
      )
    });

    if (existingEarning) {
      await db.update(daily_earnings)
        .set({ 
          total_earnings: String(parseFloat(existingEarning.total_earnings || '0') + totalOrderProfit),
          orders_count: existingEarning.orders_count + 1
        })
        .where(eq(daily_earnings.id, existingEarning.id));
    } else {
      await db.insert(daily_earnings).values({
        username,
        date: today,
        total_earnings: String(totalOrderProfit),
        orders_count: 1
      });
    }

    res.json({ 
      success: true, 
      orderId: createdOrders.length > 0 ? createdOrders[0].id : null,
      orders: createdOrders,
      totalAmount: totalOrderAmount,
      totalProfit: totalOrderProfit
    });
  } catch (error) {
    console.error("Order error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create order";
    res.status(500).json({ error: errorMessage });
  }
});

// ---------------------- Get Employee Orders ----------------------
router.get("/employees/:username/orders", async (req, res) => {
  try {
    const { username } = req.params;
    
    // Trova tutti gli ordini del dipendente
    const userOrders = await db.query.orders.findMany({
      where: eq(orders.username, username),
      orderBy: [desc(orders.created_at)]
    });

    // Calcola totali
    const totalOrders = userOrders.length;
    const totalSales = userOrders.reduce((sum, order) => sum + parseFloat(order.total_cost || '0'), 0);
    const totalProfit = userOrders.reduce((sum, order) => sum + parseFloat(order.profit || '0'), 0);

    res.json({
      orders: userOrders.map(order => ({
        id: order.id,
        item_name: order.item_name,
        quantity: order.quantity,
        unit_price: order.unit_price,
        total_cost: order.total_cost,
        profit: order.profit,
        created_at: order.created_at,
        status: order.status
      })),
      summary: {
        totalOrders,
        totalSales,
        totalProfit
      }
    });
  } catch (error) {
    console.error("Get employee orders error:", error);
    res.status(500).json({ error: "Failed to get employee orders" });
  }
});

// ---------------------- Daily Earnings ----------------------
router.get("/daily-earnings", async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? String(date) : new Date().toISOString().split('T')[0];
    
    const earnings = await db.query.daily_earnings.findMany({
      where: eq(daily_earnings.date, targetDate),
      orderBy: [desc(daily_earnings.total_earnings)]
    });
    
    res.json(earnings);
  } catch (error) {
    console.error("Get daily earnings error:", error);
    res.status(500).json({ error: "Failed to get daily earnings" });
  }
});

// ---------------------- Reset Daily Earnings (Cron Job) ----------------------
router.post("/daily-earnings/reset", async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Trova tutti i guadagni di ieri
    const yesterdayEarnings = await db.query.daily_earnings.findMany({
      where: eq(daily_earnings.date, yesterday)
    });
    
    if (yesterdayEarnings.length > 0) {
      // Log dell'operazione di reset
      console.log(`🔄 Resetting daily earnings for ${yesterdayEarnings.length} employees from ${yesterday}`);
      
      // I guadagni di ieri rimangono nella tabella per lo storico
      // Non li cancelliamo, ma li consideriamo "chiusi"
      
      res.json({
        success: true,
        message: `Profitti giornalieri resettati per ${yesterdayEarnings.length} dipendenti`,
        resetDate: yesterday,
        affectedEmployees: yesterdayEarnings.length
      });
    } else {
      res.json({
        success: true,
        message: "No earnings to reset",
        resetDate: yesterday,
        affectedEmployees: 0
      });
    }
  } catch (error) {
    console.error("Reset daily earnings error:", error);
    res.status(500).json({ error: "Failed to reset daily earnings" });
  }
});


// ---------------------- Salary History ----------------------
router.post("/salary-history", async (req, res) => {
  const { username, amount, date, description } = req.body;

  const inserted = await db
    .insert(salary_history)
    .values({
      username,
      amount: String(amount),
      date,
      description: description || "",
    })
    .$returningId();

  const record = await db.query.salary_history.findFirst({ where: eq(salary_history.id, inserted[0].id) });
  res.json(record);
});

export default router;
