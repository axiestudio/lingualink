import { NextResponse } from 'next/server';
import { getVapidPublicKey, getSubscribedUsers } from '@/lib/push-notifications';

export async function GET() {
  try {
    console.log('🔍 Running system health check...');
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: { status: 'unknown' } as any,
        pushNotifications: { status: 'unknown' } as any,
        serviceWorker: { status: 'unknown' } as any,
        translation: { status: 'unknown' } as any
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextjsVersion: process.env.npm_package_dependencies_next || 'unknown'
      },
      recommendations: [] as Array<{
        type: string;
        message: string;
        action: string;
        service?: string;
      }>
    };
    
    // Check database
    try {
      const dbResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health/database`);
      if (dbResponse.ok) {
        const dbHealth = await dbResponse.json();
        healthStatus.services.database = {
          status: dbHealth.status === 'healthy' ? 'healthy' : 'warning',
          details: dbHealth
        };
      } else {
        healthStatus.services.database = {
          status: 'error',
          error: `HTTP ${dbResponse.status}`
        };
      }
    } catch (error) {
      healthStatus.services.database = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Check push notifications
    try {
      const vapidPublicKey = getVapidPublicKey();
      const subscribedUsers = getSubscribedUsers();
      
      healthStatus.services.pushNotifications = {
        status: vapidPublicKey ? 'healthy' : 'warning',
        vapidConfigured: !!vapidPublicKey,
        subscribedUsers: subscribedUsers.length,
        details: {
          vapidPublicKey: vapidPublicKey ? `${vapidPublicKey.substring(0, 20)}...` : 'NOT SET',
          vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ? 'SET' : 'NOT SET',
          vapidSubject: process.env.VAPID_SUBJECT || 'NOT SET'
        }
      };
      
      if (!vapidPublicKey) {
        healthStatus.recommendations.push({
          type: 'warning',
          service: 'pushNotifications',
          message: 'VAPID keys not configured',
          action: 'Add NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to .env file'
        });
      }
    } catch (error) {
      healthStatus.services.pushNotifications = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Check translation services
    try {
      const hasOpenAI = !!process.env.OPENAI_API_KEY;

      // Count Featherless API keys
      const featherlessKeys = [];
      if (process.env.FEATHERLESS_API_KEY) featherlessKeys.push('FEATHERLESS_API_KEY');

      for (let i = 1; i <= 10; i++) {
        if (process.env[`FEATHERLESS_API_KEY_${i}`]) {
          featherlessKeys.push(`FEATHERLESS_API_KEY_${i}`);
        }
      }

      const hasFeatherless = featherlessKeys.length > 0;

      healthStatus.services.translation = {
        status: (hasOpenAI || hasFeatherless) ? 'healthy' : 'warning',
        providers: {
          openai: hasOpenAI ? 'configured' : 'not configured',
          featherless: hasFeatherless
            ? `configured (${featherlessKeys.length} key${featherlessKeys.length > 1 ? 's' : ''})`
            : 'not configured'
        }
      };

      if (hasFeatherless && featherlessKeys.length > 1) {
        healthStatus.recommendations.push({
          type: 'info',
          service: 'translation',
          message: `Multiple Featherless API keys detected (${featherlessKeys.length})`,
          action: 'Enhanced concurrency enabled - can handle more simultaneous translations'
        });
      }

      if (!hasOpenAI && !hasFeatherless) {
        healthStatus.recommendations.push({
          type: 'warning',
          service: 'translation',
          message: 'No translation API keys configured',
          action: 'Add OPENAI_API_KEY or FEATHERLESS_API_KEY to .env file'
        });
      }
    } catch (error) {
      healthStatus.services.translation = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Check service worker (basic check)
    healthStatus.services.serviceWorker = {
      status: 'info',
      message: 'Service worker status can only be checked from client-side',
      path: '/sw.js'
    };
    
    // Determine overall status
    const serviceStatuses = Object.values(healthStatus.services).map(s => s.status);
    if (serviceStatuses.includes('error')) {
      healthStatus.status = 'error';
    } else if (serviceStatuses.includes('warning')) {
      healthStatus.status = 'warning';
    }
    
    console.log('✅ System health check completed');
    console.log('📊 Overall status:', healthStatus.status);
    
    return NextResponse.json(healthStatus);
    
  } catch (error) {
    console.error('❌ System health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'System health check failed'
    }, { status: 500 });
  }
}

// Auto-fix common issues
export async function POST() {
  try {
    console.log('🔧 Running system auto-fix...');
    
    const fixes = [];
    
    // Try to initialize database
    try {
      const dbResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health/database`, {
        method: 'POST'
      });
      
      if (dbResponse.ok) {
        fixes.push({
          service: 'database',
          status: 'success',
          message: 'Database initialized successfully'
        });
      } else {
        fixes.push({
          service: 'database',
          status: 'failed',
          message: `Database initialization failed: ${dbResponse.status}`
        });
      }
    } catch (error) {
      fixes.push({
        service: 'database',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    // Run health check after fixes
    const healthResponse = await GET();
    const healthData = await healthResponse.json();
    
    return NextResponse.json({
      message: 'System auto-fix completed',
      fixes,
      health: healthData
    });
    
  } catch (error) {
    console.error('❌ System auto-fix failed:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'System auto-fix failed'
    }, { status: 500 });
  }
}
