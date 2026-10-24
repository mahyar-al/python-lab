import React, { useState, useEffect } from 'react';
import { PaymentGatewayStatus } from '../../lib/types';
import { adminApi } from '../../lib/adminApi';
import {
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Lock,
  Bell,
  Users,
  Mail,
  ListOrdered,
  FileSpreadsheet,
  Server,
  Sparkles,
  KeyRound,
  ShieldCheck,
  Activity,
  RefreshCw,
  AlertOctagon,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { formatJalaliDateTime } from '../../lib/dateUtils';

interface AdminSettingsProps {
  gatewayStatus: PaymentGatewayStatus;
  dark?: boolean;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ gatewayStatus }) => {
  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Payment Gateway Configuration State
  const [gwStatus, setGwStatus] = useState<PaymentGatewayStatus>(() => ({
    gatewayName: gatewayStatus?.gatewayName || 'زرین‌پال (ZarinPal IPG)',
    configured: Boolean(gatewayStatus?.configured),
    mode: gatewayStatus?.mode || 'sandbox',
    merchantId: gatewayStatus?.merchantId || '',
    disabledReason: gatewayStatus?.disabledReason || 'درگاه پرداخت اینترنتی هنوز متصل نشده است.'
  }));
  const [isSavingGw, setIsSavingGw] = useState(false);
  const [gwSuccess, setGwSuccess] = useState<string | null>(null);
  const [gwError, setGwError] = useState<string | null>(null);

  useEffect(() => {
    if (gatewayStatus) {
      setGwStatus({
        gatewayName: gatewayStatus.gatewayName || 'زرین‌پال (ZarinPal IPG)',
        configured: Boolean(gatewayStatus.configured),
        mode: gatewayStatus.mode || 'sandbox',
        merchantId: gatewayStatus.merchantId || '',
        disabledReason: gatewayStatus.disabledReason || 'درگاه پرداخت اینترنتی هنوز متصل نشده است.'
      });
    }
  }, [gatewayStatus]);

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGw(true);
    setGwSuccess(null);
    setGwError(null);
    try {
      const updated = await adminApi.updatePaymentGatewayStatus(gwStatus);
      setGwStatus(updated);
      setGwSuccess(
        updated.configured
          ? 'درگاه پرداخت با موفقیت متصل و فعال گردید. مشتریان اکنون امکان پرداخت آنلاین دارند.'
          : 'وضعیت درگاه به «غیرفعال / قطع» تغییر یافت. تا زمان اتصال مجدد توسط مدیریت، هیچ پرداختی در سایت انجام نمی‌شود.'
      );
      loadAuditLogs();
    } catch (err: any) {
      setGwError(err.message || 'خطا در ذخیره‌سازی تنظیمات درگاه.');
    } finally {
      setIsSavingGw(false);
    }
  };

  // Security Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<any | null>(null);

  const loadAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const [logs, status] = await Promise.all([
        adminApi.getAuditLogs().catch(() => []),
        adminApi.getSecurityStatus().catch(() => null)
      ]);
      setAuditLogs(logs);
      setSecurityStatus(status);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!currentPassword.trim() || !newPassword.trim()) {
      setPassError('لطفاً رمز عبور فعلی و جدید را وارد فرمایید.');
      return;
    }

    if (newPassword.length < 8) {
      setPassError('رمز عبور جدید باید حداقل دارای ۸ کاراکتر باشد.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('تکرار رمز عبور جدید با رمز عبور جدید مطابقت ندارد.');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await adminApi.changePassword(currentPassword, newPassword);
      setPassSuccess(res.message || 'رمز عبور با موفقیت بروزرسانی شد.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      loadAuditLogs();
    } catch (err: any) {
      setPassError(err.message || 'خطا در تغییر رمز عبور.');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="space-y-8 text-right">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#111110]">
          تنظیمات عمومی، امنیت و درگاه پرداخت
        </h2>
        <span className="text-xs text-[#4A5560]">
          مدیریت لایه‌های امنیتی، تغییر رمز عبور، پایش وقایع و وضعیت درگاه مالی
        </span>
      </div>

      {/* Security Status Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-[#BFDDF0] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E4F5FF] border border-[#BFDDF0] flex items-center justify-center text-[#111110]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[#4A5560] block text-[11px]">رمزنگاری کلمات عبور:</span>
            <span className="font-bold text-[#2F6B4F]">Scrypt + Salt اختصاصی</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#BFDDF0] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E4F5FF] border border-[#BFDDF0] flex items-center justify-center text-[#111110]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[#4A5560] block text-[11px]">توکن نشست مدیر:</span>
            <span className="font-bold text-[#111110]">HMAC-SHA256 امضاشده</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#BFDDF0] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E4F5FF] border border-[#BFDDF0] flex items-center justify-center text-[#111110]">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[#4A5560] block text-[11px]">محدودیت تلاش ورود:</span>
            <span className="font-bold text-[#2F6B4F]">حداکثر ۵ تلاش (قفل ۱۵ دقیقه)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#BFDDF0] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E4F5FF] border border-[#BFDDF0] flex items-center justify-center text-[#111110]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[#4A5560] block text-[11px]">پایش وقایع امنیتی:</span>
            <span className="font-bold text-[#111110]">فعال (Auditing Engine)</span>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="p-6 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-[#BFDDF0]/60 pb-3">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-[#111110]" />
            <h3 className="text-sm font-bold text-[#111110]">
              تغییر امن رمز عبور مدیر آتلیه
            </h3>
          </div>
          <span className="text-[11px] text-[#4A5560]">
            احراز هویت مجدد سمت سرور با اعتبارسنجی Scrypt
          </span>
        </div>

        {passError && (
          <div className="p-3 bg-[#A33A3A]/10 border border-[#A33A3A]/30 rounded-xl text-xs text-[#A33A3A] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{passError}</span>
          </div>
        )}

        {passSuccess && (
          <div className="p-3 bg-[#2F6B4F]/10 border border-[#2F6B4F]/30 rounded-xl text-xs text-[#2F6B4F] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{passSuccess}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl text-xs">
          <div>
            <label className="block font-medium mb-1.5 text-[#111110]">رمز عبور فعلی *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="رمز عبور فعلی را وارد کنید"
              className="w-full px-4 py-2.5 rounded-xl border border-[#BFDDF0] focus:outline-none focus:border-[#111110] dir-ltr text-right"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1.5 text-[#111110]">رمز عبور جدید (حداقل ۸ کاراکتر) *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="رمز عبور قوی جدید"
                className="w-full px-4 py-2.5 rounded-xl border border-[#BFDDF0] focus:outline-none focus:border-[#111110] dir-ltr text-right"
              />
            </div>

            <div>
              <label className="block font-medium mb-1.5 text-[#111110]">تکرار رمز عبور جدید *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="تکرار رمز عبور جدید"
                className="w-full px-4 py-2.5 rounded-xl border border-[#BFDDF0] focus:outline-none focus:border-[#111110] dir-ltr text-right"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] text-[#4A5560] hover:text-[#111110] flex items-center gap-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPassword ? 'مخفی‌سازی کاراکترها' : 'نمایش کاراکترها'}</span>
            </button>

            <button
              type="submit"
              disabled={isChangingPass}
              className="px-5 py-2.5 rounded-xl bg-[#111110] text-white hover:bg-[#2A2A28] font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isChangingPass ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال تغییر رمز...</span>
                </>
              ) : (
                <span>ذخیره رمز عبور جدید</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security Audit Log Table */}
      <div className="p-6 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#BFDDF0]/60 pb-3">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-[#111110]" />
            <div>
              <h3 className="text-sm font-bold text-[#111110]">
                دفتر ثبت وقایع امنیتی (Security Audit Logs)
              </h3>
              <span className="text-[11px] text-[#4A5560] block">
                ثبت کلیه تلاش‌های ورود، خروج، دسترسی‌های غیرمجاز و تغییرات مهم در بک‌اند
              </span>
            </div>
          </div>

          <button
            onClick={loadAuditLogs}
            disabled={isLoadingLogs}
            className="p-2 rounded-xl border border-[#BFDDF0] text-[#111110] hover:bg-gray-100 transition-colors flex items-center gap-1 text-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            <span>بروزرسانی لاگ‌ها</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[#BFDDF0] text-[#4A5560] bg-[#E4F5FF]/50">
                <th className="py-2.5 px-3">زمان وقوع</th>
                <th className="py-2.5 px-3">نوع رویداد</th>
                <th className="py-2.5 px-3">کاربر / شناسه</th>
                <th className="py-2.5 px-3">آدرس IP</th>
                <th className="py-2.5 px-3">سطح حساسیت</th>
                <th className="py-2.5 px-3">شرح رویداد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#BFDDF0]/40 font-sans">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#4A5560]">
                    هنوز رویدادی ثبت نشده است.
                  </td>
                </tr>
              ) : (
                auditLogs.slice(0, 15).map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                      {formatJalaliDateTime(log.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-[11px]">
                      {log.event}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#111110]">
                      {log.username || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">
                      {log.ip}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.severity === 'critical'
                          ? 'bg-[#A33A3A]/15 text-[#A33A3A]'
                          : log.severity === 'warning'
                          ? 'bg-[#9A6B1F]/15 text-[#9A6B1F]'
                          : 'bg-[#2F6B4F]/15 text-[#2F6B4F]'
                      }`}>
                        {log.severity === 'critical' ? 'بحرانی' : log.severity === 'warning' ? 'هشدار' : 'عادی'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#4A5560] max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Gateway Management & Status Card */}
      <div className="p-6 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#BFDDF0]/60 pb-3">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-[#111110]" />
            <div>
              <h3 className="text-sm font-bold text-[#111110]">
                مدیریت اتصال و پیکربندی درگاه پرداخت آنلاین (IPG)
              </h3>
              <span className="text-[11px] text-[#4A5560] block">
                کنترل فعال بودن یا قطعی درگاه بانکی — تا زمان عدم اتصال، هیچ پرداختی در سایت انجام نمی‌شود
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
              gwStatus.configured
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {gwStatus.configured ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>درگاه متصل و فعال است</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>درگاه قطع است (پرداختی انجام نمی‌شود)</span>
                </>
              )}
            </span>
          </div>
        </div>

        {gwSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{gwSuccess}</span>
          </div>
        )}

        {gwError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{gwError}</span>
          </div>
        )}

        {/* Quick summary badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#E4F5FF]/30 border border-[#BFDDF0]">
            <span className="text-[#4A5560] block mb-1">نام درگاه مالی انتخاب‌شده:</span>
            <span className="font-bold text-sm text-[#111110]">
              {gwStatus.gatewayName}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#E4F5FF]/30 border border-[#BFDDF0]">
            <span className="text-[#4A5560] block mb-1">وضعیت پذیرش پرداخت:</span>
            {gwStatus.configured ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-[#2F6B4F]">
                <CheckCircle2 className="w-4 h-4" />
                <span>پذیرش فعال در صفحه تسویه حساب</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-bold text-[#A33A3A]">
                <AlertTriangle className="w-4 h-4" />
                <span>غیرفعال — پرداخت مسدود است</span>
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-[#E4F5FF]/30 border border-[#BFDDF0]">
            <span className="text-[#4A5560] block mb-1">محیط اتصال (Mode):</span>
            <span className="font-semibold text-[#111110]">
              {gwStatus.mode === 'production' ? 'محیط تجاری اصلی (Production)' : 'محیط تستی / آزمایشی (Sandbox)'}
            </span>
          </div>
        </div>

        {/* Interactive Configuration Form */}
        <form onSubmit={handleSaveGateway} className="space-y-4 pt-2 text-xs border-t border-gray-100">
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 leading-relaxed text-[11px] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong>هشدار سیاست پرداخت:</strong> در صورتی که گزینه «اتصال درگاه پرداخت فعال است» خاموش باشد، پرداخت آنلاین برای خریداران غیرفعال خواهد بود و مشتریان از عدم اتصال درگاه مطلع می‌شوند تا زمانی که مدیریت آن را متصل کند.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Toggle Status */}
            <div className="sm:col-span-2 p-3.5 rounded-xl border border-[#BFDDF0] bg-neutral-50/50 flex items-center justify-between">
              <div>
                <label className="font-bold text-sm text-[#111110] block">
                  وضعیت اتصال درگاه پرداخت آنلاین:
                </label>
                <span className="text-[11px] text-[#4A5560] block mt-0.5">
                  {gwStatus.configured
                    ? 'درگاه فعال است و پرداخت بانکی انجام می‌شود.'
                    : 'درگاه هنوز متصل نیست — امکان پرداخت برای مشتریان غیرفعال است.'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={gwStatus.configured}
                  onChange={(e) => setGwStatus({ ...gwStatus, configured: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Gateway Provider */}
            <div>
              <label className="block font-semibold mb-1.5 text-[#111110]">
                ارائه‌دهنده درگاه پرداخت:
              </label>
              <select
                value={gwStatus.gatewayName}
                onChange={(e) => setGwStatus({ ...gwStatus, gatewayName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#BFDDF0] bg-white focus:outline-none focus:border-[#111110]"
              >
                <option value="زرین‌پال (ZarinPal IPG)">زرین‌پال (ZarinPal IPG)</option>
                <option value="شاپرک - به‌پرداخت ملت">شاپرک - به‌پرداخت ملت</option>
                <option value="شاپرک - پرداخت الکترونیک سداد">شاپرک - پرداخت الکترونیک سداد (ملی)</option>
                <option value="شاپرک - پرداخت الکترونیک سامان (سپ)">شاپرک - پرداخت الکترونیک سامان (سپ)</option>
                <option value="شاپرک - ایران کیش">شاپرک - ایران کیش</option>
                <option value="زیبال (Zibal IPG)">زیبال (Zibal IPG)</option>
                <option value="پی‌پینگ (PayPing)">پی‌پینگ (PayPing)</option>
                <option value="نکست‌پی (NextPay)">نکست‌پی (NextPay)</option>
                <option value="تپسی‌پی (TapsiPay)">تپسی‌پی (TapsiPay)</option>
              </select>
            </div>

            {/* Gateway Mode */}
            <div>
              <label className="block font-semibold mb-1.5 text-[#111110]">
                محیط اتصال (Gateway Environment):
              </label>
              <select
                value={gwStatus.mode}
                onChange={(e) => setGwStatus({ ...gwStatus, mode: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#BFDDF0] bg-white focus:outline-none focus:border-[#111110]"
              >
                <option value="sandbox">محیط آزمایشی (Sandbox / Test Mode)</option>
                <option value="production">محیط اصلی و تجاری (Production)</option>
              </select>
            </div>

            {/* Merchant ID / Terminal Key */}
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1.5 text-[#111110]">
                کد مرچنت (Merchant ID) / شناسه پایانه بانکی:
              </label>
              <input
                type="text"
                value={gwStatus.merchantId || ''}
                onChange={(e) => setGwStatus({ ...gwStatus, merchantId: e.target.value })}
                placeholder="مثال: 7a2633f7-23ed-43ef-a1b1-82e24be0933e"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#BFDDF0] bg-white focus:outline-none focus:border-[#111110] dir-ltr text-right font-mono"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                کد یکتای دریافت شده از ارائه‌دهنده درگاه پرداخت برای اتصال تراکنش‌ها
              </span>
            </div>

            {/* Disabled Message */}
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1.5 text-[#111110]">
                پیام نمایشی برای مشتریان در زمان عدم اتصال درگاه:
              </label>
              <input
                type="text"
                value={gwStatus.disabledReason || ''}
                onChange={(e) => setGwStatus({ ...gwStatus, disabledReason: e.target.value })}
                placeholder="درگاه پرداخت اینترنتی هنوز متصل نشده است و در انتظار اتصال توسط مدیریت فروشگاه می‌باشد."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#BFDDF0] bg-white focus:outline-none focus:border-[#111110]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingGw}
              className="px-6 py-2.5 rounded-xl bg-[#111110] text-white hover:bg-[#2A2A28] font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSavingGw ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال ذخیره تنظیمات درگاه...</span>
                </>
              ) : (
                <span>ذخیره تنظیمات درگاه پرداخت</span>
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
