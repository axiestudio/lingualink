#!/usr/bin/env node

/**
 * 🧪 Lingua Link Fix Verification Script
 * 
 * This script tests all the fixes we've implemented to ensure they're working correctly.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

console.log('🧪 Starting Lingua Link Fix Verification...');
console.log('🌐 Base URL:', BASE_URL);

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message) {
  const emoji = passed ? '✅' : '❌';
  console.log(`${emoji} ${name}: ${message}`);
  
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// Test 1: Environment Variables
async function testEnvironmentVariables() {
  console.log('\n🔍 Testing Environment Variables...');
  
  try {
    // Check .env file exists
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
      logTest('Environment File', false, '.env file not found');
      return;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check VAPID keys
    const hasVapidPrivate = envContent.includes('VAPID_PRIVATE_KEY=');
    const hasVapidPublic = envContent.includes('NEXT_PUBLIC_VAPID_PUBLIC_KEY=');
    const hasVapidSubject = envContent.includes('VAPID_SUBJECT=');
    
    logTest('VAPID Private Key', hasVapidPrivate, hasVapidPrivate ? 'Present' : 'Missing');
    logTest('VAPID Public Key', hasVapidPublic, hasVapidPublic ? 'Present' : 'Missing');
    logTest('VAPID Subject', hasVapidSubject, hasVapidSubject ? 'Present' : 'Missing');
    
    // Check database URL
    const hasDatabaseUrl = envContent.includes('DATABASE_URL=');
    logTest('Database URL', hasDatabaseUrl, hasDatabaseUrl ? 'Present' : 'Missing');
    
    // Check Clerk keys
    const hasClerkPublic = envContent.includes('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=');
    const hasClerkSecret = envContent.includes('CLERK_SECRET_KEY=');
    logTest('Clerk Public Key', hasClerkPublic, hasClerkPublic ? 'Present' : 'Missing');
    logTest('Clerk Secret Key', hasClerkSecret, hasClerkSecret ? 'Present' : 'Missing');
    
  } catch (error) {
    logTest('Environment Variables', false, `Error: ${error.message}`);
  }
}

// Test 2: Static Files
async function testStaticFiles() {
  console.log('\n🔍 Testing Static Files...');
  
  const filesToCheck = [
    { path: 'public/sw.js', name: 'Service Worker' },
    { path: 'public/manifest.json', name: 'PWA Manifest' },
    { path: 'public/icons/icon-192x192.png', name: 'App Icon 192x192' },
    { path: 'public/icons/badge-72x72.png', name: 'Badge Icon' },
    { path: 'scripts/startup-health-check.js', name: 'Health Check Script' },
    { path: 'scripts/test-fixes.js', name: 'Test Script' }
  ];
  
  for (const file of filesToCheck) {
    const fullPath = path.join(__dirname, '..', file.path);
    const exists = fs.existsSync(fullPath);
    logTest(file.name, exists, exists ? 'File exists' : 'File missing');
  }
}

// Test 3: API Endpoints
async function testApiEndpoints() {
  console.log('\n🔍 Testing API Endpoints...');
  
  const endpoints = [
    { path: '/api/health/system', name: 'System Health Check' },
    { path: '/api/health/database', name: 'Database Health Check' },
    { path: '/api/push/subscribe', name: 'Push Subscribe Endpoint', method: 'GET' },
    { path: '/api/init-db', name: 'Database Init Endpoint', method: 'POST' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method || 'GET'
      });
      
      const success = response.status < 500; // Allow 4xx errors (auth issues are expected)
      logTest(
        endpoint.name, 
        success, 
        `HTTP ${response.status} ${success ? '(OK)' : '(Server Error)'}`
      );
      
    } catch (error) {
      logTest(endpoint.name, false, `Request failed: ${error.message}`);
    }
  }
}

// Test 4: Database Health
async function testDatabaseHealth() {
  console.log('\n🔍 Testing Database Health...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/health/database`);
    
    if (response.status === 200 && response.data) {
      const health = response.data;
      
      logTest('Database Connection', health.connection?.status === 'connected', 
        `Status: ${health.connection?.status || 'unknown'}`);
      
      logTest('Database Tables', health.tables?.missing?.length === 0, 
        `Missing tables: ${health.tables?.missing?.length || 'unknown'}`);
      
      logTest('Database Status', health.status === 'healthy', 
        `Overall status: ${health.status}`);
        
    } else {
      logTest('Database Health', false, `HTTP ${response.status}`);
    }
    
  } catch (error) {
    logTest('Database Health', false, `Request failed: ${error.message}`);
  }
}

// Test 5: Push Notifications Setup
async function testPushNotifications() {
  console.log('\n🔍 Testing Push Notifications Setup...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/push/subscribe`);
    
    if (response.status === 200 && response.data) {
      const hasVapidKey = !!response.data.vapidPublicKey;
      logTest('VAPID Public Key API', hasVapidKey, 
        hasVapidKey ? 'VAPID key available' : 'VAPID key missing');
        
    } else if (response.status === 401) {
      logTest('Push Subscribe Endpoint', true, 'Endpoint accessible (auth required)');
    } else {
      logTest('Push Subscribe Endpoint', false, `HTTP ${response.status}`);
    }
    
  } catch (error) {
    logTest('Push Notifications', false, `Request failed: ${error.message}`);
  }
}

// Test 6: System Health
async function testSystemHealth() {
  console.log('\n🔍 Testing System Health...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/health/system`);
    
    if (response.status === 200 && response.data) {
      const health = response.data;
      
      logTest('System Health API', true, `Overall status: ${health.status}`);
      
      // Test individual services
      if (health.services) {
        Object.entries(health.services).forEach(([service, status]) => {
          logTest(`${service} Service`, 
            status.status === 'healthy' || status.status === 'info', 
            `Status: ${status.status}`);
        });
      }
      
    } else {
      logTest('System Health', false, `HTTP ${response.status}`);
    }
    
  } catch (error) {
    logTest('System Health', false, `Request failed: ${error.message}`);
  }
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Running all fix verification tests...\n');
  
  await testEnvironmentVariables();
  await testStaticFiles();
  await testApiEndpoints();
  await testDatabaseHealth();
  await testPushNotifications();
  await testSystemHealth();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Your fixes are working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the issues above.');
    
    // Show failed tests
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => console.log(`   - ${test.name}: ${test.message}`));
  }
  
  return testResults.failed === 0;
}

// Run if called directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, testResults };
