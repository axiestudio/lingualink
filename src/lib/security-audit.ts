// 🔒 ENTERPRISE-LEVEL SECURITY AUDIT LOGGING

interface SecurityEvent {
  timestamp: string;
  userId?: string;
  ip: string;
  userAgent?: string;
  event: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: Record<string, any>;
  action?: string;
}

// In production, this should write to a secure logging service
class SecurityAuditLogger {
  private logs: SecurityEvent[] = [];
  private maxLogs = 10000; // Keep last 10k logs in memory

  log(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    this.logs.push(securityEvent);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔒 SECURITY AUDIT [${event.severity}]:`, securityEvent);
    }

    // In production, send to secure logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToSecureLogging(securityEvent);
    }

    // Alert on critical events
    if (event.severity === 'CRITICAL') {
      this.alertCriticalEvent(securityEvent);
    }
  }

  private async sendToSecureLogging(event: SecurityEvent) {
    // TODO: Implement secure logging service integration
    // Examples: AWS CloudWatch, Datadog, Splunk, etc.
    try {
      // Example implementation:
      // await fetch('https://your-logging-service.com/api/security-events', {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${process.env.LOGGING_API_KEY}` },
      //   body: JSON.stringify(event)
      // });
    } catch (error) {
      console.error('Failed to send security event to logging service:', error);
    }
  }

  private async alertCriticalEvent(event: SecurityEvent) {
    // TODO: Implement critical event alerting
    // Examples: PagerDuty, Slack, email alerts, etc.
    console.error('🚨 CRITICAL SECURITY EVENT:', event);
    
    try {
      // Example implementation:
      // await fetch('https://hooks.slack.com/your-webhook', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     text: `🚨 CRITICAL SECURITY EVENT: ${event.event}`,
      //     attachments: [{ color: 'danger', text: JSON.stringify(event, null, 2) }]
      //   })
      // });
    } catch (error) {
      console.error('Failed to send critical security alert:', error);
    }
  }

  getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.logs.slice(-limit);
  }

  getEventsByUser(userId: string, limit: number = 50): SecurityEvent[] {
    return this.logs
      .filter(event => event.userId === userId)
      .slice(-limit);
  }

  getEventsByIP(ip: string, limit: number = 50): SecurityEvent[] {
    return this.logs
      .filter(event => event.ip === ip)
      .slice(-limit);
  }

  getCriticalEvents(limit: number = 50): SecurityEvent[] {
    return this.logs
      .filter(event => event.severity === 'CRITICAL')
      .slice(-limit);
  }
}

// Singleton instance
export const securityAudit = new SecurityAuditLogger();

// Helper functions for common security events
export function logUnauthorizedAccess(userId: string | undefined, ip: string, resource: string, userAgent?: string) {
  securityAudit.log({
    userId,
    ip,
    userAgent,
    event: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    severity: 'HIGH',
    details: { resource },
    action: 'ACCESS_DENIED'
  });
}

export function logRateLimitExceeded(userId: string, ip: string, endpoint: string, userAgent?: string) {
  securityAudit.log({
    userId,
    ip,
    userAgent,
    event: 'RATE_LIMIT_EXCEEDED',
    severity: 'MEDIUM',
    details: { endpoint },
    action: 'REQUEST_BLOCKED'
  });
}

export function logSuspiciousActivity(userId: string | undefined, ip: string, activity: string, details: Record<string, any>, userAgent?: string) {
  securityAudit.log({
    userId,
    ip,
    userAgent,
    event: 'SUSPICIOUS_ACTIVITY',
    severity: 'HIGH',
    details: { activity, ...details },
    action: 'FLAGGED_FOR_REVIEW'
  });
}

export function logDataAccess(userId: string, ip: string, resource: string, action: string, userAgent?: string) {
  securityAudit.log({
    userId,
    ip,
    userAgent,
    event: 'DATA_ACCESS',
    severity: 'LOW',
    details: { resource, action },
    action: 'LOGGED'
  });
}

export function logAuthenticationFailure(ip: string, reason: string, userAgent?: string) {
  securityAudit.log({
    ip,
    userAgent,
    event: 'AUTHENTICATION_FAILURE',
    severity: 'MEDIUM',
    details: { reason },
    action: 'LOGIN_BLOCKED'
  });
}

export function logPrivilegeEscalation(userId: string, ip: string, attemptedAction: string, userAgent?: string) {
  securityAudit.log({
    userId,
    ip,
    userAgent,
    event: 'PRIVILEGE_ESCALATION_ATTEMPT',
    severity: 'CRITICAL',
    details: { attemptedAction },
    action: 'ACCOUNT_FLAGGED'
  });
}

export function logDataBreach(userId: string | undefined, ip: string, dataType: string, recordCount: number, userAgent?: string) {
  securityAudit.log({
    userId,
    ip,
    userAgent,
    event: 'POTENTIAL_DATA_BREACH',
    severity: 'CRITICAL',
    details: { dataType, recordCount },
    action: 'INCIDENT_CREATED'
  });
}

export function logSecurityConfigChange(userId: string, ip: string, configType: string, changes: Record<string, any>, userAgent?: string) {
  securityAudit.log({
    userId,
    ip,
    userAgent,
    event: 'SECURITY_CONFIG_CHANGE',
    severity: 'HIGH',
    details: { configType, changes },
    action: 'CONFIG_UPDATED'
  });
}

// Security metrics
export function getSecurityMetrics() {
  const events = securityAudit.getRecentEvents(1000);
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);

  const recentEvents = events.filter(e => new Date(e.timestamp).getTime() > oneHourAgo);
  const dailyEvents = events.filter(e => new Date(e.timestamp).getTime() > oneDayAgo);

  return {
    totalEvents: events.length,
    recentEvents: recentEvents.length,
    dailyEvents: dailyEvents.length,
    criticalEvents: events.filter(e => e.severity === 'CRITICAL').length,
    highSeverityEvents: events.filter(e => e.severity === 'HIGH').length,
    topIPs: getTopIPs(events),
    topEvents: getTopEvents(events)
  };
}

function getTopIPs(events: SecurityEvent[]): Array<{ ip: string; count: number }> {
  const ipCounts = events.reduce((acc, event) => {
    acc[event.ip] = (acc[event.ip] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(ipCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));
}

function getTopEvents(events: SecurityEvent[]): Array<{ event: string; count: number }> {
  const eventCounts = events.reduce((acc, event) => {
    acc[event.event] = (acc[event.event] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(eventCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([event, count]) => ({ event, count }));
}
