import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function testFrontendLogin() {
  console.log('🌐 Test Frontend Login...\n');

  try {
    // 1. Simulo il login come farebbe il frontend
    console.log('1. Simulo login frontend...');
    const loginResponse = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'raycooper'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login riuscito:', loginData.employee);
      
      // Simulo quello che farebbe il frontend
      const currentUser = loginData.employee;
      const isAdmin = currentUser.role === 'admin';
      
      console.log('✅ Current User:', currentUser);
      console.log('✅ Is Admin:', isAdmin);
      
      if (isAdmin) {
        console.log('✅ L\'utente è admin, dovrebbe vedere il tab "Gestione Dipendenti"');
      } else {
        console.log('❌ L\'utente NON è admin');
      }
    } else {
      console.log('❌ Errore login:', await loginResponse.text());
    }

    // 2. Test restock con username corretto
    console.log('\n2. Test restock...');
    const restockResponse = await fetch(`${API_BASE}/inventory/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'raycooper',
        itemId: 1,
        quantity: 2,
        description: 'Test restock frontend'
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

testFrontendLogin();




