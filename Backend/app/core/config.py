"""
Configuration settings for LinguaLink AI Backend
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",  # Next.js dev server
        "http://localhost:3001",  # Alternative dev port
        "https://lingualink.tech",  # Production domain
        "https://www.lingualink.tech",  # Production domain with www
        "https://api.lingualink.tech",  # API subdomain
    ]
    
    # Model Configuration
    MODEL_NAME: str = "facebook/nllb-200-distilled-600M"  # Smaller, faster model
    MODEL_CACHE_DIR: str = "./models"
    DEVICE: str = "auto"  # auto, cpu, cuda, mps
    MAX_LENGTH: int = 512
    
    # Performance Configuration
    BATCH_SIZE: int = 1
    NUM_WORKERS: int = 1
    ENABLE_CACHING: bool = True
    CACHE_TTL: int = 3600  # 1 hour
    CACHE_MAX_SIZE: int = 1000
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Memory Management
    TORCH_COMPILE: bool = False  # Enable for PyTorch 2.0+ optimization
    LOW_MEMORY_MODE: bool = False  # Enable for systems with limited RAM
    
    # API Configuration
    MAX_TEXT_LENGTH: int = 5000  # Maximum characters per translation request
    RATE_LIMIT_PER_MINUTE: int = 100  # Requests per minute per client

    # Security Configuration
    ENABLE_RATE_LIMITING: bool = True
    ENABLE_API_KEY_AUTH: bool = False
    API_KEY_HEADER: str = "X-API-Key"
    ALLOWED_API_KEYS: List[str] = []  # Will be populated from environment

    # Production Configuration
    WORKERS: int = 1  # Number of worker processes
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    ENABLE_HEALTH_CHECKS: bool = True

    # SSL Configuration
    SSL_KEYFILE: Optional[str] = None
    SSL_CERTFILE: Optional[str] = None
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

# Language code mappings for NLLB-200 model
# NLLB uses specific language codes that may differ from standard ISO codes
NLLB_LANGUAGE_MAPPING = {
    # Major languages
    "en": "eng_Latn",  # English
    "es": "spa_Latn",  # Spanish
    "fr": "fra_Latn",  # French
    "de": "deu_Latn",  # German
    "it": "ita_Latn",  # Italian
    "pt": "por_Latn",  # Portuguese
    "ru": "rus_Cyrl",  # Russian
    "zh": "zho_Hans",  # Chinese Simplified
    "zh-TW": "zho_Hant",  # Chinese Traditional
    "ja": "jpn_Jpan",  # Japanese
    "ko": "kor_Hang",  # Korean
    "ar": "arb_Arab",  # Arabic
    "hi": "hin_Deva",  # Hindi
    "th": "tha_Thai",  # Thai
    "vi": "vie_Latn",  # Vietnamese
    "tr": "tur_Latn",  # Turkish
    "pl": "pol_Latn",  # Polish
    "nl": "nld_Latn",  # Dutch
    "sv": "swe_Latn",  # Swedish
    "da": "dan_Latn",  # Danish
    "no": "nob_Latn",  # Norwegian
    "fi": "fin_Latn",  # Finnish
    "he": "heb_Hebr",  # Hebrew
    "cs": "ces_Latn",  # Czech
    "hu": "hun_Latn",  # Hungarian
    "ro": "ron_Latn",  # Romanian
    "bg": "bul_Cyrl",  # Bulgarian
    "hr": "hrv_Latn",  # Croatian
    "sk": "slk_Latn",  # Slovak
    "sl": "slv_Latn",  # Slovenian
    "et": "est_Latn",  # Estonian
    "lv": "lav_Latn",  # Latvian
    "lt": "lit_Latn",  # Lithuanian
    "uk": "ukr_Cyrl",  # Ukrainian
    "be": "bel_Cyrl",  # Belarusian
    "mk": "mkd_Cyrl",  # Macedonian
    "sr": "srp_Cyrl",  # Serbian
    "bs": "bos_Latn",  # Bosnian
    "mt": "mlt_Latn",  # Maltese
    "is": "isl_Latn",  # Icelandic
    "ga": "gle_Latn",  # Irish
    "cy": "cym_Latn",  # Welsh
    "eu": "eus_Latn",  # Basque
    "ca": "cat_Latn",  # Catalan
    "gl": "glg_Latn",  # Galician
    "fa": "pes_Arab",  # Persian
    "ur": "urd_Arab",  # Urdu
    "bn": "ben_Beng",  # Bengali
    "ta": "tam_Taml",  # Tamil
    "te": "tel_Telu",  # Telugu
    "ml": "mal_Mlym",  # Malayalam
    "kn": "kan_Knda",  # Kannada
    "gu": "guj_Gujr",  # Gujarati
    "pa": "pan_Guru",  # Punjabi
    "mr": "mar_Deva",  # Marathi
    "ne": "npi_Deva",  # Nepali
    "si": "sin_Sinh",  # Sinhala
    "my": "mya_Mymr",  # Myanmar
    "km": "khm_Khmr",  # Khmer
    "lo": "lao_Laoo",  # Lao
    "ka": "kat_Geor",  # Georgian
    "hy": "hye_Armn",  # Armenian
    "az": "azj_Latn",  # Azerbaijani
    "kk": "kaz_Cyrl",  # Kazakh
    "ky": "kir_Cyrl",  # Kyrgyz
    "uz": "uzn_Latn",  # Uzbek
    "tg": "tgk_Cyrl",  # Tajik
    "mn": "khk_Cyrl",  # Mongolian
    "id": "ind_Latn",  # Indonesian
    "ms": "zsm_Latn",  # Malay
    "tl": "tgl_Latn",  # Filipino/Tagalog
    "sw": "swh_Latn",  # Swahili
    "am": "amh_Ethi",  # Amharic
    "ha": "hau_Latn",  # Hausa
    "yo": "yor_Latn",  # Yoruba
    "ig": "ibo_Latn",  # Igbo
    "zu": "zul_Latn",  # Zulu
    "af": "afr_Latn",  # Afrikaans
    "xh": "xho_Latn",  # Xhosa
    "st": "sot_Latn",  # Sotho
    "tn": "tsn_Latn",  # Tswana
    "ss": "ssw_Latn",  # Swati
    "ve": "ven_Latn",  # Venda
    "ts": "tso_Latn",  # Tsonga
    "nr": "nbl_Latn",  # Ndebele
}

def get_nllb_language_code(iso_code: str) -> str:
    """Convert ISO language code to NLLB language code"""
    return NLLB_LANGUAGE_MAPPING.get(iso_code, iso_code)

def get_iso_language_code(nllb_code: str) -> str:
    """Convert NLLB language code to ISO language code"""
    reverse_mapping = {v: k for k, v in NLLB_LANGUAGE_MAPPING.items()}
    return reverse_mapping.get(nllb_code, nllb_code)
