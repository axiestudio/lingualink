#!/usr/bin/env python3
"""
🚀 LinguaLink Local LLM Integration Setup Script
AS A SENIOR DEVELOPER - Complete setup for local LLM backend integration

This script automates the complete setup process for integrating local LLMs
with the LinguaLink frontend application.
"""

import os
import sys
import subprocess
import platform
import shutil
from pathlib import Path

def print_banner():
    """Print setup banner"""
    print("=" * 60)
    print("🚀 LINGUALINK LOCAL LLM INTEGRATION SETUP")
    print("AS A SENIOR DEVELOPER - Complete Local Translation Setup")
    print("=" * 60)
    print()

def check_requirements():
    """Check system requirements"""
    print("🔍 Checking system requirements...")
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    
    # Check Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js detected: {result.stdout.strip()}")
        else:
            print("❌ Node.js not found")
            return False
    except FileNotFoundError:
        print("❌ Node.js not found")
        return False
    
    # Check npm
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ npm detected: {result.stdout.strip()}")
        else:
            print("❌ npm not found")
            return False
    except FileNotFoundError:
        print("❌ npm not found")
        return False
    
    return True

def setup_backend():
    """Setup Python backend"""
    print("\n🐍 Setting up Python backend...")
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found")
        return False
    
    os.chdir(backend_dir)
    
    # Run backend setup
    try:
        subprocess.run([sys.executable, "setup.py"], check=True)
        print("✅ Backend setup completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Backend setup failed: {e}")
        return False
    finally:
        os.chdir("..")

def setup_frontend():
    """Setup frontend dependencies"""
    print("\n⚛️ Setting up frontend...")
    
    # Install frontend dependencies
    try:
        subprocess.run(["npm", "install"], check=True)
        print("✅ Frontend dependencies installed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Frontend setup failed: {e}")
        return False

def setup_environment():
    """Setup environment configuration"""
    print("\n🔧 Setting up environment configuration...")
    
    env_example = Path(".env.example")
    env_local = Path(".env.local")
    
    if not env_local.exists() and env_example.exists():
        shutil.copy(env_example, env_local)
        print("✅ Environment file created (.env.local)")
        print("⚠️ Please edit .env.local with your actual configuration values")
    else:
        print("✅ Environment file already exists")
    
    return True

def create_startup_scripts():
    """Create startup scripts for easy development"""
    print("\n📝 Creating startup scripts...")
    
    if platform.system() == "Windows":
        # Windows batch script
        script_content = """@echo off
echo 🚀 Starting LinguaLink with Local LLM Backend...
echo.

echo 📍 Starting Python Backend...
start "LinguaLink Backend" cmd /k "cd backend && call venv\\Scripts\\activate && python main.py"

echo ⏳ Waiting for backend to start...
timeout /t 10 /nobreak > nul

echo 📍 Starting Frontend...
start "LinguaLink Frontend" cmd /k "npm run dev"

echo.
echo ✅ LinguaLink is starting up!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:8000
echo.
pause
"""
        script_name = "start_lingualink.bat"
    else:
        # Unix shell script
        script_content = """#!/bin/bash
echo "🚀 Starting LinguaLink with Local LLM Backend..."
echo

echo "📍 Starting Python Backend..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

echo "⏳ Waiting for backend to start..."
sleep 10

echo "📍 Starting Frontend..."
npm run dev &
FRONTEND_PID=$!

echo
echo "✅ LinguaLink is running!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
echo
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap 'echo "Stopping services..."; kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait
"""
        script_name = "start_lingualink.sh"
    
    with open(script_name, "w") as f:
        f.write(script_content)
    
    if platform.system() != "Windows":
        os.chmod(script_name, 0o755)
    
    print(f"✅ Startup script created: {script_name}")
    return True

def create_test_script():
    """Create test script to verify integration"""
    print("\n🧪 Creating test script...")
    
    test_content = """#!/usr/bin/env python3
\"\"\"
Test script for LinguaLink Local LLM integration
\"\"\"

import requests
import time
import json

def test_backend():
    \"\"\"Test backend health\"\"\"
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend health: {data}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return False

def test_translation():
    \"\"\"Test translation endpoint\"\"\"
    try:
        payload = {
            "text": "Hello, world!",
            "target_language": "es",
            "source_language": "en"
        }
        
        response = requests.post(
            "http://localhost:8000/translate",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Translation test: {data}")
            return True
        else:
            print(f"❌ Translation test failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Translation test failed: {e}")
        return False

def test_frontend():
    \"\"\"Test frontend health\"\"\"
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is accessible")
            return True
        else:
            print(f"❌ Frontend test failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend connection failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing LinguaLink Local LLM Integration...")
    print()
    
    print("1. Testing backend health...")
    backend_ok = test_backend()
    
    if backend_ok:
        print("\\n2. Testing translation...")
        translation_ok = test_translation()
    else:
        translation_ok = False
    
    print("\\n3. Testing frontend...")
    frontend_ok = test_frontend()
    
    print("\\n" + "="*50)
    print("TEST RESULTS:")
    print(f"Backend: {'✅ PASS' if backend_ok else '❌ FAIL'}")
    print(f"Translation: {'✅ PASS' if translation_ok else '❌ FAIL'}")
    print(f"Frontend: {'✅ PASS' if frontend_ok else '❌ FAIL'}")
    
    if all([backend_ok, translation_ok, frontend_ok]):
        print("\\n🎉 All tests passed! LinguaLink is ready to use.")
    else:
        print("\\n⚠️ Some tests failed. Check the logs above.")
"""
    
    with open("test_integration.py", "w") as f:
        f.write(test_content)
    
    print("✅ Test script created: test_integration.py")
    return True

def main():
    """Main setup function"""
    print_banner()
    
    # Check requirements
    if not check_requirements():
        print("\n❌ System requirements not met. Please install missing dependencies.")
        sys.exit(1)
    
    # Setup backend
    if not setup_backend():
        print("\n❌ Backend setup failed.")
        sys.exit(1)
    
    # Setup frontend
    if not setup_frontend():
        print("\n❌ Frontend setup failed.")
        sys.exit(1)
    
    # Setup environment
    setup_environment()
    
    # Create scripts
    create_startup_scripts()
    create_test_script()
    
    print("\n" + "=" * 60)
    print("🎉 SETUP COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Edit .env.local with your configuration")
    print("2. Start the application:")
    if platform.system() == "Windows":
        print("   start_lingualink.bat")
    else:
        print("   ./start_lingualink.sh")
    print("3. Test the integration:")
    print("   python test_integration.py")
    print("\n🌐 Frontend will be available at: http://localhost:3000")
    print("🔧 Backend will be available at: http://localhost:8000")
    print("\n🚀 Happy translating with local LLMs!")

if __name__ == "__main__":
    main()
