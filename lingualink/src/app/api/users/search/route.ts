import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { searchUsers } from '../../../actions';
import { apiRateLimit, getClientIP, createRateLimitResponse } from '@/lib/rate-limiter';
import { sanitizeHtml, detectSuspiciousActivity } from '@/lib/security-headers';

// Search users
export async function GET(request: NextRequest) {
  try {
    // 🔒 SECURITY: Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🔒 SECURITY: Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitKey = `search:${userId}:${clientIP}`;
    const rateLimit = apiRateLimit.check(rateLimitKey);

    if (!rateLimit.allowed) {
      console.warn(`🚨 Search rate limit exceeded for user ${userId} from IP ${clientIP}`);
      return createRateLimitResponse('Too many search requests. Please try again later.', rateLimit.resetTime);
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        users: []
      });
    }

    // 🔒 SECURITY: Input validation and sanitization
    const sanitizedQuery = sanitizeHtml(query.trim());

    if (detectSuspiciousActivity(sanitizedQuery)) {
      console.warn(`🚨 Suspicious search query detected from user ${userId}: ${sanitizedQuery.substring(0, 50)}`);
      return NextResponse.json({ error: 'Invalid search query' }, { status: 400 });
    }

    if (sanitizedQuery.length > 100) {
      return NextResponse.json({ error: 'Search query too long' }, { status: 400 });
    }

    const users = await searchUsers(sanitizedQuery, userId);

    return NextResponse.json({ 
      success: true, 
      users 
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({
      error: 'Failed to search users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
