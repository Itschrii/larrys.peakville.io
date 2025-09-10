import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function testLoginRay() {
  console.log('🔐 Test Login Ray Cooper...\n');

  try {
    // 1. Test login
    console.log('1. Test login Ray Cooper...');
    const loginResponse = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'raycooper',
        password: 'password' // password di default
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login riuscito:', loginData);
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ Errore login:', errorText);
    }

    // 2. Verifico dipendenti
    console.log('\n2. Verifico dipendenti...');
    const employeesResponse = await fetch(`${API_BASE}/employees?userRole=admin`);
    
    if (employeesResponse.ok) {
      const employees = await employeesResponse.json();
      console.log('✅ Dipendenti ottenuti:', employees.length);
      employees.forEach(emp => {
        console.log(`   - ${emp.full_name} (${emp.username}) - Ruolo: ${emp.role}`);
      });
    } else {
      console.log('❌ Errore dipendenti:', await employeesResponse.text());
    }

    // 3. Test restock con username corretto
    console.log('\n3. Test restock con Ray Cooper...');
    const restockResponse = await fetch(`${API_BASE}/inventory/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'raycooper',
        itemId: 1,
        quantity: 2,
        description: 'Test restock Ray Cooper'
      })
    });

    if (restockResponse.ok) {
      const restockData = await restockResponse.json();
      console.log('✅ Restock completato:', restockData.message);
    } else {
      const errorText = await restockResponse.text();
      console.log('❌ Errore restock:', errorText);
    }

  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
  }
}

testLoginRay();




