import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function testRestockFrontend() {
  console.log('🧪 Test Restock Frontend...\n');

  try {
    // 1. Ottengo l'inventario
    console.log('1. Ottengo inventario...');
    const inventoryResponse = await fetch(`${API_BASE}/inventory-with-prices`);
    
    if (inventoryResponse.ok) {
      const inventory = await inventoryResponse.json();
      console.log('✅ Inventario ottenuto:', inventory.length, 'articoli');
      
      if (inventory.length > 0) {
        const firstItem = inventory[0];
        console.log(`   - Primo articolo: ${firstItem.name} (quantità: ${firstItem.quantity})`);
        
        // 2. Test restock
        console.log('\n2. Test restock...');
        const restockResponse = await fetch(`${API_BASE}/inventory/restock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'raycooper',
            itemId: firstItem.id,
            quantity: 3,
            description: 'Test restock frontend'
          })
        });

        if (restockResponse.ok) {
          const restockData = await restockResponse.json();
          console.log('✅ Restock completato:', restockData.message);
          console.log(`   - Nuova quantità: ${restockData.newQuantity}`);
        } else {
          const errorText = await restockResponse.text();
          console.log('❌ Errore restock:', errorText);
        }
      }
    } else {
      console.log('❌ Errore inventario:', await inventoryResponse.text());
    }

    // 3. Test activities
    console.log('\n3. Test activities...');
    const activitiesResponse = await fetch(`${API_BASE}/activities`);
    
    if (activitiesResponse.ok) {
      const activities = await activitiesResponse.json();
      console.log('✅ Attività ottenute:', activities.length);
      activities.slice(0, 3).forEach(activity => {
        console.log(`   - ${activity.type}: ${activity.item_name} (${activity.quantity} pz)`);
      });
    } else {
      console.log('❌ Errore attività:', await activitiesResponse.text());
    }

  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
  }
}

testRestockFrontend();




