import React, { useState } from 'react';
import { User } from '../lib/types';
import { adminApi, setAdminToken } from '../lib/adminApi';
import { X, User as UserIcon, Lock, Phone, Mail, Shield, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const u = username.trim();
      const p = password.trim();

      if (!u || !p) {
        setError('لطفاً نام کاربری و رمز عبور را وارد فرمایید.');
        setIsLoading(false);
        return;
      }

      // Check if user is logging in as admin
      if (u.toLowerCase().includes('admin')) {
        try {
          const res = await adminApi.login(u, p);
          if (res && res.token) {
            const adminUser: User = {
              id: res.user?.id || 'usr-admin-01',
              name: res.user?.name || 'مدیر ارشد آتلیه',
              email: res.user?.email || u,
              phone: res.user?.phone || '۰۹۱۲۲۲۰۸۹۴۱',
              role: 'admin',
              token: res.token
            };
            onLoginSuccess(adminUser);
            onClose();
            return;
          }
        } catch (adminErr: any) {
          // If admin login failed specifically
          setError(adminErr.message || 'نام کاربری یا رمز عبور نامعتبر است.');
          setIsLoading(false);
          return;
        }
      }

      // Customer login via secure API
      const response = await fetch('/api/auth/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username: u, password: p })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || 'نام کاربری یا رمز عبور نامعتبر است.');
        setIsLoading(false);
        return;
      }

      const loggedUser: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role,
        token: data.token
      };

      onLoginSuccess(loggedUser);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'خطا در برقراری ارتباط با سرور.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !phone.trim() || !password.trim()) {
      setError('لطفاً تمامی فیلدهای الزامی را تکمیل فرمایید.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          phone: phone.trim(),
          username: phone.trim(),
          password: password.trim(),
          name: name.trim(),
          email: email.trim() || undefined
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'خطا در ثبت‌نام کاربر.');
        return;
      }

      const newUser: User = {
        id: data.user.id,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        role: 'user',
        token: data.token
      };

      onLoginSuccess(newUser);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'خطا در ارتباط با سرور.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#BFDDF0] rounded-[24px] w-full max-w-md overflow-hidden text-right shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-gray-500 hover:text-black hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="p-6 border-b border-[#BFDDF0] bg-white">
          <span className="font-serif text-xs brand-tracking text-[#4A5560] uppercase block mb-1">
            MORICO ATELIER MEMBERSHIP
          </span>
          <h2 className="text-xl font-bold text-[#111110]">
            {tab === 'login' ? 'ورود به حساب کاربری' : 'عضویت در باشگاه مشتریان'}
          </h2>

          <div className="flex bg-[#E4F5FF] p-1 rounded-xl mt-4 border border-[#BFDDF0]/60">
            <button
              onClick={() => { setTab('login'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'login'
                  ? 'bg-white text-[#111110] shadow-sm'
                  : 'text-[#4A5560] hover:text-[#111110]'
              }`}
            >
              ورود به حساب
            </button>
            <button
              onClick={() => { setTab('register'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'register'
                  ? 'bg-white text-[#111110] shadow-sm'
                  : 'text-[#4A5560] hover:text-[#111110]'
              }`}
            >
              ثبت‌نام جدید
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[#A33A3A]/10 border border-[#A33A3A]/20 text-[#A33A3A] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium mb-1.5 text-[#111110]">شماره همراه یا ایمیل</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹ یا name@domain.com"
                    className="w-full px-3.5 py-2.5 pr-10 border border-[#BFDDF0] rounded-xl focus:outline-none focus:border-[#111110]"
                  />
                  <UserIcon className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1.5 text-[#111110]">رمز عبور</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 border border-[#BFDDF0] rounded-xl focus:outline-none focus:border-[#111110] dir-ltr text-right"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#111110] text-white hover:bg-[#2A2A28] font-semibold text-xs transition-colors mt-2 disabled:opacity-50"
              >
                {isLoading ? 'در حال ورود امن...' : 'ورود به حساب'}
              </button>

              <div className="p-2.5 rounded-xl bg-[#E4F5FF]/40 border border-[#BFDDF0]/60 text-[11px] text-[#4A5560] leading-relaxed flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#111110] shrink-0" />
                <span>کلیه اطلاعات شما با استانداردهای امنیتی رمزنگاری محافظت می‌گردد.</span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1 text-[#111110]">نام و نام خانوادگی *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: سارا تهرانی"
                  className="w-full px-3.5 py-2.5 border border-[#BFDDF0] rounded-xl focus:outline-none focus:border-[#111110]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-[#111110]">شماره تلفن همراه *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="w-full px-3.5 py-2.5 border border-[#BFDDF0] rounded-xl focus:outline-none focus:border-[#111110] dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-[#111110]">ایمیل (اختیاری)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sara@example.com"
                  className="w-full px-3.5 py-2.5 border border-[#BFDDF0] rounded-xl focus:outline-none focus:border-[#111110] dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-[#111110]">تعیین رمز عبور *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                  className="w-full px-3.5 py-2.5 border border-[#BFDDF0] rounded-xl focus:outline-none focus:border-[#111110] dir-ltr text-right"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#111110] text-white hover:bg-[#2A2A28] font-semibold text-xs transition-colors mt-3 disabled:opacity-50"
              >
                {isLoading ? 'در حال ثبت اطلاعات...' : 'تکمیل عضویت'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
