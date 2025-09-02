'use client'

import { SignedIn, SignedOut } from '@clerk/nextjs'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Globe,
  MessageSquare,
  Zap,
  Users,
  ArrowRight,
  CheckCircle,
  Star,
  Sparkles,
  Heart,
  Languages
} from 'lucide-react'

// Premium Lingua Link Logo Component
const LinguaLinkLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <motion.div
    className={`${className} relative`}
    whileHover={{ scale: 1.05 }}
    transition={{ duration: 0.3 }}
  >
    <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-2xl">
      {/* Outer Premium Ring */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="url(#premiumGradient)"
        stroke="url(#borderGradient)"
        strokeWidth="2"
        filter="url(#glow)"
      />

      {/* Inner Sophisticated Pattern */}
      <circle cx="32" cy="32" r="26" fill="url(#innerShine)" opacity="0.15"/>
      <circle cx="32" cy="32" r="22" fill="url(#coreGradient)" opacity="0.1"/>

      {/* Modern Speech Bubble Left */}
      <path
        d="M16 24 Q16 20 20 20 L26 20 Q30 20 30 24 L30 28 Q30 32 26 32 L20 32 Q16 32 16 28 Z"
        fill="white"
        stroke="url(#accentGradient)"
        strokeWidth="1.5"
        opacity="0.95"
        filter="url(#softShadow)"
      />

      {/* Modern Speech Bubble Right */}
      <path
        d="M34 32 Q34 28 38 28 L44 28 Q48 28 48 32 L48 36 Q48 40 44 40 L38 40 Q34 40 34 36 Z"
        fill="white"
        stroke="url(#accentGradient)"
        strokeWidth="1.5"
        opacity="0.95"
        filter="url(#softShadow)"
      />

      {/* Premium Translation Flow */}
      <path
        d="M30 26 Q32 24 34 26"
        stroke="url(#flowGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M34 38 Q32 40 30 38"
        stroke="url(#flowGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Sophisticated Typography */}
      <text x="23" y="28" fontSize="10" fill="url(#textGradient)" textAnchor="middle" fontWeight="700" fontFamily="system-ui">EN</text>
      <text x="41" y="36" fontSize="9" fill="url(#textGradient)" textAnchor="middle" fontWeight="700" fontFamily="system-ui">中文</text>

      {/* Connecting Elements */}
      <circle cx="32" cy="32" r="2" fill="url(#centerGradient)" opacity="0.6"/>
      <line x1="30" y1="26" x2="34" y2="34" stroke="url(#connectionGradient)" strokeWidth="1" opacity="0.4"/>
      <line x1="34" y1="30" x2="30" y2="38" stroke="url(#connectionGradient)" strokeWidth="1" opacity="0.4"/>

      <defs>
        <linearGradient id="premiumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e40af"/>
          <stop offset="30%" stopColor="#3b82f6"/>
          <stop offset="70%" stopColor="#6366f1"/>
          <stop offset="100%" stopColor="#1d4ed8"/>
        </linearGradient>
        <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a"/>
          <stop offset="100%" stopColor="#312e81"/>
        </linearGradient>
        <linearGradient id="innerShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="100%" stopColor="#dbeafe"/>
        </linearGradient>
        <linearGradient id="coreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#bfdbfe"/>
          <stop offset="100%" stopColor="#93c5fd"/>
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#6366f1"/>
        </linearGradient>
        <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4"/>
          <stop offset="50%" stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#8b5cf6"/>
        </linearGradient>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e40af"/>
          <stop offset="100%" stopColor="#312e81"/>
        </linearGradient>
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa"/>
          <stop offset="100%" stopColor="#a78bfa"/>
        </linearGradient>
        <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#6366f1"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="softShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1"/>
        </filter>
      </defs>
    </svg>
  </motion.div>
)

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-2000"></div>
      </div>

      {/* Hero Section */}
      <main className="relative">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          {/* Premium Hero Section */}
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="flex justify-center mb-12"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <LinguaLinkLogo className="w-32 h-32" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tight">
                <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Lingua Link
                </span>
              </h1>
              <div className="flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-blue-500 mr-2" />
                <span className="text-2xl md:text-3xl text-slate-600 font-light">
                  AI-Powered Translation Messaging
                </span>
                <Sparkles className="w-6 h-6 text-blue-500 ml-2" />
              </div>
              <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
                Connect with anyone, anywhere, in any language. Experience seamless conversations
                with real-time AI translation that feels natural and effortless.
              </p>
            </motion.div>

            {/* Premium Stats */}
            <motion.div
              className="flex justify-center items-center space-x-8 mb-16 text-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium">100+ Languages</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span className="text-sm font-medium">Real-Time Translation</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5" />
                <span className="text-sm font-medium">Loved by Millions</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Premium CTA Section */}
          <motion.div
            className="text-center mb-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <SignedOut>
              <div className="space-y-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border border-slate-200/50 max-w-2xl mx-auto relative overflow-hidden">
                  {/* Subtle background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>

                  <div className="relative">
                    <div className="flex items-center justify-center space-x-3 mb-8">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-slate-600 font-medium">Ready to Connect the World</span>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-500"></div>
                    </div>

                    <p className="text-lg text-slate-700 mb-8 leading-relaxed">
                      Join millions of people breaking down language barriers every day.
                      Start your journey to global communication.
                    </p>

                    <div className="grid grid-cols-3 gap-6 text-center mb-8">
                      <div className="p-4">
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">100+</div>
                        <div className="text-sm text-slate-500 mt-1">Languages</div>
                      </div>
                      <div className="p-4">
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">0.3s</div>
                        <div className="text-sm text-slate-500 mt-1">Translation Speed</div>
                      </div>
                      <div className="p-4">
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">24/7</div>
                        <div className="text-sm text-slate-500 mt-1">Always Available</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center space-x-2 text-slate-500">
                      <ArrowRight className="w-4 h-4" />
                      <span>Sign up above to start your free account</span>
                    </div>
                  </div>
                </div>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="space-y-8">
                <motion.div
                  className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-3xl p-10 shadow-2xl border border-emerald-200/50 max-w-2xl mx-auto relative overflow-hidden"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/30 to-blue-100/30"></div>

                  <div className="relative">
                    <div className="flex items-center justify-center mb-8">
                      <CheckCircle className="w-10 h-10 text-emerald-600 mr-4" />
                      <span className="text-2xl font-bold text-slate-800">Welcome to Lingua Link!</span>
                    </div>

                    <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                      Your global communication platform is ready. Start connecting with people
                      around the world in their native language.
                    </p>

                    <Link
                      href="/dashboard"
                      className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-5 rounded-2xl text-xl font-semibold transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 group"
                    >
                      <MessageSquare className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                      Start Messaging
                      <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              </div>
            </SignedIn>
          </motion.div>

          {/* Premium Features Section */}
          <motion.div
            className="mb-24"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                Why Choose Lingua Link?
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Experience the future of global communication with cutting-edge AI technology
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                className="group p-10 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/50 hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Zap className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">Lightning Fast AI</h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    Experience instant translation powered by state-of-the-art neural networks.
                    Your conversations flow naturally without any delays.
                  </p>
                  <div className="flex items-center text-blue-600 font-semibold">
                    <Star className="w-4 h-4 mr-2 fill-current" />
                    <span>Sub-second response time</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="group p-10 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/50 hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Languages className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">100+ Languages</h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    From major world languages to regional dialects, communicate with anyone,
                    anywhere. Our AI understands context and cultural nuances.
                  </p>
                  <div className="flex items-center text-indigo-600 font-semibold">
                    <Globe className="w-4 h-4 mr-2" />
                    <span>Constantly expanding</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="group p-10 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/50 hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-green-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">Global Community</h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    Join millions of users worldwide who are already connecting across cultures.
                    Build friendships and relationships that transcend language barriers.
                  </p>
                  <div className="flex items-center text-emerald-600 font-semibold">
                    <Heart className="w-4 h-4 mr-2 fill-current" />
                    <span>Millions of connections made</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Premium Demo Section */}
          <motion.div
            className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl shadow-2xl p-8 md:p-16 border border-slate-700/50 relative overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            {/* Premium Background Elements */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            </div>

            <div className="relative">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  See the Magic in Action
                </h2>
                <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                  Watch how natural conversations flow seamlessly across different languages
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                {/* Premium Chat Interface */}
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <div className="space-y-8">
                    {/* Message from User 1 */}
                    <motion.div
                      className="flex justify-start"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 1.8 }}
                    >
                      <div className="bg-white rounded-3xl rounded-bl-lg p-6 max-w-md shadow-xl">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-bold">A</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-700">Alex</span>
                            <div className="flex items-center text-xs text-slate-500">
                              <Globe className="w-3 h-3 mr-1" />
                              <span>🇺🇸 New York</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-slate-900 font-medium text-lg">
                          "Hey! I'm planning a trip to Tokyo next month. Any recommendations for great local food?"
                        </p>
                      </div>
                    </motion.div>

                    {/* AI Translation Indicator */}
                    <motion.div
                      className="flex justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 2.2 }}
                    >
                      <div className="bg-blue-500/20 backdrop-blur-sm rounded-full px-8 py-4 flex items-center space-x-4 border border-blue-400/30">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-100"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200"></div>
                        </div>
                        <span className="text-blue-200 font-medium">AI translating to Japanese...</span>
                        <Sparkles className="w-5 h-5 text-blue-400" />
                      </div>
                    </motion.div>

                    {/* Response from User 2 */}
                    <motion.div
                      className="flex justify-end"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 2.6 }}
                    >
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-3xl rounded-br-lg p-6 max-w-md shadow-xl">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-bold">Y</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-blue-100">Yuki</span>
                            <div className="flex items-center text-xs text-blue-200">
                              <Globe className="w-3 h-3 mr-1" />
                              <span>🇯🇵 Tokyo</span>
                            </div>
                          </div>
                        </div>
                        <p className="mb-4 font-medium text-lg">
                          "こんにちは！東京への旅行、素晴らしいですね！築地市場の新鮮な寿司と、渋谷の美味しいラーメン店をぜひ試してください。"
                        </p>
                        <div className="bg-white/10 rounded-2xl p-4">
                          <p className="text-blue-100 text-sm italic leading-relaxed">
                            🤖 Auto-translated: "Hello! A trip to Tokyo sounds wonderful! You should definitely try the fresh sushi at Tsukiji Market and the delicious ramen shops in Shibuya."
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Premium Stats */}
                <motion.div
                  className="grid grid-cols-3 gap-8 mt-16 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 3.0 }}
                >
                  <div className="p-6">
                    <div className="text-4xl font-bold text-white mb-2">0.3s</div>
                    <div className="text-slate-300">Translation Speed</div>
                  </div>
                  <div className="p-6">
                    <div className="text-4xl font-bold text-white mb-2">99.9%</div>
                    <div className="text-slate-300">Accuracy Rate</div>
                  </div>
                  <div className="p-6">
                    <div className="text-4xl font-bold text-white mb-2">24/7</div>
                    <div className="text-slate-300">Always Available</div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Social Proof Section */}
          <motion.div
            className="mt-24 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 3.2 }}
          >
            <p className="text-slate-500 mb-8 text-lg">Trusted by millions of users worldwide</p>
            <div className="flex justify-center items-center space-x-12 opacity-40">
              <div className="text-2xl font-bold text-slate-400">★★★★★</div>
              <div className="text-lg text-slate-400">4.9/5 Rating</div>
              <div className="text-lg text-slate-400">10M+ Downloads</div>
              <div className="text-lg text-slate-400">150+ Countries</div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
