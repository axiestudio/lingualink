import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { securityMiddleware } from './middleware/security'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/messages(.*)',
  '/api/conversations(.*)',
  '/api/users(.*)',
  '/api/upload(.*)',
  '/api/rooms(.*)',
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // 🔒 APPLY SECURITY MIDDLEWARE FIRST
  const securityResponse = securityMiddleware(req);

  // If security middleware blocks the request, return immediately
  if (securityResponse.status !== 200) {
    return securityResponse;
  }

  // 🛡️ APPLY CLERK AUTHENTICATION FOR PROTECTED ROUTES
  if (isProtectedRoute(req)) {
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.redirect(new URL('/sign-in', req.url));
      }
    } catch {
      // If auth fails, redirect to sign-in
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
  }

  // Return the security-enhanced response with proper headers
  return NextResponse.next({
    headers: securityResponse.headers
  });
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files, but include all pages and API routes
    '/((?!_next/static|_next/image|favicon.ico|logo.svg|favicon.svg|manifest.json|sw.js|icons/).*)',
    // Explicitly include API routes
    '/api/(.*)',
    // Include all pages
    '/((?!_next).*)',
  ],
}
