import type { Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Lingua Link - AI-Powered Translation Messaging',
  description: 'Break down language barriers with AI-powered real-time translation in your conversations. Connect with anyone, anywhere, in any language.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <header className="flex justify-between items-center p-6 h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
            {/* Premium Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10">
                <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-lg">
                  <circle cx="32" cy="32" r="30" fill="url(#headerPremiumGradient)" stroke="url(#headerBorderGradient)" strokeWidth="2"/>
                  <circle cx="32" cy="32" r="26" fill="url(#headerInnerShine)" opacity="0.15"/>
                  <path d="M16 24 Q16 20 20 20 L26 20 Q30 20 30 24 L30 28 Q30 32 26 32 L20 32 Q16 32 16 28 Z" fill="white" stroke="url(#headerAccentGradient)" strokeWidth="1.5" opacity="0.95"/>
                  <path d="M34 32 Q34 28 38 28 L44 28 Q48 28 48 32 L48 36 Q48 40 44 40 L38 40 Q34 40 34 36 Z" fill="white" stroke="url(#headerAccentGradient)" strokeWidth="1.5" opacity="0.95"/>
                  <path d="M30 26 Q32 24 34 26" stroke="url(#headerFlowGradient)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8"/>
                  <path d="M34 38 Q32 40 30 38" stroke="url(#headerFlowGradient)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8"/>
                  <text x="23" y="28" fontSize="10" fill="url(#headerTextGradient)" textAnchor="middle" fontWeight="700" fontFamily="system-ui">EN</text>
                  <text x="41" y="36" fontSize="9" fill="url(#headerTextGradient)" textAnchor="middle" fontWeight="700" fontFamily="system-ui">中文</text>
                  <circle cx="32" cy="32" r="2" fill="url(#headerCenterGradient)" opacity="0.6"/>
                  <defs>
                    <linearGradient id="headerPremiumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e40af"/>
                      <stop offset="30%" stopColor="#3b82f6"/>
                      <stop offset="70%" stopColor="#6366f1"/>
                      <stop offset="100%" stopColor="#1d4ed8"/>
                    </linearGradient>
                    <linearGradient id="headerBorderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e3a8a"/>
                      <stop offset="100%" stopColor="#312e81"/>
                    </linearGradient>
                    <linearGradient id="headerInnerShine" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff"/>
                      <stop offset="100%" stopColor="#dbeafe"/>
                    </linearGradient>
                    <linearGradient id="headerAccentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6"/>
                      <stop offset="100%" stopColor="#6366f1"/>
                    </linearGradient>
                    <linearGradient id="headerFlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4"/>
                      <stop offset="50%" stopColor="#3b82f6"/>
                      <stop offset="100%" stopColor="#8b5cf6"/>
                    </linearGradient>
                    <linearGradient id="headerTextGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e40af"/>
                      <stop offset="100%" stopColor="#312e81"/>
                    </linearGradient>
                    <linearGradient id="headerCenterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6"/>
                      <stop offset="100%" stopColor="#6366f1"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
                Lingua Link
              </span>
            </div>

            {/* Premium Auth Buttons */}
            <div className="flex items-center gap-6">
              <SignedOut>
                <SignInButton>
                  <button className="text-slate-600 hover:text-slate-900 font-medium transition-colors text-lg">
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
                  <a href="/dashboard" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                    Messages
                  </a>
                  <UserButton />
                </div>
              </SignedIn>
            </div>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
