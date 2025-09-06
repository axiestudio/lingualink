# 🚀 LinguaLink Local LLM Integration

**AS A SENIOR DEVELOPER** - Complete guide for integrating local LLMs with LinguaLink

This document provides comprehensive instructions for setting up and using local Large Language Models (LLMs) with LinguaLink instead of relying on external AI services like Featherless AI or OpenAI.

## 🎯 Overview

The local LLM integration replaces external translation APIs with a local Python backend that runs translation models on your own hardware. This provides:

- **🔒 Privacy**: All translations happen locally
- **💰 Cost Savings**: No API costs for translation
- **⚡ Performance**: Potentially faster responses
- **🛡️ Reliability**: No dependency on external services
- **🎛️ Control**: Full control over translation quality and models

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Local Backend  │    │   Local LLM     │
│   (Next.js)     │───▶│   (FastAPI)      │───▶│   (NLLB/Ollama) │
│                 │    │   Port: 8000     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │              ┌────────▼────────┐
         │              │   Fallback to   │
         └─────────────▶│   External APIs │
                        │ (Featherless/AI)│
                        └─────────────────┘
```

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Run the complete setup script
python setup_local_llm.py
```

### Option 2: Manual Setup

#### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Run backend setup
python setup.py

# Start the backend
./start_backend.sh  # Linux/Mac
# OR
start_backend.bat   # Windows
```

#### 2. Frontend Configuration

```bash
# Install frontend dependencies
npm install

# Copy environment configuration
cp .env.example .env.local

# Edit .env.local with your settings
# Set LOCAL_BACKEND_URL=http://localhost:8000
```

#### 3. Start the Application

```bash
# Start both services
./start_lingualink.sh  # Linux/Mac
# OR
start_lingualink.bat   # Windows
```

## 🔧 Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
# Local LLM Backend (Primary)
NEXT_PUBLIC_LOCAL_BACKEND_URL=http://localhost:8000
LOCAL_BACKEND_URL=http://localhost:8000
LOCAL_BACKEND_API_KEY=your-optional-api-key

# External APIs (Fallback)
FEATHERLESS_API_KEY=your-featherless-key
OPENAI_API_KEY=your-openai-key
```

### Translation Priority

The system uses this priority order:

1. **Local LLM Backend** (Primary)
2. **Featherless AI** (Fallback 1)
3. **OpenAI** (Fallback 2)

## 🤖 Supported Models

### Option 1: Transformers (Recommended)

- **NLLB-200**: Facebook's multilingual translation model
- **mBART**: Multilingual BART for translation
- **Custom fine-tuned models**

### Option 2: Ollama Integration

- **Llama 3.1**: Meta's latest language model
- **Mistral**: Efficient multilingual model
- **Custom Ollama models**

### Option 3: Mock Translator

- Development/testing mode
- Returns formatted mock translations

## 📊 API Endpoints

### Backend Endpoints

```
GET  /health              - Health check
POST /translate           - Single translation
POST /batch-translate     - Batch translations
GET  /languages          - Supported languages
GET  /stats              - Backend statistics
POST /reload-model       - Reload translation model
```

### Translation Request Format

```json
{
  "text": "Hello, world!",
  "target_language": "es",
  "source_language": "en"
}
```

### Translation Response Format

```json
{
  "success": true,
  "translation": {
    "translatedText": "¡Hola, mundo!",
    "originalText": "Hello, world!",
    "sourceLanguage": "en",
    "targetLanguage": "es",
    "translator": "local_llm",
    "cached": false,
    "processingTime": 1250,
    "confidence": 0.97
  },
  "processing_time": 1.25,
  "model_used": "facebook/nllb-200-distilled-600M"
}
```

## 🧪 Testing

### Health Check

```bash
# Test backend health
curl http://localhost:8000/health

# Test translation
curl -X POST http://localhost:8000/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello", "target_language": "es"}'
```

### Integration Test

```bash
# Run comprehensive tests
python test_integration.py
```

### Frontend Testing

1. Open http://localhost:3000
2. Send a message in the chat
3. Check browser console for translation logs
4. Verify "Local LLM Backend" appears in logs

## 🔍 Monitoring

### Translation Service Status

The frontend provides methods to monitor translation services:

```typescript
import { getTranslationService } from '@/lib/translation';

const service = getTranslationService();

// Check service health
const health = await service.checkServicesHealth();
console.log('Service health:', health);

// Get service status
const status = service.getServiceStatus();
console.log('Available services:', status);

// Get performance metrics
const metrics = service.getPerformanceMetrics();
console.log('Performance:', metrics);
```

### Logs

- **Backend logs**: Check terminal running the Python backend
- **Frontend logs**: Check browser console
- **Translation logs**: Look for "Local LLM Backend" in console

## 🚨 Troubleshooting

### Common Issues

#### Backend Not Starting

```bash
# Check Python version
python --version  # Should be 3.8+

# Check dependencies
cd backend
pip install -r requirements.txt

# Check port availability
netstat -an | grep 8000
```

#### Model Loading Issues

```bash
# Check available disk space (models can be large)
df -h

# Check memory usage
free -h  # Linux
# OR
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory  # Windows

# Try mock mode for testing
export MODEL_TYPE=mock
python main.py
```

#### Translation Failures

1. Check backend health: `curl http://localhost:8000/health`
2. Check frontend console for error messages
3. Verify environment variables are set correctly
4. Test with external APIs as fallback

### Performance Optimization

#### GPU Acceleration

```python
# In backend/main.py, modify device setting:
device = 0  # Use GPU instead of -1 (CPU)
```

#### Memory Management

```python
# Reduce model size for lower memory usage
model_name = "facebook/nllb-200-distilled-600M"  # Smaller model
# Instead of larger models like nllb-200-3.3B
```

## 📈 Performance Comparison

| Service | Avg Response Time | Cost | Privacy | Reliability |
|---------|------------------|------|---------|-------------|
| Local LLM | 1-3 seconds | Free | 100% | High |
| Featherless AI | 2-5 seconds | Low | External | Medium |
| OpenAI | 1-2 seconds | High | External | High |

## 🔮 Future Enhancements

- [ ] GPU acceleration support
- [ ] Model quantization for faster inference
- [ ] Redis caching for translations
- [ ] Load balancing for multiple model instances
- [ ] Custom model fine-tuning pipeline
- [ ] Real-time model switching
- [ ] Translation quality scoring
- [ ] Batch processing optimization

## 🤝 Contributing

To contribute to the local LLM integration:

1. Fork the repository
2. Create a feature branch
3. Test your changes with `python test_integration.py`
4. Submit a pull request

## 📞 Support

For issues with local LLM integration:

1. Check this documentation
2. Review logs in backend terminal and browser console
3. Test with the integration test script
4. Create an issue with detailed error information

---

**AS A SENIOR DEVELOPER** - This integration provides enterprise-grade local translation capabilities while maintaining compatibility with external services as fallbacks. The modular design ensures reliability and scalability for production use.
