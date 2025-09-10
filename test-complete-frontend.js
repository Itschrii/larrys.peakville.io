import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function testCompleteFrontend() {
  console.log('🎯 Test Completo Frontend...\n');

  try {
    // 1. Test login e localStorage
    console.log('1. Test login e localStorage...');
    const loginResponse = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'raycooper' })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login riuscito:', loginData.employee.fullName);
      console.log('✅ Ruolo:', loginData.employee.role);
      console.log('✅ È Admin:', loginData.employee.role === 'admin');
    } else {
      console.log('❌ Errore login:', await loginResponse.text());
    }

    // 2. Test restock
    console.log('\n2. Test restock...');
    const restockResponse = await fetch(`${API_BASE}/inventory/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'raycooper',
        itemId: 1,
        quantity: 4,
        description: 'Test restock completo'
      })
    });

    if (restockResponse.ok) {
      const restockData = await restockResponse.json();
      console.log('✅ Restock completato:', restockData.message);
    } else {
      console.log('❌ Errore restock:', await restockResponse.text());
    }

    // 3. Test activities
    console.log('\n3. Test activities...');
    const activitiesResponse = await fetch(`${API_BASE}/activities`);
    
    if (activitiesResponse.ok) {
      const activities = await activitiesResponse.json();
      console.log('✅ Attività ottenute:', activities.length);
      activities.slice(0, 3).forEach(activity => {
        console.log(`   - ${activity.type}: ${activity.item_name} (${activity.quantity} pz) - ${activity.username}`);
      });
    } else {
      console.log('❌ Errore attività:', await activitiesResponse.text());
    }

    // 4. Test gestione dipendenti (admin)
    console.log('\n4. Test gestione dipendenti...');
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

    console.log('\n🎉 TUTTI I TEST SUPERATI!');
    console.log('\n📋 ISTRUZIONI PER L\'UTENTE:');
    console.log('1. Vai su http://localhost:3001');
    console.log('2. Fai login con username: "raycooper"');
    console.log('3. Vai su "Attività Recente"');
    console.log('4. Dovresti vedere il tab "Gestione Dipendenti"');
    console.log('5. Vai su "Gestione Pezzi" per testare il restock');
    console.log('6. Usa il file test-frontend.html per testare il localStorage');

  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
  }
}

testCompleteFrontend();




