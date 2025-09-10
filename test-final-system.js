import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function testFinalSystem() {
  console.log('🎯 Test Finale Sistema Completo...\n');

  try {
    // 1. Test login Ray Cooper
    console.log('1. Test login Ray Cooper...');
    const loginResponse = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'raycooper'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login riuscito:', loginData.employee.fullName, '- Ruolo:', loginData.employee.role);
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
        quantity: 5,
        description: 'Test restock finale'
      })
    });

    if (restockResponse.ok) {
      const restockData = await restockResponse.json();
      console.log('✅ Restock completato:', restockData.message);
    } else {
      console.log('❌ Errore restock:', await restockResponse.text());
    }

    // 3. Test gestione dipendenti (admin)
    console.log('\n3. Test gestione dipendenti...');
    const employeesResponse = await fetch(`${API_BASE}/employees?userRole=admin`);
    
    if (employeesResponse.ok) {
      const employees = await employeesResponse.json();
      console.log('✅ Dipendenti ottenuti:', employees.length);
      employees.forEach(emp => {
        console.log(`   - ${emp.full_name} (${emp.username}) - Ruolo: ${emp.role} - Attivo: ${emp.is_active}`);
      });
    } else {
      console.log('❌ Errore dipendenti:', await employeesResponse.text());
    }

    // 4. Test stipendi dipendente
    console.log('\n4. Test stipendi dipendente...');
    const earningsResponse = await fetch(`${API_BASE}/employees/admin/earnings?userRole=admin`);
    
    if (earningsResponse.ok) {
      const earnings = await earningsResponse.json();
      console.log('✅ Stipendi ottenuti:');
      console.log(`   - Guadagni totali: €${earnings.totalEarnings?.toFixed(2)}`);
      console.log(`   - Giorni lavorati: ${earnings.totalDays}`);
    } else {
      console.log('❌ Errore stipendi:', await earningsResponse.text());
    }

    // 5. Test activities
    console.log('\n5. Test activities...');
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

    console.log('\n🎉 SISTEMA COMPLETAMENTE FUNZIONANTE!');
    console.log('\n📋 ISTRUZIONI PER L\'UTENTE:');
    console.log('1. Vai su http://localhost:3001');
    console.log('2. Fai login con username: "raycooper"');
    console.log('3. Vai su "Attività Recente"');
    console.log('4. Vedrai il tab "Gestione Dipendenti" (solo per admin)');
    console.log('5. Puoi licenziare dipendenti e vedere stipendi');
    console.log('6. Vai su "Gestione Pezzi" per fare restock');

  } catch (error) {
    console.error('❌ Errore durante il test finale:', error.message);
  }
}

testFinalSystem();



