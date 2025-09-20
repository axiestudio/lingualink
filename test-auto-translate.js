// Test the auto-translate logic
import { ENV } from "./backend/src/lib/env.js";

console.log("🧪 Testing Auto-Translate Logic");
console.log("================================");

// Test 1: Check environment variables
console.log("\n1. Environment Variables:");
console.log("OPENAI_API_KEY:", ENV.OPENAI_API_KEY ? "✅ Set" : "❌ Missing");
console.log("FEATHERLESS_API_KEY:", ENV.FEATHERLESS_API_KEY ? "✅ Set" : "❌ Missing");

// Test 2: Test translation service
console.log("\n2. Testing Translation Service:");

async function testTranslation() {
  try {
    const { translateText } = await import("./backend/src/services/translation.service.js");
    
    const testText = "Hello, how are you?";
    const targetLanguage = "es"; // Spanish
    
    console.log(`Translating: "${testText}" to ${targetLanguage}`);
    
    const result = await translateText(testText, targetLanguage);
    
    if (result.success) {
      console.log("✅ Translation successful!");
      console.log("Original:", result.originalText || testText);
      console.log("Translated:", result.translatedText);
      console.log("Provider:", result.provider);
    } else {
      console.log("❌ Translation failed:", result.error);
    }
  } catch (error) {
    console.error("❌ Translation test error:", error.message);
  }
}

// Test 3: Test auto-translate logic simulation
console.log("\n3. Auto-Translate Logic Simulation:");

function simulateAutoTranslate() {
  console.log("\nScenario: User1 (English) → User2 (Spanish preference)");
  console.log("Auto-translate: ENABLED");
  console.log("Message: 'Hello, how are you today?'");
  console.log("Expected: Message gets translated to Spanish before sending");
  console.log("Result: User2 receives Spanish message");
  
  console.log("\nScenario: User1 (English) → User2 (Spanish preference)");
  console.log("Auto-translate: DISABLED");
  console.log("Message: 'Hello, how are you today?'");
  console.log("Expected: Message sent as-is in English");
  console.log("Result: User2 receives English message + can manually translate");
}

// Run tests
testTranslation();
simulateAutoTranslate();

console.log("\n🎯 Implementation Summary:");
console.log("1. ⚡ Lightning button in chat = Auto-translate toggle");
console.log("2. 🔄 Auto-translate ON = Messages translated to recipient's language");
console.log("3. 🔄 Auto-translate OFF = Messages sent as-is, recipient can manually translate");
console.log("4. 🌍 Manual translate button = Translate received messages to your language");
