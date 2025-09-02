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
  Palette,
  HelpCircle,
  LogOut,
  Loader2,
  Check
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from '@/lib/translation';

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [userLanguage, setUserLanguage] = useState('en');
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);

  // Load user language preference
  useEffect(() => {
    if (user?.id) {
      fetch('/api/user/language')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUserLanguage(data.language);
          }
        })
        .catch(err => console.error('Error loading language preference:', err));
    }
  }, [user?.id]);

  // Update user language preference
  const updateLanguage = async (languageCode: string) => {
    setIsUpdatingLanguage(true);
    try {
      const response = await fetch('/api/user/language', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: languageCode })
      });

      if (response.ok) {
        setUserLanguage(languageCode);
        console.log(`✅ Language updated to: ${languageCode}`);
      } else {
        console.error('Failed to update language');
        alert('Failed to update language preference');
      }
    } catch (error) {
      console.error('Error updating language:', error);
      alert('Error updating language preference');
    } finally {
      setIsUpdatingLanguage(false);
    }
  };



  const settingsTabs = [
    { id: 'profile', label: 'Profile & Account', icon: User },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'language', label: 'Language & Region', icon: Globe },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          {/* Premium Header */}
          <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/50 px-6 py-4 shadow-sm">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Messages</span>
            </Link>
            <div className="h-6 w-px bg-slate-300"></div>
            <div className="flex items-center space-x-3">
              <SettingsIcon className="w-6 h-6 text-slate-700" />
              <h1 className="text-xl font-bold text-slate-900">Settings</h1>
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
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Settings Menu</h2>
              <nav className="space-y-2">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
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

                  {/* User Info Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-200/50">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-slate-900">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user?.username || 'User'
                          }
                        </h4>
                        <p className="text-slate-600">{user?.emailAddresses[0]?.emailAddress}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span className="text-sm text-slate-500">Account Active</span>
                        </div>
                      </div>
                    </div>
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
                    <p className="text-slate-600">Choose your preferred language for message translation</p>
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
                        <p className="text-blue-800 text-sm">
                          <strong>Current Language:</strong> {SUPPORTED_LANGUAGES.find(lang => lang.code === userLanguage)?.name || 'English'} ({SUPPORTED_LANGUAGES.find(lang => lang.code === userLanguage)?.nativeName || 'English'})
                        </p>
                        <p className="text-blue-700 text-xs mt-1">
                          Translation will occur when you and your conversation partner have different language preferences.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {SUPPORTED_LANGUAGES.map((language) => (
                          <button
                            key={language.code}
                            onClick={() => updateLanguage(language.code)}
                            disabled={isUpdatingLanguage}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                              userLanguage === language.code
                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                            } ${isUpdatingLanguage ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{language.name}</div>
                                <div className="text-sm opacity-75">{language.nativeName}</div>
                              </div>
                              {userLanguage === language.code && (
                                <Check className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>

                      {isUpdatingLanguage && (
                        <div className="mt-4 flex items-center justify-center space-x-2 text-blue-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Updating language preference...</span>
                        </div>
                      )}
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

              {/* Add other tabs content here */}
              {activeTab !== 'profile' && activeTab !== 'privacy' && activeTab !== 'language' && (
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
