'use client'

import { UserProfile, UserButton, SignOutButton, useUser, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Settings as SettingsIcon,
  Shield,
  Bell,
  Globe,
  LogOut,
  Loader2,
  Check,
  Search,
  MessageCircle,
  Zap,
  Volume2,
  VolumeX,
  Smartphone,
  Laptop
} from 'lucide-react';
import { useState } from 'react';
import { SUPPORTED_LANGUAGES } from '@/lib/translation';
import { useLanguageSync } from '../../../hooks/useLanguageSync';


export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [languageSearch, setLanguageSearch] = useState('');

  const [notifications, setNotifications] = useState({
    messages: true,
    translations: true,
    sounds: true,
    desktop: true,
    mobile: true
  });

  // 🌐 Real-time Language Synchronization
  const {
    currentLanguage,
    isLoading: isUpdatingLanguage,
    error: languageError,
    updatePrimaryLanguage,
    isRealTimeConnected
  } = useLanguageSync({
    onLanguageChanged: (language) => {
      console.log('✅ Language preference updated:', language);
    },
    onSyncError: (error) => {
      console.error('❌ Language sync error:', error);
    }
  });

  // Update user language preference using the new hook
  const updateLanguage = async (languageCode: string) => {
    const success = await updatePrimaryLanguage(languageCode);
    if (!success) {
      alert('Failed to update language preference');
    }
  };



  const settingsTabs = [
    { id: 'profile', label: 'Profile & Account', icon: User },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'language', label: 'Language & Region', icon: Globe },
  ];

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>

      <SignedIn>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 dark:text-slate-100 transition-colors duration-300">
          {/* Premium Header */}
          <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4 shadow-sm transition-colors duration-300">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Messages</span>
            </Link>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600"></div>
            <div className="flex items-center space-x-3">
              <SettingsIcon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <SignOutButton redirectUrl="/">
              <button className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </SignOutButton>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main Settings Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 transition-colors duration-300">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Settings Menu</h2>
              <nav className="space-y-2">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </motion.button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden transition-colors duration-300">
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-8"
                >
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Profile & Account</h3>
                    <p className="text-slate-600">Manage your account information and preferences</p>
                  </div>



                  {/* Clerk User Profile Component */}
                  <div className="rounded-2xl overflow-hidden border border-slate-200/50">
                    {user && isLoaded ? (
                      <UserProfile
                        appearance={{
                          elements: {
                            rootBox: "w-full",
                            card: "shadow-none border-0 bg-transparent",
                            navbar: "bg-slate-50/50",
                            navbarButton: "text-slate-700 hover:bg-white/50",
                            navbarButtonActive: "bg-blue-50 text-blue-700",
                            headerTitle: "text-slate-900 font-semibold",
                            headerSubtitle: "text-slate-600",
                            formButtonPrimary: "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600",
                            formFieldInput: "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20",
                            dividerLine: "bg-slate-200",
                            dividerText: "text-slate-500",
                          }
                        }}
                      />
                    ) : (
                      <div className="p-8 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-slate-600">Loading user profile...</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'privacy' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-8"
                >
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Privacy & Security</h3>
                    <p className="text-slate-600">Control your privacy settings and security preferences</p>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-50 rounded-xl p-6">
                      <h4 className="font-semibold text-slate-900 mb-4">Translation Privacy</h4>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between">
                          <span className="text-slate-700">Save translation history</span>
                          <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-slate-700">Allow message analytics</span>
                          <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        </label>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6">
                      <h4 className="font-semibold text-slate-900 mb-4">Account Security</h4>
                      <p className="text-slate-600 mb-4">Manage your password, two-factor authentication, and other security settings through your Clerk account above.</p>
                      <div className="flex items-center space-x-2 text-emerald-600">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-medium">Your account is secure</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'language' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-8"
                >
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Language & Region</h3>
                    <p className="text-slate-600">Choose from our collection of {SUPPORTED_LANGUAGES.length}+ supported languages</p>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                      <div className="flex items-center space-x-3 mb-4">
                        <Globe className="w-6 h-6 text-blue-600" />
                        <h4 className="text-lg font-semibold text-slate-900">Translation Language</h4>
                      </div>
                      <p className="text-slate-600 mb-4">
                        Messages sent to you will be automatically translated to your selected language.
                        Your messages will be translated to the recipient's language.
                      </p>

                      <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-blue-800 text-sm">
                            <strong>Current Language:</strong> {SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage.primary)?.name || 'English'} ({SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage.primary)?.nativeName || 'English'})
                          </p>
                          <div className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                            {SUPPORTED_LANGUAGES.length}+ Languages
                          </div>
                        </div>
                        <p className="text-blue-700 text-xs mt-1">
                          Translation will occur when you and your conversation partner have different language preferences.
                        </p>
                        {isRealTimeConnected && (
                          <p className="text-green-700 text-xs mt-1 flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Real-time sync enabled
                          </p>
                        )}
                      </div>

                      {/* Search Bar */}
                      <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search languages..."
                          value={languageSearch}
                          onChange={(e) => setLanguageSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                        {SUPPORTED_LANGUAGES
                          .filter(language =>
                            language.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
                            language.nativeName.toLowerCase().includes(languageSearch.toLowerCase()) ||
                            language.code.toLowerCase().includes(languageSearch.toLowerCase())
                          )
                          .map((language) => (
                          <button
                            key={language.code}
                            onClick={() => updateLanguage(language.code)}
                            disabled={isUpdatingLanguage}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                              currentLanguage.primary === language.code
                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                            } ${isUpdatingLanguage ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                  {language.code.toUpperCase().slice(0, 2)}
                                </div>
                                <div>
                                  <div className="font-medium">{language.name}</div>
                                  <div className="text-sm opacity-75">{language.nativeName}</div>
                                </div>
                              </div>
                              {currentLanguage.primary === language.code && (
                                <Check className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                          </button>
                        ))}

                        {/* No Results */}
                        {SUPPORTED_LANGUAGES.filter(language =>
                          language.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
                          language.nativeName.toLowerCase().includes(languageSearch.toLowerCase()) ||
                          language.code.toLowerCase().includes(languageSearch.toLowerCase())
                        ).length === 0 && languageSearch && (
                          <div className="col-span-full p-8 text-center text-slate-500">
                            <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No languages found matching "{languageSearch}"</p>
                            <button
                              onClick={() => setLanguageSearch('')}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
                            >
                              Clear search
                            </button>
                          </div>
                        )}
                      </div>

                      {isUpdatingLanguage && (
                        <div className="mt-4 flex items-center justify-center space-x-2 text-blue-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Updating language preference...</span>
                        </div>
                      )}
                    </div>

                    {/* Popular Languages Quick Access */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200/50">
                      <h4 className="font-semibold text-emerald-900 mb-4 flex items-center space-x-2">
                        <Zap className="w-5 h-5" />
                        <span>Popular Languages</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'].map(code => {
                          const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
                          if (!lang) return null;
                          return (
                            <button
                              key={code}
                              onClick={() => updateLanguage(code)}
                              disabled={isUpdatingLanguage}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                currentLanguage.primary === code
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {lang.code.toUpperCase().slice(0, 1)}
                              </div>
                              <span>{lang.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Translation Features */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50">
                      <h4 className="font-semibold text-blue-900 mb-4 flex items-center space-x-2">
                        <Globe className="w-5 h-5" />
                        <span>Translation Features</span>
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="bg-white rounded-lg p-3 border border-blue-200/30">
                          <div className="text-2xl font-bold text-blue-700">{SUPPORTED_LANGUAGES.length}+</div>
                          <div className="text-sm text-blue-600">Languages</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-blue-200/30">
                          <div className="text-2xl font-bold text-blue-700">AI</div>
                          <div className="text-sm text-blue-600">Powered</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-blue-200/30">
                          <div className="text-2xl font-bold text-blue-700">⚡</div>
                          <div className="text-sm text-blue-600">Real-time</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-blue-200/30">
                          <div className="text-2xl font-bold text-blue-700">24/7</div>
                          <div className="text-sm text-blue-600">Available</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6">
                      <h4 className="font-semibold text-slate-900 mb-4">How Translation Works</h4>
                      <div className="space-y-3 text-slate-600">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <p>Messages are automatically translated when you and the recipient have different language preferences</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <p>Both the original and translated versions are displayed for clarity</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <p>Translation is powered by advanced AI to ensure accuracy and context</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-8"
                >
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Notifications</h3>
                    <p className="text-slate-600">Customize how you receive notifications and alerts</p>
                  </div>

                  <div className="space-y-6">
                    {/* Message Notifications */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                      <div className="flex items-center space-x-3 mb-4">
                        <MessageCircle className="w-6 h-6 text-blue-600" />
                        <h4 className="text-lg font-semibold text-slate-900">Message Notifications</h4>
                      </div>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Bell className="w-5 h-5 text-slate-500" />
                            <span className="text-slate-700">New message alerts</span>
                          </div>
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={notifications.messages}
                            onChange={(e) => setNotifications(prev => ({ ...prev, messages: e.target.checked }))}
                          />
                        </label>
                        <label className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Globe className="w-5 h-5 text-slate-500" />
                            <span className="text-slate-700">Translation notifications</span>
                          </div>
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={notifications.translations}
                            onChange={(e) => setNotifications(prev => ({ ...prev, translations: e.target.checked }))}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Sound & Device Notifications */}
                    <div className="bg-slate-50 rounded-xl p-6">
                      <h4 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <Volume2 className="w-5 h-5" />
                        <span>Sound & Device Settings</span>
                      </h4>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {notifications.sounds ? <Volume2 className="w-5 h-5 text-slate-500" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
                            <span className="text-slate-700">Sound notifications</span>
                          </div>
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={notifications.sounds}
                            onChange={(e) => setNotifications(prev => ({ ...prev, sounds: e.target.checked }))}
                          />
                        </label>
                        <label className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Laptop className="w-5 h-5 text-slate-500" />
                            <span className="text-slate-700">Desktop notifications</span>
                          </div>
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={notifications.desktop}
                            onChange={(e) => setNotifications(prev => ({ ...prev, desktop: e.target.checked }))}
                          />
                        </label>
                        <label className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Smartphone className="w-5 h-5 text-slate-500" />
                            <span className="text-slate-700">Mobile push notifications</span>
                          </div>
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={notifications.mobile}
                            onChange={(e) => setNotifications(prev => ({ ...prev, mobile: e.target.checked }))}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Notification Preview */}
                    <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200/50">
                      <h4 className="font-semibold text-emerald-900 mb-3 flex items-center space-x-2">
                        <Zap className="w-5 h-5" />
                        <span>Real-time Features</span>
                      </h4>
                      <div className="space-y-2 text-emerald-800">
                        <div className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span>Instant message delivery</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span>Real-time translation updates</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span>Online status synchronization</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}





              {/* Fallback for other tabs */}
              {!['profile', 'privacy', 'language', 'notifications'].includes(activeTab) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 text-center"
                >
                  <div className="text-slate-400 mb-4">
                    <SettingsIcon className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Coming Soon</h3>
                  <p className="text-slate-600">This settings section is under development.</p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
      </SignedIn>
    </>
  );
}
