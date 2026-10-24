import React, { useState } from 'react';
import { DiscountCode } from '../../lib/types';
import { formatPrice, formatPersianNumber, toPersianDigits, toAsciiDigits } from '../../lib/currency';
import { formatJalaliDate, formatJalaliDateText } from '../../lib/dateUtils';
import { Plus, Edit2, Trash2, X, Tag, AlertCircle, Percent } from 'lucide-react';

interface AdminDiscountsProps {
  discounts: DiscountCode[];
  onCreateDiscount: (disc: Omit<DiscountCode, 'id'>) => Promise<void>;
  onUpdateDiscount: (id: string, disc: Partial<DiscountCode>) => Promise<void>;
  onDeleteDiscount: (id: string) => Promise<void>;
  dark?: boolean;
}

export const AdminDiscounts: React.FC<AdminDiscountsProps> = ({
  discounts,
  onCreateDiscount,
  onUpdateDiscount,
  onDeleteDiscount
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);

  const [code, setCode] = useState('');
  const [percent, setPercent] = useState('15');
  const [description, setDescription] = useState('');
  const [maxUses, setMaxUses] = useState('100');
  const [minOrderAmount, setMinOrderAmount] = useState('1000000');
  const [expiryDateDays, setExpiryDateDays] = useState('30');
  const [active, setActive] = useState(true);

  const openCreateModal = () => {
    setEditingDiscount(null);
    setCode('');
    setPercent('15');
    setDescription('');
    setMaxUses('100');
    setMinOrderAmount('1000000');
    setExpiryDateDays('30');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (disc: DiscountCode) => {
    setEditingDiscount(disc);
    setCode(disc.code);
    setPercent(String(disc.percent));
    setDescription(disc.description || '');
    setMaxUses(disc.maxUses ? String(disc.maxUses) : '100');
    setMinOrderAmount(disc.minOrderAmount ? String(disc.minOrderAmount) : '0');
    setActive(disc.active !== false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const pct = Math.max(1, Math.min(100, Number(toAsciiDigits(percent)) || 10));
    const maxU = Number(toAsciiDigits(maxUses)) || 100;
    const minOrder = Number(toAsciiDigits(minOrderAmount)) || 0;
    const days = Number(toAsciiDigits(expiryDateDays)) || 30;

    const expiryISO = editingDiscount?.expiryDate || new Date(Date.now() + days * 86400000).toISOString();

    const payload: Omit<DiscountCode, 'id'> = {
      code: code.trim().toUpperCase(),
      percent: pct,
      description: description.trim(),
      maxUses: maxU,
      usedCount: editingDiscount?.usedCount || 0,
      minOrderAmount: minOrder,
      expiryDate: expiryISO,
      active
    };

    if (editingDiscount) {
      await onUpdateDiscount(editingDiscount.id || editingDiscount.code, payload);
    } else {
      await onCreateDiscount(payload);
    }
    setIsModalOpen(false);
  };

  const now = Date.now();

  return (
    <div className="space-y-6 text-right">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111110]">
            مدیریت کدهای تخفیف و کوپن‌ها
          </h2>
          <span className="text-xs text-[#4A5560]">
            تعریف سقف مصرف، حداقل خرید و تاریخ انقضا به تقویم جلالی
          </span>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-[#111110] text-[#FFFFFF] text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>تعریف کد تخفیف جدید</span>
        </button>
      </div>

      {/* Discounts Table */}
      <div className="rounded-2xl border bg-white border-[#BFDDF0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#E4F5FF]/50 border-b border-[#BFDDF0] text-[#4A5560]">
                <th className="py-3.5 px-4 font-semibold">کد تخفیف</th>
                <th className="py-3.5 px-4 font-semibold">درصد</th>
                <th className="py-3.5 px-4 font-semibold">توضیحات و شرایط</th>
                <th className="py-3.5 px-4 font-semibold">میزان مصرف</th>
                <th className="py-3.5 px-4 font-semibold">حداقل خرید</th>
                <th className="py-3.5 px-4 font-semibold">تاریخ انقضا</th>
                <th className="py-3.5 px-4 font-semibold">وضعیت</th>
                <th className="py-3.5 px-4 font-semibold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#BFDDF0]/60">
              {discounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#4A5560] text-xs">
                    هیچ کد تخفیفی در سیستم ثبت نشده است.
                  </td>
                </tr>
              ) : (
                discounts.map((disc) => {
                const used = disc.usedCount || 0;
                const max = disc.maxUses || 100;
                const progressPct = Math.min(100, Math.round((used / max) * 100));
                const isLimitReached = used >= max;
                const isExpired = disc.expiryDate ? new Date(disc.expiryDate).getTime() < now : false;

                return (
                  <tr
                    key={disc.code}
                    className="hover:bg-[#D3ECFA]/20 transition-colors"
                  >
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-sm text-[#111110] tracking-wider uppercase">
                      {disc.code}
                    </td>

                    {/* Percent */}
                    <td className="py-3.5 px-4 font-bold text-sm text-[#2F6B4F]">
                      %{formatPersianNumber(disc.percent)}
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 text-[#4A5560]">
                      {disc.description || 'بدون توضیحات'}
                    </td>

                    {/* Progress Bar of Used / Max */}
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold text-[#111110]">
                            {formatPersianNumber(used)} از {formatPersianNumber(max)}
                          </span>
                          <span className="text-[#4A5560]">
                            {toPersianDigits(progressPct)}%
                          </span>
                        </div>
                        <div className="w-full bg-[#E4F5FF] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isLimitReached ? 'bg-[#A33A3A]' : 'bg-[#111110]'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Min Spend */}
                    <td className="py-3.5 px-4 font-medium text-[#111110]">
                      {disc.minOrderAmount ? formatPrice(disc.minOrderAmount) : 'بدون حداقل'}
                    </td>

                    {/* Expiry Date */}
                    <td className="py-3.5 px-4 text-[#4A5560]">
                      {disc.expiryDate ? formatJalaliDateText(disc.expiryDate) : 'نامحدود'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {isExpired ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A33A3A]/10 text-[#A33A3A]">
                          منقضی شده
                        </span>
                      ) : isLimitReached ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#9A6B1F]/10 text-[#9A6B1F]">
                          سقف پر شد
                        </span>
                      ) : !disc.active ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700">
                          غیرفعال
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2F6B4F]/10 text-[#2F6B4F]">
                          فعال
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(disc)}
                          className="p-1.5 rounded-lg text-[#4A5560] hover:bg-[#D3ECFA]/60"
                          title="ویرایش کد"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`آیا از حذف کد تخفیف «${disc.code}» اطمینان دارید؟`)) {
                              onDeleteDiscount(disc.id || disc.code);
                            }
                          }}
                          className="p-1.5 rounded-lg text-[#A33A3A] hover:bg-[#A33A3A]/10"
                          title="حذف کد"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-[#BFDDF0] rounded-2xl p-6 max-w-md w-full text-right shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#BFDDF0]">
              <h3 className="text-base font-bold text-[#111110]">
                {editingDiscount ? 'ویرایش کد تخفیف' : 'تعریف کد تخفیف جدید'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium mb-1">کد کوپن (حروف بزرگ لاتین): *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="MORICO2026"
                  className="w-full px-3 py-2 border border-[#BFDDF0] rounded-xl focus:outline-none uppercase font-mono font-bold dir-ltr text-center"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">درصد تخفیف (۱ الی ۱۰۰): *</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={percent}
                    onChange={(e) => setPercent(e.target.value)}
                    className="w-full px-3 py-2 border border-[#BFDDF0] rounded-xl text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">حداکثر دفعات مصرف:</label>
                  <input
                    type="number"
                    min={1}
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full px-3 py-2 border border-[#BFDDF0] rounded-xl text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">حداقل مبلغ سفارش (تومان):</label>
                <input
                  type="text"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  placeholder="۱۰۰۰۰۰۰"
                  className="w-full px-3 py-2 border border-[#BFDDF0] rounded-xl dir-ltr text-left font-mono"
                />
                <span className="text-[11px] text-[#4A5560] mt-1 block">
                  {formatPrice(Number(toAsciiDigits(minOrderAmount)) || 0)}
                </span>
              </div>

              {!editingDiscount && (
                <div>
                  <label className="block font-medium mb-1">مدت اعتبار از امروز (روز):</label>
                  <select
                    value={expiryDateDays}
                    onChange={(e) => setExpiryDateDays(e.target.value)}
                    className="w-full px-3 py-2 border border-[#BFDDF0] rounded-xl"
                  >
                    <option value="7">۷ روز (یک هفته)</option>
                    <option value="15">۱۵ روز</option>
                    <option value="30">۳۰ روز (یک ماه)</option>
                    <option value="60">۶۰ روز (دو ماه)</option>
                    <option value="90">۹۰ روز (فصل جاری)</option>
                    <option value="365">۳۶۵ روز (یک سال)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-medium mb-1">توضیحات و شرایط:</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="تخفیف ویژه مشتریان جدید"
                  className="w-full px-3 py-2 border border-[#BFDDF0] rounded-xl"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-medium pt-1">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded"
                />
                <span>فعال و قابل استفاده توسط خریداران</span>
              </label>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#BFDDF0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-[#4A5560]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#111110] text-white rounded-xl font-bold"
                >
                  {editingDiscount ? 'ذخیره تغییرات' : 'ثبت کد تخفیف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
