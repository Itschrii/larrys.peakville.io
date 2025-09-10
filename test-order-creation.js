// Script di test per verificare la creazione degli ordini
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function testOrderCreation() {
  try {
    console.log('🧪 Test creazione ordini...\n');

    // 1. Reset del database
    console.log('1. Reset database...');
    const resetResponse = await fetch(`${API_BASE}/reset-db`, { method: 'POST' });
    if (!resetResponse.ok) {
      throw new Error(`Reset failed: ${resetResponse.statusText}`);
    }
    console.log('✅ Database resettato\n');

    // 2. Setup del database
    console.log('2. Setup database...');
    const setupResponse = await fetch(`${API_BASE}/setup-db`, { method: 'POST' });
    if (!setupResponse.ok) {
      throw new Error(`Setup failed: ${setupResponse.statusText}`);
    }
    console.log('✅ Database configurato\n');

    // 3. Login come admin
    console.log('3. Login come admin...');
    const loginResponse = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin' })
    });
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.statusText}`);
    }
    const loginData = await loginResponse.json();
    console.log('✅ Login effettuato:', loginData.employee.username, '\n');

    // 4. Ottieni inventario
    console.log('4. Ottieni inventario...');
    const inventoryResponse = await fetch(`${API_BASE}/inventory-with-prices`);
    if (!inventoryResponse.ok) {
      throw new Error(`Inventory fetch failed: ${inventoryResponse.statusText}`);
    }
    const inventory = await inventoryResponse.json();
    console.log(`✅ Inventario ottenuto: ${inventory.length} articoli\n`);

    // 5. Seleziona un articolo per il test
    const testItem = inventory.find(item => item.quantity > 0);
    if (!testItem) {
      throw new Error('Nessun articolo disponibile per il test');
    }
    console.log(`5. Articolo selezionato per il test: ${testItem.name} (quantità: ${testItem.quantity})\n`);

    // 6. Crea un ordine
    console.log('6. Crea ordine...');
    const orderData = {
      username: 'admin',
      items: [{
        itemId: testItem.id,
        itemName: testItem.name,
        quantity: 1,
        unitPrice: parseFloat(testItem.selling_price),
        total: parseFloat(testItem.selling_price),
        profit: parseFloat(testItem.profit)
      }],
      totalAmount: parseFloat(testItem.selling_price),
      totalProfit: parseFloat(testItem.profit)
    };

    const orderResponse = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      throw new Error(`Order creation failed: ${errorData.error}`);
    }

    const orderResult = await orderResponse.json();
    console.log('✅ Ordine creato con successo!');
    console.log('   - Ordini creati:', orderResult.orders.length);
    console.log('   - Importo totale:', orderResult.totalAmount);
    console.log('   - Profitto totale:', orderResult.totalProfit, '\n');

    // 7. Verifica che l'inventario sia stato aggiornato
    console.log('7. Verifica aggiornamento inventario...');
    const updatedInventoryResponse = await fetch(`${API_BASE}/inventory-with-prices`);
    const updatedInventory = await updatedInventoryResponse.json();
    const updatedItem = updatedInventory.find(item => item.id === testItem.id);
    
    if (updatedItem.quantity === testItem.quantity - 1) {
      console.log('✅ Inventario aggiornato correttamente');
      console.log(`   - Quantità precedente: ${testItem.quantity}`);
      console.log(`   - Quantità attuale: ${updatedItem.quantity}\n`);
    } else {
      throw new Error(`Inventario non aggiornato correttamente. Atteso: ${testItem.quantity - 1}, Attuale: ${updatedItem.quantity}`);
    }

    // 8. Verifica activity log
    console.log('8. Verifica activity log...');
    const activitiesResponse = await fetch(`${API_BASE}/activities`);
    const activities = await activitiesResponse.json();
    const orderActivity = activities.find(activity => 
      activity.type === 'order' && activity.item_name === testItem.name
    );
    
    if (orderActivity) {
      console.log('✅ Activity log aggiornato correttamente');
      console.log(`   - Tipo: ${orderActivity.type}`);
      console.log(`   - Articolo: ${orderActivity.item_name}`);
      console.log(`   - Quantità: ${orderActivity.quantity}\n`);
    } else {
      throw new Error('Activity log non aggiornato');
    }

    console.log('🎉 TUTTI I TEST SUPERATI! La creazione degli ordini funziona correttamente.');

  } catch (error) {
    console.error('❌ ERRORE:', error.message);
    process.exit(1);
  }
}

// Esegui il test
testOrderCreation();
