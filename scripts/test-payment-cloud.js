#!/usr/bin/env node

/**
 * Payment Cloud Integration Test Script
 * 
 * This script tests the Payment Cloud API integration without making actual payments.
 * Run this after setting up your Payment Cloud credentials.
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function testPaymentCloudIntegration() {
  console.log('🧪 Testing Payment Cloud Integration...\n');

  // Test 1: Check if Payment Cloud credentials are configured
  console.log('1️⃣ Checking Payment Cloud configuration...');
  if (!process.env.PAYMENT_CLOUD_SECRET_KEY) {
    console.log('❌ PAYMENT_CLOUD_SECRET_KEY not found in environment variables');
    console.log('   Please add your Payment Cloud secret key to .env.local');
    return;
  }
  console.log('✅ Payment Cloud secret key configured');

  // Test 2: Test server health
  console.log('\n2️⃣ Testing server health...');
  try {
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Server is running:', healthData.status);
  } catch (error) {
    console.log('❌ Server is not running. Please start with: npm run dev');
    return;
  }

  // Test 3: Test offers endpoint
  console.log('\n3️⃣ Testing offers endpoint...');
  try {
    const offersResponse = await fetch(`${API_BASE}/api/offers`);
    const offers = await offersResponse.json();
    console.log('✅ Offers endpoint working, found', offers.length, 'offers');
  } catch (error) {
    console.log('❌ Offers endpoint failed:', error.message);
  }

  // Test 4: Test Payment Cloud API endpoint (without actual payment)
  console.log('\n4️⃣ Testing Payment Cloud API endpoint...');
  try {
    const testPayload = {
      method: 'card',
      customer_info: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-123-4567'
      },
      payment_data: {
        token: 'test_token_123' // This will fail but test the endpoint
      },
      amount: 100000, // $1000
      offer_id: 'monthly-creator-pass'
    };

    const paymentResponse = await fetch(`${API_BASE}/api/payment-cloud/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    const paymentResult = await paymentResponse.json();
    
    if (paymentResult.success) {
      console.log('✅ Payment Cloud API endpoint working');
    } else {
      console.log('⚠️  Payment Cloud API endpoint responded with error (expected for test):', paymentResult.error);
    }
  } catch (error) {
    console.log('❌ Payment Cloud API endpoint failed:', error.message);
  }

  // Test 5: Check frontend integration
  console.log('\n5️⃣ Checking frontend integration...');
  try {
    const frontendResponse = await fetch(`${API_BASE}/`);
    if (frontendResponse.ok) {
      console.log('✅ Frontend is accessible');
    } else {
      console.log('❌ Frontend not accessible');
    }
  } catch (error) {
    console.log('❌ Frontend check failed:', error.message);
  }

  console.log('\n🎉 Integration test completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Open your browser and go to http://localhost:3000');
  console.log('2. Click "Reserve Event Seat" to test the checkout flow');
  console.log('3. Try different payment methods in the secure checkout');
  console.log('4. Check the browser console for any JavaScript errors');
  console.log('5. Check the server logs for Payment Cloud API responses');
}

// Run the test
testPaymentCloudIntegration().catch(console.error);
