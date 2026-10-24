import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, GarmentViewId, ViewCustomization } from '../../lib/types';
import { formatPrice, formatPersianNumber, formatPersianPhone, toPersianDigits } from '../../lib/currency';
import { formatJalaliDateTime } from '../../lib/dateUtils';
import {
  X,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Printer,
  Trash2,
  Sparkles,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  User,
  Package,
  Calendar,
  FileText,
  Layers,
  Eye
} from 'lucide-react';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onPrintA4Sheet: (order: Order) => void;
  onPrintShippingLabel: (order: Order) => void;
  onPrintProductionSlip?: (order: Order) => void;
  dark?: boolean;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onUpdateStatus,
  onDeleteOrder,
  onPrintA4Sheet,
  onPrintShippingLabel,
  onPrintProductionSlip
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order?.status || 'PENDING_PAYMENT');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [selectedAdminViewId, setSelectedAdminViewId] = useState<GarmentViewId>('front');

  useEffect(() => {
    if (order?.status) {
      setSelectedStatus(order.status);
    }
  }, [order?.status]);

  if (!order) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (newStatus === 'CANCELED') {
      setIsConfirmingCancel(true);
      return;
    }
    setSelectedStatus(newStatus);
    await onUpdateStatus(order.id, newStatus);
  };

  const handleConfirmCancel = async () => {
    setIsConfirmingCancel(false);
    setSelectedStatus('CANCELED');
    await onUpdateStatus(order.id, 'CANCELED');
  };

  const handleDelete = async () => {
    const orderIdentifier = order.orderNumber || order.id;
    if (deleteConfirmationInput.trim() !== orderIdentifier.trim()) {
      return;
    }
    await onDeleteOrder(order.id);
    onClose();
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PAID':
        return { label: 'پرداخت شده', bg: 'bg-[#2F6B4F]/10 text-[#2F6B4F] border-[#2F6B4F]/30' };
      case 'PROCESSING':
        return { label: 'در حال تولید / چاپ', bg: 'bg-[#2B5876]/10 text-[#2B5876] border-[#2B5876]/30' };
      case 'SHIPPED':
        return { label: 'ارسال شده به پست', bg: 'bg-[#9A6B1F]/10 text-[#9A6B1F] border-[#9A6B1F]/30' };
      case 'DELIVERED':
        return { label: 'تحویل داده شده', bg: 'bg-[#111110]/10 text-[#111110] border-[#111110]/30' };
      case 'PENDING_PAYMENT':
        return { label: 'در انتظار پرداخت', bg: 'bg-gray-100 text-gray-700 border-gray-300' };
      case 'PAYMENT_FAILED':
        return { label: 'خطا در پرداخت', bg: 'bg-[#A33A3A]/10 text-[#A33A3A] border-[#A33A3A]/30' };
      case 'CANCELED':
        return { label: 'لغو شده', bg: 'bg-[#A33A3A]/15 text-[#A33A3A] border-[#A33A3A]/40' };
      default:
        return { label: status, bg: 'bg-gray-100 text-gray-800 border-gray-300' };
    }
  };

  const currentBadge = getStatusBadge(order.status);
  const orderIdentifier = order.orderNumber || order.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#BFDDF0] rounded-[24px] w-full max-w-4xl max-h-[92vh] overflow-y-auto text-right p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Modal Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#BFDDF0]">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-[#111110]">
                جزئیات سفارش: {orderIdentifier}
              </h2>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${currentBadge.bg}`}>
                {currentBadge.label}
              </span>
            </div>
            <div className="text-xs text-[#4A5560] mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>تاریخ ثبت: {formatJalaliDateTime(order.date)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onPrintA4Sheet(order)}
              className="px-3 py-1.5 rounded-xl border border-[#BFDDF0] text-xs font-medium text-[#111110] hover:bg-[#D3ECFA]/50 transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ فاکتور (A4)</span>
            </button>

            <button
              onClick={() => onPrintShippingLabel(order)}
              className="px-3 py-1.5 rounded-xl border border-[#BFDDF0] text-xs font-medium text-[#111110] hover:bg-[#D3ECFA]/50 transition-colors flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5" />
              <span>لیبل پستی</span>
            </button>

            {onPrintProductionSlip && (
              <button
                onClick={() => onPrintProductionSlip(order)}
                className="px-3 py-1.5 rounded-xl border border-[#BFDDF0] text-xs font-medium text-[#2B5876] bg-[#E4F5FF]/50 hover:bg-[#D3ECFA] transition-colors flex items-center gap-1.5"
                title="دستور کارگاهی چاپ مستقیم DTG و بسته‌بندی"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>حواله کارگاه (DTG)</span>
              </button>
            )}

            <button
              onClick={() => setIsDeleting(true)}
              className="p-1.5 rounded-xl text-[#A33A3A] hover:bg-[#A33A3A]/10 transition-colors"
              title="حذف سفارش"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#4A5560] hover:bg-[#D3ECFA]/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Change Selector Bar */}
        <div className="p-4 rounded-2xl bg-[#E4F5FF]/50 border border-[#BFDDF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-[#111110]">
            تغییر وضعیت مرحله‌ای سفارش:
          </span>
          <div className="flex items-center gap-2">
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
              className="px-3 py-2 rounded-xl border border-[#BFDDF0] bg-white text-[#111110] font-medium focus:outline-none cursor-pointer"
            >
              <option value="PENDING_PAYMENT">در انتظار پرداخت</option>
              <option value="PAID">پرداخت شده</option>
              <option value="PROCESSING">در حال پردازش و چاپ</option>
              <option value="SHIPPED">ارسال شده (کد رهگیری پست)</option>
              <option value="DELIVERED">تحویل مشتری شد</option>
              <option value="PAYMENT_FAILED">خطا در تراکنش بانک</option>
              <option value="CANCELED">لغو شده</option>
            </select>
          </div>
        </div>

        {/* Cancellation Confirmation Warning */}
        {isConfirmingCancel && (
          <div className="p-4 rounded-xl border border-[#A33A3A]/30 bg-[#A33A3A]/10 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-[#A33A3A]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>آیا از لغو این سفارش اطمینان دارید؟ وضعیت سفارش به «لغو شده» تغییر خواهد کرد.</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsConfirmingCancel(false)}
                className="px-3 py-1 bg-white border rounded-lg"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-3 py-1 bg-[#A33A3A] text-white rounded-lg font-bold"
              >
                تایید لغو
              </button>
            </div>
          </div>
        )}

        {/* SECTION 1: Customer Information with Copy Buttons */}
        <div className="p-5 rounded-2xl border border-[#BFDDF0] bg-white space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#111110] border-b border-[#BFDDF0]/60 pb-2">
            <User className="w-4 h-4" />
            <span>مشخصات خریدار و نشانی تحویل</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            
            {/* Customer Name */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#E4F5FF]/30 border border-[#BFDDF0]/60">
              <div>
                <span className="text-[#4A5560] block text-[11px]">نام خریدار:</span>
                <span className="font-semibold text-[#111110]">{order.customerName}</span>
              </div>
              <button
                onClick={() => copyToClipboard(order.customerName, 'name')}
                className="p-1.5 text-gray-500 hover:text-black"
                title="کپی نام"
              >
                {copiedKey === 'name' ? <Check className="w-3.5 h-3.5 text-[#2F6B4F]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#E4F5FF]/30 border border-[#BFDDF0]/60">
              <div>
                <span className="text-[#4A5560] block text-[11px]">شماره تماس:</span>
                <span className="font-semibold text-[#111110] dir-ltr inline-block">
                  {formatPersianPhone(order.customerPhone)}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(order.customerPhone, 'phone')}
                className="p-1.5 text-gray-500 hover:text-black"
                title="کپی شماره تلفن"
              >
                {copiedKey === 'phone' ? <Check className="w-3.5 h-3.5 text-[#2F6B4F]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#E4F5FF]/30 border border-[#BFDDF0]/60">
              <div>
                <span className="text-[#4A5560] block text-[11px]">ایمیل:</span>
                <span className="font-semibold text-[#111110] text-[11px] font-mono">
                  {order.customerEmail || '—'}
                </span>
              </div>
              {order.customerEmail && (
                <button
                  onClick={() => copyToClipboard(order.customerEmail!, 'email')}
                  className="p-1.5 text-gray-500 hover:text-black"
                  title="کپی ایمیل"
                >
                  {copiedKey === 'email' ? <Check className="w-3.5 h-3.5 text-[#2F6B4F]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* Province & City */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#E4F5FF]/30 border border-[#BFDDF0]/60">
              <div>
                <span className="text-[#4A5560] block text-[11px]">استان و شهر:</span>
                <span className="font-semibold text-[#111110]">
                  {order.customerProvince || 'تهران'} - {order.customerCity || 'تهران'}
                </span>
              </div>
            </div>

            {/* Postal Code */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#E4F5FF]/30 border border-[#BFDDF0]/60">
              <div>
                <span className="text-[#4A5560] block text-[11px]">کد پستی ۱۰ رقمی:</span>
                <span className="font-semibold text-[#111110] font-mono">
                  {formatPersianNumber(order.customerPostal)}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(order.customerPostal, 'postal')}
                className="p-1.5 text-gray-500 hover:text-black"
                title="کپی کد پستی"
              >
                {copiedKey === 'postal' ? <Check className="w-3.5 h-3.5 text-[#2F6B4F]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Tracking Code */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#E4F5FF]/30 border border-[#BFDDF0]/60">
              <div>
                <span className="text-[#4A5560] block text-[11px]">کد رهگیری پست:</span>
                <span className="font-bold text-[#2F6B4F] font-mono text-[11px]">
                  {order.trackingCode}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(order.trackingCode, 'tracking')}
                className="p-1.5 text-gray-500 hover:text-black"
                title="کپی کد رهگیری"
              >
                {copiedKey === 'tracking' ? <Check className="w-3.5 h-3.5 text-[#2F6B4F]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Full Address */}
            <div className="sm:col-span-2 lg:col-span-3 flex items-start justify-between p-2.5 rounded-xl bg-[#E4F5FF]/30 border border-[#BFDDF0]/60">
              <div>
                <span className="text-[#4A5560] block text-[11px]">نشانی پستی دقیق:</span>
                <p className="font-medium text-[#111110] leading-relaxed">
                  {order.customerAddress}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(order.customerAddress, 'address')}
                className="p-1.5 text-gray-500 hover:text-black shrink-0"
                title="کپی نشانی"
              >
                {copiedKey === 'address' ? <Check className="w-3.5 h-3.5 text-[#2F6B4F]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Notes */}
            {order.customerNotes && (
              <div className="sm:col-span-2 lg:col-span-3 p-2.5 rounded-xl bg-[#9A6B1F]/10 border border-[#9A6B1F]/20 text-[#9A6B1F]">
                <span className="font-bold block text-[11px]">یادداشت مشتری:</span>
                <p className="mt-0.5">{order.customerNotes}</p>
              </div>
            )}

          </div>
        </div>

        {/* SECTION 2: Order Items */}
        <div className="p-5 rounded-2xl border border-[#BFDDF0] bg-white space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#111110] border-b border-[#BFDDF0]/60 pb-2">
            <Package className="w-4 h-4" />
            <span>اقلام خریداری شده ({formatPersianNumber(order.items.length)} ردیف)</span>
          </div>

          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-[#BFDDF0]/60 bg-[#E4F5FF]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-14 h-14 rounded-lg object-cover border border-[#BFDDF0] shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-[#111110]">
                      {item.product.name}
                    </h4>
                    <div className="text-[#4A5560] text-[11px] mt-0.5">
                      رنگ: {item.selectedColor} · سایز: {item.selectedSize} · تعداد: {formatPersianNumber(item.quantity)}
                    </div>
                  </div>
                </div>

                <div className="text-left">
                  <div className="font-bold text-[#111110]">
                    {formatPrice((item.product.discountPrice || item.product.price) * item.quantity)}
                  </div>
                  <div className="text-[10px] text-[#4A5560]">
                    فی: {formatPrice(item.product.discountPrice || item.product.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: Custom Design View & Download (If customer customized) */}
        {(() => {
          const activeCustomization = order.customization || order.items.find((i) => i.customization)?.customization;
          if (!activeCustomization) return null;

          const hasMultiViews = Boolean(activeCustomization.views && Object.keys(activeCustomization.views).length > 0);
          const viewsData = activeCustomization.views || {};
          const currentViewData = viewsData[selectedAdminViewId];

          const VIEW_LABELS: Record<GarmentViewId, string> = {
            front: 'نمای روبرو (جلو)',
            back: 'نمای پشت',
            left: 'نمای بغل چپ',
            right: 'نمای بغل راست'
          };

          return (
            <div className="p-5 rounded-2xl border border-[#BFDDF0] bg-[#E4F5FF]/30 space-y-4">
              <div className="flex items-center justify-between border-b border-[#BFDDF0]/60 pb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2B5876]">
                  <Sparkles className="w-4 h-4" />
                  <span>طرح اختصاصی ۴ جهته مشتری برای چاپ مستقیم دیجیتال (DTG)</span>
                </div>

                <div className="flex items-center gap-2">
                  {onPrintProductionSlip && (
                    <button
                      type="button"
                      onClick={() => onPrintProductionSlip(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#BFDDF0] text-[#111110] rounded-xl text-xs font-semibold hover:bg-[#D3ECFA]/50"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>چاپ برگه کارگاهی چاپخانه</span>
                    </button>
                  )}

                  {(currentViewData?.designImageUrl || activeCustomization.designImageUrl) && (
                    <a
                      href={currentViewData?.designImageUrl || activeCustomization.designImageUrl}
                      download={`morico_dtg_${order.orderNumber || order.id}_${selectedAdminViewId}.png`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111110] text-white rounded-xl text-xs font-semibold hover:bg-black shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود فایل باکیفیت چاپ ({VIEW_LABELS[selectedAdminViewId]})</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Multi-view Switcher Tabs */}
              {hasMultiViews && (
                <div className="flex items-center gap-2 flex-wrap bg-white p-1.5 rounded-xl border border-[#BFDDF0]">
                  {(['front', 'back', 'left', 'right'] as GarmentViewId[]).map((vKey) => {
                    const vInfo = viewsData[vKey];
                    const hasDesign = Boolean(vInfo && ((vInfo.layers && vInfo.layers.length > 0) || vInfo.designImageUrl));
                    const isSelected = selectedAdminViewId === vKey;

                    return (
                      <button
                        key={vKey}
                        type="button"
                        onClick={() => setSelectedAdminViewId(vKey)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#111110] text-white shadow-sm font-bold'
                            : 'text-[#4A5560] hover:text-[#111110] hover:bg-[#E4F5FF]/50'
                        }`}
                      >
                        <span>{VIEW_LABELS[vKey]}</span>
                        {hasDesign ? (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected ? 'bg-white text-black' : 'bg-[#2F6B4F]/10 text-[#2F6B4F]'
                          }`}>
                            ✓ دارای طرح
                          </span>
                        ) : (
                          <span className="text-[10px] opacity-60">بدون چاپ</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* View Content Display */}
              {currentViewData ? (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 text-xs items-start">
                  
                  {/* Visual Previews: Mockup & Print File */}
                  <div className="sm:col-span-5 space-y-3">
                    {/* Mockup on Garment */}
                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-[#BFDDF0] bg-white flex items-center justify-center shadow-sm">
                      <img
                        src={currentViewData.previewMockupUrl || currentViewData.garmentImage || order.items[0]?.product.image || '/brand/morico-logo.jpg'}
                        alt={currentViewData.viewTitle}
                        className="w-full h-full object-contain"
                      />
                      <span className="absolute top-2 right-2 text-[10px] font-bold bg-[#111110]/80 text-white px-2 py-0.5 rounded-md">
                        پیش‌نمایش روی لباس ({VIEW_LABELS[selectedAdminViewId]})
                      </span>
                    </div>

                    {/* High-res Transparent Print File Preview */}
                    {currentViewData.designImageUrl && (
                      <div className="p-3 bg-white rounded-xl border border-[#BFDDF0] space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-[#4A5560]">
                          <span className="font-bold text-[#111110]">فایل طرح خالص (شفاف / PNG):</span>
                          <span>آماده ریپ چاپخانه DTG</span>
                        </div>
                        <div className="h-28 rounded-lg border border-dashed border-[#BFDDF0] flex items-center justify-center p-2 overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:8px_8px]">
                          <img
                            src={currentViewData.designImageUrl}
                            alt="DTG Print Pure File"
                            className="max-h-full max-w-full object-contain drop-shadow"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Design Metadata & Layers Breakdown */}
                  <div className="sm:col-span-7 space-y-3">
                    
                    <div className="p-3.5 bg-white rounded-xl border border-[#BFDDF0] space-y-2">
                      <span className="font-bold text-xs text-[#111110] block">
                        مشخصات فنی چاپ این نما:
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[#4A5560]">
                        <div>جهت: <span className="font-bold text-[#111110]">{VIEW_LABELS[selectedAdminViewId]}</span></div>
                        <div>تعداد لایه‌ها: <span className="font-bold text-[#111110] font-mono">{toPersianDigits(currentViewData.layers?.length || 0)}</span></div>
                        {currentViewData.printableArea && (
                          <div className="col-span-2 text-[10px] text-[#4A5560] font-mono dir-ltr text-right">
                            Print Area: X={currentViewData.printableArea.x}%, Y={currentViewData.printableArea.y}%, W={currentViewData.printableArea.width}%, H={currentViewData.printableArea.height}%
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Layers Detailed List */}
                    <div className="p-3.5 bg-white rounded-xl border border-[#BFDDF0] space-y-2.5">
                      <span className="font-bold text-xs text-[#111110] block">
                        جزئیات لایه‌های گرافیکی و متنی:
                      </span>

                      {currentViewData.layers && currentViewData.layers.length > 0 ? (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {currentViewData.layers.map((layer, lIdx) => (
                            <div
                              key={layer.id || lIdx}
                              className="p-2.5 rounded-lg border border-[#BFDDF0]/60 bg-[#E4F5FF]/20 space-y-1 text-[11px]"
                            >
                              <div className="flex items-center justify-between font-bold text-[#111110]">
                                <span className="flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-[#2B5876]" />
                                  <span>
                                    {layer.type === 'text'
                                      ? 'تایپوگرافی / متن'
                                      : layer.type === 'image'
                                      ? 'تصویر / لوگوی آپلودی مشتری'
                                      : 'مونوگرام رسمی برند'}
                                  </span>
                                </span>
                                {layer.hasBgRemoved && (
                                  <span className="text-[9px] bg-[#2B5876] text-white px-1.5 py-0.5 rounded font-bold">
                                    پس‌زمینه حذف شده
                                  </span>
                                )}
                              </div>

                              {layer.type === 'text' && (
                                <div className="text-[#111110] bg-white p-1.5 rounded border border-[#BFDDF0]/40 font-medium">
                                  «{layer.content}»
                                </div>
                              )}

                              {layer.type === 'image' && (
                                <div className="flex items-center gap-2 pt-1">
                                  <img
                                    src={layer.content}
                                    alt="Layer preview"
                                    className="w-10 h-10 object-contain rounded border border-[#BFDDF0] bg-white p-0.5"
                                  />
                                  <span className="text-[10px] text-[#4A5560]">
                                    ابعاد قرارگیری: {toPersianDigits(layer.width || 120)} × {toPersianDigits(layer.height || 120)} px
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center gap-3 text-[10px] text-[#4A5560] font-mono pt-1">
                                <span>موقعیت: X={toPersianDigits(layer.x)}%, Y={toPersianDigits(layer.y)}%</span>
                                <span>مقیاس: {toPersianDigits(layer.scale || 1)}x</span>
                                <span>زاویه: {toPersianDigits(layer.rotation || 0)}°</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#4A5560]">
                          هیچ لایه‌ای روی این نما ثبت نشده است.
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-[#4A5560] leading-relaxed">
                      فایل آماده ارسال مستقیم به نرم‌افزار ریپ (RIP) دستگاه‌های Brother GTX یا Kornit جهت چاپ با دوام بالا روی پارچه‌های سنگین‌وزن پنبه‌ای است.
                    </p>
                  </div>

                </div>
              ) : (
                /* Fallback for Legacy Orders without multi-views */
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs items-center">
                  <div className="sm:col-span-5 relative aspect-[4/5] rounded-xl overflow-hidden border border-[#BFDDF0] bg-white flex items-center justify-center">
                    <img
                      src={order.items[0]?.product.image || '/brand/morico-logo.jpg'}
                      alt="Product view"
                      className="w-full h-full object-contain"
                    />
                    {activeCustomization.designImageUrl && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${activeCustomization.position?.x || 50}%`,
                          top: `${activeCustomization.position?.y || 35}%`,
                          transform: `translate(-50%, -50%) scale(${activeCustomization.scale || 1}) rotate(${activeCustomization.rotation || 0}deg)`
                        }}
                        className="w-24 h-24 border border-dashed border-[#111110] flex items-center justify-center p-1 bg-white/70 shadow-sm"
                      >
                        <img
                          src={activeCustomization.designImageUrl}
                          alt="Customer print"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-7 space-y-2.5">
                    <div className="p-3 bg-white rounded-xl border border-[#BFDDF0] space-y-1.5">
                      <span className="font-bold text-[#111110] block">
                        مشخصات فنی چیدمان طرح:
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[#4A5560]">
                        <div>نمای انتخابی: {activeCustomization.viewName || 'جلو'}</div>
                        <div>مقیاس (Scale): {toPersianDigits(activeCustomization.scale || 1)}x</div>
                        <div>زاویه چرخش: {toPersianDigits(activeCustomization.rotation || 0)} درجه</div>
                        <div>موقعیت: X={toPersianDigits(activeCustomization.position?.x || 50)}%, Y={toPersianDigits(activeCustomization.position?.y || 35)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          );
        })()}

        {/* SECTION 4: Payment Information & Pricing Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Payment Info */}
          <div className="p-4 rounded-2xl border border-[#BFDDF0] bg-white space-y-2.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#111110] border-b border-[#BFDDF0]/60 pb-1.5">
              <CreditCard className="w-4 h-4" />
              <span>اطلاعات درگاه پرداخت و تراکنش</span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#4A5560]">درگاه پرداخت:</span>
                <span className="font-semibold text-[#111110]">
                  {order.paymentInfo?.gateway || 'زرین‌پال (ZarinPal IPG)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A5560]">شناسه پیگیری بانکی (RefID):</span>
                <span className="font-mono font-bold text-[#2F6B4F]">
                  {order.paymentInfo?.refId || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A5560]">ماسک کارت خریدار:</span>
                <span className="font-mono text-[#111110]">
                  {order.paymentInfo?.cardPanMask || '۶۰۳۷-۹۹**-****-۲۲۴۵'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A5560]">کد مرجع Authority:</span>
                <span className="font-mono text-[10px] text-gray-500 truncate max-w-[180px]">
                  {order.paymentInfo?.authority || 'A000000000000000000000000001'}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="p-4 rounded-2xl border border-[#BFDDF0] bg-white space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#111110] border-b border-[#BFDDF0]/60 pb-1.5">
              <FileText className="w-4 h-4" />
              <span>صورت‌حساب مالی سفارش</span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#4A5560]">جمع اقلام (Subtotal):</span>
                <span className="font-medium text-[#111110]">{formatPrice(order.subtotal ?? order.totalAmount)}</span>
              </div>
              {((order.discount ?? order.discountAmount ?? 0) > 0) && (
                <div className="flex justify-between text-[#2F6B4F]">
                  <span>تخفیف کوپن / پروموشن:</span>
                  <span>- {formatPrice(order.discount ?? order.discountAmount ?? 0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#4A5560]">هزینه بسته‌بندی و ارسال پیشتاز:</span>
                <span className="font-medium text-[#111110]">
                  {(order.shipping ?? order.shippingFee ?? 0) === 0 ? 'رایگان' : formatPrice(order.shipping ?? order.shippingFee ?? 0)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#BFDDF0]/60 flex justify-between text-sm font-bold text-[#111110]">
                <span>مبلغ نهایی پرداخت شده:</span>
                <span>{formatPrice(order.total ?? order.totalAmount)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Strong Delete Confirmation Dialog */}
        {isDeleting && (
          <div className="p-4 rounded-xl border border-[#A33A3A] bg-[#A33A3A]/10 space-y-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-[#A33A3A] font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>هشدار امنیتی حذف دائم سفارش</span>
            </div>
            <p className="text-[#111110] leading-relaxed">
              جهت حذف این سفارش، لطفاً شماره سفارش <strong className="font-mono dir-ltr">{orderIdentifier}</strong> را در کادر زیر تایپ نمایید:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder={orderIdentifier}
                className="px-3 py-2 border border-[#A33A3A] rounded-xl flex-1 text-center font-mono font-bold"
              />
              <button
                onClick={handleDelete}
                disabled={deleteConfirmationInput.trim() !== orderIdentifier.trim()}
                className="px-4 py-2 bg-[#A33A3A] text-white rounded-xl font-bold disabled:opacity-40"
              >
                تایید و حذف دائم
              </button>
              <button
                onClick={() => setIsDeleting(false)}
                className="px-3 py-2 border rounded-xl"
              >
                انصراف
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
