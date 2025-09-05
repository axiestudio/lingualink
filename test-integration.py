#!/usr/bin/env python3
"""
🧪 LinguaLink AI - Integration Testing Script
Test the complete frontend-backend integration
"""

import asyncio
import aiohttp
import subprocess
import time
import sys
import os
from pathlib import Path

class IntegrationTester:
    """Complete integration testing suite"""
    
    def __init__(self):
        self.backend_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:3000"
        self.backend_process = None
        self.frontend_process = None
    
    async def test_backend_health(self):
        """Test if backend is healthy"""
        print("🔍 Testing backend health...")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.backend_url}/health") as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get("status") == "healthy" and data.get("model_loaded"):
                            print(f"✅ Backend healthy: {data.get('model_name')} on {data.get('device')}")
                            return True
                        else:
                            print(f"❌ Backend unhealthy: {data}")
                            return False
                    else:
                        print(f"❌ Backend health check failed: {response.status}")
                        return False
        except Exception as e:
            print(f"❌ Backend not accessible: {e}")
            return False
    
    async def test_backend_translation(self):
        """Test backend translation endpoint"""
        print("🔄 Testing backend translation...")
        
        test_cases = [
            {"text": "Hello, world!", "targetLanguage": "es", "expected_contains": "Hola"},
            {"text": "Good morning", "targetLanguage": "fr", "expected_contains": "Bonjour"},
            {"text": "Thank you", "targetLanguage": "de", "expected_contains": "Danke"},
        ]
        
        success_count = 0
        
        try:
            async with aiohttp.ClientSession() as session:
                for i, test_case in enumerate(test_cases, 1):
                    print(f"  Test {i}: {test_case['text']} → {test_case['targetLanguage']}")
                    
                    async with session.post(
                        f"{self.backend_url}/api/translate",
                        json=test_case,
                        headers={"Content-Type": "application/json"}
                    ) as response:
                        if response.status == 200:
                            data = await response.json()
                            if data.get("success"):
                                translated = data["translation"]["translatedText"]
                                processing_time = data["translation"].get("processingTime", 0)
                                print(f"    ✅ '{translated}' ({processing_time:.2f}s)")
                                success_count += 1
                            else:
                                print(f"    ❌ Translation failed: {data}")
                        else:
                            print(f"    ❌ HTTP {response.status}")
        
        except Exception as e:
            print(f"❌ Translation test failed: {e}")
        
        print(f"📊 Backend translation tests: {success_count}/{len(test_cases)} passed")
        return success_count == len(test_cases)
    
    async def test_backend_endpoints(self):
        """Test all backend endpoints"""
        print("🔍 Testing backend endpoints...")
        
        endpoints = [
            ("/", "Root endpoint"),
            ("/health", "Health check"),
            ("/api/languages", "Supported languages"),
            ("/api/metrics", "Performance metrics"),
        ]
        
        success_count = 0
        
        try:
            async with aiohttp.ClientSession() as session:
                for endpoint, description in endpoints:
                    print(f"  Testing {description}: {endpoint}")
                    
                    async with session.get(f"{self.backend_url}{endpoint}") as response:
                        if response.status == 200:
                            print(f"    ✅ {response.status}")
                            success_count += 1
                        else:
                            print(f"    ❌ {response.status}")
        
        except Exception as e:
            print(f"❌ Endpoint test failed: {e}")
        
        print(f"📊 Backend endpoint tests: {success_count}/{len(endpoints)} passed")
        return success_count == len(endpoints)
    
    def check_frontend_running(self):
        """Check if frontend is running"""
        print("🔍 Checking frontend status...")
        
        try:
            import requests
            response = requests.get(self.frontend_url, timeout=5)
            if response.status_code == 200:
                print("✅ Frontend is running")
                return True
            else:
                print(f"❌ Frontend returned {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Frontend not accessible: {e}")
            return False
    
    def check_environment(self):
        """Check environment configuration"""
        print("🔍 Checking environment configuration...")
        
        # Check backend .env
        backend_env = Path("backend/.env")
        if backend_env.exists():
            print("✅ Backend .env file exists")
        else:
            print("❌ Backend .env file missing")
            return False
        
        # Check frontend .env
        frontend_env = Path("lingualink/.env")
        if frontend_env.exists():
            print("✅ Frontend .env file exists")
            
            # Check for backend URL configuration
            with open(frontend_env, 'r') as f:
                content = f.read()
                if "NEXT_PUBLIC_BACKEND_TRANSLATION_URL" in content:
                    print("✅ Backend URL configured in frontend")
                else:
                    print("⚠️ Backend URL not configured in frontend")
        else:
            print("❌ Frontend .env file missing")
            return False
        
        return True
    
    def print_setup_instructions(self):
        """Print setup instructions"""
        print("\n" + "="*60)
        print("🚀 LINGUALINK AI - INTEGRATION SETUP")
        print("="*60)
        print()
        print("To test the complete integration:")
        print()
        print("1. 🖥️  Start Backend:")
        print("   cd backend")
        print("   python run-local.py")
        print("   # Wait for 'Model loaded successfully'")
        print()
        print("2. 🌐 Start Frontend (in new terminal):")
        print("   cd lingualink")
        print("   npm run dev")
        print()
        print("3. 🧪 Run Integration Test:")
        print("   python test-integration.py")
        print()
        print("4. 🎯 Manual Test:")
        print("   - Visit: http://localhost:3000")
        print("   - Send a message in different languages")
        print("   - Check browser console for backend logs")
        print()
        print("="*60)
    
    async def run_full_test(self):
        """Run complete integration test"""
        print("🚀 LinguaLink AI - Integration Test Suite")
        print("="*50)
        
        # Check environment
        if not self.check_environment():
            print("❌ Environment check failed")
            return False
        
        # Test backend
        backend_healthy = await self.test_backend_health()
        if not backend_healthy:
            print("❌ Backend is not healthy")
            return False
        
        # Test backend endpoints
        endpoints_ok = await self.test_backend_endpoints()
        
        # Test backend translation
        translation_ok = await self.test_backend_translation()
        
        # Check frontend
        frontend_ok = self.check_frontend_running()
        
        # Summary
        print("\n" + "="*50)
        print("📊 INTEGRATION TEST SUMMARY")
        print("="*50)
        print(f"Backend Health: {'✅' if backend_healthy else '❌'}")
        print(f"Backend Endpoints: {'✅' if endpoints_ok else '❌'}")
        print(f"Backend Translation: {'✅' if translation_ok else '❌'}")
        print(f"Frontend Status: {'✅' if frontend_ok else '❌'}")
        
        all_passed = backend_healthy and endpoints_ok and translation_ok and frontend_ok
        
        if all_passed:
            print("\n🎉 ALL TESTS PASSED! Integration is working correctly!")
            print("🌟 Your LinguaLink AI is ready for local development!")
        else:
            print("\n💥 Some tests failed. Check the logs above for details.")
            print("📖 See INTEGRATION_GUIDE.md for troubleshooting.")
        
        return all_passed

async def main():
    """Main function"""
    tester = IntegrationTester()
    
    if len(sys.argv) > 1 and sys.argv[1] == "--setup":
        tester.print_setup_instructions()
        return
    
    # Run the integration test
    success = await tester.run_full_test()
    
    if not success:
        print("\n💡 Run 'python test-integration.py --setup' for setup instructions")
        sys.exit(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🔄 Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        sys.exit(1)
