import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#00A343] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-gray-500">Loading ReachInbox...</span>
        </div>
      </div>
    );
  }

  if (!user && !isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return <Dashboard />;
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
