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
import CookieConsent from '@/components/CookieConsent'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Lingua Link - Real-time Translation Messaging',
  description: 'Break language barriers with real-time translation messaging. Connect with anyone, anywhere, in any language. Enterprise-grade security and PWA support.',
  keywords: ['translation', 'messaging', 'real-time', 'multilingual', 'chat', 'communication', 'PWA'],
  authors: [{ name: 'Axie Studio' }],
  creator: 'Axie Studio',
  publisher: 'Axie Studio',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Lingua Link - Real-time Translation Messaging',
    description: 'Break language barriers with real-time translation messaging. Connect with anyone, anywhere, in any language.',
    url: 'http://localhost:3000',
    siteName: 'Lingua Link',
    images: [
      {
        url: '/logo.svg',
        width: 200,
        height: 200,
        alt: 'Lingua Link Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lingua Link - Real-time Translation Messaging',
    description: 'Break language barriers with real-time translation messaging.',
    images: ['/logo.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lingua Link',
  },
  verification: {
    google: 'your-google-verification-code',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#3b82f6',
  },
}

// Separate viewport export as required by Next.js 15
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
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
                <img src="/logo.svg" alt="Lingua Link Logo" className="w-full h-full drop-shadow-lg" />
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
          <CookieConsent />
        </body>
      </html>
    </ClerkProvider>
  )
}
