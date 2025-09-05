#!/usr/bin/env node

/**
 * 🚀 Lingua Link Startup Health Check & Auto-Fix Script
 * 
 * This script runs comprehensive health checks and attempts to fix common issues
 * automatically during application startup.
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

console.log('🚀 Starting Lingua Link Health Check & Auto-Fix...');
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
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Wait for server to be ready
async function waitForServer(maxAttempts = 30) {
  console.log('⏳ Waiting for server to be ready...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await makeRequest(`${BASE_URL}/api/health/system`);
      if (response.status === 200) {
        console.log('✅ Server is ready!');
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    
    console.log(`⏳ Attempt ${i + 1}/${maxAttempts} - Server not ready, waiting 2 seconds...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Server failed to start within expected time');
}

// Run system health check
async function runHealthCheck() {
  console.log('\n🔍 Running system health check...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/health/system`);
    
    if (response.status !== 200) {
      throw new Error(`Health check failed with status ${response.status}`);
    }
    
    const health = response.data;
    console.log('📊 System Status:', health.status);
    
    // Log service statuses
    Object.entries(health.services).forEach(([service, status]) => {
      const emoji = status.status === 'healthy' ? '✅' : 
                   status.status === 'warning' ? '⚠️' : '❌';
      console.log(`${emoji} ${service}: ${status.status}`);
    });
    
    // Log recommendations
    if (health.recommendations && health.recommendations.length > 0) {
      console.log('\n📋 Recommendations:');
      health.recommendations.forEach(rec => {
        const emoji = rec.type === 'error' ? '❌' : 
                     rec.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${emoji} ${rec.message}`);
        console.log(`   Action: ${rec.action}`);
      });
    }
    
    return health;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    throw error;
  }
}

// Run auto-fix
async function runAutoFix() {
  console.log('\n🔧 Running auto-fix...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/health/system`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`Auto-fix failed with status ${response.status}`);
    }
    
    const result = response.data;
    console.log('✅ Auto-fix completed');
    
    // Log fix results
    if (result.fixes) {
      result.fixes.forEach(fix => {
        const emoji = fix.status === 'success' ? '✅' : '❌';
        console.log(`${emoji} ${fix.service}: ${fix.message}`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Auto-fix failed:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Wait for server
    await waitForServer();
    
    // Run initial health check
    const initialHealth = await runHealthCheck();
    
    // Run auto-fix if there are issues
    if (initialHealth.status !== 'healthy') {
      console.log('\n🔧 Issues detected, running auto-fix...');
      await runAutoFix();
      
      // Run health check again
      console.log('\n🔍 Running post-fix health check...');
      const finalHealth = await runHealthCheck();
      
      if (finalHealth.status === 'healthy') {
        console.log('\n🎉 All issues resolved! System is healthy.');
      } else {
        console.log('\n⚠️ Some issues remain. Check the recommendations above.');
      }
    } else {
      console.log('\n🎉 System is healthy! No fixes needed.');
    }
    
    console.log('\n✅ Startup health check completed successfully!');
    console.log('🌐 Application is ready at:', BASE_URL);
    
  } catch (error) {
    console.error('\n❌ Startup health check failed:', error.message);
    console.error('🔍 Please check the application logs and fix any issues manually.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, runHealthCheck, runAutoFix, waitForServer };
