import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function addAdminRay() {
  console.log('👤 Aggiungo admin Ray Cooper...\n');

  try {
    // Prima resetto il database per avere un setup pulito
    console.log('1. Reset database...');
    const resetResponse = await fetch(`${API_BASE}/reset-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (resetResponse.ok) {
      console.log('✅ Database resettato');
    } else {
      console.log('❌ Errore reset:', await resetResponse.text());
    }

    // Setup database
    console.log('\n2. Setup database...');
    const setupResponse = await fetch(`${API_BASE}/setup-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (setupResponse.ok) {
      console.log('✅ Database configurato');
    } else {
      console.log('❌ Errore setup:', await setupResponse.text());
    }

    // Aggiungo admin Ray Cooper
    console.log('\n3. Aggiungo admin Ray Cooper...');
    const addAdminResponse = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'raycooper',
        full_name: 'Ray Cooper',
        role: 'admin',
        is_active: true
      })
    });

    if (addAdminResponse.ok) {
      console.log('✅ Admin Ray Cooper aggiunto');
    } else {
      console.log('❌ Errore aggiunta admin:', await addAdminResponse.text());
    }

    // Verifico che sia stato aggiunto
    console.log('\n4. Verifico admin aggiunto...');
    const verifyResponse = await fetch(`${API_BASE}/employees?userRole=admin`);
    
    if (verifyResponse.ok) {
      const employees = await verifyResponse.json();
      console.log('✅ Dipendenti nel sistema:');
      employees.forEach(emp => {
        console.log(`   - ${emp.full_name} (${emp.username}) - Ruolo: ${emp.role} - Attivo: ${emp.is_active}`);
      });
    } else {
      console.log('❌ Errore verifica:', await verifyResponse.text());
    }

    // Creo un ordine di test per Ray Cooper
    console.log('\n5. Creo ordine di test per Ray Cooper...');
    const orderResponse = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'raycooper',
        items: [{
          itemId: 1,
          itemName: 'Motore 3 Cilindri',
          quantity: 1,
          unitPrice: 285.00,
          total: 285.00,
          profit: 285.00
        }],
        totalAmount: 285.00,
        totalProfit: 285.00
      })
    });

    if (orderResponse.ok) {
      console.log('✅ Ordine creato per Ray Cooper');
    } else {
      console.log('❌ Errore creazione ordine:', await orderResponse.text());
    }

    console.log('\n🎉 Setup completato! Ora puoi:');
    console.log('   - Fare login come "raycooper"');
    console.log('   - Vedere il tab "Gestione Dipendenti" nell\'Activity Feed');
    console.log('   - Licenziare dipendenti e vedere stipendi');

  } catch (error) {
    console.error('❌ Errore durante il setup:', error.message);
  }
}

addAdminRay();




