'use client'

import { usePathname } from 'next/navigation'
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { ThemeToggle } from './theme-toggle'

export default function ConditionalHeader() {
  const pathname = usePathname()
  
  // Hide header on dashboard and settings pages
  const hideHeader = pathname === '/dashboard' || pathname === '/settings'
  
  if (hideHeader) {
    return null
  }

  return (
    <header className="flex justify-between items-center p-6 h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50 shadow-sm">
      {/* Premium Logo and Brand */}
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10">
          <img src="/logo.svg" alt="Lingua Link Logo" className="w-full h-full drop-shadow-lg" />
        </div>
        <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-slate-100 dark:via-blue-400 dark:to-slate-100 bg-clip-text text-transparent">
          Lingua Link
        </span>
      </div>

      {/* Premium Auth Buttons */}
      <div className="flex items-center gap-6">
        <ThemeToggle />
        <SignedOut>
          <SignInButton>
            <button className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors text-lg">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold text-sm px-8 py-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              Get Started Free
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors">
              Messages
            </a>
            <UserButton />
          </div>
        </SignedIn>
      </div>
    </header>
  )
}
