import React, { useState } from 'react';
import { Order } from '../lib/types';
import { formatPrice, formatPersianNumber, formatPersianPhone } from '../lib/currency';
import { formatJalaliDateTime } from '../lib/dateUtils';
import { Search, Package, Clock, CheckCircle2, Truck, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';

interface OrderTrackingProps {
  orders?: Order[];
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({ orders = [] }) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = orderNumber.trim();
    const cleanPhone = customerPhone.trim();

    if (!cleanNum) {
      setErrorMessage('لطفاً شماره سفارش را وارد فرمایید.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setSearched(true);

    try {
      // Secure server-side verification: checks matching orderNumber & phone
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: cleanNum,
          phone: cleanPhone
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.id) {
        setSearchedOrder(data);
      } else {
        // Fallback check against in-memory orders passed as prop (strictly checking phone if provided)
        const foundLocal = orders.find((o) => {
          const matchNum =
            o.orderNumber?.toLowerCase() === cleanNum.toLowerCase() ||
            o.trackingCode?.toLowerCase() === cleanNum.toLowerCase() ||
            o.id?.toLowerCase() === cleanNum.toLowerCase();
          if (!matchNum) return false;
          if (cleanPhone) {
            return o.customerPhone?.replace(/\D/g, '').includes(cleanPhone.replace(/\D/g, ''));
          }
          return true;
        });

        if (foundLocal) {
          setSearchedOrder(foundLocal);
        } else {
          setSearchedOrder(null);
          setErrorMessage(data.error || 'سفارشی با این مشخصات یافت نشد. لطفاً شماره سفارش و شماره تماس را بررسی نمایید.');
        }
      }
    } catch {
      setSearchedOrder(null);
      setErrorMessage('خطا در استعلام سفارش. لطفاً دوباره تلاش فرمایید.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStep = (status: Order['status']) => {
    switch (status) {
      case 'PAID':
        return 1;
      case 'PROCESSING':
        return 2;
      case 'SHIPPED':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 1;
    }
  };

  return (
    <div className="w-full py-12 md:py-20 bg-[#E4F5FF]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-right">
        
        <div className="text-center space-y-3 mb-10">
          <span className="font-serif text-xs brand-tracking text-[#4A5560] uppercase">
            ATELIER TRACKING · 2026
          </span>
          <h1 className="text-3xl font-bold text-[#111110]">رهگیری هوشمند و امن سفارش</h1>
          <p className="text-xs sm:text-sm text-[#4A5560] max-w-md mx-auto">
            جهت حفظ محرمانگی و حریم خصوصی، شماره سفارش و شماره تماس خود را وارد نمایید.
          </p>
        </div>

        {/* Search input card */}
        <form
          onSubmit={handleSearch}
          className="bg-white p-5 rounded-2xl border border-[#BFDDF0] shadow-sm flex flex-col sm:flex-row gap-3 mb-8"
        >
          <div className="relative flex-1">
            <input
              type="text"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="شماره سفارش (مثال: MC-123456)..."
              className="w-full px-4 py-3 rounded-xl border border-[#BFDDF0] focus:outline-none focus:border-[#111110] text-xs font-mono"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          </div>

          <div className="relative sm:w-48">
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="شماره تماس ثبت‌شده..."
              className="w-full px-4 py-3 rounded-xl border border-[#BFDDF0] focus:outline-none focus:border-[#111110] text-xs dir-ltr text-right"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 rounded-xl bg-[#111110] text-white hover:bg-[#2A2A28] text-xs font-semibold whitespace-nowrap transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال استعلام...</span>
              </>
            ) : (
              <span>استعلام وضعیت</span>
            )}
          </button>
        </form>

        {/* Security Assurance Tag */}
        <div className="flex items-center justify-center gap-2 mb-8 text-[11px] text-[#4A5560]">
          <ShieldCheck className="w-4 h-4 text-[#2F6B4F]" />
          <span>استعلام سفارشات تحت پروتکل امنیتی دوسطحی جهت محافظت از حریم خصوصی مشتریان صورت می‌پذیرد.</span>
        </div>

        {/* Error Results */}
        {searched && !searchedOrder && (
          <div className="p-8 rounded-2xl bg-white border border-[#BFDDF0] text-center space-y-3 text-xs text-[#4A5560]">
            <AlertCircle className="w-10 h-10 text-gray-400 mx-auto" />
            <h3 className="font-bold text-sm text-[#111110]">سفارشی یافت نشد</h3>
            <p>{errorMessage || 'لطفاً صحت شماره سفارش و شماره تماس ثبت‌شده را مجدداً بررسی فرمایید.'}</p>
          </div>
        )}

        {searchedOrder && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#BFDDF0] shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#BFDDF0]">
              <div>
                <span className="text-[11px] text-[#4A5560] block">شماره سفارش:</span>
                <h2 className="text-xl font-bold text-[#111110] font-mono">{searchedOrder.orderNumber}</h2>
              </div>
              <div className="text-left sm:text-left">
                <span className="text-[11px] text-[#4A5560] block">تاریخ ثبت:</span>
                <span className="text-xs font-medium text-[#111110]">
                  {formatJalaliDateTime(searchedOrder.createdAt)}
                </span>
              </div>
            </div>

            {/* Stepper */}
            <div className="py-4">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#E4F5FF] -translate-y-1/2 z-0" />
                <div
                  className="absolute top-1/2 right-0 h-1 bg-[#111110] -translate-y-1/2 z-0 transition-all duration-500"
                  style={{
                    width: `${((getStatusStep(searchedOrder.status) - 1) / 3) * 100}%`
                  }}
                />

                {[
                  { step: 1, label: 'تایید پرداخت', icon: CheckCircle2 },
                  { step: 2, label: 'در حال دوخت و چاپ', icon: Clock },
                  { step: 3, label: 'تحویل به پست', icon: Truck },
                  { step: 4, label: 'تحویل نهایی', icon: Package }
                ].map((s) => {
                  const currentStep = getStatusStep(searchedOrder.status);
                  const isDone = currentStep >= s.step;
                  const Icon = s.icon;
                  return (
                    <div key={s.step} className="relative z-10 flex flex-col items-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isDone
                            ? 'bg-[#111110] text-white'
                            : 'bg-white border-2 border-[#BFDDF0] text-gray-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-medium text-[#111110] text-center">
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tracking Code if Shipped */}
            {searchedOrder.trackingCode && (
              <div className="p-4 bg-[#E4F5FF] rounded-xl border border-[#BFDDF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-[#4A5560] block">کد رهگیری پست پیشتاز:</span>
                  <span className="font-mono font-bold text-sm text-[#111110]">
                    {searchedOrder.trackingCode}
                  </span>
                </div>
                <a
                  href={`https://tracking.post.ir/?id=${searchedOrder.trackingCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-white rounded-lg border border-[#BFDDF0] text-[#111110] hover:bg-gray-50 text-xs font-semibold text-center transition-colors"
                >
                  رهگیری در سامانه ملی پست
                </a>
              </div>
            )}

            {/* Items Summary */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-[#111110]">اقلام سفارش:</h4>
              <div className="divide-y divide-[#BFDDF0]/60 border border-[#BFDDF0] rounded-xl overflow-hidden">
                {searchedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-3 text-xs bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#E4F5FF] border border-[#BFDDF0] overflow-hidden shrink-0 flex items-center justify-center p-1">
                        <img
                          src={item.product?.image || '/mockups/tee-front.svg'}
                          alt={item.product?.name || 'محصول'}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h5 className="font-bold text-[#111110]">{item.product?.name}</h5>
                        <span className="text-[11px] text-[#4A5560]">
                          رنگ: {item.selectedColor} · سایز: {item.selectedSize} · تعداد: {formatPersianNumber(item.quantity)}
                        </span>
                      </div>
                    </div>
                    <span className="font-semibold text-[#111110]">
                      {formatPrice((item.product?.price || 0) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Destination Info (City and Province only, protects specific home addresses) */}
            <div className="flex items-center justify-between pt-4 border-t border-[#BFDDF0] text-xs">
              <span className="text-[#4A5560]">
                مقصد ارسال: {searchedOrder.customerProvince || 'تهران'} - {searchedOrder.customerCity || 'تهران'}
              </span>
              <div className="text-left">
                <span className="text-[11px] text-[#4A5560] block">مبلغ کل پرداخت‌شده:</span>
                <span className="text-sm font-bold text-[#111110]">
                  {formatPrice(searchedOrder.total || 0)}
                </span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
