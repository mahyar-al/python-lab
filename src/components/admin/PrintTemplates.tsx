import React, { useRef } from 'react';
import { Order } from '../../lib/types';
import { formatPrice, formatPersianNumber, formatPersianPhone } from '../../lib/currency';
import { formatJalaliDateTime } from '../../lib/dateUtils';
import { Printer, X } from 'lucide-react';

export interface PrintModalProps {
  order: Order | null;
  mode: 'invoice' | 'label' | 'production' | 'sheet' | null;
  onClose: () => void;
  dark?: boolean;
}

export const PrintModal: React.FC<PrintModalProps> = ({ order, mode, onClose }) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!order || !mode) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#BFDDF0] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-right overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#BFDDF0] bg-gray-50 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#111110]" />
            <h3 className="font-bold text-sm text-[#111110]">
              {mode === 'invoice' || mode === 'sheet'
                ? 'فاکتور فروش رسمی آتلیه (A4)'
                : mode === 'label'
                ? 'لیبل پستی مرسوله'
                : 'برگه کارگاهی تولید و چاپ DTG'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-[#111110] text-white hover:bg-black text-xs font-semibold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ارسال به چاپگر</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area Content */}
        <div ref={printAreaRef} className="p-8 overflow-y-auto font-sans text-xs text-[#111110] space-y-6">
          
          {/* INVOICE TEMPLATE */}
          {(mode === 'invoice' || mode === 'sheet') && (
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b-2 border-black pb-4">
                <div>
                  <h1 className="text-2xl font-bold font-serif brand-tracking">MORICO STYLE</h1>
                  <p className="text-xs text-gray-600 mt-1">استودیو مد و لباس مینیمال — تهران، فرشته</p>
                </div>
                <div className="text-left font-mono">
                  <div className="font-bold">شماره فاکتور: {order.orderNumber || order.id}</div>
                  <div className="text-gray-600 mt-1">تاریخ: {formatJalaliDateTime(order.date)}</div>
                  <div className="text-gray-600">کد رهگیری: {order.trackingCode}</div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="grid grid-cols-2 gap-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                <div>
                  <span className="text-gray-500 block">خریدار:</span>
                  <span className="font-bold text-sm">{order.customerName}</span>
                  <span className="block mt-1 font-mono">{formatPersianPhone(order.customerPhone)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">نشانی تحویل:</span>
                  <p className="leading-relaxed">{order.customerAddress}</p>
                </div>
              </div>

              {/* Products Table */}
              <table className="w-full border-collapse border border-gray-300 text-right">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="p-2 border-l border-gray-300">ردیف</th>
                    <th className="p-2 border-l border-gray-300">شرح کالا</th>
                    <th className="p-2 border-l border-gray-300">مشخصات</th>
                    <th className="p-2 border-l border-gray-300">تعداد</th>
                    <th className="p-2 border-l border-gray-300">قیمت واحد</th>
                    <th className="p-2">جمع کل</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="p-2 border-l border-gray-300 text-center">{formatPersianNumber(idx + 1)}</td>
                      <td className="p-2 border-l border-gray-300 font-bold">{item.product.name}</td>
                      <td className="p-2 border-l border-gray-300">
                        رنگ: {item.selectedColor} | سایز: {item.selectedSize}
                        {item.customization && <span className="block text-[10px] text-blue-700">دارای چاپ اختصاصی</span>}
                      </td>
                      <td className="p-2 border-l border-gray-300 text-center">{formatPersianNumber(item.quantity)}</td>
                      <td className="p-2 border-l border-gray-300 font-mono">
                        {formatPrice(item.product.discountPrice || item.product.price)}
                      </td>
                      <td className="p-2 font-bold font-mono">
                        {formatPrice((item.product.discountPrice || item.product.price) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 border border-gray-300 p-3 rounded-lg bg-gray-50">
                  <div className="flex justify-between">
                    <span>مبلغ کل اقلام:</span>
                    <span className="font-mono">{formatPrice(order.subtotal || order.totalAmount)}</span>
                  </div>
                  {order.discountAmount ? (
                    <div className="flex justify-between text-green-700">
                      <span>تخفیف:</span>
                      <span className="font-mono">{formatPrice(order.discountAmount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between font-bold border-t border-gray-300 pt-2 text-sm">
                    <span>مبلغ نهایی پرداختی:</span>
                    <span className="font-mono">{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SHIPPING LABEL TEMPLATE */}
          {mode === 'label' && (
            <div className="border-2 border-dashed border-gray-600 p-6 rounded-xl space-y-4 max-w-md mx-auto">
              <div className="text-center border-b border-gray-300 pb-2">
                <h2 className="font-bold text-lg">مرسوله پستی پیشتاز</h2>
                <span className="font-mono text-xs">کد رهگیری: {order.trackingCode}</span>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-gray-100 rounded">
                  <span className="text-[10px] text-gray-500 block">فرستنده:</span>
                  <div className="font-bold">استودیو مد MORICO STYLE</div>
                  <div className="text-[11px]">تهران، خیابان فرشته، مریم غربی، پلاک ۲۴</div>
                  <div className="text-[11px] font-mono">تلفن: ۰۲۱-۲۲۰۸۹۴۱۰</div>
                </div>
                <div className="p-3 bg-white border border-gray-300 rounded">
                  <span className="text-[10px] text-gray-500 block">گیرنده:</span>
                  <div className="font-bold text-sm">{order.customerName}</div>
                  <div className="text-xs mt-1 leading-relaxed">{order.customerAddress}</div>
                  <div className="text-xs font-mono mt-1">تلفن تماس: {formatPersianPhone(order.customerPhone)}</div>
                  {order.postalCode && <div className="text-xs font-mono">کد پستی: {order.postalCode}</div>}
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTION / DTG TEMPLATE */}
          {mode === 'production' && (
            <div className="space-y-6 text-xs">
              <div className="border-b-2 border-black pb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-base text-black">دستور کارگاهی چاپ مستقیم دیجیتال و تولید (DTG Production Sheet)</h2>
                  <span className="text-[11px] text-gray-600 block mt-0.5">استودیو مد و پوشاک MORICO STYLE — واحد چاپ اختصاصی</span>
                </div>
                <div className="text-left font-mono text-xs">
                  <div className="font-bold text-sm">{order.orderNumber || order.id}</div>
                  <div className="text-gray-500">{formatJalaliDateTime(order.date)}</div>
                </div>
              </div>

              {/* Order & Customer Summary */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                <div>
                  <span className="text-gray-500 block text-[10px]">مشتری:</span>
                  <span className="font-bold text-black">{order.customerName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">تلفن تماس:</span>
                  <span className="font-mono text-black">{formatPersianPhone(order.customerPhone)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">شهر مقصد:</span>
                  <span className="font-bold text-black">{order.customerProvince || 'تهران'} - {order.customerCity || 'تهران'}</span>
                </div>
              </div>

              {/* Production Items */}
              <div className="space-y-4">
                <span className="font-bold text-xs block text-black">اقلام تولیدی سفارش:</span>

                {order.items.map((item, idx) => {
                  const cust = item.customization || order.customization;
                  const views = cust?.views || {};
                  const viewKeys = ['front', 'back', 'left', 'right'].filter(
                    (k) => views[k] && ((views[k].layers && views[k].layers.length > 0) || views[k].designImageUrl)
                  );

                  const VIEW_NAMES: Record<string, string> = {
                    front: 'نمای روبرو (جلو)',
                    back: 'نمای پشت',
                    left: 'نمای بغل چپ',
                    right: 'نمای بغل راست'
                  };

                  return (
                    <div key={idx} className="border border-gray-400 p-4 rounded-xl space-y-3 bg-white">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="font-bold text-sm text-black">
                          {formatPersianNumber(idx + 1)}. {item.product.name}
                        </div>
                        <div className="text-xs text-gray-700 font-mono">
                          رنگ: <strong className="text-black">{item.selectedColor}</strong> | سایز: <strong className="text-black">{item.selectedSize}</strong> | تعداد: <strong className="text-black">{formatPersianNumber(item.quantity)} عدد</strong>
                        </div>
                      </div>

                      {cust ? (
                        <div className="space-y-3">
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-900 font-bold text-xs flex items-center justify-between">
                            <span>پوشاک دارای چاپ اختصاصی چند جهته</span>
                            <span>{formatPersianNumber(viewKeys.length || 1)} جهت چاپ</span>
                          </div>

                          {viewKeys.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {viewKeys.map((vk) => {
                                const vData = views[vk]!;
                                return (
                                  <div key={vk} className="p-3 border rounded-lg bg-gray-50 space-y-2">
                                    <div className="flex items-center justify-between font-bold text-xs border-b pb-1">
                                      <span>{VIEW_NAMES[vk] || vk}</span>
                                      <span className="font-mono text-[10px] text-gray-500">
                                        {formatPersianNumber(vData.layers?.length || 0)} لایه
                                      </span>
                                    </div>

                                    {/* Previews */}
                                    <div className="flex items-center gap-2">
                                      {vData.previewMockupUrl && (
                                        <div className="w-20 h-24 border rounded overflow-hidden bg-white shrink-0">
                                          <img src={vData.previewMockupUrl} alt="Mockup" className="w-full h-full object-contain" />
                                        </div>
                                      )}
                                      {vData.designImageUrl && (
                                        <div className="w-20 h-24 border rounded overflow-hidden bg-white shrink-0 p-1">
                                          <img src={vData.designImageUrl} alt="Print" className="w-full h-full object-contain" />
                                        </div>
                                      )}
                                      <div className="text-[10px] space-y-1 text-gray-700">
                                        {vData.layers?.map((l, lIdx) => (
                                          <div key={lIdx} className="truncate">
                                            • {l.type === 'text' ? `متن: "${l.content}"` : l.type === 'image' ? (l.hasBgRemoved ? 'تصویر (بدون پس‌زمینه)' : 'تصویر اختصاصی') : 'مونوگرام MC'}
                                            <span className="font-mono text-gray-500 block text-[9px]">X:{l.x}% Y:{l.y}% S:{l.scale || 1}x</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            /* Single view fallback */
                            <div className="p-3 border rounded bg-gray-50 flex items-center gap-3">
                              {cust.designImageUrl && (
                                <img src={cust.designImageUrl} alt="Print" className="w-16 h-16 object-contain border bg-white" />
                              )}
                              <div className="text-[11px] space-y-0.5">
                                <div>نما: {cust.viewName || 'جلو'}</div>
                                <div>موقعیت چاپ: X={cust.position?.x || 50}%, Y={cust.position?.y || 35}%</div>
                                <div>مقیاس: {cust.scale || 1}x | زاویه: {cust.rotation || 0}°</div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-500 text-xs p-2 bg-gray-50 rounded">
                          طرح استاندارد کاتالوگ (بدون چاپ اختصاصی)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quality Control & Inspection Sign-off */}
              <div className="p-3 border border-gray-400 rounded-lg space-y-2 bg-gray-50">
                <span className="font-bold text-[11px] block">چک‌لیست کنترل کیفیت و تایید سرپرست کارگاه:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                  <label className="flex items-center gap-1.5"><input type="checkbox" readOnly className="rounded" /> تطابق رنگ و سایز پارچه</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" readOnly className="rounded" /> کیفیت و وضوح چاپ DTG</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" readOnly className="rounded" /> تثبیت حرارتی ۱۶۰ درجه</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" readOnly className="rounded" /> الصاق کارت اصالت و بسته‌بندی</label>
                </div>
                <div className="pt-2 border-t flex justify-between text-[10px] text-gray-500">
                  <span>امضای اپراتور چاپ: ..............................</span>
                  <span>امضای کنترل کیفیت: ..............................</span>
                  <span>تاریخ آماده‌سازی: ...... / ...... / ۱۴۰۳</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
