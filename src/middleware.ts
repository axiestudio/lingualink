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
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
