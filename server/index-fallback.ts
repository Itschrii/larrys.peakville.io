import express from "express";
import cors from "cors";
import { db, isSQLite, storagePromise } from "./storage-fallback";
import router from "./routes-fallback";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import http from "http";
dotenv.config();

// --- Risolvi __dirname in ES module ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  storagePromise.then(() => {
    app.listen(port, () => {
      console.log(`🚀 Server ottimizzato running on http://localhost:${port}`);
      console.log(`📊 Sistema di gestione inventario attivo`);
      console.log(`🗄️  Database: ${isSQLite ? 'SQLite' : 'MySQL'}`);
      console.log(`🛠️  API endpoints disponibili:`);
      console.log(`   - POST /api/orders (creazione ordini ottimizzata)`);
      console.log(`   - POST /api/inventory/modify (gestione inventario)`);
      console.log(`   - GET /api/inventory (inventario con statistiche)`);
      console.log(`   - GET /api/inventory/search (ricerca articoli)`);
      console.log(`   - GET /api/inventory/low-stock (scorte basse)`);
    });
  }).catch((error) => {
    console.error("❌ Errore nell'inizializzazione del database:", error);
    process.exit(1);
  });
} else {
  const server = http.createServer(app);

  const { setupVite } = await import("./vite");

  await setupVite(app, server);

  const port = process.env.PORT || 3001;
  
  // Inizializza il database prima di avviare il server
  storagePromise.then(() => {
    server.listen(port, () => {
      console.log(`🚀 Server ottimizzato running on http://localhost:${port}`);
      console.log(`📊 Sistema di gestione inventario attivo`);
      console.log(`🗄️  Database: ${isSQLite ? 'SQLite' : 'MySQL'}`);
      console.log(`🛠️  API endpoints disponibili:`);
      console.log(`   - POST /api/orders (creazione ordini ottimizzata)`);
      console.log(`   - POST /api/inventory/modify (gestione inventario)`);
      console.log(`   - GET /api/inventory (inventario con statistiche)`);
      console.log(`   - GET /api/inventory/search (ricerca articoli)`);
      console.log(`   - GET /api/inventory/low-stock (scorte basse)`);
    });
  }).catch((error) => {
    console.error("❌ Errore nell'inizializzazione del database:", error);
    process.exit(1);
  });
}
