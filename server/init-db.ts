import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "@shared/schema";

async function initDb() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306"),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "officina_db",
  });

  const db = drizzle(connection, { schema, mode: "default" });

  try {
    // Aggiungi dipendenti di test
    const employees = [
      { username: "mario", full_name: "Mario Rossi", role: "meccanico", is_active: true },
      { username: "luigi", full_name: "Luigi Bianchi", role: "elettricista", is_active: true },
      { username: "giuseppe", full_name: "Giuseppe Verdi", role: "capo_officina", is_active: true },
      { username: "anna", full_name: "Anna Neri", role: "meccanico", is_active: true },
    ];

    for (const employee of employees) {
      try {
        await db.insert(schema.employees).values(employee);
        console.log(`✅ Dipendente ${employee.full_name} aggiunto`);
      } catch (error) {
        console.log(`⚠️  Dipendente ${employee.full_name} già esistente`);
      }
    }

    // Aggiungi articoli di inventario di test
    const inventoryItems = [
      { name: "Motore 1.6 TDI", category: "upper", type: "motore", quantity: 5, min_stock: 2, purchase_price: "2500.00" },
      { name: "Batteria 12V 70Ah", category: "upper", type: "elettrico", quantity: 8, min_stock: 3, purchase_price: "120.00" },
      { name: "Olio Motore 5W30", category: "upper", type: "lubrificante", quantity: 15, min_stock: 5, purchase_price: "45.00" },
      { name: "Pastiglie Freno Anteriori", category: "lower", type: "freni", quantity: 12, min_stock: 4, purchase_price: "85.00" },
      { name: "Dischi Freno", category: "lower", type: "freni", quantity: 6, min_stock: 2, purchase_price: "150.00" },
      { name: "Ammortizzatori Anteriori", category: "lower", type: "sospensione", quantity: 4, min_stock: 2, purchase_price: "280.00" },
      { name: "Copertoni 205/55 R16", category: "lower", type: "gomme", quantity: 20, min_stock: 8, purchase_price: "95.00" },
    ];

    for (const item of inventoryItems) {
      try {
        await db.insert(schema.inventory).values(item);
        console.log(`✅ Articolo ${item.name} aggiunto`);
      } catch (error) {
        console.log(`⚠️  Articolo ${item.name} già esistente`);
      }
    }

    console.log("✅ Database inizializzato con dati di test");
  } catch (error) {
    console.error("❌ Errore durante l'inizializzazione:", error);
  }

  await connection.end();
}

initDb().catch(console.error);
