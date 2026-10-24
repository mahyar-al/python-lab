import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowLeft, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { adminApi, AdminApiError } from '../../lib/adminApi';

interface AdminLoginProps {
  onLoginSuccess: (token: string) => void;
  initialMessage?: string;
  onBackToSite: () => void;
  dark?: boolean;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  initialMessage,
  onBackToSite
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialMessage || '');
  const [isRateLimited, setIsRateLimited] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage('');
    setIsRateLimited(false);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('لطفاً نام کاربری و رمز عبور را وارد فرمایید.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await adminApi.login(username, password);
      if (res && res.token) {
        onLoginSuccess(res.token);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'نام کاربری یا رمز عبور نامعتبر است.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#E4F5FF] text-[#111110]">
      <div className="w-full max-w-md rounded-[28px] border p-8 sm:p-10 text-right shadow-[0_20px_60px_rgba(17,17,16,0.08)] relative bg-[#FFFFFF] border-[#BFDDF0]">
        
        {/* Top Back to site button */}
        <button
          onClick={onBackToSite}
          className="absolute top-6 left-6 p-2 rounded-xl text-[#4A5560] hover:bg-[#D3ECFA]/50 transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="بازگشت به فروشگاه"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">مشاهده سایت</span>
        </button>

        {/* Brand Monogram & Title */}
        <div className="flex flex-col items-center text-center mb-8 pt-2">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-[#BFDDF0] shadow-sm mb-4 bg-[#E4F5FF]">
            <img
              src="/brand/morico-logo.jpg"
              alt="MORICO STYLE"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-serif text-xs brand-tracking text-[#4A5560] uppercase block">
            MORICO ATELIER · 2026
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#111110] mt-1">
            ورود به پنل مدیریت آتلیه
          </h1>
          <p className="text-xs text-[#4A5560] mt-1.5">
            جهت دسترسی به کاتالوگ چنددسته‌ای، سفارشات و تنظیمات فروشگاه
          </p>
        </div>

        {/* Error / Notice Banner */}
        {errorMessage && (
          <div className={`mb-6 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
            isRateLimited
              ? 'bg-[#9A6B1F]/10 border-[#9A6B1F]/30 text-[#9A6B1F]'
              : 'bg-[#A33A3A]/10 border-[#A33A3A]/30 text-[#A33A3A]'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Form - Absolutely NO pre-filled credentials */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-[#111110] mb-1.5">
              نام کاربری یا ایمیل مدیر:
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@morico.style یا admin"
                disabled={isLoading}
                className="w-full px-4 py-3 pl-10 text-sm border rounded-xl focus:outline-none transition-all dir-ltr text-left font-mono bg-[#FFFFFF] border-[#BFDDF0] text-[#111110] focus:border-[#111110]"
              />
              <User className="w-4 h-4 text-[#4A5560] absolute left-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111110] mb-1.5">
              رمز عبور:
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isLoading}
                className="w-full px-4 py-3 pl-10 text-sm border rounded-xl focus:outline-none transition-all dir-ltr text-left bg-[#FFFFFF] border-[#BFDDF0] text-[#111110] focus:border-[#111110]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 p-1 text-[#4A5560] hover:text-[#111110]"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium transition-all shadow-[0_8px_24px_rgba(17,17,16,0.12)] active:scale-[0.98] bg-[#111110] text-[#FFFFFF] hover:bg-[#2A2A28] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال اعتبارسنجی امنیتی...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>ورود به سیستم مدیریت</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-5 border-t border-[#BFDDF0] text-center text-xs text-[#4A5560] space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E4F5FF] border border-[#BFDDF0] text-[11px] font-medium text-[#111110]">
            <Shield className="w-3.5 h-3.5" />
            <span>سامانه امنیتی آتلیه MORICO STYLE</span>
          </div>
          <p className="text-[11px] text-[#4A5560] leading-relaxed">
            دسترسی به این بخش نیازمند مجوز مدیریت معتبر است. کلیه درخواست‌ها و تلاش‌های ورود در سامانه پایش امنیتی می‌شوند.
          </p>
        </div>

      </div>
    </div>
  );
};
