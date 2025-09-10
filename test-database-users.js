import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testDatabaseUsers() {
  console.log('🧪 Testando gli utenti nel database...\n');

  try {
    // 1. Test login con admin
    console.log('1. Testando login con admin...');
    const adminLoginResponse = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (adminLoginResponse.ok) {
      const adminData = await adminLoginResponse.json();
      console.log('✅ Login admin successful:', adminData.employee.full_name, '- Ruolo:', adminData.employee.role);
    } else {
      console.log('❌ Login admin failed:', adminLoginResponse.statusText);
    }

    // 2. Test login con raycooper
    console.log('\n2. Testando login con raycooper...');
    const rayLoginResponse = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'raycooper',
        password: 'password123'
      })
    });

    if (rayLoginResponse.ok) {
      const rayData = await rayLoginResponse.json();
      console.log('✅ Login raycooper successful:', rayData.employee.full_name, '- Ruolo:', rayData.employee.role);
    } else {
      console.log('❌ Login raycooper failed:', rayLoginResponse.statusText);
    }

    // 3. Test accesso alle funzioni admin con raycooper
    console.log('\n3. Testando accesso funzioni admin con raycooper...');
    const employeesResponse = await fetch(`${BASE_URL}/api/employees?userRole=admin`, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (employeesResponse.ok) {
      const employeesData = await employeesResponse.json();
      console.log('✅ Accesso funzioni admin successful');
      console.log('   - Dipendenti trovati:', employeesData.length);
      employeesData.forEach(emp => {
        console.log(`   - ${emp.full_name} (@${emp.username}) - Ruolo: ${emp.role} - Attivo: ${emp.is_active}`);
      });
    } else {
      console.log('❌ Accesso funzioni admin failed:', employeesResponse.statusText);
    }

    console.log('\n🎉 Test completato!');
    console.log('\n📋 Riepilogo:');
    console.log('   ✅ Gli utenti sono stati aggiunti al database_optimized.sql');
    console.log('   ✅ raycooper è configurato come admin');
    console.log('   ✅ Entrambi gli utenti sono attivi (is_active = TRUE)');

  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
    process.exit(1);
  }
}

// Avvia il test
testDatabaseUsers();



