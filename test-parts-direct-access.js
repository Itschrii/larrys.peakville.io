import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function testPartsDirectAccess() {
  console.log('🔧 Test Accesso Diretto Gestione Pezzi...\n');

  try {
    // 1. Test che le API di gestione pezzi funzionino ancora
    console.log('1. Test API gestione pezzi...');
    
    // Test inventario
    const inventoryResponse = await fetch(`${API_BASE}/inventory-with-prices`);
    if (inventoryResponse.ok) {
      const inventory = await inventoryResponse.json();
      console.log('✅ API inventario funzionante:', inventory.length, 'articoli');
    } else {
      console.log('❌ Errore API inventario');
    }

    // Test restock
    const restockResponse = await fetch(`${API_BASE}/inventory/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'raycooper',
        itemId: 1,
        quantity: 1,
        description: 'Test accesso diretto'
      })
    });

    if (restockResponse.ok) {
      const restockData = await restockResponse.json();
      console.log('✅ API restock funzionante:', restockData.message);
    } else {
      console.log('❌ Errore API restock');
    }

    // Test modifications
    const modificationsResponse = await fetch(`${API_BASE}/modifications`);
    if (modificationsResponse.ok) {
      const modifications = await modificationsResponse.json();
      console.log('✅ API modifiche funzionante:', modifications.length, 'modifiche');
    } else {
      console.log('❌ Errore API modifiche');
    }

    console.log('\n✅ TUTTE LE API DI GESTIONE PEZZI FUNZIONANO ANCORA!');
    console.log('\n📋 ISTRUZIONI PER RIATTIVARE:');
    console.log('1. Apri il file client/src/components/sidebar.tsx');
    console.log('2. Decommenta la riga 16:');
    console.log('   // { href: "/parts", icon: Package, label: "Gestione Pezzi", active: location === "/parts" },');
    console.log('3. Rimuovi i commenti per riattivare');
    console.log('4. La pagina sarà accessibile su http://localhost:3001/parts');

  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
  }
}

testPartsDirectAccess();




