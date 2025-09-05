#!/usr/bin/env python3
"""
🔍 LinguaLink AI Backend Setup Validation
Validates installation, dependencies, and system compatibility
"""

import sys
import os
import importlib
import subprocess
from pathlib import Path
from typing import List, Tuple, Dict, Any

class SetupValidator:
    """Validates backend setup and dependencies"""
    
    def __init__(self):
        self.results = []
        self.warnings = []
        self.errors = []
    
    def check_python_version(self) -> bool:
        """Check Python version compatibility"""
        print("🐍 Checking Python version...")
        
        version = sys.version_info
        min_version = (3, 8)
        recommended_version = (3, 10)
        
        if version < min_version:
            self.errors.append(f"Python {version.major}.{version.minor} is too old. Minimum required: {min_version[0]}.{min_version[1]}")
            print(f"❌ Python {version.major}.{version.minor}.{version.micro} (minimum: {min_version[0]}.{min_version[1]})")
            return False
        elif version < recommended_version:
            self.warnings.append(f"Python {version.major}.{version.minor} works but {recommended_version[0]}.{recommended_version[1]}+ is recommended")
            print(f"⚠️ Python {version.major}.{version.minor}.{version.micro} (recommended: {recommended_version[0]}.{recommended_version[1]}+)")
        else:
            print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
        
        return True
    
    def check_required_packages(self) -> bool:
        """Check if required packages are installed"""
        print("\n📦 Checking required packages...")
        
        required_packages = [
            ("fastapi", "FastAPI web framework"),
            ("uvicorn", "ASGI server"),
            ("pydantic", "Data validation"),
            ("torch", "PyTorch ML framework"),
            ("transformers", "Hugging Face Transformers"),
            ("psutil", "System monitoring"),
            ("aiofiles", "Async file operations"),
        ]
        
        all_installed = True
        
        for package, description in required_packages:
            try:
                importlib.import_module(package)
                print(f"✅ {package} - {description}")
            except ImportError:
                print(f"❌ {package} - {description} (NOT INSTALLED)")
                self.errors.append(f"Missing required package: {package}")
                all_installed = False
        
        return all_installed
    
    def check_optional_packages(self) -> None:
        """Check optional packages for enhanced functionality"""
        print("\n🔧 Checking optional packages...")
        
        optional_packages = [
            ("accelerate", "Model acceleration"),
            ("bitsandbytes", "8-bit optimization"),
            ("nvidia_ml_py3", "NVIDIA GPU monitoring"),
        ]
        
        for package, description in optional_packages:
            try:
                importlib.import_module(package)
                print(f"✅ {package} - {description}")
            except ImportError:
                print(f"⚪ {package} - {description} (optional)")
    
    def check_torch_installation(self) -> bool:
        """Check PyTorch installation and capabilities"""
        print("\n🔥 Checking PyTorch installation...")
        
        try:
            import torch
            print(f"✅ PyTorch version: {torch.__version__}")
            
            # Check CUDA
            if torch.cuda.is_available():
                cuda_version = torch.version.cuda
                device_count = torch.cuda.device_count()
                device_name = torch.cuda.get_device_name(0)
                print(f"🚀 CUDA available: {cuda_version}")
                print(f"🚀 GPU devices: {device_count} ({device_name})")
            else:
                print("💻 CUDA not available (CPU only)")
                self.warnings.append("CUDA not available - translations will be slower on CPU")
            
            # Check MPS (Apple Silicon)
            if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                print("🍎 MPS (Apple Silicon) available")
            
            return True
            
        except ImportError:
            print("❌ PyTorch not installed")
            self.errors.append("PyTorch is required but not installed")
            return False
        except Exception as e:
            print(f"❌ PyTorch check failed: {e}")
            self.errors.append(f"PyTorch installation issue: {e}")
            return False
    
    def check_transformers_installation(self) -> bool:
        """Check Transformers library"""
        print("\n🤗 Checking Transformers installation...")
        
        try:
            import transformers
            print(f"✅ Transformers version: {transformers.__version__}")
            
            # Test basic functionality
            from transformers import AutoTokenizer
            print("✅ AutoTokenizer import successful")
            
            return True
            
        except ImportError:
            print("❌ Transformers not installed")
            self.errors.append("Transformers library is required but not installed")
            return False
        except Exception as e:
            print(f"❌ Transformers check failed: {e}")
            self.errors.append(f"Transformers installation issue: {e}")
            return False
    
    def check_system_resources(self) -> bool:
        """Check system resources"""
        print("\n💻 Checking system resources...")
        
        try:
            import psutil
            
            # Memory check
            memory = psutil.virtual_memory()
            memory_gb = memory.total / (1024**3)
            
            if memory_gb < 4:
                print(f"❌ RAM: {memory_gb:.1f}GB (minimum 4GB required)")
                self.errors.append(f"Insufficient RAM: {memory_gb:.1f}GB (minimum 4GB required)")
                return False
            elif memory_gb < 8:
                print(f"⚠️ RAM: {memory_gb:.1f}GB (8GB+ recommended)")
                self.warnings.append(f"Limited RAM: {memory_gb:.1f}GB (8GB+ recommended for better performance)")
            else:
                print(f"✅ RAM: {memory_gb:.1f}GB")
            
            # Disk space check
            disk = psutil.disk_usage('.')
            disk_free_gb = disk.free / (1024**3)
            
            if disk_free_gb < 2:
                print(f"❌ Disk space: {disk_free_gb:.1f}GB free (minimum 2GB required)")
                self.errors.append(f"Insufficient disk space: {disk_free_gb:.1f}GB (minimum 2GB required)")
                return False
            else:
                print(f"✅ Disk space: {disk_free_gb:.1f}GB free")
            
            # CPU check
            cpu_count = psutil.cpu_count()
            print(f"✅ CPU cores: {cpu_count}")
            
            return True
            
        except Exception as e:
            print(f"❌ System resource check failed: {e}")
            self.errors.append(f"System resource check failed: {e}")
            return False
    
    def check_file_structure(self) -> bool:
        """Check if all required files are present"""
        print("\n📁 Checking file structure...")
        
        required_files = [
            "main.py",
            "requirements.txt",
            ".env.example",
            "app/__init__.py",
            "app/core/config.py",
            "app/models/translation.py",
            "app/services/translation_service.py",
        ]
        
        all_present = True
        
        for file_path in required_files:
            if Path(file_path).exists():
                print(f"✅ {file_path}")
            else:
                print(f"❌ {file_path} (MISSING)")
                self.errors.append(f"Missing required file: {file_path}")
                all_present = False
        
        return all_present
    
    def check_environment_config(self) -> bool:
        """Check environment configuration"""
        print("\n⚙️ Checking environment configuration...")
        
        env_file = Path(".env")
        env_example = Path(".env.example")
        
        if not env_example.exists():
            print("❌ .env.example file missing")
            self.errors.append(".env.example file is missing")
            return False
        else:
            print("✅ .env.example found")
        
        if not env_file.exists():
            print("⚠️ .env file not found (will use defaults)")
            self.warnings.append("No .env file found - using default configuration")
        else:
            print("✅ .env file found")
        
        return True
    
    def run_validation(self) -> bool:
        """Run all validation checks"""
        print("🔍 LinguaLink AI Backend Setup Validation")
        print("=" * 50)
        
        checks = [
            self.check_python_version,
            self.check_required_packages,
            self.check_torch_installation,
            self.check_transformers_installation,
            self.check_system_resources,
            self.check_file_structure,
            self.check_environment_config,
        ]
        
        all_passed = True
        
        for check in checks:
            try:
                if not check():
                    all_passed = False
            except Exception as e:
                print(f"❌ Check failed with exception: {e}")
                self.errors.append(f"Validation check failed: {e}")
                all_passed = False
        
        # Check optional packages (doesn't affect overall result)
        try:
            self.check_optional_packages()
        except Exception as e:
            print(f"⚠️ Optional package check failed: {e}")
        
        return all_passed
    
    def print_summary(self) -> None:
        """Print validation summary"""
        print("\n" + "=" * 50)
        print("📊 VALIDATION SUMMARY")
        print("=" * 50)
        
        if not self.errors and not self.warnings:
            print("🎉 All checks passed! Your setup is ready.")
            print("\n🚀 Next steps:")
            print("1. Copy .env.example to .env and customize settings")
            print("2. Run: python start.py")
            print("3. Visit: http://localhost:8000/docs")
        elif not self.errors:
            print("✅ Setup is functional with some warnings.")
            print(f"\n⚠️ Warnings ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  - {warning}")
            print("\n🚀 You can proceed with: python start.py")
        else:
            print("❌ Setup validation failed.")
            print(f"\n❌ Errors ({len(self.errors)}):")
            for error in self.errors:
                print(f"  - {error}")
            
            if self.warnings:
                print(f"\n⚠️ Warnings ({len(self.warnings)}):")
                for warning in self.warnings:
                    print(f"  - {warning}")
            
            print("\n🔧 Fix the errors above and run validation again.")

def main():
    """Main validation function"""
    validator = SetupValidator()
    
    success = validator.run_validation()
    validator.print_summary()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
