#!/usr/bin/env python3
"""
🚀 LinguaLink AI Backend - Local Development Runner
Quick start script for local development
"""

import os
import sys
import subprocess
import time

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")

def install_dependencies():
    """Install required dependencies"""
    print("📦 Installing dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("✅ Dependencies installed")
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        sys.exit(1)

def check_env_file():
    """Check if .env file exists"""
    if not os.path.exists(".env"):
        print("⚠️ .env file not found, copying from .env.example")
        if os.path.exists(".env.example"):
            import shutil
            shutil.copy(".env.example", ".env")
            print("✅ .env file created from example")
        else:
            print("❌ .env.example not found")
            sys.exit(1)
    else:
        print("✅ .env file found")

def main():
    """Main function"""
    print("🚀 LinguaLink AI Backend - Local Development Setup")
    print("=" * 50)
    
    # Check Python version
    check_python_version()
    
    # Check .env file
    check_env_file()
    
    # Install dependencies
    install_dependencies()
    
    print("\n🌟 Setup complete! Starting backend server...")
    print("📖 API Documentation will be available at: http://localhost:8000/docs")
    print("🔍 Health check: http://localhost:8000/health")
    print("\n" + "=" * 50)
    
    # Start the server
    try:
        subprocess.run([sys.executable, "start.py"], check=True)
    except KeyboardInterrupt:
        print("\n🔄 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Server failed to start: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
