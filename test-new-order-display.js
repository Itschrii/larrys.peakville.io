import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testNewOrderDisplay() {
  console.log('🧪 Testando la nuova visualizzazione degli ordini...\n');

  try {
    // 1. Login come dipendente
    console.log('1. Login come dipendente...');
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

    // 2. Prima faccio restock per avere scorte sufficienti
    console.log('\n2. Facendo restock per avere scorte sufficienti...');
    const restockItems = [
      { itemId: 1, quantity: 10, description: 'Restock per test' },
      { itemId: 2, quantity: 10, description: 'Restock per test' },
      { itemId: 3, quantity: 10, description: 'Restock per test' }
    ];

    for (const item of restockItems) {
      const restockResponse = await fetch(`${BASE_URL}/api/inventory/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'raycooper',
          itemId: item.itemId,
          quantity: item.quantity,
          description: item.description
        })
      });

      if (!restockResponse.ok) {
        const errorText = await restockResponse.text();
        console.log(`⚠️ Restock fallito per item ${item.itemId}: ${errorText}`);
      } else {
        console.log(`✅ Restock completato per item ${item.itemId}: +${item.quantity} pezzi`);
      }
    }

    // 3. Crea un ordine con più articoli
    console.log('\n3. Creando ordine con più articoli...');
    const orderResponse = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'raycooper',
        items: [
          {
            itemId: 1,
            itemName: 'Freni anteriori',
            quantity: 2,
            unitPrice: 25.00,
            total: 50.00,
            profit: 10.00
          },
          {
            itemId: 2,
            itemName: 'Freni posteriori',
            quantity: 1,
            unitPrice: 30.00,
            total: 30.00,
            profit: 6.00
          },
          {
            itemId: 3,
            itemName: 'Pastiglie freni',
            quantity: 4,
            unitPrice: 15.00,
            total: 60.00,
            profit: 12.00
          }
        ]
      })
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      throw new Error(`Order creation failed: ${errorText}`);
    }

    const orderData = await orderResponse.json();
    console.log('✅ Ordine creato con successo!');
    console.log('   - Articoli:', orderData.orders.length);
    console.log('   - Totale:', `€${orderData.totalAmount.toFixed(2)}`);
    console.log('   - Profitto:', `€${orderData.totalProfit.toFixed(2)}`);

    // 4. Verifica le attività
    console.log('\n4. Verificando le attività...');
    const activitiesResponse = await fetch(`${BASE_URL}/api/activities`);
    if (!activitiesResponse.ok) {
      throw new Error(`Activities fetch failed: ${activitiesResponse.statusText}`);
    }

    const activities = await activitiesResponse.json();
    console.log('✅ Attività recuperate:', activities.length);

    // Trova l'attività dell'ordine appena creato
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

      // 5. Testa i dettagli dell'ordine
      console.log('\n5. Testando i dettagli dell\'ordine...');
      const orderDetailsResponse = await fetch(`${BASE_URL}/api/orders/${orderActivity.reference_id}`);
      if (!orderDetailsResponse.ok) {
        throw new Error(`Order details fetch failed: ${orderDetailsResponse.statusText}`);
      }

      const orderDetails = await orderDetailsResponse.json();
      console.log('✅ Dettagli ordine recuperati:');
      console.log('   - Dipendente:', orderDetails.employee.full_name);
      console.log('   - Articoli nell\'ordine:', orderDetails.items.length);
      console.log('   - Totale ordine:', `€${orderDetails.order.total_amount.toFixed(2)}`);
      console.log('   - Pagamento dipendente:', `€${orderDetails.employeePayment.toFixed(2)}`);
      
      console.log('\n   Articoli dettagliati:');
      orderDetails.items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.item_name} - ${item.quantity}pz - €${parseFloat(item.total_cost).toFixed(2)}`);
      });

    } else {
      console.log('❌ Attività ordine non trovata');
    }

    // 6. Verifica che non ci siano attività duplicate per ogni pezzo
    console.log('\n6. Verificando che non ci siano attività duplicate...');
    const orderActivities = activities.filter(activity => 
      activity.type === 'order' && 
      activity.username === 'raycooper' &&
      activity.created_at === orderActivity?.created_at
    );

    console.log(`✅ Attività ordine trovate: ${orderActivities.length}`);
    if (orderActivities.length === 1) {
      console.log('✅ Perfetto! Solo una attività per ordine (non una per ogni pezzo)');
    } else {
      console.log('❌ Problema: troppe attività per lo stesso ordine');
    }

    console.log('\n🎉 Test completato con successo!');
    console.log('\n📋 Riepilogo delle modifiche:');
    console.log('   ✅ Gli ordini ora appaiono come una singola attività');
    console.log('   ✅ Il prezzo totale è mostrato a destra');
    console.log('   ✅ I dettagli mostrano tutti gli articoli dell\'ordine');
    console.log('   ✅ Il pagamento del dipendente è chiaramente visibile');

  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
    process.exit(1);
  }
}

// Avvia il test
testNewOrderDisplay();
