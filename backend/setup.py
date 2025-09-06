#!/usr/bin/env python3
"""
🚀 LinguaLink Local Backend Setup Script
AS A SENIOR DEVELOPER - Automated setup for local LLM translation backend
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ is required")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} detected")
    return True

def setup_virtual_environment():
    """Create and activate virtual environment"""
    venv_path = Path("venv")
    
    if not venv_path.exists():
        print("🔄 Creating virtual environment...")
        if not run_command(f"{sys.executable} -m venv venv", "Virtual environment creation"):
            return False
    else:
        print("✅ Virtual environment already exists")
    
    # Determine activation script based on OS
    if platform.system() == "Windows":
        activate_script = "venv\\Scripts\\activate"
        pip_path = "venv\\Scripts\\pip"
    else:
        activate_script = "source venv/bin/activate"
        pip_path = "venv/bin/pip"
    
    print(f"📝 To activate virtual environment, run: {activate_script}")
    return pip_path

def install_dependencies(pip_path):
    """Install Python dependencies"""
    print("🔄 Installing dependencies...")
    
    # Upgrade pip first
    if not run_command(f"{pip_path} install --upgrade pip", "Pip upgrade"):
        return False
    
    # Install requirements
    if not run_command(f"{pip_path} install -r requirements.txt", "Dependencies installation"):
        return False
    
    return True

def download_models():
    """Download required translation models"""
    print("🔄 Downloading translation models...")
    
    # Create a simple script to download models
    download_script = """
import os
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

def download_model():
    try:
        print("Downloading NLLB translation model...")
        model_name = "facebook/nllb-200-distilled-600M"
        
        # Download tokenizer and model
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
        
        print("✅ Model downloaded successfully")
        return True
    except Exception as e:
        print(f"❌ Model download failed: {e}")
        return False

if __name__ == "__main__":
    download_model()
"""
    
    # Write and execute download script
    with open("download_models.py", "w") as f:
        f.write(download_script)
    
    # Determine python executable in venv
    if platform.system() == "Windows":
        python_path = "venv\\Scripts\\python"
    else:
        python_path = "venv/bin/python"
    
    success = run_command(f"{python_path} download_models.py", "Model download")
    
    # Clean up
    if os.path.exists("download_models.py"):
        os.remove("download_models.py")
    
    return success

def create_env_file():
    """Create environment configuration file"""
    env_content = """# LinguaLink Local Backend Configuration
# AS A SENIOR DEVELOPER - Environment variables for local LLM backend

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true

# Model Configuration
MODEL_TYPE=transformers  # Options: transformers, ollama, mock
MODEL_NAME=facebook/nllb-200-distilled-600M

# Security (optional)
SECRET_KEY=your-secret-key-here
API_KEY=your-api-key-here

# Logging
LOG_LEVEL=INFO

# Performance
MAX_WORKERS=4
BATCH_SIZE=1
"""
    
    env_file = Path(".env")
    if not env_file.exists():
        with open(env_file, "w") as f:
            f.write(env_content)
        print("✅ Environment file created (.env)")
    else:
        print("✅ Environment file already exists")

def create_startup_script():
    """Create startup script for the backend"""
    if platform.system() == "Windows":
        script_content = """@echo off
echo 🚀 Starting LinguaLink Local Backend...
call venv\\Scripts\\activate
python main.py
pause
"""
        script_name = "start_backend.bat"
    else:
        script_content = """#!/bin/bash
echo "🚀 Starting LinguaLink Local Backend..."
source venv/bin/activate
python main.py
"""
        script_name = "start_backend.sh"
    
    with open(script_name, "w") as f:
        f.write(script_content)
    
    if platform.system() != "Windows":
        os.chmod(script_name, 0o755)
    
    print(f"✅ Startup script created ({script_name})")

def main():
    """Main setup function"""
    print("🚀 LinguaLink Local Backend Setup")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Setup virtual environment
    pip_path = setup_virtual_environment()
    if not pip_path:
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies(pip_path):
        print("⚠️ Dependency installation failed. You may need to install manually.")
    
    # Create configuration files
    create_env_file()
    create_startup_script()
    
    # Download models (optional, may take time)
    print("\n🤔 Do you want to download translation models now? (This may take several minutes)")
    response = input("Download models? (y/N): ").lower().strip()
    
    if response in ['y', 'yes']:
        download_models()
    else:
        print("⚠️ Models not downloaded. The backend will use mock translation until models are available.")
    
    print("\n" + "=" * 50)
    print("🎉 Setup completed!")
    print("\nNext steps:")
    print("1. Activate virtual environment:")
    if platform.system() == "Windows":
        print("   venv\\Scripts\\activate")
        print("2. Start the backend: start_backend.bat")
    else:
        print("   source venv/bin/activate")
        print("2. Start the backend: ./start_backend.sh")
    print("3. The backend will be available at http://localhost:8000")
    print("4. Test with: curl http://localhost:8000/health")

if __name__ == "__main__":
    main()
