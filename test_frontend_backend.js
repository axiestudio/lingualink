// Test script to verify frontend can connect to local backend
const fetch = require('node-fetch');

async function testFrontendBackendConnection() {
    console.log('🧪 Testing Frontend → Backend Connection');
    console.log('=====================================');
    
    const backendUrl = 'http://localhost:8000';
    const frontendUrl = 'http://localhost:3000';
    
    try {
        // Test 1: Direct backend call (what should work)
        console.log('\n1. 🔗 Testing Direct Backend Call...');
        const directResponse = await fetch(`${backendUrl}/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: 'hello',
                target_language: 'it'
            })
        });
        
        if (directResponse.ok) {
            const directData = await directResponse.json();
            console.log('✅ Direct backend call successful:');
            console.log('   Translation:', directData.translation?.translatedText);
            console.log('   Translator:', directData.translation?.translator);
        } else {
            console.log('❌ Direct backend call failed:', directResponse.status);
        }
        
        // Test 2: Check if frontend can reach backend
        console.log('\n2. 🌐 Testing Frontend Environment...');
        console.log('   Backend URL should be: http://localhost:8000');
        console.log('   Frontend URL: http://localhost:3000');
        
        // Test 3: Check CORS
        console.log('\n3. 🔒 Testing CORS...');
        const corsResponse = await fetch(`${backendUrl}/health`, {
            method: 'GET',
            headers: {
                'Origin': frontendUrl,
                'Content-Type': 'application/json',
            }
        });
        
        if (corsResponse.ok) {
            console.log('✅ CORS working correctly');
            const healthData = await corsResponse.json();
            console.log('   Backend health:', healthData);
        } else {
            console.log('❌ CORS issue detected:', corsResponse.status);
        }
        
        // Test 4: Test the exact same call the frontend should make
        console.log('\n4. 🎯 Testing Frontend-Style Call...');
        const frontendStyleResponse = await fetch(`${backendUrl}/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': frontendUrl,
            },
            body: JSON.stringify({
                text: 'hello',
                target_language: 'it',
                source_language: undefined
            })
        });
        
        if (frontendStyleResponse.ok) {
            const frontendStyleData = await frontendStyleResponse.json();
            console.log('✅ Frontend-style call successful:');
            console.log('   Translation:', frontendStyleData.translation?.translatedText);
            console.log('   Translator:', frontendStyleData.translation?.translator);
            console.log('   Success:', frontendStyleData.success);
        } else {
            console.log('❌ Frontend-style call failed:', frontendStyleResponse.status);
            const errorText = await frontendStyleResponse.text();
            console.log('   Error:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testFrontendBackendConnection();
