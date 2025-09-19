import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useTranslationStore } from "../store/useTranslationStore";
import { User, Lock, Globe, Key, Save, TestTube, Eye, EyeOff, Camera, Upload } from "lucide-react";
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
  const [profilePicPreview, setProfilePicPreview] = useState(authUser?.profilePic || "");
  const fileInputRef = useRef(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // Translation settings state - sync with store
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result;
      setProfilePic(base64String);
      setProfilePicPreview(base64String);
    };
    reader.readAsDataURL(file);
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
          preferredLanguage: userPreferredLanguage,
          autoTranslateEnabled: autoTranslateEnabled,
          openaiApiKey: customApiKey || null
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Translation settings updated!");
        // Settings are now updated via the store's database-driven setters
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
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-slate-100 mb-8 flex items-center">
          <User className="w-8 h-8 text-cyan-400 mr-3" />
          Settings
        </h1>

        <div className="space-y-8">
          {/* Profile Settings */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
            <div className="flex items-center mb-6">
              <User className="w-6 h-6 text-cyan-400 mr-3" />
              <h2 className="text-xl font-semibold text-slate-100">Profile Settings</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-700 border-2 border-slate-600">
                      {profilePicPreview ? (
                        <img
                          src={profilePicPreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-cyan-500 hover:bg-cyan-600 rounded-full flex items-center justify-center transition-colors"
                    >
                      <Camera className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New Picture
                    </button>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG up to 5MB</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-slate-700/50 text-slate-100 placeholder-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={authUser?.email || ""}
                  disabled
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700/30 text-slate-400"
                />
                <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="flex items-center px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-400 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {isUpdatingProfile ? "Updating..." : "Update Profile"}
              </button>
            </form>
          </div>

          {/* Password Settings */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
            <div className="flex items-center mb-6">
              <Lock className="w-6 h-6 text-pink-400 mr-3" />
              <h2 className="text-xl font-semibold text-slate-100">Change Password</h2>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-slate-700/50 text-slate-100 placeholder-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-slate-700/50 text-slate-100 placeholder-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-slate-700/50 text-slate-100 placeholder-slate-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="flex items-center px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-400 text-white rounded-lg transition-colors"
              >
                <Lock className="w-4 h-4 mr-2" />
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* Translation Settings */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
            <div className="flex items-center mb-6">
              <Globe className="w-6 h-6 text-cyan-400 mr-3" />
              <h2 className="text-xl font-semibold text-slate-100">Translation Settings</h2>
            </div>

            <form onSubmit={handleUpdateTranslationSettings} className="space-y-6">
              {/* Preferred Language */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Preferred Language
                </label>
                <LanguageSelector
                  selectedLanguage={userPreferredLanguage}
                  onLanguageChange={setUserPreferredLanguage}
                  label="Select your preferred language for auto-translation"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Messages will be auto-translated to this language when you use the ⚡ button
                </p>
              </div>

              {/* Auto-translate Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                <div>
                  <label className="text-sm font-medium text-slate-200">
                    Auto-translate incoming messages
                  </label>
                  <p className="text-xs text-slate-400">
                    Automatically translate received messages to your preferred language
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoTranslateEnabled(!autoTranslateEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoTranslateEnabled ? 'bg-cyan-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoTranslateEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Custom OpenAI API Key */}
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-200 flex items-center">
                    <Key className="w-4 h-4 mr-2 text-cyan-400" />
                    Custom OpenAI API Key (Optional)
                  </label>
                  {hasCustomApiKey && (
                    <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full border border-cyan-500/30">
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
                      className="w-full px-3 py-2 pr-20 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-slate-800/50 text-slate-100 placeholder-slate-400"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-slate-400 hover:text-slate-300 p-1"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleTestApiKey}
                        disabled={!customApiKey.trim() || isTestingApiKey}
                        className="text-cyan-400 hover:text-cyan-300 disabled:text-slate-500 p-1"
                        title="Test API key"
                      >
                        <TestTube className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 bg-slate-800/30 p-3 rounded border border-slate-600/20">
                    <p>• If provided, your API key will be used with <strong>highest priority</strong></p>
                    <p>• This gives you unlimited rate limits and fastest response times</p>
                    <p>• Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">OpenAI Platform</a></p>
                    <p>• Leave empty to use our shared translation service</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingTranslation}
                className="flex items-center px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-400 text-white rounded-lg transition-colors"
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
