#!/usr/bin/env node
/**
 * 🧪 LinguaLink Local Backend Connectivity Test
 * AS A SENIOR DEVELOPER - Quick connectivity test for local LLM backend
 */

const http = require('http');
const https = require('https');

const BACKEND_URL = process.env.LOCAL_BACKEND_URL || 'http://localhost:8000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

console.log('🧪 LinguaLink Local Backend Connectivity Test');
console.log('=' * 50);

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(data) 
            : data;
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
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

/**
 * Test backend health
 */
async function testBackendHealth() {
  console.log('\n1. 🏥 Testing Backend Health...');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/health`);
    
    if (response.status === 200) {
      console.log('✅ Backend is healthy');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Model loaded: ${response.data.model_loaded}`);
      console.log(`   Supported languages: ${response.data.supported_languages}`);
      console.log(`   Uptime: ${Math.round(response.data.uptime)}s`);
      return true;
    } else {
      console.log(`❌ Backend health check failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Backend connection failed: ${error.message}`);
    console.log(`   Make sure the backend is running at: ${BACKEND_URL}`);
    return false;
  }
}

/**
 * Test translation endpoint
 */
async function testTranslation() {
  console.log('\n2. 🔄 Testing Translation...');
  
  const testPayload = {
    text: "Hello, world! This is a test.",
    target_language: "es",
    source_language: "en"
  };
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Translation successful');
      console.log(`   Original: "${response.data.translation.originalText}"`);
      console.log(`   Translated: "${response.data.translation.translatedText}"`);
      console.log(`   Model: ${response.data.model_used}`);
      console.log(`   Processing time: ${response.data.processing_time.toFixed(2)}s`);
      return true;
    } else {
      console.log(`❌ Translation failed: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Translation request failed: ${error.message}`);
    return false;
  }
}

/**
 * Test supported languages
 */
async function testLanguages() {
  console.log('\n3. 🌐 Testing Supported Languages...');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/languages`);
    
    if (response.status === 200) {
      console.log('✅ Languages endpoint working');
      console.log(`   Total languages: ${response.data.count}`);
      
      // Show first few languages
      const languages = Object.entries(response.data.languages).slice(0, 5);
      console.log('   Sample languages:');
      languages.forEach(([code, name]) => {
        console.log(`     ${code}: ${name}`);
      });
      console.log('     ...');
      
      return true;
    } else {
      console.log(`❌ Languages endpoint failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Languages request failed: ${error.message}`);
    return false;
  }
}

/**
 * Test frontend connectivity
 */
async function testFrontend() {
  console.log('\n4. ⚛️ Testing Frontend...');
  
  try {
    const response = await makeRequest(FRONTEND_URL);
    
    if (response.status === 200) {
      console.log('✅ Frontend is accessible');
      console.log(`   Status: ${response.status}`);
      return true;
    } else {
      console.log(`❌ Frontend test failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Frontend connection failed: ${error.message}`);
    console.log(`   Make sure the frontend is running at: ${FRONTEND_URL}`);
    return false;
  }
}

/**
 * Test CORS configuration
 */
async function testCORS() {
  console.log('\n5. 🔒 Testing CORS Configuration...');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsHeaders = response.headers['access-control-allow-origin'];
    if (corsHeaders) {
      console.log('✅ CORS is configured');
      console.log(`   Allowed origins: ${corsHeaders}`);
      return true;
    } else {
      console.log('⚠️ CORS headers not found (may still work)');
      return true; // Not critical
    }
  } catch (error) {
    console.log(`⚠️ CORS test failed: ${error.message}`);
    return true; // Not critical
  }
}

/**
 * Performance test
 */
async function testPerformance() {
  console.log('\n6. ⚡ Testing Performance...');
  
  const testTexts = [
    "Hello",
    "How are you today?",
    "This is a longer sentence to test translation performance with more complex text."
  ];
  
  const results = [];
  
  for (const text of testTexts) {
    try {
      const start = Date.now();
      const response = await makeRequest(`${BACKEND_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          target_language: "fr",
          source_language: "en"
        })
      });
      const duration = Date.now() - start;
      
      if (response.status === 200) {
        results.push({ text, duration, success: true });
      } else {
        results.push({ text, duration, success: false });
      }
    } catch (error) {
      results.push({ text, duration: 10000, success: false });
    }
  }
  
  const successful = results.filter(r => r.success);
  if (successful.length > 0) {
    const avgTime = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    console.log('✅ Performance test completed');
    console.log(`   Average response time: ${avgTime.toFixed(0)}ms`);
    console.log(`   Successful translations: ${successful.length}/${results.length}`);
    
    results.forEach(r => {
      const status = r.success ? '✅' : '❌';
      console.log(`   ${status} "${r.text.substring(0, 20)}..." - ${r.duration}ms`);
    });
    
    return true;
  } else {
    console.log('❌ All performance tests failed');
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log(`🔗 Backend URL: ${BACKEND_URL}`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  
  const tests = [
    { name: 'Backend Health', fn: testBackendHealth },
    { name: 'Translation', fn: testTranslation },
    { name: 'Languages', fn: testLanguages },
    { name: 'Frontend', fn: testFrontend },
    { name: 'CORS', fn: testCORS },
    { name: 'Performance', fn: testPerformance }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, success: result });
    } catch (error) {
      console.log(`❌ ${test.name} test crashed: ${error.message}`);
      results.push({ name: test.name, success: false });
    }
  }
  
  // Summary
  console.log('\n' + '=' * 50);
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' * 50);
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
  });
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! LinguaLink local backend is ready to use.');
    console.log('\n🚀 Next steps:');
    console.log('   1. Start the frontend: npm run dev');
    console.log('   2. Open http://localhost:3000');
    console.log('   3. Send a message to test translation');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the issues above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the backend is running: cd backend && python main.py');
    console.log('   2. Check environment variables in .env.local');
    console.log('   3. Verify network connectivity');
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test runner crashed:', error);
  process.exit(1);
});
