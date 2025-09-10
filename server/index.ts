import express from "express";
import cors from "cors";
import { db } from "./mysql-storage";
import router from "./routes";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import http from "http";
import mysql from "mysql2/promise";
dotenv.config();

// --- Risolvi __dirname in ES module ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Funzione per inizializzare il database
async function initializeDatabase() {
  try {
    // Crea connessione senza specificare il database
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
    });

    // Crea il database se non esiste
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE || 'officina_db'}`);
    console.log(`✅ Database ${process.env.MYSQL_DATABASE || 'officina_db'} creato/verificato`);
    
    await connection.end();
  } catch (error) {
    console.error("❌ Errore durante l'inizializzazione del database:", error);
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// --- Router API ---
app.use("/api", router);

// --- Servi il client React buildato ---
if (process.env.NODE_ENV === "production") {
  // Punta alla cartella dist generata da `npm run build` in client
  const clientPath = path.join(__dirname, "../dist/public");
  app.use(express.static(clientPath));

  app.get("*", (_req: any, res: any) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });

  // --- Avvio server ---
  const port = process.env.PORT || 3001;
  
  // Inizializza il database prima di avviare il server
  initializeDatabase().then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  });
} else {
  const server = http.createServer(app);

  const { setupVite } = await import("./vite");

  await setupVite(app, server);

  const port = process.env.PORT || 3001;
  
  // Inizializza il database prima di avviare il server
  initializeDatabase().then(() => {
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  });
}