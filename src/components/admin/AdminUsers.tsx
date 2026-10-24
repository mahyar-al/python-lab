import React, { useState } from 'react';
import { AdminUser } from '../../lib/types';
import { formatPersianNumber, formatPersianPhone } from '../../lib/currency';
import { formatJalaliDateTime } from '../../lib/dateUtils';
import { Plus, Trash2, X, AlertTriangle, Shield, User, Lock, Mail, Phone } from 'lucide-react';

interface AdminUsersProps {
  users: AdminUser[];
  currentUserId?: string;
  onCreateUser: (data: {
    name: string;
    email: string;
    password?: string;
    phone: string;
    role: 'admin' | 'user' | 'staff';
  }) => Promise<void>;
  onUpdateRole: (id: string, role: 'admin' | 'user' | 'staff') => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  dark?: boolean;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({
  users,
  currentUserId = 'usr-01',
  onCreateUser,
  onUpdateRole,
  onDeleteUser
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'user' | 'staff'>('user');

  // Deletion modal state
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [confirmInput, setConfirmInput] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) return;

    await onCreateUser({
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      phone: phone.trim(),
      role
    });

    setIsCreateOpen(false);
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setRole('user');
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    if (confirmInput.trim() !== 'حذف') {
      alert('لطفاً عبارت «حذف» را دقیقاً تایپ فرمایید.');
      return;
    }

    await onDeleteUser(userToDelete.id);
    setUserToDelete(null);
    setConfirmInput('');
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#111110]">
              مدیریت حساب مدیر آتلیه
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#111110] text-white text-[10px] font-bold">
              تک‌مدیر اختصاصی
            </span>
          </div>
          <span className="text-xs text-[#4A5560] block mt-1">
            دسترسی به بخش مدیریت منحصراً برای همین حساب تعریف شده است.
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E4F5FF] border border-[#BFDDF0] text-xs text-[#111110]">
          <Shield className="w-4 h-4 text-[#111110]" />
          <span>امنیت تک‌مدیر فعال است</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border bg-white border-[#BFDDF0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#E4F5FF]/50 border-b border-[#BFDDF0] text-[#4A5560]">
                <th className="py-3.5 px-4 font-semibold">نام و نام خانوادگی</th>
                <th className="py-3.5 px-4 font-semibold">ایمیل کاربری</th>
                <th className="py-3.5 px-4 font-semibold">شماره تماس</th>
                <th className="py-3.5 px-4 font-semibold">نقش و سطح دسترسی</th>
                <th className="py-3.5 px-4 font-semibold">آخرین ورود</th>
                <th className="py-3.5 px-4 font-semibold">تعداد ورود</th>
                <th className="py-3.5 px-4 font-semibold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#BFDDF0]/60">
              {users.map((usr) => {
                const isSelf = usr.id === currentUserId || usr.email === 'admin@morico.style';

                return (
                  <tr
                    key={usr.id}
                    className="hover:bg-[#D3ECFA]/20 transition-colors"
                  >
                    {/* Name */}
                    <td className="py-3.5 px-4 font-bold text-[#111110]">
                      <div className="flex items-center gap-2">
                        <span>{usr.name}</span>
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                            شما
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 font-mono dir-ltr text-right text-[#4A5560]">
                      {usr.email}
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 font-mono dir-ltr text-right text-[#4A5560]">
                      {formatPersianPhone(usr.phone)}
                    </td>

                    {/* Role Dropdown (Disabled for self to prevent self-demotion per spec) */}
                    <td className="py-3.5 px-4">
                      {isSelf ? (
                        <span className="px-2.5 py-1 rounded-lg border border-[#111110] text-[#111110] font-bold text-[11px] inline-block">
                          مدیر کل (غیرقابل تغییر)
                        </span>
                      ) : (
                        <select
                          value={usr.role}
                          onChange={(e) => onUpdateRole(usr.id, e.target.value as any)}
                          className="px-2.5 py-1 rounded-lg border border-[#BFDDF0] bg-transparent text-[#111110] text-[11px] font-medium cursor-pointer"
                        >
                          <option value="user">مشتری عادی (User)</option>
                          <option value="staff">همکار استودیو (Staff)</option>
                          <option value="admin">مدیر سیستم (Admin)</option>
                        </select>
                      )}
                    </td>

                    {/* Last Login */}
                    <td className="py-3.5 px-4 text-[#4A5560]">
                      {formatJalaliDateTime(usr.lastLogin)}
                    </td>

                    {/* Login Count */}
                    <td className="py-3.5 px-4 font-bold text-[#111110]">
                      {formatPersianNumber(usr.loginCount)} بار
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      {!isSelf && (
                        <button
                          onClick={() => {
                            setUserToDelete(usr);
                            setConfirmInput('');
                          }}
                          className="p-1.5 rounded-lg text-[#A33A3A] hover:bg-[#A33A3A]/10 transition-colors"
                          title="حذف کاربر و سفارشات وی"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Red Warning Delete User Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border-2 border-[#A33A3A] rounded-2xl p-6 sm:p-7 max-w-md w-full text-right shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-[#A33A3A]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-[#111110]">
                هشدار شدید امنیتی: حذف حساب کاربری {userToDelete.name}
              </h3>
            </div>

            <div className="p-3 bg-[#A33A3A]/10 border border-[#A33A3A]/30 rounded-xl text-xs text-[#A33A3A] font-medium leading-relaxed">
              توجه بسیار مهم: طبق پروتکل امنیتی سرور، با حذف این کاربر، <strong>تمامی سفارشات و فاکتورهای ثبت‌شده توسط این کاربر در دیتابیس نیز به طور کامل پاک خواهند شد.</strong>
            </div>

            <p className="text-xs text-[#4A5560]">
              جهت تایید قطعی، لطفاً عبارت <strong className="text-black">«حذف»</strong> را در کادر زیر تایپ نمایید:
            </p>

            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="حذف"
              className="w-full px-3.5 py-2.5 border border-[#A33A3A] rounded-xl text-center font-bold text-sm"
            />

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 border rounded-xl text-xs font-medium"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={confirmInput.trim() !== 'حذف'}
                onClick={handleDeleteConfirm}
                className="px-5 py-2 bg-[#A33A3A] text-white rounded-xl text-xs font-bold disabled:opacity-40"
              >
                تایید و حذف کامل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-[#BFDDF0] rounded-2xl p-6 max-w-md w-full text-right shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#BFDDF0]">
              <h3 className="text-base font-bold text-[#111110]">
                تعریف کاربر یا مدیر جدید
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium mb-1">نام و نام خانوادگی: *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: آرش سپهری"
                  className="w-full px-3 py-2 border border-[#BFDDF0] rounded-xl"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">پست الکترونیک (ایمیل): *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arash@example.com"
                  className="w-full px-3 py-2 border border-[#BFDDF0] rounded-xl dir-ltr font-mono"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">شماره تماس همراه: *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="w-full px-3 py-2 border border-[#BFDDF0] rounded-xl dir-ltr font-mono"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">رمز عبور ورود:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-[#BFDDF0] rounded-xl dir-ltr font-mono"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">نقش کاربری در سیستم:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#BFDDF0] rounded-xl"
                >
                  <option value="user">مشتری عادی (User)</option>
                  <option value="staff">همکار استودیو / چاپخانه (Staff)</option>
                  <option value="admin">مدیر سیستم (Admin)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#BFDDF0]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#111110] text-white rounded-xl font-bold"
                >
                  ایجاد حساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
