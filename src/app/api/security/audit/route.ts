import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { securityAudit, getSecurityMetrics } from '@/lib/security-audit';
import { apiRateLimit, getClientIP, createRateLimitResponse } from '@/lib/rate-limiter';

// 🔒 ADMIN-ONLY SECURITY AUDIT ENDPOINT
export async function GET(request: NextRequest) {
  try {
    // 🔒 SECURITY: Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🔒 SECURITY: Admin authorization check
    // TODO: Implement proper admin role checking
    // For now, restrict to specific admin user IDs
    const adminUsers = process.env.ADMIN_USER_IDS?.split(',') || [];
    if (!adminUsers.includes(userId)) {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
    }

    // 🔒 SECURITY: Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitKey = `admin:${userId}:${clientIP}`;
    const rateLimit = apiRateLimit.check(rateLimitKey);
    
    if (!rateLimit.allowed) {
      return createRateLimitResponse('Too many admin requests. Please try again later.', rateLimit.resetTime);
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'metrics';
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);

    switch (action) {
      case 'metrics':
        return NextResponse.json({
          success: true,
          metrics: getSecurityMetrics()
        });

      case 'recent':
        return NextResponse.json({
          success: true,
          events: securityAudit.getRecentEvents(limit)
        });

      case 'critical':
        return NextResponse.json({
          success: true,
          events: securityAudit.getCriticalEvents(limit)
        });

      case 'user':
        const targetUserId = searchParams.get('userId');
        if (!targetUserId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          events: securityAudit.getEventsByUser(targetUserId, limit)
        });

      case 'ip':
        const targetIP = searchParams.get('ip');
        if (!targetIP) {
          return NextResponse.json({ error: 'IP address required' }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          events: securityAudit.getEventsByIP(targetIP, limit)
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in security audit endpoint:', error);
    return NextResponse.json({
      error: 'Failed to retrieve security audit data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
