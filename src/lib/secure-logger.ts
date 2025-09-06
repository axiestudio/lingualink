/**
 * 🔒 SECURE LOGGING UTILITY
 * Implements OWASP logging best practices to prevent sensitive data exposure
 * Removes credentials, PII, and other sensitive information from logs
 */

interface LogLevel {
  EMERGENCY: 0;
  ALERT: 1;
  CRITICAL: 2;
  ERROR: 3;
  WARNING: 4;
  NOTICE: 5;
  INFO: 6;
  DEBUG: 7;
}

const LOG_LEVELS: LogLevel = {
  EMERGENCY: 0,
  ALERT: 1,
  CRITICAL: 2,
  ERROR: 3,
  WARNING: 4,
  NOTICE: 5,
  INFO: 6,
  DEBUG: 7
};

// 🚨 SENSITIVE DATA PATTERNS TO SANITIZE
const SENSITIVE_PATTERNS = [
  // Authentication & Authorization
  { pattern: /password['":\s]*['"]\s*([^'"]+)['"]/gi, replacement: 'password":"[REDACTED]"' },
  { pattern: /token['":\s]*['"]\s*([^'"]+)['"]/gi, replacement: 'token":"[REDACTED]"' },
  { pattern: /authorization['":\s]*['"]\s*([^'"]+)['"]/gi, replacement: 'authorization":"[REDACTED]"' },
  { pattern: /bearer\s+([a-zA-Z0-9\-._~+/]+=*)/gi, replacement: 'Bearer [REDACTED]' },
  { pattern: /api[_-]?key['":\s]*['"]\s*([^'"]+)['"]/gi, replacement: 'api_key":"[REDACTED]"' },
  { pattern: /secret['":\s]*['"]\s*([^'"]+)['"]/gi, replacement: 'secret":"[REDACTED]"' },
  
  // Database & Connection Strings
  { pattern: /postgres:\/\/[^:]+:[^@]+@/gi, replacement: 'postgres://[USER]:[PASSWORD]@' },
  { pattern: /mysql:\/\/[^:]+:[^@]+@/gi, replacement: 'mysql://[USER]:[PASSWORD]@' },
  { pattern: /mongodb:\/\/[^:]+:[^@]+@/gi, replacement: 'mongodb://[USER]:[PASSWORD]@' },
  
  // Session & Cookie Data
  { pattern: /session[_-]?id['":\s]*['"]\s*([^'"]+)['"]/gi, replacement: 'session_id":"[REDACTED]"' },
  { pattern: /cookie['":\s]*['"]\s*([^'"]+)['"]/gi, replacement: 'cookie":"[REDACTED]"' },
  { pattern: /csrf[_-]?token['":\s]*['"]\s*([^'"]+)['"]/gi, replacement: 'csrf_token":"[REDACTED]"' },
  
  // Personal Identifiable Information (PII)
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN_REDACTED]' },
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD_REDACTED]' },
  { pattern: /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/g, replacement: '[PHONE_REDACTED]' },
  
  // IP Addresses (partial masking)
  { pattern: /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.)\d{1,3}\b/g, replacement: '$1XXX' },
  
  // File Paths (remove sensitive parts)
  { pattern: /\/home\/[^\/\s]+/g, replacement: '/home/[USER]' },
  { pattern: /C:\\Users\\[^\\]+/g, replacement: 'C:\\Users\\[USER]' },
  
  // Room IDs (partial masking for privacy)
  { pattern: /room_([a-zA-Z0-9]{8})[a-zA-Z0-9]+/g, replacement: 'room_$1***' },
  
  // User IDs (partial masking)
  { pattern: /user_([a-zA-Z0-9]{8})[a-zA-Z0-9]+/g, replacement: 'user_$1***' },
];

// 🔒 SECURITY EVENT TYPES
export enum SecurityEventType {
  AUTHENTICATION_SUCCESS = 'AUTH_SUCCESS',
  AUTHENTICATION_FAILURE = 'AUTH_FAILURE',
  AUTHORIZATION_FAILURE = 'AUTHZ_FAILURE',
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_DESTROYED = 'SESSION_DESTROYED',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INPUT_VALIDATION_FAILURE = 'INPUT_VALIDATION_FAILURE',
  OUTPUT_VALIDATION_FAILURE = 'OUTPUT_VALIDATION_FAILURE',
  INJECTION_ATTEMPT = 'INJECTION_ATTEMPT',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  ACCOUNT_LOCKOUT = 'ACCOUNT_LOCKOUT',
  CONFIGURATION_CHANGE = 'CONFIG_CHANGE',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  NETWORK_ANOMALY = 'NETWORK_ANOMALY'
}

export enum SecuritySeverity {
  EMERGENCY = 0,  // System is unusable
  ALERT = 1,      // Action must be taken immediately
  CRITICAL = 2,   // Critical conditions
  ERROR = 3,      // Error conditions
  WARNING = 4,    // Warning conditions
  NOTICE = 5,     // Normal but significant condition
  INFO = 6,       // Informational messages
  DEBUG = 7       // Debug-level messages
}

interface SecurityLogEntry {
  timestamp: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'DEFERRED';
  message: string;
  details?: Record<string, any>;
  requestId?: string;
  correlationId?: string;
}

class SecureLogger {
  private static instance: SecureLogger;
  private isProduction: boolean;
  private logLevel: number;

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logLevel = this.isProduction ? LOG_LEVELS.WARNING : LOG_LEVELS.DEBUG;
  }

  public static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }

  /**
   * 🧹 SANITIZE SENSITIVE DATA FROM LOG MESSAGES
   * Removes passwords, tokens, PII, and other sensitive information
   */
  private sanitizeLogData(data: any): any {
    if (typeof data === 'string') {
      let sanitized = data;
      
      // Apply all sensitive data patterns
      SENSITIVE_PATTERNS.forEach(({ pattern, replacement }) => {
        sanitized = sanitized.replace(pattern, replacement);
      });
      
      return sanitized;
    }
    
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return data.map(item => this.sanitizeLogData(item));
      }
      
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Skip sensitive keys entirely
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeLogData(value);
        }
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * 🔍 CHECK IF A KEY CONTAINS SENSITIVE INFORMATION
   */
  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password', 'passwd', 'pwd', 'secret', 'token', 'key', 'auth', 'authorization',
      'cookie', 'session', 'csrf', 'api_key', 'apikey', 'private_key', 'privatekey',
      'access_token', 'refresh_token', 'id_token', 'jwt', 'signature', 'hash',
      'salt', 'nonce', 'credit_card', 'creditcard', 'ssn', 'social_security',
      'phone', 'email', 'address', 'location', 'coordinates', 'ip_address'
    ];
    
    return sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive.toLowerCase())
    );
  }

  /**
   * 🛡️ LOG SECURITY EVENTS WITH PROPER SANITIZATION
   */
  public logSecurityEvent(entry: Partial<SecurityLogEntry>): void {
    if (entry.severity !== undefined && entry.severity > this.logLevel) {
      return; // Skip if below log level
    }

    const sanitizedEntry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      eventType: entry.eventType || SecurityEventType.SYSTEM_ERROR,
      severity: entry.severity || SecuritySeverity.INFO,
      userId: entry.userId ? this.sanitizeUserId(entry.userId) : undefined,
      sessionId: entry.sessionId ? '[SESSION_ID_HASH]' : undefined,
      ipAddress: entry.ipAddress ? this.sanitizeIpAddress(entry.ipAddress) : undefined,
      userAgent: entry.userAgent ? this.sanitizeUserAgent(entry.userAgent) : undefined,
      resource: entry.resource,
      action: entry.action,
      result: entry.result || 'SUCCESS',
      message: this.sanitizeLogData(entry.message || ''),
      details: entry.details ? this.sanitizeLogData(entry.details) : undefined,
      requestId: entry.requestId,
      correlationId: entry.correlationId
    };

    // 🔒 SECURITY: Only log to server-side, never to browser console
    if (typeof window === 'undefined') {
      const logMessage = `🔒 SECURITY [${SecuritySeverity[sanitizedEntry.severity]}]: ${JSON.stringify(sanitizedEntry)}`;
      
      switch (sanitizedEntry.severity) {
        case SecuritySeverity.EMERGENCY:
        case SecuritySeverity.ALERT:
        case SecuritySeverity.CRITICAL:
          console.error(logMessage);
          break;
        case SecuritySeverity.ERROR:
          console.error(logMessage);
          break;
        case SecuritySeverity.WARNING:
          console.warn(logMessage);
          break;
        case SecuritySeverity.NOTICE:
        case SecuritySeverity.INFO:
          console.info(logMessage);
          break;
        case SecuritySeverity.DEBUG:
          if (!this.isProduction) {
            console.log(logMessage);
          }
          break;
      }
    }
  }

  /**
   * 🎭 SANITIZE USER ID (PARTIAL MASKING)
   */
  private sanitizeUserId(userId: string): string {
    if (userId.length <= 8) return '[USER_ID]';
    return userId.substring(0, 8) + '***';
  }

  /**
   * 🌐 SANITIZE IP ADDRESS (PARTIAL MASKING)
   */
  private sanitizeIpAddress(ip: string): string {
    if (ip.includes(':')) {
      // IPv6 - mask last segments
      const segments = ip.split(':');
      return segments.slice(0, 4).join(':') + ':****';
    } else {
      // IPv4 - mask last octet
      const octets = ip.split('.');
      return octets.slice(0, 3).join('.') + '.XXX';
    }
  }

  /**
   * 🕵️ SANITIZE USER AGENT (REMOVE SENSITIVE INFO)
   */
  private sanitizeUserAgent(userAgent: string): string {
    // Remove potentially sensitive information while keeping useful data
    return userAgent
      .replace(/\([^)]*\)/g, '(SYSTEM_INFO_REDACTED)')
      .substring(0, 100) + (userAgent.length > 100 ? '...' : '');
  }

  /**
   * 🚨 LOG CRITICAL SECURITY EVENTS
   */
  public logCriticalSecurity(eventType: SecurityEventType, message: string, details?: any): void {
    this.logSecurityEvent({
      eventType,
      severity: SecuritySeverity.CRITICAL,
      message,
      details
    });
  }

  /**
   * ⚠️ LOG WARNING SECURITY EVENTS
   */
  public logWarningSecurity(eventType: SecurityEventType, message: string, details?: any): void {
    this.logSecurityEvent({
      eventType,
      severity: SecuritySeverity.WARNING,
      message,
      details
    });
  }

  /**
   * ℹ️ LOG INFO SECURITY EVENTS
   */
  public logInfoSecurity(eventType: SecurityEventType, message: string, details?: any): void {
    this.logSecurityEvent({
      eventType,
      severity: SecuritySeverity.INFO,
      message,
      details
    });
  }
}

// Export singleton instance
export const secureLogger = SecureLogger.getInstance();
export type { SecurityLogEntry };
