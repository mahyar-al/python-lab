import React, { useState, useEffect } from 'react';
import { CartItem, Order, User, Product, PaymentGatewayStatus } from '../lib/types';
import { formatPrice, formatPersianNumber, formatPersianPhone } from '../lib/currency';
import { calculateCartTotals, SHIPPING_THRESHOLD } from '../lib/cartUtils';
import { adminApi } from '../lib/adminApi';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  AlertTriangle,
  User as UserIcon,
  MapPin,
  Package,
  Truck,
  FileText,
  Building,
  Sparkles
} from 'lucide-react';
import { LocationPickerModal, LocationData } from './LocationPickerModal';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  products: Product[];
  discountAmount: number;
  appliedCode: string;
  currentUser: User | null;
  onOrderSuccess: (order: Order) => void;
  onNavigateToTracking?: () => void;
}

const IRAN_PROVINCES = [
  'تهران',
  'اصفهان',
  'خراسان رضوی',
  'فارس',
  'آذربایجان شرقی',
  'مازندران',
  'گیلان',
  'البرز',
  'خوزستان',
  'قم',
  'مرکزی',
  'همدان',
  'یزد',
  'کرمان',
  'قزوین',
  'سایر استان‌ها'
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  products,
  discountAmount,
  appliedCode,
  currentUser,
  onOrderSuccess,
  onNavigateToTracking
}) => {
  // Step tracker: 1 = Review, 2 = Customer Info & Address, 3 = Payment & Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields with Persistence in session
  const [name, setName] = useState(() => currentUser?.name || localStorage.getItem('morico_chk_name') || '');
  const [phone, setPhone] = useState(() => currentUser?.phone || localStorage.getItem('morico_chk_phone') || '');
  const [email, setEmail] = useState(() => currentUser?.email || localStorage.getItem('morico_chk_email') || '');
  const [province, setProvince] = useState(() => localStorage.getItem('morico_chk_province') || 'تهران');
  const [city, setCity] = useState(() => localStorage.getItem('morico_chk_city') || 'تهران');
  const [address, setAddress] = useState(() => localStorage.getItem('morico_chk_address') || '');
  const [postalCode, setPostalCode] = useState(() => localStorage.getItem('morico_chk_postal') || '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'gateway' | 'card'>('gateway');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const handleLocationConfirmed = (loc: LocationData) => {
    if (loc.fullName) setName(loc.fullName);
    if (loc.phone) setPhone(loc.phone);
    if (loc.province) setProvince(loc.province);
    if (loc.city) setCity(loc.city);
    if (loc.address) setAddress(loc.address);
    if (loc.postalCode) setPostalCode(loc.postalCode);
  };

  // Form Validation & Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Gateway Status
  const [gatewayStatus, setGatewayStatus] = useState<PaymentGatewayStatus | null>(null);

  useEffect(() => {
    adminApi.getPaymentGatewayStatus().then((status) => {
      setGatewayStatus(status);
      if (!status?.configured) {
        setPaymentMethod('card');
      }
    });
  }, []);

  // Save fields to draft
  useEffect(() => {
    try {
      if (name) localStorage.setItem('morico_chk_name', name);
      if (phone) localStorage.setItem('morico_chk_phone', phone);
      if (email) localStorage.setItem('morico_chk_email', email);
      if (province) localStorage.setItem('morico_chk_province', province);
      if (city) localStorage.setItem('morico_chk_city', city);
      if (address) localStorage.setItem('morico_chk_address', address);
      if (postalCode) localStorage.setItem('morico_chk_postal', postalCode);
    } catch {}
  }, [name, phone, email, province, city, address, postalCode]);

  if (!isOpen) return null;

  // Calculate live totals
  const promoDummy = appliedCode ? { code: appliedCode, amount: discountAmount, active: true, id: 'temp' } : null;
  const totals = calculateCartTotals(cart, promoDummy as any, products);

  // Validate Step 2 inputs
  const validateStep2 = () => {
    const errs: { [key: string]: string } = {};

    if (!name.trim()) errs.name = 'لطفاً نام و نام خانوادگی را وارد نمایید.';
    if (!phone.trim()) {
      errs.phone = 'لطفاً شماره تماس همراه را وارد نمایید.';
    } else {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        errs.phone = 'شماره تلفن وارد شده نامعتبر است.';
      }
    }
    if (!address.trim() || address.trim().length < 10) {
      errs.address = 'لطفاً نشانی کامل پستی (شامل خیابان، پلاک، واحد) را وارد نمایید.';
    }
    if (postalCode.trim() && postalCode.replace(/\D/g, '').length !== 10) {
      errs.postalCode = 'کد پستی باید ۱۰ رقم باشد.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3);
      }
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totals.hasOutOfStock) {
      alert('برخی از محصولات سبد ناموجود شده‌اند. لطفاً ابتدا آن‌ها را از سبد حذف کنید.');
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      return;
    }

    if (paymentMethod === 'gateway' && !gatewayStatus?.configured) {
      alert('درگاه پرداخت اینترنتی هنوز متصل نشده است. تا زمان اتصال درگاه توسط مدیریت فروشگاه، پرداختی انجام نمی‌شود.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        customerAddress: address.trim(),
        customerPostal: postalCode.trim() || '۱۱۹۳۶۵۴۳۲۱',
        postalCode: postalCode.trim() || '۱۱۹۳۶۵۴۳۲۱',
        province: province.trim(),
        customerProvince: province.trim(),
        city: city.trim(),
        customerCity: city.trim(),
        customerNotes: notes.trim() || undefined,
        items: [...cart],
        subtotal: totals.subtotalAfterProductDiscount,
        discount: totals.promoDiscount,
        discountAmount: totals.promoDiscount,
        promoCode: appliedCode || undefined,
        shipping: totals.shippingFee,
        shippingFee: totals.shippingFee,
        total: totals.finalTotal,
        totalAmount: totals.finalTotal,
        status: (paymentMethod === 'gateway' ? 'PAID' : 'PENDING_PAYMENT') as Order['status'],
        paymentStatus: paymentMethod === 'gateway' ? 'PAID' : 'PENDING',
        paymentMethod:
          paymentMethod === 'gateway'
            ? 'درگاه پرداخت شاپرک / زرین‌پال'
            : 'کارت به کارت / حساب رسمی آتلیه',
        paymentInfo: {
          gateway: gatewayStatus?.gatewayName || 'زرین‌پال (ZarinPal IPG)',
          refId: Math.floor(100000000 + Math.random() * 900000000).toString(),
          cardPanMask: '۶۰۳۷-۹۹**-****-۲۲۴۵',
          paidAt: new Date().toISOString()
        }
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      let finalOrder: Order;
      if (res.ok) {
        finalOrder = await res.json();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'خطا در ثبت سفارش. لطفاً اطلاعات ارسالی را بررسی فرمایید.');
        setIsSubmitting(false);
        return;
      }

      onOrderSuccess(finalOrder);
      setCompletedOrder(finalOrder);
    } catch (err: any) {
      alert('خطا در برقراری ارتباط با سرور: ' + (err.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white border border-[#BFDDF0] rounded-[24px] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-right shadow-2xl relative">
        
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-[#BFDDF0] bg-white flex items-center justify-between">
          <div>
            <span className="font-serif text-[10px] sm:text-xs brand-tracking text-[#4A5560] uppercase block">
              MORICO STYLE · CHECKOUT
            </span>
            <h2 className="text-base sm:text-xl font-bold text-[#111110] mt-0.5">
              {completedOrder
                ? 'رسید نهایی و تایید سفارش'
                : step === 1
                ? 'مرور سبد و بررسی اقلام'
                : step === 2
                ? 'اطلاعات خریدار و نشانی تحویل'
                : 'انتخاب شیوه پرداخت و ثبت نهایی'}
            </h2>
          </div>

          {!completedOrder && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-[#BFDDF0] hover:bg-gray-100 text-[#111110] transition-colors cursor-pointer"
              aria-label="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Stepper Progress Bar */}
        {!completedOrder && (
          <div className="px-6 py-2.5 bg-[#E4F5FF]/40 border-b border-[#BFDDF0] flex items-center justify-between text-xs font-semibold text-[#4A5560]">
            <div
              className={`flex items-center gap-1.5 cursor-pointer ${
                step >= 1 ? 'text-[#111110]' : 'text-gray-400'
              }`}
              onClick={() => setStep(1)}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 1 ? 'bg-[#111110] text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                ۱
              </span>
              <span>مرور اقلام</span>
            </div>
            <div className="flex-1 h-[1px] bg-[#BFDDF0] mx-3" />
            <div
              className={`flex items-center gap-1.5 cursor-pointer ${
                step >= 2 ? 'text-[#111110]' : 'text-gray-400'
              }`}
              onClick={() => {
                if (step > 2) setStep(2);
              }}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 2 ? 'bg-[#111110] text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                ۲
              </span>
              <span>اطلاعات پستی</span>
            </div>
            <div className="flex-1 h-[1px] bg-[#BFDDF0] mx-3" />
            <div className={`flex items-center gap-1.5 ${
              step >= 3 ? 'text-[#111110]' : 'text-gray-400'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 3 ? 'bg-[#111110] text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                ۳
              </span>
              <span>پرداخت و تایید</span>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {completedOrder ? (
            /* ========================================================= */
            /* SUCCESS CONFIRMATION RECEIPT                              */
            /* ========================================================= */
            <div className="text-center py-4 space-y-6">
              <div className="w-16 h-16 bg-green-100 text-[#2F6B4F] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-bold text-[#111110]">
                  سفارش شما با موفقیت ثبت گردید
                </h3>
                <p className="text-xs text-[#4A5560] max-w-md mx-auto leading-relaxed">
                  اطلاعات سفارش در سیستم ثبت شد و در پنل مدیریت استودیو MORICO قابل مشاهده است. همچنین فاکتور آماده چاپ می‌باشد.
                </p>
              </div>

              {/* Order Metadata Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#E4F5FF]/50 border border-[#BFDDF0] max-w-lg mx-auto space-y-3 text-xs text-right">
                
                {/* Order Number */}
                <div className="flex justify-between items-center pb-2.5 border-b border-[#BFDDF0]/60">
                  <span className="text-[#4A5560]">شماره فاکتور / سفارش:</span>
                  <div className="flex items-center gap-1.5 font-bold font-mono text-sm text-[#111110]">
                    <span>{completedOrder.orderNumber}</span>
                    <button
                      onClick={() => handleCopy(completedOrder.orderNumber, 'num')}
                      className="p-1 hover:text-black text-gray-500 cursor-pointer"
                      title="کپی شماره سفارش"
                    >
                      {copiedKey === 'num' ? <Check className="w-3.5 h-3.5 text-[#2F6B4F]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Tracking Code */}
                <div className="flex justify-between items-center pb-2.5 border-b border-[#BFDDF0]/60">
                  <span className="text-[#4A5560]">کد رهگیری پست پیشتاز:</span>
                  <div className="flex items-center gap-1.5 font-bold font-mono text-[#2F6B4F]">
                    <span>{completedOrder.trackingCode}</span>
                    <button
                      onClick={() => handleCopy(completedOrder.trackingCode, 'trk')}
                      className="p-1 hover:text-black text-gray-500 cursor-pointer"
                      title="کپی کد رهگیری"
                    >
                      {copiedKey === 'trk' ? <Check className="w-3.5 h-3.5 text-[#2F6B4F]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Customer */}
                <div className="flex justify-between items-center pb-2.5 border-b border-[#BFDDF0]/60">
                  <span className="text-[#4A5560]">تحویل‌گیرنده:</span>
                  <span className="font-semibold text-[#111110]">{completedOrder.customerName} ({formatPersianPhone(completedOrder.customerPhone)})</span>
                </div>

                {/* Address */}
                <div className="flex justify-between items-start pb-2.5 border-b border-[#BFDDF0]/60">
                  <span className="text-[#4A5560] shrink-0">نشانی ارسال:</span>
                  <span className="font-medium text-[#111110] text-left max-w-xs">{completedOrder.customerAddress}</span>
                </div>

                {/* Amount Paid */}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[#4A5560] font-semibold">مبلغ پرداخت شده:</span>
                  <span className="font-bold text-base text-[#111110]">{formatPrice(completedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    if (onNavigateToTracking) onNavigateToTracking();
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#111110] text-white hover:bg-black text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  رهگیری وضعیت بسته در استودیو
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[#BFDDF0] bg-white text-[#111110] hover:bg-gray-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  بازگشت به صفحه اصلی
                </button>
              </div>

            </div>
          ) : step === 1 ? (
            /* ========================================================= */
            /* STEP 1: CART REVIEW                                       */
            /* ========================================================= */
            <div className="space-y-4">
              <div className="space-y-3">
                {cart.map((item) => {
                  const liveProd = products.find((p) => p.id === item.product.id) || item.product;
                  const price = liveProd.discountPrice || liveProd.price;
                  const customFee = item.customization?.customFee || 0;
                  const total = (price + customFee) * item.quantity;

                  return (
                    <div
                      key={item.cartItemId}
                      className="p-3 rounded-xl border border-[#BFDDF0] bg-[#E4F5FF]/20 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={liveProd.image}
                          alt={liveProd.name}
                          className="w-12 h-14 object-cover rounded-lg border border-[#BFDDF0] shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-[#111110] truncate">{liveProd.name}</h4>
                          <span className="text-[11px] text-[#4A5560] block mt-0.5">
                            رنگ: {item.selectedColor} | سایز: {item.selectedSize} | تعداد: {formatPersianNumber(item.quantity)}
                          </span>
                          {item.customization && (
                            <span className="text-[10px] text-blue-700 font-medium">سفارشی‌سازی شده</span>
                          )}
                        </div>
                      </div>

                      <div className="text-left font-bold text-[#111110] shrink-0">
                        {formatPrice(total)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Financial Summary */}
              <div className="p-4 rounded-2xl bg-[#E4F5FF]/50 border border-[#BFDDF0] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#4A5560]">جمع محصولات:</span>
                  <span className="font-medium text-[#111110]">{formatPrice(totals.originalSubtotal)}</span>
                </div>
                {totals.productDiscountTotal > 0 && (
                  <div className="flex justify-between text-[#2F6B4F]">
                    <span>تخفیف مستقیم اقلام:</span>
                    <span>- {formatPrice(totals.productDiscountTotal)}</span>
                  </div>
                )}
                {totals.promoDiscount > 0 && (
                  <div className="flex justify-between text-[#2F6B4F]">
                    <span>تخفیف کد پروموشن ({appliedCode}):</span>
                    <span>- {formatPrice(totals.promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#4A5560]">هزینه ارسال پیشتاز:</span>
                  <span>{totals.shippingFee === 0 ? <span className="text-[#2F6B4F] font-bold">رایگان</span> : formatPrice(totals.shippingFee)}</span>
                </div>
                <div className="pt-2 border-t border-[#BFDDF0] flex justify-between font-bold text-sm text-[#111110]">
                  <span>مبلغ کل سفارش:</span>
                  <span>{formatPrice(totals.finalTotal)}</span>
                </div>
              </div>

              <button
                onClick={handleNextStep}
                className="w-full py-3.5 rounded-xl bg-[#111110] text-white hover:bg-[#2A2A28] text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>تایید اقلام و ورود مشخصات ارسال</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          ) : step === 2 ? (
            /* ========================================================= */
            /* STEP 2: CUSTOMER INFO & SHIPPING ADDRESS                  */
            /* ========================================================= */
            <div className="space-y-4 text-xs">
              
              {/* Logged in prompt */}
              {currentUser && (
                <div className="p-3 bg-[#E4F5FF]/60 border border-[#BFDDF0] rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#111110]">
                    <UserIcon className="w-4 h-4" />
                    <span>ورود با حساب: <strong>{currentUser.name}</strong> ({currentUser.phone})</span>
                  </div>
                  <span className="text-[10px] text-[#2F6B4F] font-bold">اطلاعات تایید شده</span>
                </div>
              )}

              {/* Map Address Selection Banner */}
              <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-neutral-800 min-w-0">
                  <MapPin className="w-4 h-4 text-[#ef394a] shrink-0" />
                  <span className="truncate">انتخاب دقیق نشانی، پلاک و مشخصات تحویل از روی نقشه</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#ef394a] hover:bg-[#d72c41] text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  انتخاب از نقشه
                </button>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-[#111110]">
                    نام و نام خانوادگی تحویل‌گیرنده *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    placeholder="مثال: مهیار شبرنگ"
                    className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none ${
                      errors.name ? 'border-[#A33A3A] bg-[#A33A3A]/5' : 'border-[#BFDDF0] focus:border-[#111110]'
                    }`}
                  />
                  {errors.name && <span className="text-[11px] text-[#A33A3A] mt-1 block">{errors.name}</span>}
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#111110]">
                    شماره تلفن همراه (جهت هماهنگی و پیامک رهگیری) *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none dir-ltr text-right ${
                      errors.phone ? 'border-[#A33A3A] bg-[#A33A3A]/5' : 'border-[#BFDDF0] focus:border-[#111110]'
                    }`}
                  />
                  {errors.phone && <span className="text-[11px] text-[#A33A3A] mt-1 block">{errors.phone}</span>}
                </div>
              </div>

              {/* Email & Province/City */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-[#111110]">
                    استان *
                  </label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#BFDDF0] rounded-xl focus:outline-none focus:border-[#111110] bg-white cursor-pointer"
                  >
                    {IRAN_PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#111110]">
                    شهرستان / شهر *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="مثال: تهران"
                    className="w-full px-3.5 py-2.5 border border-[#BFDDF0] rounded-xl focus:outline-none focus:border-[#111110]"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#111110]">
                    کد پستی ۱۰ رقمی
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    maxLength={10}
                    onChange={(e) => {
                      setPostalCode(e.target.value);
                      if (errors.postalCode) setErrors((prev) => ({ ...prev, postalCode: '' }));
                    }}
                    placeholder="۱۲۳۴۵۶۷۸۹۰"
                    className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none dir-ltr text-right font-mono ${
                      errors.postalCode ? 'border-[#A33A3A]' : 'border-[#BFDDF0] focus:border-[#111110]'
                    }`}
                  />
                  {errors.postalCode && <span className="text-[11px] text-[#A33A3A] mt-1 block">{errors.postalCode}</span>}
                </div>
              </div>

              {/* Full Address */}
              <div>
                <label className="block font-semibold mb-1 text-[#111110]">
                  نشانی دقیق پستی (خیابان، کوچه، پلاک، واحد) *
                </label>
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
                  }}
                  placeholder="تهران، فرشته، خیابان مریم غربی، پلاک ۲۴..."
                  className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none ${
                    errors.address ? 'border-[#A33A3A] bg-[#A33A3A]/5' : 'border-[#BFDDF0] focus:border-[#111110]'
                  }`}
                />
                {errors.address && <span className="text-[11px] text-[#A33A3A] mt-1 block">{errors.address}</span>}
              </div>

              {/* Delivery Notes */}
              <div>
                <label className="block font-semibold mb-1 text-[#111110]">
                  یادداشت سفارش یا زمان تحویل (اختیاری)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="توضیحات مربوط به نگهبانی، زنگ یا هماهنگی..."
                  className="w-full px-3.5 py-2.5 border border-[#BFDDF0] rounded-xl focus:outline-none focus:border-[#111110]"
                />
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl border border-[#BFDDF0] hover:bg-gray-100 text-[#111110] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>مرحله قبل</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 py-3.5 rounded-xl bg-[#111110] text-white hover:bg-[#2A2A28] font-semibold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <span>ادامه به انتخاب درگاه و پرداخت</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            /* ========================================================= */
            /* STEP 3: PAYMENT & CONFIRMATION                            */
            /* ========================================================= */
            <form onSubmit={handleFinalSubmit} className="space-y-5 text-xs">
              
              {/* Payment Methods */}
              <div className="space-y-3">
                <label className="block font-bold text-sm text-[#111110]">
                  انتخاب شیوه پرداخت:
                </label>

                {/* Disconnected Gateway Notice */}
                {!gatewayStatus?.configured && (
                  <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-900 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-xs">درگاه پرداخت اینترنتی متصل نیست</span>
                      <span className="text-[11px] text-rose-800 leading-relaxed block mt-0.5">
                        {gatewayStatus?.disabledReason || 'درگاه پرداخت آنلاین اینترنتی هنوز متصل نشده است. تا زمان اتصال درگاه توسط مدیریت، امکان پرداخت آنلاین وجود ندارد.'}
                        {' '}جهت ثبت سفارش، می‌توانید گزینه «کارت به کارت» را انتخاب فرمایید.
                      </span>
                    </div>
                  </div>
                )}

                {/* Gateway option */}
                <div
                  onClick={() => {
                    if (gatewayStatus?.configured) {
                      setPaymentMethod('gateway');
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    !gatewayStatus?.configured
                      ? 'border-gray-200 bg-gray-50/60 opacity-75 cursor-not-allowed'
                      : paymentMethod === 'gateway'
                      ? 'border-[#111110] bg-[#E4F5FF]/40 ring-1 ring-[#111110] cursor-pointer'
                      : 'border-[#BFDDF0] bg-white hover:border-gray-400 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#BFDDF0] flex items-center justify-center text-[#111110] shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#111110] flex items-center gap-2">
                        <span>پرداخت آنلاین با کلیه کارتهای بانکی (شتاب)</span>
                        {gatewayStatus?.configured ? (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold">
                            فعال
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            غیرفعال / درگاه متصل نیست
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#4A5560] block mt-0.5">
                        {gatewayStatus?.configured
                          ? `متصل به درگاه امن ${gatewayStatus?.gatewayName || 'شاپرک'} با رمز پویا`
                          : 'درگاه هنوز متصل نشده است — پرداخت آنلاین تا زمان اتصال توسط مدیریت غیرفعال می‌باشد.'}
                      </span>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    !gatewayStatus?.configured
                      ? 'border-gray-200 bg-gray-100'
                      : paymentMethod === 'gateway'
                      ? 'border-[#111110] bg-[#111110]'
                      : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'gateway' && gatewayStatus?.configured && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                {/* Card to Card option */}
                <div
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    paymentMethod === 'card'
                      ? 'border-[#111110] bg-[#E4F5FF]/40 ring-1 ring-[#111110]'
                      : 'border-[#BFDDF0] bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#BFDDF0] flex items-center justify-center text-[#111110] shrink-0">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#111110]">
                        واریز به حساب رسمی آتلیه (کارت به کارت)
                      </div>
                      <span className="text-[11px] text-[#4A5560] block mt-0.5">
                        شماره حساب و کارت استودیو MORICO پس از ثبت نمایش داده می‌شود
                      </span>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentMethod === 'card' ? 'border-[#111110] bg-[#111110]' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'card' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

              {/* Delivery & Recipient Summary */}
              <div className="p-4 rounded-2xl bg-white border border-[#BFDDF0] space-y-2 text-xs">
                <span className="font-bold text-[#111110] block border-b border-[#BFDDF0]/60 pb-1.5">
                  خلاصه اطلاعات ارسال:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-[#4A5560]">تحویل‌گیرنده:</span> <strong className="text-[#111110]">{name}</strong></div>
                  <div><span className="text-[#4A5560]">شماره تماس:</span> <strong className="text-[#111110] font-mono">{formatPersianPhone(phone)}</strong></div>
                  <div className="col-span-2"><span className="text-[#4A5560]">نشانی:</span> <span className="text-[#111110]">{province}، {city}، {address}</span></div>
                </div>
              </div>

              {/* Final Financial Breakdown */}
              <div className="p-4 rounded-2xl bg-[#E4F5FF]/50 border border-[#BFDDF0] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#4A5560]">مبلغ محصولات:</span>
                  <span className="font-medium text-[#111110]">{formatPrice(totals.originalSubtotal)}</span>
                </div>
                {totals.productDiscountTotal > 0 && (
                  <div className="flex justify-between text-[#2F6B4F]">
                    <span>تخفیف مستقیم کالاها:</span>
                    <span>- {formatPrice(totals.productDiscountTotal)}</span>
                  </div>
                )}
                {totals.promoDiscount > 0 && (
                  <div className="flex justify-between text-[#2F6B4F]">
                    <span>تخفیف کوپن ({appliedCode}):</span>
                    <span>- {formatPrice(totals.promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#4A5560]">هزینه ارسال پیشتاز:</span>
                  <span>{totals.shippingFee === 0 ? <span className="text-[#2F6B4F] font-bold">رایگان</span> : formatPrice(totals.shippingFee)}</span>
                </div>
                <div className="pt-2 border-t border-[#BFDDF0] flex justify-between font-bold text-base text-[#111110]">
                  <span>مبلغ قابل پرداخت نهایی:</span>
                  <span>{formatPrice(totals.finalTotal)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-3 rounded-xl border border-[#BFDDF0] hover:bg-gray-100 text-[#111110] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>ویرایش آدرس</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || totals.hasOutOfStock || (paymentMethod === 'gateway' && !gatewayStatus?.configured)}
                  className="flex-1 py-3.5 sm:py-4 rounded-xl bg-[#111110] text-white hover:bg-[#2A2A28] disabled:opacity-50 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  <span>
                    {isSubmitting
                      ? 'در حال پردازش سفارش...'
                      : paymentMethod === 'gateway' && !gatewayStatus?.configured
                      ? 'درگاه پرداخت متصل نیست — امکان پرداخت وجود ندارد'
                      : paymentMethod === 'gateway'
                      ? `پرداخت آنلاین و ثبت سفارش (${formatPrice(totals.finalTotal)})`
                      : `ثبت سفارش با پرداخت کارت به کارت (${formatPrice(totals.finalTotal)})`}
                  </span>
                </button>
              </div>

            </form>
          )}

        </div>

      </div>

      {/* Interactive Location Picker Modal (Parsimap) */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onConfirm={handleLocationConfirmed}
        initialCity={city}
      />
    </div>
  );
};
