import { defineConfig } from "drizzle-kit";

// Controllo variabili d'ambiente obbligatorie
const requiredEnv = ["MYSQL_HOST", "MYSQL_DATABASE"];
for (const envVar of requiredEnv) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} environment variable is required`);
  }
}

export default ({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.MYSQL_HOST!, // ✅ l'uso del ! assicura a TypeScript che non è undefined
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE!, // ✅ idem
  },
});
