import { NextRequest, NextResponse } from 'next/server';
import { getTranslationService } from '@/lib/translation';

// 🧪 Translation Auto-Detection Test Endpoint
// Tests the Unicode-based language detection with various languages and edge cases

export async function GET(request: NextRequest) {
  try {
    const translationService = getTranslationService();

    // 🧪 Test Cases for Language Detection
    const testCases = [
      // Basic Latin Scripts
      { text: "Hello, how are you?", expected: "en", description: "English text" },
      { text: "Bonjour, comment allez-vous?", expected: "en", description: "French text (defaults to English for Latin)" },
      { text: "Hola, ¿cómo estás?", expected: "en", description: "Spanish text (defaults to English for Latin)" },
      { text: "Guten Tag, wie geht es Ihnen?", expected: "en", description: "German text (defaults to English for Latin)" },
      
      // Chinese Characters
      { text: "你好，你好吗？", expected: "zh", description: "Simplified Chinese" },
      { text: "您好，請問您好嗎？", expected: "zh", description: "Traditional Chinese" },
      { text: "Hello 你好 world", expected: "zh", description: "Mixed English-Chinese (should detect Chinese)" },
      
      // Japanese Characters
      { text: "こんにちは、元気ですか？", expected: "ja", description: "Japanese Hiragana" },
      { text: "コンニチハ、ゲンキデスカ？", expected: "ja", description: "Japanese Katakana" },
      { text: "こんにちはworld", expected: "ja", description: "Mixed Japanese-English" },
      
      // Korean Characters
      { text: "안녕하세요, 어떻게 지내세요?", expected: "ko", description: "Korean Hangul" },
      { text: "Hello 안녕하세요", expected: "ko", description: "Mixed Korean-English" },
      
      // Arabic Script
      { text: "مرحبا، كيف حالك؟", expected: "ar", description: "Arabic text" },
      { text: "Hello مرحبا", expected: "ar", description: "Mixed Arabic-English" },
      
      // Hebrew Script
      { text: "שלום, מה שלומך?", expected: "he", description: "Hebrew text" },
      { text: "Hello שלום", expected: "he", description: "Mixed Hebrew-English" },
      
      // Russian Cyrillic
      { text: "Привет, как дела?", expected: "ru", description: "Russian Cyrillic" },
      { text: "Hello Привет", expected: "ru", description: "Mixed Russian-English" },
      
      // Hindi Devanagari
      { text: "नमस्ते, आप कैसे हैं?", expected: "hi", description: "Hindi Devanagari" },
      { text: "Hello नमस्ते", expected: "hi", description: "Mixed Hindi-English" },
      
      // Edge Cases
      { text: "", expected: "en", description: "Empty string" },
      { text: "123456", expected: "en", description: "Numbers only" },
      { text: "!@#$%^&*()", expected: "en", description: "Special characters only" },
      { text: "   ", expected: "en", description: "Whitespace only" },
      { text: "Hello123!@#", expected: "en", description: "Mixed alphanumeric and symbols" },
      
      // Complex Mixed Scripts
      { text: "Hello 你好 こんにちは 안녕하세요", expected: "zh", description: "Multi-language mix (should detect first non-Latin)" },
      { text: "English text with some 中文 characters", expected: "zh", description: "Primarily English with Chinese" },
      { text: "مرحبا Hello 你好", expected: "ar", description: "Arabic, English, Chinese mix" }
    ];

    // 🧪 Run Tests
    const results = testCases.map(testCase => {
      const detected = translationService.detectLanguage(testCase.text);
      const passed = detected === testCase.expected;
      
      return {
        text: testCase.text,
        description: testCase.description,
        expected: testCase.expected,
        detected,
        passed,
        textLength: testCase.text.length,
        hasUnicode: /[^\x00-\x7F]/.test(testCase.text)
      };
    });

    // 📊 Calculate Statistics
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);

    // 📋 Group Results by Language
    const languageGroups = results.reduce((groups, result) => {
      const lang = result.expected;
      if (!groups[lang]) {
        groups[lang] = { total: 0, passed: 0, failed: 0, tests: [] };
      }
      groups[lang].total++;
      if (result.passed) {
        groups[lang].passed++;
      } else {
        groups[lang].failed++;
      }
      groups[lang].tests.push(result);
      return groups;
    }, {} as Record<string, any>);

    // 🔍 Identify Failed Tests
    const failedTestDetails = results.filter(r => !r.passed);

    // 📈 Performance Test
    const performanceTest = () => {
      const testText = "Hello 你好 こんにちは مرحبا";
      const iterations = 1000;
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        translationService.detectLanguage(testText);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;
      
      return {
        iterations,
        totalTime: `${totalTime}ms`,
        averageTime: `${avgTime.toFixed(3)}ms`,
        operationsPerSecond: Math.round(1000 / avgTime)
      };
    };

    const performance = performanceTest();

    // 🎯 Return Comprehensive Test Results
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        failedTests,
        passRate: `${passRate}%`,
        status: passRate === '100.0' ? '✅ All tests passed' : `⚠️ ${failedTests} tests failed`
      },
      performance,
      languageGroups,
      failedTests: failedTestDetails,
      allResults: results,
      recommendations: [
        failedTests === 0 
          ? "✅ Language detection is working perfectly!"
          : "⚠️ Consider improving detection for failed test cases",
        performance.operationsPerSecond > 1000 
          ? "✅ Performance is excellent" 
          : "⚠️ Consider optimizing detection performance",
        "💡 Consider adding more sophisticated language detection for Latin scripts",
        "💡 Test with real user messages to validate accuracy"
      ]
    });

  } catch (error) {
    console.error('❌ Translation detection test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Translation detection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 🧪 POST endpoint for custom text testing
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({
        error: 'Text parameter is required and must be a string'
      }, { status: 400 });
    }

    const translationService = getTranslationService();
    const detected = translationService.detectLanguage(text);
    
    // Analyze the text
    const analysis = {
      text,
      detectedLanguage: detected,
      textLength: text.length,
      hasUnicode: /[^\x00-\x7F]/.test(text),
      unicodeRanges: {
        chinese: /[\u4e00-\u9fff]/.test(text),
        japanese: /[\u3040-\u309f\u30a0-\u30ff]/.test(text),
        korean: /[\uac00-\ud7af]/.test(text),
        arabic: /[\u0600-\u06ff]/.test(text),
        hebrew: /[\u0590-\u05ff]/.test(text),
        russian: /[\u0400-\u04ff]/.test(text),
        hindi: /[\u0900-\u097f]/.test(text)
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('❌ Custom text detection error:', error);
    return NextResponse.json({
      success: false,
      error: 'Custom text detection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
