# 🚀 LinguaLink AI Backend

**Advanced Local Machine Translation API using Meta's NLLB-200 Model**

A high-performance FastAPI backend that provides embedded machine translation capabilities without relying on external APIs like OpenAI or Featherless. Supports 200+ languages with GPU acceleration and intelligent caching.

## ✨ Features

- **🌍 200+ Languages**: Powered by Meta's NLLB-200 model
- **🔒 Fully Offline**: No external API dependencies
- **⚡ GPU Accelerated**: CUDA, MPS (Apple Silicon), and CPU support
- **🧠 Intelligent Caching**: High-performance in-memory caching with LRU eviction
- **📊 Performance Monitoring**: Real-time metrics and health checks
- **🔧 Auto-Optimization**: Automatic device detection and model optimization
- **🛡️ Production Ready**: Comprehensive error handling and logging
- **🔌 Frontend Compatible**: Drop-in replacement for existing translation APIs

## 🚀 Quick Start

### Prerequisites

- Python 3.8+ (3.10+ recommended)
- 4GB+ RAM (8GB+ recommended)
- 2GB+ free disk space for models
- Optional: NVIDIA GPU with CUDA 11.7+ or Apple Silicon for acceleration

### Installation

1. **Clone and navigate to backend directory**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env file with your settings
```

5. **Start the server**
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## 📖 API Documentation

### Interactive Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Core Endpoints

#### Translation
```http
POST /api/translate
Content-Type: application/json

{
  "text": "Hello, world!",
  "targetLanguage": "es",
  "sourceLanguage": "en"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "translation": {
    "translatedText": "¡Hola, mundo!",
    "originalText": "Hello, world!",
    "sourceLanguage": "en",
    "targetLanguage": "es",
    "translator": "nllb-200",
    "cached": false,
    "processingTime": 0.85,
    "confidence": 0.95
  }
}
```

#### Health Check
```http
GET /health
```

#### Supported Languages
```http
GET /api/languages
```

#### Performance Metrics
```http
GET /api/metrics
```

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `MODEL_NAME` | `facebook/nllb-200-distilled-600M` | Translation model |
| `DEVICE` | `auto` | Device: auto, cpu, cuda, mps |
| `ENABLE_CACHING` | `true` | Enable translation caching |
| `CACHE_MAX_SIZE` | `1000` | Maximum cache entries |
| `MAX_TEXT_LENGTH` | `5000` | Maximum text length |

### Model Options

| Model | Size | Languages | Speed | Quality |
|-------|------|-----------|-------|---------|
| `facebook/nllb-200-distilled-600M` | 600M | 200+ | Fast | Good |
| `facebook/nllb-200-1.3B` | 1.3B | 200+ | Medium | Better |
| `facebook/nllb-200-3.3B` | 3.3B | 200+ | Slow | Best |

## 🔧 System Requirements

### Minimum Requirements
- **CPU**: 2+ cores
- **RAM**: 4GB
- **Storage**: 2GB free space
- **Python**: 3.8+

### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **GPU**: NVIDIA GPU with 4GB+ VRAM or Apple Silicon
- **Storage**: 5GB+ free space
- **Python**: 3.10+

### GPU Support

#### NVIDIA CUDA
```bash
# Check CUDA availability
python -c "import torch; print(torch.cuda.is_available())"

# Install CUDA-specific packages (optional)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### Apple Silicon (MPS)
```bash
# Check MPS availability
python -c "import torch; print(torch.backends.mps.is_available())"
```

## 🚀 Deployment

### Development
```bash
python main.py
```

### Production with Gunicorn
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker (Optional)
```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "main.py"]
```

## 📊 Performance Optimization

### Memory Optimization
```python
# For systems with limited RAM
LOW_MEMORY_MODE=true
BATCH_SIZE=1
MAX_LENGTH=256
```

### GPU Optimization
```python
# For NVIDIA GPUs
DEVICE=cuda
TORCH_COMPILE=true
BATCH_SIZE=4
```

### Caching Optimization
```python
# Adjust cache size based on available memory
CACHE_MAX_SIZE=2000  # For 16GB+ RAM
CACHE_TTL=7200       # 2 hours
```

## 🔍 Monitoring

### Health Checks
The `/health` endpoint provides comprehensive system status:
- Model loading status
- Device information
- Memory usage
- Uptime statistics

### Performance Metrics
The `/api/metrics` endpoint tracks:
- Request counts and success rates
- Average response times
- Cache hit rates
- Memory usage statistics

### Logging
Structured logging with configurable levels:
```bash
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
```

## 🛠️ Troubleshooting

### Common Issues

#### Model Download Fails
```bash
# Check internet connection and disk space
df -h
ping huggingface.co

# Manual model download
python -c "from transformers import AutoTokenizer; AutoTokenizer.from_pretrained('facebook/nllb-200-distilled-600M')"
```

#### Out of Memory Errors
```bash
# Enable low memory mode
LOW_MEMORY_MODE=true
BATCH_SIZE=1
MAX_LENGTH=256

# Or use smaller model
MODEL_NAME=facebook/nllb-200-distilled-600M
```

#### CUDA Out of Memory
```bash
# Reduce batch size and enable memory optimization
BATCH_SIZE=1
TORCH_COMPILE=false
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
```

### Performance Issues

#### Slow Translation
1. Enable GPU acceleration
2. Use larger batch sizes (if memory allows)
3. Enable model compilation (PyTorch 2.0+)
4. Check system resources

#### High Memory Usage
1. Enable low memory mode
2. Reduce cache size
3. Use smaller model variant
4. Monitor with `/api/metrics`

## 🔗 Integration

### Frontend Integration
The API is designed to be a drop-in replacement for existing translation services:

```javascript
// Replace your existing translation API call
const response = await fetch('http://localhost:8000/api/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Hello, world!',
    targetLanguage: 'es',
    sourceLanguage: 'en'
  })
});

const result = await response.json();
console.log(result.translation.translatedText); // "¡Hola, mundo!"
```

### Language Codes
Uses standard ISO 639-1 language codes:
- `en` - English
- `es` - Spanish  
- `fr` - French
- `de` - German
- `zh` - Chinese (Simplified)
- `ja` - Japanese
- And 200+ more...

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check system requirements
4. Open an issue on GitHub

## 🧪 Testing

### Manual Testing
```bash
# Test translation endpoint
curl -X POST "http://localhost:8000/api/translate" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, world!", "targetLanguage": "es"}'

# Test health endpoint
curl "http://localhost:8000/health"

# Test supported languages
curl "http://localhost:8000/api/languages"
```

### Automated Testing
```bash
# Run tests (if pytest is installed)
pytest tests/

# Load testing (if you have locust installed)
locust -f tests/load_test.py --host=http://localhost:8000
```

## 🔄 Updates and Maintenance

### Model Updates
```bash
# Clear model cache to download latest version
rm -rf ./models/*
python main.py  # Will download fresh models
```

### Dependency Updates
```bash
pip install --upgrade -r requirements.txt
```

---

**Built with ❤️ for the LinguaLink AI project**
