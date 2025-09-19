import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useTranslationStore } from "../store/useTranslationStore";
import { User, Lock, Globe, Key, Save, TestTube, Eye, EyeOff } from "lucide-react";
import LanguageSelector from "../components/LanguageSelector";
import toast from "react-hot-toast";

const SettingsPage = () => {
  const { authUser, updateProfile } = useAuthStore();
  const { 
    userPreferredLanguage, 
    autoTranslateEnabled,
    setUserPreferredLanguage,
    setAutoTranslateEnabled 
  } = useTranslationStore();

  // Profile state
  const [fullName, setFullName] = useState(authUser?.fullName || "");
  const [profilePic, setProfilePic] = useState(authUser?.profilePic || "");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // Translation settings state
  const [preferredLanguage, setPreferredLanguage] = useState(userPreferredLanguage || "en");
  const [autoTranslate, setAutoTranslate] = useState(autoTranslateEnabled || false);
  const [customApiKey, setCustomApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasCustomApiKey, setHasCustomApiKey] = useState(false);

  // Loading states
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingTranslation, setIsUpdatingTranslation] = useState(false);
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const response = await fetch("/api/settings/profile", {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setHasCustomApiKey(data.settings.hasCustomApiKey);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fullName: fullName.trim(), profilePic })
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Profile updated successfully!");
        updateProfile(data.profile);
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to update password");
      }
    } catch (error) {
      toast.error("Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateTranslationSettings = async (e) => {
    e.preventDefault();
    setIsUpdatingTranslation(true);
    
    try {
      const response = await fetch("/api/settings/translation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          preferredLanguage,
          autoTranslateEnabled: autoTranslate,
          openaiApiKey: customApiKey || null
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Translation settings updated!");
        setUserPreferredLanguage(preferredLanguage);
        setAutoTranslateEnabled(autoTranslate);
        setHasCustomApiKey(!!customApiKey);
      } else {
        toast.error(data.error || "Failed to update settings");
      }
    } catch (error) {
      toast.error("Failed to update translation settings");
    } finally {
      setIsUpdatingTranslation(false);
    }
  };

  const handleTestApiKey = async () => {
    if (!customApiKey.trim()) {
      toast.error("Please enter an API key to test");
      return;
    }

    setIsTestingApiKey(true);
    try {
      const response = await fetch("/api/settings/test-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ apiKey: customApiKey })
      });

      const data = await response.json();
      if (data.success) {
        toast.success("✅ API key is valid and working!");
      } else {
        toast.error(`❌ ${data.error}`);
      }
    } catch (error) {
      toast.error("Failed to test API key");
    } finally {
      setIsTestingApiKey(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Settings</h1>

        <div className="space-y-8">
          {/* Profile Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <User className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Profile Settings</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={authUser?.email || ""}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {isUpdatingProfile ? "Updating..." : "Update Profile"}
              </button>
            </form>
          </div>

          {/* Password Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <Lock className="w-6 h-6 text-red-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Change Password</h2>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
              >
                <Lock className="w-4 h-4 mr-2" />
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* Translation Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <Globe className="w-6 h-6 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Translation Settings</h2>
            </div>

            <form onSubmit={handleUpdateTranslationSettings} className="space-y-6">
              {/* Preferred Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preferred Language
                </label>
                <LanguageSelector
                  selectedLanguage={preferredLanguage}
                  onLanguageChange={setPreferredLanguage}
                  label="Select your preferred language for auto-translation"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Messages will be auto-translated to this language when you use the ⚡ button
                </p>
              </div>

              {/* Auto-translate Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto-translate incoming messages
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Automatically translate received messages to your preferred language
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoTranslate(!autoTranslate)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoTranslate ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoTranslate ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Custom OpenAI API Key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Custom OpenAI API Key (Optional)
                  </label>
                  {hasCustomApiKey && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      ✅ Custom key active
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="sk-proj-..."
                      className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleTestApiKey}
                        disabled={!customApiKey.trim() || isTestingApiKey}
                        className="text-blue-500 hover:text-blue-600 disabled:text-gray-400 p-1"
                        title="Test API key"
                      >
                        <TestTube className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p>• If provided, your API key will be used instead of our shared keys</p>
                    <p>• This gives you higher rate limits and priority access</p>
                    <p>• Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">OpenAI Platform</a></p>
                    <p>• Leave empty to use our shared translation service</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingTranslation}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4 mr-2" />
                {isUpdatingTranslation ? "Updating..." : "Update Translation Settings"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
