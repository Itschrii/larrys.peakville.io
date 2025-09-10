import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function checkRayCooper() {
  console.log('🔍 Controllo Ray Cooper...\n');

  try {
    // 1. Verifico dipendenti
    console.log('1. Verifico dipendenti nel sistema...');
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

    // 2. Test login
    console.log('\n2. Test login Ray Cooper...');
    const loginResponse = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'raycooper'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login riuscito:', loginData);
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ Errore login:', errorText);
    }

    // 3. Test activities
    console.log('\n3. Test activities...');
    const activitiesResponse = await fetch(`${API_BASE}/activities`);
    
    if (activitiesResponse.ok) {
      const activities = await activitiesResponse.json();
      console.log('✅ Attività ottenute:', activities.length);
      activities.slice(0, 5).forEach(activity => {
        console.log(`   - ${activity.type}: ${activity.item_name} (${activity.quantity} pz) - ${activity.username}`);
      });
    } else {
      console.log('❌ Errore attività:', await activitiesResponse.text());
    }

  } catch (error) {
    console.error('❌ Errore durante il controllo:', error.message);
  }
}

checkRayCooper();




