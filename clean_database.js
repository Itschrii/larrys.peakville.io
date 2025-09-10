import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'officina_db',
  multipleStatements: true
};

// Dati corretti dall'immagine - SOLO QUESTI 25 ARTICOLI
const inventoryData = [
  { "name": "Motore 3 Cilindri", "category": "upper", "type": "motore", "quantity": 3, "min_stock": 1, "purchase_price": 175.0, "selling_price": 285.0 },
  { "name": "Motore 4 Cilindri", "category": "upper", "type": "motore", "quantity": 2, "min_stock": 1, "purchase_price": 1500.0, "selling_price": 2100.0 },
  { "name": "Motore 8 Cilindri", "category": "upper", "type": "motore", "quantity": 1, "min_stock": 1, "purchase_price": 4000.0, "selling_price": 5380.0 },
  { "name": "Motore 12 Cilindri", "category": "upper", "type": "motore", "quantity": 1, "min_stock": 1, "purchase_price": 9000.0, "selling_price": 12500.0 },
  { "name": "Freno a Tamburo", "category": "lower", "type": "freni", "quantity": 10, "min_stock": 3, "purchase_price": 50.0, "selling_price": 70.0 },
  { "name": "Freno a Disco", "category": "lower", "type": "freni", "quantity": 8, "min_stock": 2, "purchase_price": 300.0, "selling_price": 420.0 },
  { "name": "Freno in Ceramica", "category": "lower", "type": "freni", "quantity": 5, "min_stock": 1, "purchase_price": 600.0, "selling_price": 790.0 },
  { "name": "Freno a Disco in Ceramica", "category": "lower", "type": "freni", "quantity": 3, "min_stock": 1, "purchase_price": 1000.0, "selling_price": 1350.0 },
  { "name": "Trasmissione Manuale", "category": "upper", "type": "trasmissione", "quantity": 6, "min_stock": 2, "purchase_price": 220.0, "selling_price": 295.0 },
  { "name": "Trasmissione con Convertitore di Coppia", "category": "upper", "type": "trasmissione", "quantity": 4, "min_stock": 1, "purchase_price": 1600.0, "selling_price": 2220.0 },
  { "name": "Trasmissione a Doppia Frizione", "category": "upper", "type": "trasmissione", "quantity": 2, "min_stock": 1, "purchase_price": 3500.0, "selling_price": 4650.0 },
  { "name": "Batteria al Piombo Acido", "category": "upper", "type": "batteria", "quantity": 12, "min_stock": 4, "purchase_price": 46.0, "selling_price": 78.0 },
  { "name": "Batteria ad Alta Tensione", "category": "upper", "type": "batteria", "quantity": 8, "min_stock": 2, "purchase_price": 100.0, "selling_price": 142.0 },
  { "name": "Batteria al Litio", "category": "upper", "type": "batteria", "quantity": 6, "min_stock": 2, "purchase_price": 220.0, "selling_price": 300.0 },
  { "name": "Olio Minerale", "category": "upper", "type": "olio", "quantity": 20, "min_stock": 5, "purchase_price": 7.0, "selling_price": 28.0 },
  { "name": "Olio Sintetico", "category": "upper", "type": "olio", "quantity": 15, "min_stock": 3, "purchase_price": 65.0, "selling_price": 90.0 },
  { "name": "Olio a Bassa Viscosità", "category": "upper", "type": "olio", "quantity": 10, "min_stock": 2, "purchase_price": 120.0, "selling_price": 170.0 },
  { "name": "Sospensioni a Balestra", "category": "lower", "type": "sospensioni", "quantity": 8, "min_stock": 3, "purchase_price": 48.0, "selling_price": 78.0 },
  { "name": "Sospensioni Indipendenti", "category": "lower", "type": "sospensioni", "quantity": 6, "min_stock": 2, "purchase_price": 200.0, "selling_price": 275.0 },
  { "name": "Sospensioni ad Aria", "category": "lower", "type": "sospensioni", "quantity": 4, "min_stock": 1, "purchase_price": 500.0, "selling_price": 670.0 },
  { "name": "Sospensioni Idropneumatica", "category": "lower", "type": "sospensioni", "quantity": 2, "min_stock": 1, "purchase_price": 1100.0, "selling_price": 1470.0 },
  { "name": "Pneumatici Serie", "category": "lower", "type": "gomme", "quantity": 25, "min_stock": 8, "purchase_price": 33.0, "selling_price": 55.0 },
  { "name": "Pneumatici Rinforzato", "category": "lower", "type": "gomme", "quantity": 15, "min_stock": 5, "purchase_price": 120.0, "selling_price": 170.0 },
  { "name": "Pneumatici Tela Acciaio", "category": "lower", "type": "gomme", "quantity": 10, "min_stock": 3, "purchase_price": 240.0, "selling_price": 322.0 },
  { "name": "Pneumatici Tubeless", "category": "lower", "type": "gomme", "quantity": 8, "min_stock": 2, "purchase_price": 600.0, "selling_price": 790.0 }
];

async function cleanDatabase() {
  let connection;
  try {
    console.log('🧹 PULIZIA COMPLETA DEL DATABASE...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connesso al database MySQL');

    await connection.beginTransaction();

    console.log('🗑️ Eliminando TUTTI i dati esistenti...');
    
    // Disabilita temporaneamente i controlli di foreign key
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Pulisci tutte le tabelle in ordine corretto
    await connection.execute('DELETE FROM activity_log');
    await connection.execute('DELETE FROM employee_deductions');
    await connection.execute('DELETE FROM modifications');
    await connection.execute('DELETE FROM orders');
    await connection.execute('DELETE FROM daily_earnings');
    await connection.execute('DELETE FROM selling_prices');
    await connection.execute('DELETE FROM inventory');
    
    // Riabilita i controlli di foreign key
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Database completamente pulito');

    console.log('➕ Inserendo i 25 articoli corretti...');
    for (const item of inventoryData) {
      const [inventoryResult] = await connection.execute(
        'INSERT INTO inventory (name, category, type, quantity, min_stock, purchase_price) VALUES (?, ?, ?, ?, ?, ?)',
        [item.name, item.category, item.type, item.quantity, item.min_stock, item.purchase_price]
      );
      const inventoryId = inventoryResult.insertId;

      await connection.execute(
        'INSERT INTO selling_prices (item_name, selling_price) VALUES (?, ?)',
        [item.name, item.selling_price]
      );
      
      console.log(`✅ ${item.name} (ID: ${inventoryId})`);
    }

    await connection.commit();
    console.log('');
    console.log('🎉 DATABASE COMPLETAMENTE PULITO E AGGIORNATO!');
    console.log(`📊 Inseriti esattamente ${inventoryData.length} articoli`);
    console.log('💰 Prezzi di vendita configurati');
    console.log('🗑️ Tutti i duplicati eliminati');
    console.log('');

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Errore durante la pulizia del database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connessione al database chiusa.');
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  cleanDatabase().catch(console.error);
}

export { cleanDatabase };
