import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { addSecurityHeaders } from '@/lib/security-headers'

export default clerkMiddleware((auth, req) => {
  // Get the response from Clerk middleware
  const response = NextResponse.next()

  // 🔒 SECURITY: Only add security headers in production to avoid Clerk conflicts
  if (process.env.NODE_ENV === 'production') {
    return addSecurityHeaders(response)
  }

  return response
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
