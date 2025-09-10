import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";

// Crea connessione SQLite
const sqlite = new Database("database.sqlite");

// Tipizziamo db
export const db: BetterSQLite3Database<typeof schema> = drizzle(sqlite, {
  schema,
});

// Interfaccia storage
export interface IStorage {
  getEmployees(): Promise<schema.Employee[]>;
}





