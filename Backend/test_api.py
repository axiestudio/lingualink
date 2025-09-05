#!/usr/bin/env python3
"""
🧪 LinguaLink AI Backend API Testing Script
Test all endpoints and functionality
"""

import asyncio
import aiohttp
import json
import time
import sys
from typing import Dict, Any

class APITester:
    """API testing utility"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None
        self.results = []
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def test_endpoint(self, name: str, method: str, endpoint: str, data: Dict[Any, Any] = None) -> Dict[str, Any]:
        """Test a single endpoint"""
        print(f"🧪 Testing {name}...")
        
        start_time = time.time()
        
        try:
            if method.upper() == "GET":
                async with self.session.get(f"{self.base_url}{endpoint}") as response:
                    result = await response.json()
                    status = response.status
            elif method.upper() == "POST":
                async with self.session.post(
                    f"{self.base_url}{endpoint}",
                    json=data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    result = await response.json()
                    status = response.status
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            duration = time.time() - start_time
            
            test_result = {
                "name": name,
                "endpoint": endpoint,
                "method": method,
                "status": status,
                "duration": duration,
                "success": 200 <= status < 300,
                "response": result
            }
            
            if test_result["success"]:
                print(f"✅ {name} - {status} ({duration:.2f}s)")
            else:
                print(f"❌ {name} - {status} ({duration:.2f}s)")
                print(f"   Error: {result}")
            
            self.results.append(test_result)
            return test_result
            
        except Exception as e:
            duration = time.time() - start_time
            print(f"❌ {name} - Exception ({duration:.2f}s): {e}")
            
            test_result = {
                "name": name,
                "endpoint": endpoint,
                "method": method,
                "status": 0,
                "duration": duration,
                "success": False,
                "error": str(e)
            }
            
            self.results.append(test_result)
            return test_result
    
    async def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting LinguaLink AI Backend API Tests\n")
        
        # Test 1: Root endpoint
        await self.test_endpoint("Root Endpoint", "GET", "/")
        
        # Test 2: Health check
        await self.test_endpoint("Health Check", "GET", "/health")
        
        # Test 3: Supported languages
        await self.test_endpoint("Supported Languages", "GET", "/api/languages")
        
        # Test 4: Performance metrics
        await self.test_endpoint("Performance Metrics", "GET", "/api/metrics")
        
        # Test 5: Basic translation
        await self.test_endpoint(
            "Basic Translation (EN→ES)",
            "POST",
            "/api/translate",
            {
                "text": "Hello, world!",
                "targetLanguage": "es",
                "sourceLanguage": "en"
            }
        )
        
        # Test 6: Translation without source language
        await self.test_endpoint(
            "Auto-detect Translation",
            "POST",
            "/api/translate",
            {
                "text": "Bonjour le monde!",
                "targetLanguage": "en"
            }
        )
        
        # Test 7: Long text translation
        long_text = "This is a longer text to test the translation capabilities of the system. " * 5
        await self.test_endpoint(
            "Long Text Translation",
            "POST",
            "/api/translate",
            {
                "text": long_text,
                "targetLanguage": "fr",
                "sourceLanguage": "en"
            }
        )
        
        # Test 8: Multiple language translation
        test_languages = [
            ("Hello", "es", "Spanish"),
            ("Hello", "fr", "French"),
            ("Hello", "de", "German"),
            ("Hello", "it", "Italian"),
            ("Hello", "pt", "Portuguese")
        ]
        
        for text, target_lang, lang_name in test_languages:
            await self.test_endpoint(
                f"Translation to {lang_name}",
                "POST",
                "/api/translate",
                {
                    "text": text,
                    "targetLanguage": target_lang,
                    "sourceLanguage": "en"
                }
            )
        
        # Test 9: Error handling - empty text
        await self.test_endpoint(
            "Error Handling (Empty Text)",
            "POST",
            "/api/translate",
            {
                "text": "",
                "targetLanguage": "es"
            }
        )
        
        # Test 10: Error handling - invalid language
        await self.test_endpoint(
            "Error Handling (Invalid Language)",
            "POST",
            "/api/translate",
            {
                "text": "Hello",
                "targetLanguage": "invalid_lang"
            }
        )
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        total_tests = len(self.results)
        successful_tests = sum(1 for r in self.results if r["success"])
        failed_tests = total_tests - successful_tests
        
        total_duration = sum(r["duration"] for r in self.results)
        avg_duration = total_duration / total_tests if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Successful: {successful_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(successful_tests/total_tests*100):.1f}%")
        print(f"Total Duration: {total_duration:.2f}s")
        print(f"Average Duration: {avg_duration:.2f}s")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"  - {result['name']}: {result.get('error', 'HTTP ' + str(result['status']))}")
        
        print("\n🔍 DETAILED RESULTS:")
        for result in self.results:
            status_icon = "✅" if result["success"] else "❌"
            print(f"  {status_icon} {result['name']}: {result['duration']:.2f}s")
        
        return successful_tests == total_tests

async def main():
    """Main testing function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="LinguaLink AI Backend API Tester")
    parser.add_argument("--url", default="http://localhost:8000", help="Base URL for API")
    parser.add_argument("--wait", type=int, default=0, help="Wait seconds before starting tests")
    
    args = parser.parse_args()
    
    if args.wait > 0:
        print(f"⏳ Waiting {args.wait} seconds for server to start...")
        await asyncio.sleep(args.wait)
    
    async with APITester(args.url) as tester:
        await tester.run_all_tests()
        success = tester.print_summary()
        
        if success:
            print("\n🎉 All tests passed!")
            sys.exit(0)
        else:
            print("\n💥 Some tests failed!")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
