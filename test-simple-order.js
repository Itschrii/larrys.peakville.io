import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testSimpleOrder() {
  console.log('🧪 Test semplice per verificare la visualizzazione degli ordini...\n');

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

    // 2. Crea un ordine semplice
    console.log('\n2. Creando ordine semplice...');
    const orderResponse = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'raycooper',
        items: [
          {
            itemId: 1,
            itemName: 'Freni anteriori',
            quantity: 1,
            unitPrice: 25.00,
            total: 25.00,
            profit: 5.00
          },
          {
            itemId: 2,
            itemName: 'Freni posteriori',
            quantity: 1,
            unitPrice: 30.00,
            total: 30.00,
            profit: 6.00
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

    // 3. Verifica le attività
    console.log('\n3. Verificando le attività...');
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

      // Verifica che l'importo non sia NaN
      const amount = parseFloat(orderActivity.amount);
      if (isNaN(amount)) {
        console.log('❌ Problema: l\'importo è NaN');
      } else {
        console.log('✅ Importo corretto:', `€${amount.toFixed(2)}`);
      }
    } else {
      console.log('❌ Attività ordine non trovata');
    }

    console.log('\n🎉 Test completato!');

  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
    process.exit(1);
  }
}

// Avvia il test
testSimpleOrder();
