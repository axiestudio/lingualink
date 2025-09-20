/**
 * TRANSLATION API TEST SCRIPT
 * Tests Featherless AI (Primary) → OpenAI (Fallback) with 3 retry attempts
 */

import "dotenv/config";

const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

console.log('🔑 API Keys loaded:');
console.log('- Featherless:', FEATHERLESS_API_KEY ? '✅ Present' : '❌ Missing');
console.log('- OpenAI:', OPENAI_API_KEY ? '✅ Present' : '❌ Missing');

/**
 * FEATHERLESS AI TRANSLATION (PRIMARY)
 * Uses Meta-Llama-3.1-8B-Instruct model
 * API Docs: https://docs.featherless.ai/
 */
async function translateWithFeatherless(text, targetLanguage, sourceLanguage = 'auto', retryCount = 0) {
  const maxRetries = 3;
  
  try {
    console.log(`🪶 [Attempt ${retryCount + 1}/${maxRetries}] Featherless AI Translation...`);
    console.log(`📝 Text: "${text}"`);
    console.log(`🎯 Target: ${targetLanguage}, Source: ${sourceLanguage}`);

    const prompt = `Translate the following text from ${sourceLanguage === 'auto' ? 'automatically detected language' : sourceLanguage} to ${targetLanguage}. Only return the translated text, nothing else:\n\n${text}`;

    const response = await fetch('https://api.featherless.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FEATHERLESS_API_KEY}`
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.1
      })
    });

    console.log(`📡 Featherless Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Featherless API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 Featherless Response:', JSON.stringify(data, null, 2));

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const translatedText = data.choices[0].message.content.trim();
      console.log(`✅ Featherless Success: "${translatedText}"`);
      
      return {
        success: true,
        translatedText,
        provider: 'featherless',
        sourceLanguage,
        targetLanguage,
        attempt: retryCount + 1
      };
    } else {
      throw new Error('Invalid response format from Featherless');
    }

  } catch (error) {
    console.error(`❌ Featherless Attempt ${retryCount + 1} Failed:`, error.message);
    
    if (retryCount < maxRetries - 1) {
      console.log(`🔄 Retrying Featherless (${retryCount + 2}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return translateWithFeatherless(text, targetLanguage, sourceLanguage, retryCount + 1);
    }
    
    return {
      success: false,
      error: error.message,
      provider: 'featherless',
      attempts: maxRetries
    };
  }
}

/**
 * OPENAI TRANSLATION (FALLBACK)
 * Uses GPT-4o-mini model
 * API Docs: https://platform.openai.com/docs/api-reference/chat
 */
async function translateWithOpenAI(text, targetLanguage, sourceLanguage = 'auto', retryCount = 0) {
  const maxRetries = 3;
  
  try {
    console.log(`🤖 [Attempt ${retryCount + 1}/${maxRetries}] OpenAI Translation...`);
    console.log(`📝 Text: "${text}"`);
    console.log(`🎯 Target: ${targetLanguage}, Source: ${sourceLanguage}`);

    const prompt = `Translate the following text from ${sourceLanguage === 'auto' ? 'automatically detected language' : sourceLanguage} to ${targetLanguage}. Only return the translated text, nothing else:\n\n${text}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.1
      })
    });

    console.log(`📡 OpenAI Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 OpenAI Response:', JSON.stringify(data, null, 2));

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const translatedText = data.choices[0].message.content.trim();
      console.log(`✅ OpenAI Success: "${translatedText}"`);
      
      return {
        success: true,
        translatedText,
        provider: 'openai-fallback',
        sourceLanguage,
        targetLanguage,
        attempt: retryCount + 1
      };
    } else {
      throw new Error('Invalid response format from OpenAI');
    }

  } catch (error) {
    console.error(`❌ OpenAI Attempt ${retryCount + 1} Failed:`, error.message);
    
    if (retryCount < maxRetries - 1) {
      console.log(`🔄 Retrying OpenAI (${retryCount + 2}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return translateWithOpenAI(text, targetLanguage, sourceLanguage, retryCount + 1);
    }
    
    return {
      success: false,
      error: error.message,
      provider: 'openai',
      attempts: maxRetries
    };
  }
}

/**
 * MAIN TRANSLATION FUNCTION WITH FALLBACK LOGIC
 * Featherless (Primary) → OpenAI (Fallback) → Error Message
 */
async function translateText(text, targetLanguage, sourceLanguage = 'auto') {
  console.log('\n🌍 ===== TRANSLATION TEST STARTED =====');
  console.log(`📝 Input: "${text}"`);
  console.log(`🎯 Target Language: ${targetLanguage}`);
  console.log(`🔍 Source Language: ${sourceLanguage}`);
  console.log('🔄 Strategy: Featherless (Primary) → OpenAI (Fallback) → Error');
  
  // STEP 1: Try Featherless AI (PRIMARY)
  console.log('\n🪶 ===== TRYING FEATHERLESS AI (PRIMARY) =====');
  const featherlessResult = await translateWithFeatherless(text, targetLanguage, sourceLanguage);
  
  if (featherlessResult.success) {
    console.log('\n🎉 ===== TRANSLATION SUCCESSFUL WITH FEATHERLESS =====');
    return featherlessResult;
  }
  
  // STEP 2: Try OpenAI (FALLBACK)
  console.log('\n🤖 ===== FEATHERLESS FAILED, TRYING OPENAI (FALLBACK) =====');
  const openaiResult = await translateWithOpenAI(text, targetLanguage, sourceLanguage);
  
  if (openaiResult.success) {
    console.log('\n🎉 ===== TRANSLATION SUCCESSFUL WITH OPENAI FALLBACK =====');
    return openaiResult;
  }
  
  // STEP 3: Both failed - return error
  console.log('\n💥 ===== ALL PROVIDERS FAILED =====');
  return {
    success: false,
    error: 'Failed to translate, try again later',
    translatedText: null,
    provider: 'none',
    sourceLanguage,
    targetLanguage,
    featherlessError: featherlessResult.error,
    openaiError: openaiResult.error
  };
}

/**
 * TEST CASES
 */
async function runTests() {
  console.log('🧪 ===== STARTING TRANSLATION API TESTS =====\n');
  
  const testCases = [
    { text: 'Hello, how are you?', target: 'es', source: 'en' },
    { text: 'Hola, ¿cómo estás?', target: 'en', source: 'es' },
    { text: 'Bonjour le monde', target: 'en', source: 'fr' },
    { text: 'This is a test message', target: 'de', source: 'en' }
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n🧪 ===== TEST CASE ${i + 1}/${testCases.length} =====`);
    
    const result = await translateText(testCase.text, testCase.target, testCase.source);
    
    console.log('\n📊 ===== FINAL RESULT =====');
    console.log(JSON.stringify(result, null, 2));
    
    if (i < testCases.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n🏁 ===== ALL TESTS COMPLETED =====');
}

// Run the tests
runTests().catch(console.error);
