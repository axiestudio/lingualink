import { Navigate, Route, Routes } from "react-router";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import SettingsPage from "./pages/SettingsPage";
import { useAuthStore } from "./store/useAuthStore";
import { useTranslationStore } from "./store/useTranslationStore";
import { useEffect } from "react";
import PageLoader from "./components/PageLoader";
import keepAliveService from "./services/keepAliveService";

import { Toaster } from "react-hot-toast";

function App() {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();
  const { fetchSupportedLanguages, loadUserSettings, settingsLoaded } = useTranslationStore();

  useEffect(() => {
    checkAuth();

    // Start keep-alive service for Render free tier
    console.log("🚀 Starting keep-alive service to prevent backend sleeping");
    keepAliveService.start();

    // Cleanup on unmount
    return () => {
      keepAliveService.stop();
    };
  }, [checkAuth]);

  // Fetch supported languages only after successful authentication
  useEffect(() => {
    if (authUser && !isCheckingAuth) {
      fetchSupportedLanguages();
    }
  }, [authUser, isCheckingAuth, fetchSupportedLanguages]);

  // Load user settings when authenticated
  useEffect(() => {
    if (authUser && !settingsLoaded) {
      console.log("🔄 User authenticated, loading settings...");
      loadUserSettings();
    }
  }, [authUser, settingsLoaded, loadUserSettings]);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="min-h-screen bg-slate-900 relative flex items-center justify-center p-4 overflow-hidden">
      {/* DECORATORS - GRID BG & GLOW SHAPES */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="absolute top-0 -left-4 size-96 bg-pink-500 opacity-20 blur-[100px]" />
      <div className="absolute bottom-0 -right-4 size-96 bg-cyan-500 opacity-20 blur-[100px]" />

      <Routes>
        <Route path="/" element={authUser ? <ChatPage /> : <Navigate to={"/login"} />} />
        <Route path="/settings" element={authUser ? <SettingsPage /> : <Navigate to={"/login"} />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to={"/"} />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />} />
      </Routes>

      <Toaster />
    </div>
  );
}
export default App;
