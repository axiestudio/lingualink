#!/usr/bin/env python3
"""
🚀 LinguaLink AI - Docker Health Check Script
Verify that the backend service is healthy
"""

import sys
import requests
import json
import os

def check_health():
    """Check if the backend service is healthy"""
    try:
        # Get port from environment or use default
        port = os.getenv("PORT", "8000")
        health_url = f"http://localhost:{port}/health"
        
        # Make health check request with timeout
        response = requests.get(health_url, timeout=10)
        
        if response.status_code == 200:
            health_data = response.json()
            
            # Check if service is healthy and model is loaded
            if (health_data.get("status") == "healthy" and 
                health_data.get("model_loaded") == True):
                print("✅ Service is healthy")
                return True
            else:
                print(f"❌ Service unhealthy: {health_data}")
                return False
        else:
            print(f"❌ Health check failed with status: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check request failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

if __name__ == "__main__":
    healthy = check_health()
    sys.exit(0 if healthy else 1)
