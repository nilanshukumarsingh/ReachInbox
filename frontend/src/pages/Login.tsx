import React, { useState } from 'react';
import { GoogleIcon } from '../components/icons/FigmaIcons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { login, googleLogin } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('oliver.brown@domain.io');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      showToast('Welcome back, Oliver Brown!', 'success');
      onLoginSuccess();
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await googleLogin({
        email: 'oliver.brown@domain.io',
        name: 'Oliver Brown',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        googleId: 'google-oauth-10928374',
      });
      showToast('Signed in with Google OAuth!', 'success');
      onLoginSuccess();
    } catch (err: any) {
      showToast('Google login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] flex items-center justify-center p-6 select-none">
      {/* Centered Login Card matching Figma: 1440x900 view */}
      <div className="w-full max-w-[420px] bg-white rounded-3xl border border-[#EAECF0] shadow-sm p-10 flex flex-col items-center">
        {/* Title matching Figma */}
        <h1 className="text-2xl font-bold text-[#1E293B] mb-8">Login</h1>

        {/* Google Login Button matching Figma */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-[#E8F5E9] hover:bg-[#D8F3DC] border border-[#C8E6C9] text-xs font-medium text-[#1E293B] flex items-center justify-center gap-2.5 transition active:scale-[0.99]"
        >
          <GoogleIcon className="w-4 h-4" />
          <span>Login with Google</span>
        </button>

        {/* Divider matching Figma: "or sign up through email" */}
        <div className="w-full flex items-center my-6">
          <div className="flex-1 h-[1px] bg-[#E2E8F0]" />
          <span className="px-3 text-[11px] text-[#94A3B8] font-normal">
            or sign up through email
          </span>
          <div className="flex-1 h-[1px] bg-[#E2E8F0]" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailLogin} className="w-full flex flex-col gap-4">
          {/* Email ID input matching Figma */}
          <div>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email ID"
              className="w-full bg-[#F1F5F9] border-none rounded-xl px-4 py-3 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#00A343] transition"
              required
            />
          </div>

          {/* Password input matching Figma */}
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-[#F1F5F9] border-none rounded-xl px-4 py-3 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#00A343] transition"
              required
            />
          </div>

          {/* Solid Green Login Button matching Figma */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-[#00A343] hover:bg-[#008e3a] active:bg-[#007a32] text-white text-xs font-semibold shadow-sm transition flex items-center justify-center"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};
