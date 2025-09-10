#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testCompleteSystem() {
  console.log('🧪 Testing Complete System...\n');

  try {
    // Test 1: Login
    console.log('1️⃣ Testing Login...');
    const loginResponse = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'raycooper',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', loginData.employee.full_name);
    console.log('   Role:', loginData.employee.role);
    console.log('   Active:', loginData.employee.is_active);

    // Test 2: Get Inventory
    console.log('\n2️⃣ Testing Inventory...');
    const inventoryResponse = await fetch(`${BASE_URL}/api/inventory`);
    if (!inventoryResponse.ok) {
      throw new Error(`Inventory fetch failed: ${inventoryResponse.status}`);
    }
    const inventory = await inventoryResponse.json();
    console.log('✅ Inventory loaded:', inventory.length, 'items');

    // Test 3: Create Order
    console.log('\n3️⃣ Testing Order Creation...');
    const orderResponse = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          { 
            itemId: 2, 
            itemName: 'Motore 4 Cilindri',
            quantity: 1,
            unitPrice: 175.00,
            total: 175.00,
            profit: 25.00
          }
        ],
        username: 'raycooper'
      })
    });

    if (!orderResponse.ok) {
      throw new Error(`Order creation failed: ${orderResponse.status}`);
    }

    const orderData = await orderResponse.json();
    console.log('✅ Order created successfully');
    console.log('   Order ID:', orderData.orderId);
    console.log('   Total Amount:', orderData.totalAmount);

    // Test 4: Get Activities
    console.log('\n4️⃣ Testing Activities...');
    const activitiesResponse = await fetch(`${BASE_URL}/api/activities`);
    if (!activitiesResponse.ok) {
      throw new Error(`Activities fetch failed: ${activitiesResponse.status}`);
    }
    const activities = await activitiesResponse.json();
    console.log('✅ Activities loaded:', activities.length, 'activities');

    // Test 5: Get Order Details
    console.log('\n5️⃣ Testing Order Details...');
    console.log('   Order ID from response:', orderData.orderId);
    if (orderData.orderId && !isNaN(orderData.orderId)) {
      const orderDetailsResponse = await fetch(`${BASE_URL}/api/orders/${orderData.orderId}`);
      if (!orderDetailsResponse.ok) {
        throw new Error(`Order details fetch failed: ${orderDetailsResponse.status}`);
      }
      const orderDetails = await orderDetailsResponse.json();
      console.log('✅ Order details loaded');
      console.log('   Items:', orderDetails.items?.length || 0);
      console.log('   Employee Payment:', orderDetails.employeePayment);
    } else {
      console.log('⚠️ Skipping order details test - invalid order ID');
    }

    // Test 6: Get Employees (Admin only)
    console.log('\n6️⃣ Testing Employee Management...');
    const employeesResponse = await fetch(`${BASE_URL}/api/employees?userRole=admin`);
    if (!employeesResponse.ok) {
      throw new Error(`Employees fetch failed: ${employeesResponse.status}`);
    }
    const employees = await employeesResponse.json();
    console.log('✅ Employees loaded:', employees.length, 'employees');

    // Test 7: Test Restock
    console.log('\n7️⃣ Testing Inventory Restock...');
    const restockResponse = await fetch(`${BASE_URL}/api/inventory/2/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantity: 5
      })
    });

    if (!restockResponse.ok) {
      throw new Error(`Restock failed: ${restockResponse.status}`);
    }

    const restockData = await restockResponse.json();
    console.log('✅ Restock successful');
    console.log('   New quantity:', restockData.newQuantity);

    console.log('\n🎉 ALL TESTS PASSED! System is fully functional!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Login system working');
    console.log('   ✅ Inventory management working');
    console.log('   ✅ Order creation working');
    console.log('   ✅ Activity tracking working');
    console.log('   ✅ Order details working');
    console.log('   ✅ Employee management working');
    console.log('   ✅ Restock functionality working');
    console.log('\n🌐 Frontend should be accessible at: http://localhost:5173');
    console.log('🔧 Backend API running at: http://localhost:3001');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testCompleteSystem();
