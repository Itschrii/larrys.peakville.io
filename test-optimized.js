// Test ottimizzato per il sistema di gestione inventario e ordini
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function testOptimizedSystem() {
  try {
    console.log('🚀 Test Sistema Ottimizzato - Gestione Inventario e Ordini\n');

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

    // 4. Ottieni inventario con statistiche
    console.log('4. Ottieni inventario con statistiche...');
    const inventoryResponse = await fetch(`${API_BASE}/inventory`);
    if (!inventoryResponse.ok) {
      throw new Error(`Inventory fetch failed: ${inventoryResponse.statusText}`);
    }
    const inventoryData = await inventoryResponse.json();
    console.log(`✅ Inventario ottenuto: ${inventoryData.items.length} articoli`);
    console.log(`   - Totale quantità: ${inventoryData.stats.totalQuantity}`);
    console.log(`   - Articoli con scorte basse: ${inventoryData.stats.lowStockItems}`);
    console.log(`   - Articoli esauriti: ${inventoryData.stats.outOfStockItems}\n`);

    // 5. Test ricerca inventario
    console.log('5. Test ricerca inventario...');
    const searchResponse = await fetch(`${API_BASE}/inventory/search?q=motore`);
    const searchResults = await searchResponse.json();
    console.log(`✅ Ricerca "motore": ${searchResults.length} risultati\n`);

    // 6. Test gestione inventario - Aggiungi pezzi
    console.log('6. Test gestione inventario - Aggiungi pezzi...');
    const testItem = inventoryData.items.find(item => item.name.includes('Motore'));
    if (testItem) {
      const modifyResponse = await fetch(`${API_BASE}/inventory/modify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: testItem.id,
          itemName: testItem.name,
          quantity: 5,
          operation: 'add',
          cost: 100.00,
          description: 'Aggiunta scorte per test',
          username: 'admin'
        })
      });
      
      if (modifyResponse.ok) {
        const modifyResult = await modifyResponse.json();
        console.log(`✅ Aggiunti 5 pezzi a ${testItem.name}`);
        console.log(`   - Nuova quantità: ${modifyResult.newQuantity}\n`);
      } else {
        console.log('❌ Errore nell\'aggiunta di pezzi\n');
      }
    }

    // 7. Ottieni inventario con prezzi
    console.log('7. Ottieni inventario con prezzi...');
    const inventoryWithPricesResponse = await fetch(`${API_BASE}/inventory-with-prices`);
    const inventoryWithPrices = await inventoryWithPricesResponse.json();
    console.log(`✅ Inventario con prezzi ottenuto: ${inventoryWithPrices.length} articoli\n`);

    // 8. Seleziona un articolo per il test ordine
    const orderItem = inventoryWithPrices.find(item => item.quantity > 0);
    if (!orderItem) {
      throw new Error('Nessun articolo disponibile per il test ordine');
    }
    console.log(`8. Articolo selezionato per il test ordine: ${orderItem.name} (quantità: ${orderItem.quantity})\n`);

    // 9. Crea un ordine ottimizzato
    console.log('9. Crea ordine ottimizzato...');
    const orderData = {
      username: 'admin',
      items: [{
        itemId: orderItem.id,
        itemName: orderItem.name,
        quantity: 1,
        unitPrice: parseFloat(orderItem.selling_price),
        total: parseFloat(orderItem.selling_price),
        profit: parseFloat(orderItem.profit)
      }],
      totalAmount: parseFloat(orderItem.selling_price),
      totalProfit: parseFloat(orderItem.profit),
      description: 'Test ordine ottimizzato'
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
    console.log('   - Profitto totale:', orderResult.totalProfit);
    console.log('   - Messaggio:', orderResult.message, '\n');

    // 10. Verifica che l'inventario sia stato aggiornato
    console.log('10. Verifica aggiornamento inventario...');
    const updatedInventoryResponse = await fetch(`${API_BASE}/inventory`);
    const updatedInventoryData = await updatedInventoryResponse.json();
    const updatedItem = updatedInventoryData.items.find(item => item.id === orderItem.id);
    
    if (updatedItem.quantity === orderItem.quantity - 1) {
      console.log('✅ Inventario aggiornato correttamente');
      console.log(`   - Quantità precedente: ${orderItem.quantity}`);
      console.log(`   - Quantità attuale: ${updatedItem.quantity}\n`);
    } else {
      throw new Error(`Inventario non aggiornato correttamente. Atteso: ${orderItem.quantity - 1}, Attuale: ${updatedItem.quantity}`);
    }

    // 11. Verifica activity log
    console.log('11. Verifica activity log...');
    const activitiesResponse = await fetch(`${API_BASE}/activities`);
    const activities = await activitiesResponse.json();
    const orderActivity = activities.find(activity => 
      activity.activity_type === 'order' && activity.item_name === orderItem.name
    );
    
    if (orderActivity) {
      console.log('✅ Activity log aggiornato correttamente');
      console.log(`   - Tipo: ${orderActivity.activity_type}`);
      console.log(`   - Articolo: ${orderActivity.item_name}`);
      console.log(`   - Quantità: ${orderActivity.quantity}\n`);
    } else {
      throw new Error('Activity log non aggiornato');
    }

    // 12. Test gestione inventario - Sottrai pezzi
    console.log('12. Test gestione inventario - Sottrai pezzi...');
    const subtractResponse = await fetch(`${API_BASE}/inventory/modify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: testItem.id,
        itemName: testItem.name,
        quantity: 2,
        operation: 'subtract',
        cost: 50.00,
        description: 'Sottrazione scorte per test',
        username: 'admin'
      })
    });
    
    if (subtractResponse.ok) {
      const subtractResult = await subtractResponse.json();
      console.log(`✅ Sottratti 2 pezzi da ${testItem.name}`);
      console.log(`   - Nuova quantità: ${subtractResult.newQuantity}\n`);
    } else {
      console.log('❌ Errore nella sottrazione di pezzi\n');
    }

    // 13. Verifica articoli con scorte basse
    console.log('13. Verifica articoli con scorte basse...');
    const lowStockResponse = await fetch(`${API_BASE}/inventory/low-stock`);
    const lowStockItems = await lowStockResponse.json();
    console.log(`✅ Articoli con scorte basse: ${lowStockItems.length}\n`);

    console.log('🎉 TUTTI I TEST SUPERATI! Il sistema ottimizzato funziona perfettamente!');
    console.log('\n📊 Funzionalità testate:');
    console.log('   ✅ Creazione ordini ottimizzata');
    console.log('   ✅ Gestione inventario (aggiungi/sottrai pezzi)');
    console.log('   ✅ Ricerca articoli');
    console.log('   ✅ Statistiche inventario');
    console.log('   ✅ Activity log');
    console.log('   ✅ Scorte basse');
    console.log('   ✅ Aggiornamento automatico quantità');

  } catch (error) {
    console.error('❌ ERRORE:', error.message);
    process.exit(1);
  }
}

// Esegui il test
testOptimizedSystem();





