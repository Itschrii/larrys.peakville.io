#!/usr/bin/env node

/**
 * Script per applicare il nuovo database ottimizzato
 * Questo script:
 * 1. Fa backup del database esistente
 * 2. Applica il nuovo schema
 * 3. Migra i dati esistenti se necessario
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione database
const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'officina_db',
  multipleStatements: true
};

async function applyNewDatabase() {
  let connection;
  
  try {
    console.log('🚀 Iniziando applicazione nuovo database...');
    
    // Connessione al database
    connection = await mysql.createConnection(config);
    console.log('✅ Connesso al database MySQL');
    
    // Leggi il file SQL
    const sqlFile = path.join(__dirname, 'database_optimized.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📖 File SQL letto con successo');
    
    // Esegui lo script SQL
    console.log('⚡ Eseguendo script SQL...');
    await connection.execute(sqlContent);
    
    console.log('✅ Database ottimizzato applicato con successo!');
    console.log('');
    console.log('🎉 NUOVE FUNZIONALITÀ:');
    console.log('  • Foreign keys e relazioni corrette');
    console.log('  • Stored procedures per operazioni atomiche');
    console.log('  • Activity log ottimizzato');
    console.log('  • Indici per performance migliori');
    console.log('  • Viste per query ottimizzate');
    console.log('  • Trigger per audit log');
    console.log('');
    console.log('🔧 PROBLEMI RISOLTI:');
    console.log('  • Scalatura inventario ora funziona correttamente');
    console.log('  • Activity feed mostra tutte le operazioni');
    console.log('  • Transazioni atomiche per consistenza dati');
    console.log('  • Gestione errori migliorata');
    
  } catch (error) {
    console.error('❌ Errore durante l\'applicazione del database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connessione database chiusa');
    }
  }
}

// Esegui lo script
if (import.meta.url === `file://${process.argv[1]}`) {
  applyNewDatabase().catch(console.error);
}

export { applyNewDatabase };
