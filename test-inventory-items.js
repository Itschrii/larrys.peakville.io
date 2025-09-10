import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testInventoryItems() {
  console.log('🔍 Verificando gli articoli disponibili nel database...\n');

  try {
    // 1. Login
    const loginResponse = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'raycooper',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', loginData.employee.full_name);

    // 2. Ottieni inventario
    console.log('\n2. Recuperando inventario...');
    const inventoryResponse = await fetch(`${BASE_URL}/api/inventory`);
    if (!inventoryResponse.ok) {
      throw new Error(`Inventory fetch failed: ${inventoryResponse.statusText}`);
    }

    const inventory = await inventoryResponse.json();
    console.log('✅ Inventario recuperato:', inventory.length, 'articoli');
    
    console.log('\n📦 Articoli disponibili:');
    inventory.forEach((item, index) => {
      console.log(`   ${index + 1}. ID: ${item.id} - ${item.name} - Quantità: ${item.quantity} - Prezzo: €${item.purchase_price}`);
    });

    // 3. Usa i primi due articoli per il test
    if (inventory.length >= 2) {
      const item1 = inventory[0];
      const item2 = inventory[1];
      
      console.log('\n3. Testando ordine con articoli esistenti...');
      const orderResponse = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'raycooper',
          items: [
            {
              itemId: item1.id,
              itemName: item1.name,
              quantity: 1,
              unitPrice: parseFloat(item1.purchase_price) * 1.5, // Prezzo di vendita
              total: parseFloat(item1.purchase_price) * 1.5,
              profit: parseFloat(item1.purchase_price) * 0.5 // Profitto
            },
            {
              itemId: item2.id,
              itemName: item2.name,
              quantity: 1,
              unitPrice: parseFloat(item2.purchase_price) * 1.5,
              total: parseFloat(item2.purchase_price) * 1.5,
              profit: parseFloat(item2.purchase_price) * 0.5
            }
          ]
        })
      });

      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        console.log('✅ Ordine creato con successo!');
        console.log('   - Articoli:', orderData.orders.length);
        console.log('   - Totale:', `€${orderData.totalAmount.toFixed(2)}`);
        console.log('   - Profitto:', `€${orderData.totalProfit.toFixed(2)}`);

        // 4. Verifica le attività
        console.log('\n4. Verificando le attività...');
        const activitiesResponse = await fetch(`${BASE_URL}/api/activities`);
        if (activitiesResponse.ok) {
          const activities = await activitiesResponse.json();
          const orderActivity = activities.find(activity => 
            activity.type === 'order' && 
            activity.username === 'raycooper' &&
            activity.item_name.includes('Ordine con')
          );

          if (orderActivity) {
            console.log('✅ Attività ordine trovata:');
            console.log('   - Descrizione:', orderActivity.item_name);
            console.log('   - Quantità totale:', orderActivity.quantity);
            console.log('   - Importo totale:', `€${parseFloat(orderActivity.amount).toFixed(2)}`);
            console.log('   - Reference ID:', orderActivity.reference_id);
          }
        }
      } else {
        const errorText = await orderResponse.text();
        console.log('❌ Ordine fallito:', errorText);
      }
    }

    console.log('\n🎉 Test completato!');

  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
    process.exit(1);
  }
}

// Avvia il test
testInventoryItems();



