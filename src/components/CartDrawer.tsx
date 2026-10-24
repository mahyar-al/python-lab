import React, { useState } from 'react';
import { CartItem, DiscountCode, Product } from '../lib/types';
import { formatPrice, formatPersianNumber } from '../lib/currency';
import { calculateCartTotals, validatePromoCode, SHIPPING_THRESHOLD } from '../lib/cartUtils';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Tag,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Info,
  Truck,
  ExternalLink
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  products: Product[];
  onUpdateQuantity: (cartItemId: string, quantity: number) => { success: boolean; message?: string };
  onRemoveItem: (cartItemId: string) => CartItem | null;
  onClearCart: () => void;
  onUndoRemove?: () => boolean;
  onProceedToCheckout: (discount: number, promo: string) => void;
  discounts: DiscountCode[];
  onSelectProductDetails?: (product: Product) => void;
  onShowToast?: (type: 'success' | 'error' | 'warning' | 'info', message: string, action?: { label: string; onClick: () => void }) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  products,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onUndoRemove,
  onProceedToCheckout,
  discounts,
  onSelectProductDetails,
  onShowToast
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<DiscountCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  // Real-time financial calculations
  const totals = calculateCartTotals(cart, appliedPromo, products);

  // Remaining for free shipping
  const remainingForFreeShipping = Math.max(0, SHIPPING_THRESHOLD - totals.subtotalAfterProductDiscount);
  const freeShippingProgress = Math.min(100, Math.round((totals.subtotalAfterProductDiscount / SHIPPING_THRESHOLD) * 100));

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    setPromoSuccess(null);

    const cleanCode = promoInput.trim().toUpperCase();
    if (!cleanCode) {
      setPromoError('لطفاً کد تخفیف را وارد نمایید.');
      return;
    }

    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          subtotal: totals.subtotalAfterProductDiscount
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.valid) {
        const validatedDisc: DiscountCode = {
          id: `disc-${cleanCode}`,
          code: data.code || cleanCode,
          type: 'fixed',
          amount: data.discountAmount,
          description: data.description || 'تخفیف ویژه اعمال شد',
          active: true
        };
        setAppliedPromo(validatedDisc);
        setPromoSuccess(`کد تخفیف ${validatedDisc.code} با موفقیت اعمال شد.`);
        setPromoInput('');
        if (onShowToast) onShowToast('success', `کد تخفیف ${validatedDisc.code} اعمال شد.`);
        return;
      } else if (data.error) {
        setPromoError(data.error);
        return;
      }
    } catch (_) {}

    // Fallback local check
    const validation = validatePromoCode(cleanCode, totals.subtotalAfterProductDiscount, discounts);

    if (!validation.valid || !validation.discount) {
      setPromoError(validation.error || 'کد تخفیف معتبر نیست.');
      return;
    }

    setAppliedPromo(validation.discount);
    setPromoSuccess(`کد تخفیف ${validation.discount.code} با موفقیت اعمال شد.`);
    setPromoInput('');

    if (onShowToast) {
      onShowToast('success', `کد تخفیف ${validation.discount.code} اعمال شد.`);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError(null);
    setPromoSuccess(null);
    if (onShowToast) {
      onShowToast('info', 'کد تخفیف حذف شد.');
    }
  };

  const handleItemRemove = (cartItemId: string) => {
    const removed = onRemoveItem(cartItemId);
    if (removed && onShowToast && onUndoRemove) {
      onShowToast(
        'info',
        `«${removed.product.name}» از سبد حذف شد.`,
        {
          label: 'بازگردانی',
          onClick: () => {
            onUndoRemove();
          }
        }
      );
    }
  };

  const handleQuantityChange = (cartItemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    const res = onUpdateQuantity(cartItemId, newQty);
    if (!res.success && res.message && onShowToast) {
      onShowToast('warning', res.message);
    }
  };

  const handleClearAll = () => {
    onClearCart();
    setShowClearConfirm(false);
    if (onShowToast) {
      onShowToast('info', 'تمامی اقلام از سبد خرید حذف شدند.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <div className="w-screen max-w-md bg-[#FFFFFF] border-r border-[#BFDDF0] text-right flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#BFDDF0] bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E4F5FF] border border-[#BFDDF0] flex items-center justify-center text-[#111110]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#111110] leading-none">
                  سبد خرید شما
                </h3>
                <span className="text-[11px] text-[#4A5560] mt-0.5 block">
                  {formatPersianNumber(totals.totalItemsCount)} کالا در سبد
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {cart.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="p-2 text-xs text-[#4A5560] hover:text-[#A33A3A] hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  title="پاک کردن کل سبد"
                  aria-label="پاک کردن سبد خرید"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl border border-[#BFDDF0] hover:bg-gray-100 text-[#111110] transition-colors cursor-pointer"
                aria-label="بستن سبد خرید"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Clear Cart Confirmation Banner */}
          {showClearConfirm && (
            <div className="p-3.5 bg-[#A33A3A]/10 border-b border-[#A33A3A]/30 text-xs flex items-center justify-between gap-3 animate-in fade-in">
              <span className="text-[#A33A3A] font-medium">
                آیا از حذف تمام اقلام سبد خرید اطمینان دارید؟
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2.5 py-1 bg-white border border-[#BFDDF0] rounded-lg text-xs hover:bg-gray-50"
                >
                  انصراف
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-2.5 py-1 bg-[#A33A3A] text-white rounded-lg text-xs font-bold hover:bg-[#8A2F2F]"
                >
                  حذف همه
                </button>
              </div>
            </div>
          )}

          {/* Free Shipping Progress Meter */}
          {cart.length > 0 && (
            <div className="px-4 sm:px-5 py-3 bg-[#E4F5FF]/60 border-b border-[#BFDDF0] text-xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 font-medium text-[#111110]">
                  <Truck className="w-3.5 h-3.5 text-[#2F6B4F]" />
                  <span>
                    {remainingForFreeShipping === 0 ? (
                      <span className="text-[#2F6B4F] font-bold">ارسال این سفارش رایگان است!</span>
                    ) : (
                      <span>
                        <span className="font-bold text-[#111110]">{formatPrice(remainingForFreeShipping)}</span> دیگر تا ارسال رایگان
                      </span>
                    )}
                  </span>
                </div>
                <span className="text-[11px] text-[#4A5560] font-mono">
                  {formatPersianNumber(freeShippingProgress)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-white border border-[#BFDDF0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#111110] transition-all duration-300"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-[#4A5560] space-y-4 py-16">
                <div className="w-16 h-16 rounded-2xl bg-[#E4F5FF] border border-[#BFDDF0] flex items-center justify-center text-[#4A5560]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-[#111110]">سبد خرید شما در حال حاضر خالی است</h4>
                  <p className="text-xs text-[#4A5560] max-w-xs leading-relaxed">
                    مجموعه پوشاک ارگانیک و مینیمال استودیو را بررسی کنید و یا در بخش طراحی آنلاین، طرح دلخواه خود را خلق نمایید.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-xs font-semibold rounded-xl bg-[#111110] text-white hover:bg-[#2A2A28] shadow-md transition-all cursor-pointer"
                >
                  مشاهده مجموعه محصولات
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const liveProd = products.find((p) => p.id === item.product.id) || item.product;
                const isOutOfStock = liveProd.stock === 0;
                const isStockCapped = item.quantity >= liveProd.stock;
                const hasDiscount = liveProd.discountPrice !== undefined && liveProd.discountPrice < liveProd.price;
                const effectivePrice = hasDiscount ? liveProd.discountPrice! : liveProd.price;
                const customFee = item.customization?.customFee || 0;
                const lineTotal = (effectivePrice + customFee) * item.quantity;

                return (
                  <div
                    key={item.cartItemId}
                    className={`p-3.5 rounded-2xl border transition-all relative flex gap-3 ${
                      isOutOfStock
                        ? 'border-[#A33A3A]/40 bg-[#A33A3A]/5'
                        : 'border-[#BFDDF0] bg-white hover:border-[#111110]/40'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div
                      onClick={() => onSelectProductDetails && onSelectProductDetails(liveProd)}
                      className="w-18 h-22 sm:w-20 sm:h-24 rounded-xl overflow-hidden border border-[#BFDDF0] bg-[#E4F5FF]/30 shrink-0 cursor-pointer relative group"
                    >
                      <img
                        src={liveProd.image}
                        alt={liveProd.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {item.customization && (
                        <div className="absolute bottom-1 right-1 bg-[#111110] text-white rounded p-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <h4
                            onClick={() => onSelectProductDetails && onSelectProductDetails(liveProd)}
                            className="font-bold text-xs sm:text-sm text-[#111110] hover:underline cursor-pointer truncate leading-snug"
                          >
                            {liveProd.name}
                          </h4>
                          <button
                            onClick={() => handleItemRemove(item.cartItemId)}
                            className="p-1 text-gray-400 hover:text-[#A33A3A] transition-colors rounded cursor-pointer"
                            title="حذف از سبد"
                            aria-label={`حذف ${liveProd.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Options: Variant, Color, Size, Custom Attributes */}
                        <div className="flex items-center gap-1.5 text-[11px] text-[#4A5560] mt-1 flex-wrap">
                          {item.selectedVariant && (
                            <span className="inline-flex items-center gap-1 bg-[#E4F5FF] px-2 py-0.5 rounded-md border border-[#BFDDF0] font-medium text-[#111110]">
                              تنوع: {item.selectedVariant.title}
                            </span>
                          )}
                          {item.selectedColor && (
                            <span className="inline-flex items-center gap-1 bg-[#E4F5FF]/60 px-2 py-0.5 rounded-md border border-[#BFDDF0]/60">
                              رنگ: {item.selectedColor}
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="inline-flex items-center gap-1 bg-[#E4F5FF]/60 px-2 py-0.5 rounded-md border border-[#BFDDF0]/60">
                              سایز: {item.selectedSize}
                            </span>
                          )}
                          {item.selectedAttributes &&
                            Object.entries(item.selectedAttributes).map(([k, v]) => (
                              <span key={k} className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-[#BFDDF0]">
                                {k}: {v}
                              </span>
                            ))}
                        </div>

                        {/* Customization Note */}
                        {item.customization && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] mt-1 font-medium border border-blue-200">
                            <Sparkles className="w-3 h-3" />
                            <span>چاپ اختصاصی (+{formatPrice(customFee)})</span>
                          </div>
                        )}

                        {/* Stock Warnings */}
                        {isOutOfStock ? (
                          <div className="text-[10px] text-[#A33A3A] font-bold mt-1">
                            ناموجود در انبار — امکان ثبت نهایی وجود ندارد.
                          </div>
                        ) : isStockCapped && liveProd.stock <= 5 ? (
                          <div className="text-[10px] text-[#9A6B1F] mt-1">
                            تنها {formatPersianNumber(liveProd.stock)} عدد در انبار باقی مانده است.
                          </div>
                        ) : null}
                      </div>

                      {/* Bottom row: Stepper and Price */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#BFDDF0]/60">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-[#BFDDF0] rounded-xl overflow-hidden bg-white shadow-2xs">
                          <button
                            onClick={() => handleQuantityChange(item.cartItemId, item.quantity, -1)}
                            className="w-7 h-7 flex items-center justify-center text-xs hover:bg-gray-100 font-bold text-[#111110] transition-colors cursor-pointer"
                            aria-label="کاهش تعداد"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-[#111110] font-persian-nums">
                            {formatPersianNumber(item.quantity)}
                          </span>
                          <button
                            disabled={isStockCapped || isOutOfStock}
                            onClick={() => handleQuantityChange(item.cartItemId, item.quantity, 1)}
                            className="w-7 h-7 flex items-center justify-center text-xs hover:bg-gray-100 font-bold text-[#111110] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            aria-label="افزایش تعداد"
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-left">
                          <div className="font-bold text-xs sm:text-sm text-[#111110]">
                            {formatPrice(lineTotal)}
                          </div>
                          {hasDiscount && (
                            <div className="text-[10px] text-[#4A5560] line-through">
                              {formatPrice((liveProd.price + customFee) * item.quantity)}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Trigger */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#BFDDF0] bg-white space-y-4 shadow-lg sticky bottom-0">
              
              {/* Promo Code Form */}
              <form onSubmit={handleApplyPromo} className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value);
                      setPromoError(null);
                    }}
                    placeholder="کد تخفیف (مثال: MORICO2026)"
                    className="flex-1 px-3.5 py-2 text-xs border border-[#BFDDF0] rounded-xl text-right uppercase font-mono focus:outline-none focus:border-[#111110]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#111110] text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                  >
                    اعمال کد
                  </button>
                </div>

                {promoError && (
                  <p className="text-[11px] text-[#A33A3A] font-medium leading-relaxed">
                    {promoError}
                  </p>
                )}

                {promoSuccess && (
                  <p className="text-[11px] text-[#2F6B4F] font-medium leading-relaxed">
                    {promoSuccess}
                  </p>
                )}
              </form>

              {/* Active Applied Promo Chip */}
              {appliedPromo && (
                <div className="flex items-center justify-between text-xs text-[#2F6B4F] bg-green-50/80 border border-green-200 p-2.5 rounded-xl">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Tag className="w-3.5 h-3.5" />
                    <span>
                      کد {appliedPromo.code} اعمال شد ({formatPrice(totals.promoDiscount)} تخفیف)
                    </span>
                  </div>
                  <button
                    onClick={handleRemovePromo}
                    className="text-xs hover:underline text-gray-500 font-medium cursor-pointer"
                  >
                    حذف
                  </button>
                </div>
              )}

              {/* Detailed Financial Summary */}
              <div className="space-y-2 text-xs text-[#4A5560] pt-1">
                <div className="flex justify-between">
                  <span>مجموع ارزش اقلام:</span>
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
                    <span>تخفیف کوپن ({appliedPromo?.code}):</span>
                    <span>- {formatPrice(totals.promoDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>هزینه بسته‌بندی و ارسال پیشتاز:</span>
                  <span>
                    {totals.shippingFee === 0 ? (
                      <span className="text-[#2F6B4F] font-bold">رایگان</span>
                    ) : (
                      <span className="text-[#111110] font-medium">{formatPrice(totals.shippingFee)}</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between font-bold text-sm sm:text-base text-[#111110] pt-2.5 border-t border-[#BFDDF0]">
                  <span>مبلغ قابل پرداخت:</span>
                  <span className="text-[#111110]">{formatPrice(totals.finalTotal)}</span>
                </div>
              </div>

              {/* Out of stock warning banner */}
              {totals.hasOutOfStock && (
                <div className="p-2.5 rounded-xl bg-[#A33A3A]/10 border border-[#A33A3A]/30 text-[#A33A3A] text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>برخی از اقلام سبد ناموجود هستند. لطفاً آن‌ها را حذف کنید تا بتوانید خرید را نهایی کنید.</span>
                </div>
              )}

              {/* Checkout Action Button */}
              <button
                disabled={totals.hasOutOfStock || cart.length === 0}
                onClick={() => onProceedToCheckout(totals.promoDiscount, appliedPromo?.code || '')}
                className="w-full py-3.5 sm:py-4 rounded-xl bg-[#111110] text-white hover:bg-[#2A2A28] disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer"
              >
                <span>ادامه فرآیند خرید و پرداخت</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
