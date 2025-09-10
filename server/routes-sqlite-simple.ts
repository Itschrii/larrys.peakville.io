import express from "express";
import { db } from "./sqlite-storage";
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
import { eq, desc, and } from "drizzle-orm";

const router = express.Router();

// ---------------------- Database Setup ----------------------
router.post("/reset-db", async (req, res) => {
  try {
    // Elimina tutte le tabelle esistenti
    await db.execute(`DROP TABLE IF EXISTS activity_log`);
    await db.execute(`DROP TABLE IF EXISTS daily_earnings`);
    await db.execute(`DROP TABLE IF EXISTS selling_prices`);
    await db.execute(`DROP TABLE IF EXISTS modifications`);
    await db.execute(`DROP TABLE IF EXISTS employee_deductions`);
    await db.execute(`DROP TABLE IF EXISTS orders`);
    await db.execute(`DROP TABLE IF EXISTS salary_history`);
    await db.execute(`DROP TABLE IF EXISTS inventory`);
    await db.execute(`DROP TABLE IF EXISTS employees`);
    await db.execute(`DROP TABLE IF EXISTS bot_status`);
    
    res.json({ success: true, message: "Database reset successfully" });
  } catch (error) {
    console.error("Database reset error:", error);
    res.status(500).json({ error: "Failed to reset database" });
  }
});

router.post("/setup-db", async (req, res) => {
  try {
    // Crea le tabelle se non esistono
    await db.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'employee',
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        type TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 0,
        purchase_price REAL NOT NULL DEFAULT 0.00,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS modifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        total_cost REAL NOT NULL DEFAULT 0.00,
        description TEXT DEFAULT '',
        operation_type TEXT NOT NULL DEFAULT 'subtract',
        discord_channel_id TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS employee_deductions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        modification_id INTEGER,
        order_id INTEGER,
        amount REAL NOT NULL,
        is_paid BOOLEAN NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        paid_at DATETIME
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        item_name TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL DEFAULT 0.00,
        total_cost REAL NOT NULL DEFAULT 0.00,
        profit REAL NOT NULL DEFAULT 0.00,
        status TEXT NOT NULL DEFAULT 'pending',
        description TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS salary_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        description TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS bot_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status TEXT NOT NULL DEFAULT 'offline',
        server_name TEXT NOT NULL DEFAULT '',
        uptime TEXT NOT NULL DEFAULT '',
        commands_per_hour INTEGER NOT NULL DEFAULT 0,
        last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS selling_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_name TEXT NOT NULL UNIQUE,
        selling_price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crea tabella daily_earnings per i guadagni giornalieri
    await db.execute(`
      CREATE TABLE IF NOT EXISTS daily_earnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        date DATE NOT NULL,
        total_earnings REAL DEFAULT 0.00,
        orders_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(username, date)
      )
    `);

    // Crea tabella activity_log per il log delle attività
    await db.execute(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        item_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        amount REAL DEFAULT 0.00,
        description TEXT DEFAULT '',
        reference_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crea un admin di default
    await db.execute(`
      INSERT OR IGNORE INTO employees (username, full_name, role, is_active) VALUES
      ('admin', 'Amministratore', 'admin', 1)
    `);

    // Aggiungi alcuni articoli di inventario di default
    await db.execute(`
      INSERT OR IGNORE INTO inventory (name, category, type, quantity, min_stock, purchase_price) VALUES
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
      INSERT OR IGNORE INTO selling_prices (item_name, selling_price) VALUES
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
      }).returning();

      employee = newEmployee[0];
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
        isActive: employee.is_active ? 1 : 0,
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
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

      // Crea ordine usando SQL diretto per evitare problemi con i timestamp
      const orderResult = await db.execute(`
        INSERT INTO orders (username, item_name, item_id, quantity, unit_price, total_cost, profit, status, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        username,
        item.itemName,
        item.itemId,
        Number(item.quantity),
        item.unitPrice || 0,
        item.total,
        item.profit || 0,
        'completed',
        `Ordine per ${item.itemName}`
      ]);

      // Recupera l'ordine appena creato
      const orders = await db.execute(`SELECT * FROM orders WHERE username = ? AND item_name = ? ORDER BY id DESC LIMIT 1`, [username, item.itemName]);
      const order = orders[0][0];
      
      if (order) {
        createdOrders.push(order);
        totalOrderAmount += parseFloat(item.total);
        totalOrderProfit += parseFloat(item.profit || 0);
      }

      // Aggiorna inventario
      const newQuantity = Number(inventoryItem.quantity) - Number(item.quantity);
      await db.update(inventory)
        .set({ quantity: newQuantity })
        .where(eq(inventory.id, item.itemId));

      // Log attività usando SQL diretto
      await db.execute(`
        INSERT INTO activity_log (username, activity_type, item_name, quantity, amount, description, reference_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        username,
        'order',
        item.itemName,
        Number(item.quantity),
        item.total,
        `Ordine per ${item.itemName}`,
        order.id
      ]);
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

// ---------------------- Get All Activities (Activity Log) ----------------------
router.get("/activities", async (_req, res) => {
  try {
    const activities = await db.query.activity_log.findMany({
      orderBy: [desc(activity_log.created_at)],
      limit: 50
    });
    
    res.json(activities);
  } catch (error) {
    console.error("Get activities error:", error);
    res.status(500).json({ error: "Failed to get activities" });
  }
});

export default router;
