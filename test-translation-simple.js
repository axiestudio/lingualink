/**
 * SIMPLE TRANSLATION TEST
 * Tests the backend translation API directly
 */

console.log('🧪 ===== TESTING BACKEND TRANSLATION API =====\n');

// Test data
const testCases = [
  { text: 'Hello, how are you?', target: 'es', source: 'en' },
  { text: 'Hola, ¿cómo estás?', target: 'en', source: 'es' },
  { text: 'Bonjour le monde', target: 'en', source: 'fr' }
];

console.log('📝 Test Cases:');
testCases.forEach((test, i) => {
  console.log(`${i + 1}. "${test.text}" (${test.source} → ${test.target})`);
});

console.log('\n🔧 To test manually, use these curl commands:\n');

testCases.forEach((test, i) => {
  console.log(`# Test ${i + 1}: ${test.text}`);
  console.log(`curl -X POST http://localhost:3000/api/translation/translate \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "Cookie: jwt=YOUR_JWT_TOKEN" \\`);
  console.log(`  -d '{`);
  console.log(`    "text": "${test.text}",`);
  console.log(`    "targetLanguage": "${test.target}",`);
  console.log(`    "sourceLanguage": "${test.source}"`);
  console.log(`  }'\n`);
});

console.log('🔑 API Keys Check:');
console.log('- Make sure your .env file has:');
console.log('  FEATHERLESS_API_KEY=your_featherless_key');
console.log('  OPENAI_API_KEY=your_openai_key');

console.log('\n🌍 Translation Flow:');
console.log('1. 🪶 Try Featherless AI (Primary) - 3 attempts');
console.log('2. 🤖 Try OpenAI (Fallback) - 3 attempts');
console.log('3. ❌ Show error: "Failed to translate, try again later"');

console.log('\n✅ Expected Behavior:');
console.log('- Featherless should be tried first');
console.log('- If Featherless fails, OpenAI should be used');
console.log('- Each provider gets 3 retry attempts');
console.log('- Final error message should be user-friendly');

console.log('\n🔍 Check the backend logs to see the actual API calls!');
