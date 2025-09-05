// 🚀 BACKEND TRANSLATION SERVICE - LinguaLink AI
// Local backend integration for embedded translation

export interface BackendTranslationResult {
  translatedText: string;
  originalText: string;
  sourceLanguage: string;
  targetLanguage: string;
  translator: string;
  cached?: boolean;
  processingTime?: number;
  confidence?: number;
}

export interface BackendTranslationResponse {
  success: boolean;
  translation: BackendTranslationResult;
}

export interface BackendHealthResponse {
  status: string;
  model_loaded: boolean;
  model_name: string;
  device: string;
  memory_usage?: any;
  uptime: number;
  timestamp: string;
}

class BackendTranslationService {
  private baseUrl: string;
  private isAvailable: boolean = false;
  private lastHealthCheck: number = 0;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  constructor(baseUrl?: string) {
    // Use environment variable or fallback to default
    this.baseUrl = baseUrl ||
                   process.env.NEXT_PUBLIC_BACKEND_TRANSLATION_URL ||
                   'http://localhost:8000';
    console.log(`🔗 Backend Translation Service initialized: ${this.baseUrl}`);

    // Initial health check
    this.checkHealth();
  }

  /**
   * Check if backend is available and healthy
   */
  async checkHealth(): Promise<boolean> {
    const now = Date.now();
    
    // Skip if recently checked
    if (now - this.lastHealthCheck < this.HEALTH_CHECK_INTERVAL && this.isAvailable) {
      return this.isAvailable;
    }

    try {
      console.log('🔍 Checking backend health...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const health: BackendHealthResponse = await response.json();
        this.isAvailable = health.status === 'healthy' && health.model_loaded;
        
        if (this.isAvailable) {
          console.log(`✅ Backend healthy: ${health.model_name} on ${health.device}`);
        } else {
          console.warn('⚠️ Backend unhealthy:', health);
        }
      } else {
        this.isAvailable = false;
        console.warn(`⚠️ Backend health check failed: ${response.status}`);
      }

    } catch (error) {
      this.isAvailable = false;
      console.warn('⚠️ Backend not available:', error);
    }

    this.lastHealthCheck = now;
    return this.isAvailable;
  }

  /**
   * Translate text using local backend
   */
  async translate(text: string, targetLanguage: string, sourceLanguage?: string): Promise<BackendTranslationResult> {
    // Check health first
    const isHealthy = await this.checkHealth();
    if (!isHealthy) {
      throw new Error('Backend translation service is not available');
    }

    const requestId = Math.random().toString(36).substring(7);
    console.log(`🔄 [${requestId}] Backend translation: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" | ${sourceLanguage || 'auto'} → ${targetLanguage}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${this.baseUrl}/api/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage,
          sourceLanguage
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Backend translation failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const result: BackendTranslationResponse = await response.json();
      
      if (!result.success) {
        throw new Error('Backend translation returned unsuccessful result');
      }

      console.log(`✅ [${requestId}] Backend translation completed in ${result.translation.processingTime?.toFixed(2) || 'N/A'}s`);
      
      return result.translation;

    } catch (error) {
      console.error(`❌ [${requestId}] Backend translation failed:`, error);
      throw error;
    }
  }

  /**
   * Get supported languages from backend
   */
  async getSupportedLanguages(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/languages`);
      
      if (!response.ok) {
        throw new Error(`Failed to get languages: ${response.status}`);
      }

      const result = await response.json();
      return result.languages || [];

    } catch (error) {
      console.error('Failed to get supported languages from backend:', error);
      return [];
    }
  }

  /**
   * Get backend performance metrics
   */
  async getMetrics(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/metrics`);
      
      if (!response.ok) {
        throw new Error(`Failed to get metrics: ${response.status}`);
      }

      const result = await response.json();
      return result.metrics;

    } catch (error) {
      console.error('Failed to get backend metrics:', error);
      return null;
    }
  }

  /**
   * Check if backend is currently available
   */
  isBackendAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Get backend base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Create singleton instance
export const backendTranslationService = new BackendTranslationService();

// Export for use in other components
export default BackendTranslationService;
