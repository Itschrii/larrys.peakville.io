import mysql from "mysql2/promise";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "@shared/schema";

// Creiamo un pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306"),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "officina_db",
});

// Tipizziamo db
export const db: MySql2Database<typeof schema> = drizzle(pool, {
  schema,
  mode: "default", // 🔑 necessario
});
// Interfaccia storage
export interface IStorage {
  getEmployees(): Promise<schema.Employee[]>;
}

// Classe MySQLStorage
export class MySQLStorage implements IStorage {
  async getEmployees() {
    return db.query.employees.findMany();
  }
}
