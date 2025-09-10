// Sistema di storage con fallback SQLite
import mysql from "mysql2/promise";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import Database from "better-sqlite3";
import { drizzle as drizzleSQLite, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";

let db: MySql2Database<typeof schema> | BetterSQLite3Database<typeof schema>;
let isSQLite = false;

// Prova prima MySQL, poi fallback a SQLite
async function initializeStorage() {
  try {
    console.log("🔄 Tentativo connessione MySQL...");
    
    // Crea connessione MySQL
    const mysqlConnection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      port: parseInt(process.env.MYSQL_PORT || "3306"),
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "officina_db",
    });

    // Testa la connessione
    await mysqlConnection.execute("SELECT 1");
    
    // Crea il database se non esiste
    await mysqlConnection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE || 'officina_db'}`);
    await mysqlConnection.execute(`USE ${process.env.MYSQL_DATABASE || 'officina_db'}`);
    
    // Crea pool MySQL
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || "localhost",
      port: parseInt(process.env.MYSQL_PORT || "3306"),
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "officina_db",
    });

    db = drizzle(pool, { schema, mode: "default" });
    isSQLite = false;
    
    console.log("✅ Connesso a MySQL");
    return db;
  } catch (error) {
    console.log("⚠️  MySQL non disponibile, uso SQLite come fallback");
    console.log("   Errore MySQL:", error instanceof Error ? error.message : "Sconosciuto");
    
    try {
      // Fallback a SQLite
      const sqlite = new Database("database.sqlite");
      db = drizzleSQLite(sqlite, { schema });
      isSQLite = true;
      
      console.log("✅ Connesso a SQLite");
      return db;
    } catch (sqliteError) {
      console.error("❌ Errore anche con SQLite:", sqliteError);
      throw sqliteError;
    }
  }
}

// Inizializza il storage
const storagePromise = initializeStorage();

export { db, isSQLite, storagePromise };

// Interfaccia storage
export interface IStorage {
  getEmployees(): Promise<schema.Employee[]>;
}





