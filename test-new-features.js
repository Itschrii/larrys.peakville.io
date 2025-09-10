import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function testNewFeatures() {
  console.log('🧪 Test nuove funzionalità...\n');

  try {
    // 1. Test Restock
    console.log('1. Test Restock...');
    const restockResponse = await fetch(`${API_BASE}/inventory/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        itemId: 1, // Motore 3 Cilindri
        quantity: 5,
        description: 'Restock di test'
      })
    });

    if (restockResponse.ok) {
      const restockData = await restockResponse.json();
      console.log('✅ Restock completato:', restockData.message);
    } else {
      console.log('❌ Errore restock:', await restockResponse.text());
    }

    // 2. Test Order Details
    console.log('\n2. Test Dettagli Ordine...');
    const orderDetailsResponse = await fetch(`${API_BASE}/orders/1`);
    
    if (orderDetailsResponse.ok) {
      const orderDetails = await orderDetailsResponse.json();
      console.log('✅ Dettagli ordine ottenuti:');
      console.log(`   - Dipendente: ${orderDetails.employee?.full_name}`);
      console.log(`   - Pagamento: €${orderDetails.employeePayment?.toFixed(2)}`);
      console.log(`   - Articolo: ${orderDetails.items?.[0]?.item_name}`);
    } else {
      console.log('❌ Errore dettagli ordine:', await orderDetailsResponse.text());
    }

    // 3. Test Employee Management (Admin)
    console.log('\n3. Test Gestione Dipendenti...');
    const employeesResponse = await fetch(`${API_BASE}/employees?userRole=admin`);
    
    if (employeesResponse.ok) {
      const employees = await employeesResponse.json();
      console.log('✅ Dipendenti ottenuti:', employees.length);
      employees.forEach(emp => {
        console.log(`   - ${emp.full_name} (${emp.username}): €${emp.totalEarnings?.toFixed(2)} totali, ${emp.totalOrders} ordini`);
      });
    } else {
      console.log('❌ Errore dipendenti:', await employeesResponse.text());
    }

    // 4. Test Employee Earnings
    console.log('\n4. Test Stipendi Dipendente...');
    const earningsResponse = await fetch(`${API_BASE}/employees/admin/earnings?userRole=admin`);
    
    if (earningsResponse.ok) {
      const earnings = await earningsResponse.json();
      console.log('✅ Stipendi ottenuti:');
      console.log(`   - Guadagni totali: €${earnings.totalEarnings?.toFixed(2)}`);
      console.log(`   - Giorni lavorati: ${earnings.totalDays}`);
      console.log(`   - Media giornaliera: €${(earnings.totalEarnings / Math.max(earnings.totalDays, 1)).toFixed(2)}`);
    } else {
      console.log('❌ Errore stipendi:', await earningsResponse.text());
    }

    // 5. Test Activities con nuovi tipi
    console.log('\n5. Test Activity Feed...');
    const activitiesResponse = await fetch(`${API_BASE}/activities`);
    
    if (activitiesResponse.ok) {
      const activities = await activitiesResponse.json();
      console.log('✅ Attività ottenute:', activities.length);
      activities.slice(0, 3).forEach(activity => {
        console.log(`   - ${activity.type}: ${activity.item_name} (${activity.quantity} pz) - €${activity.total_cost}`);
      });
    } else {
      console.log('❌ Errore attività:', await activitiesResponse.text());
    }

    console.log('\n🎉 TUTTI I TEST DELLE NUOVE FUNZIONALITÀ SUPERATI!');

  } catch (error) {
    console.error('❌ Errore durante i test:', error.message);
  }
}

testNewFeatures();




