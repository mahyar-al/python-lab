import React, { useState } from 'react';
import { Order, OrderStatus } from '../../lib/types';
import { formatPrice, formatPersianNumber, formatPersianPhone } from '../../lib/currency';
import { formatJalaliDateTime, formatJalaliDate } from '../../lib/dateUtils';
import { OrderDetailModal } from './OrderDetailModal';
import { PrintModal } from './PrintTemplates';
import {
  Search,
  Filter,
  Download,
  Printer,
  Sparkles,
  CheckSquare,
  Square,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';

interface AdminOrdersProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  dark?: boolean;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  onUpdateStatus,
  onDeleteOrder
}) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [customFilter, setCustomFilter] = useState<'all' | 'custom' | 'regular'>('all');
  const [sortBy, setSortBy] = useState<'dateDesc' | 'dateAsc' | 'totalDesc' | 'totalAsc'>('dateDesc');

  // Multi-select for bulk status change
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>('PROCESSING');

  // Pagination (15 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [printMode, setPrintMode] = useState<'sheet' | 'label' | 'production' | null>(null);

  // Status badge styling helper
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PAID':
        return { label: 'پرداخت شده', className: 'bg-[#2F6B4F]/10 text-[#2F6B4F] border-[#2F6B4F]/30' };
      case 'PROCESSING':
        return { label: 'در حال تولید', className: 'bg-[#2B5876]/10 text-[#2B5876] border-[#2B5876]/30' };
      case 'SHIPPED':
        return { label: 'ارسال شده', className: 'bg-[#9A6B1F]/10 text-[#9A6B1F] border-[#9A6B1F]/30' };
      case 'DELIVERED':
        return { label: 'تحویل شد', className: 'bg-[#111110]/10 text-[#111110] border-[#111110]/30' };
      case 'PENDING_PAYMENT':
        return { label: 'در انتظار پرداخت', className: 'bg-gray-100 text-gray-700 border-gray-300' };
      case 'PAYMENT_FAILED':
        return { label: 'خطا در پرداخت', className: 'bg-[#A33A3A]/10 text-[#A33A3A] border-[#A33A3A]/30' };
      case 'CANCELED':
        return { label: 'لغو شده', className: 'bg-[#A33A3A]/15 text-[#A33A3A] border-[#A33A3A]/40' };
      default:
        return { label: status, className: 'bg-gray-100 text-gray-800 border-gray-300' };
    }
  };

  // Filter & Search Logic
  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.trim().toLowerCase();
    const orderNum = (o.orderNumber || o.id).toLowerCase();
    const matchesSearch =
      !q ||
      orderNum.includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q);

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesPayment =
      paymentFilter === 'all' || (o.paymentStatus || 'PENDING') === paymentFilter;

    const hasCustom = o.items.some((i) => i.customization) || Boolean(o.customization);
    const matchesCustom =
      customFilter === 'all'
        ? true
        : customFilter === 'custom'
        ? hasCustom
        : !hasCustom;

    return matchesSearch && matchesStatus && matchesPayment && matchesCustom;
  });

  // Sort
  filteredOrders.sort((a, b) => {
    const aTotal = a.total ?? a.totalAmount ?? 0;
    const bTotal = b.total ?? b.totalAmount ?? 0;
    if (sortBy === 'dateDesc') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'dateAsc') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'totalDesc') return bTotal - aTotal;
    if (sortBy === 'totalAsc') return aTotal - bTotal;
    return 0;
  });

  // Pagination slice
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Bulk status update
  const handleBulkStatusApply = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await onUpdateStatus(id, bulkStatus);
    }
    setSelectedIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedOrders.map((o) => o.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // CSV Export with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      'شماره سفارش',
      'تاریخ شمسی',
      'نام مشتری',
      'تلفن',
      'استان',
      'شهر',
      'آدرس',
      'کد پستی',
      'مبلغ کل (تومان)',
      'وضعیت سفارش',
      'وضعیت پرداخت',
      'دارای طرح اختصاصی'
    ];

    const rows = filteredOrders.map((o) => {
      const hasCustom = o.items.some((i) => i.customization) || Boolean(o.customization);
      return [
        o.orderNumber || o.id,
        `"${formatJalaliDate(o.date)}"`,
        `"${o.customerName.replace(/"/g, '""')}"`,
        `"${o.customerPhone}"`,
        `"${o.customerProvince || ''}"`,
        `"${o.customerCity || ''}"`,
        `"${o.customerAddress.replace(/"/g, '""')}"`,
        `"${o.customerPostal}"`,
        o.total,
        o.status,
        o.paymentStatus || 'PENDING',
        hasCustom ? 'بله' : 'خیر'
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `morico_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111110]">
            مدیریت سفارشات مشتریان
          </h2>
          <span className="text-xs text-[#4A5560]">
            فهرست {formatPersianNumber(filteredOrders.length)} سفارش فیلتر شده (از آخرین ۳۰۰ سفارش)
          </span>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-xl border border-[#BFDDF0] text-xs font-medium text-[#111110] hover:bg-[#D3ECFA]/50 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          title="خروجی کامل با انکودینگ اکسل"
        >
          <Download className="w-4 h-4" />
          <span>خروجی اکسل (CSV)</span>
        </button>
      </div>

      {/* Power Filters Toolbar */}
      <div className="p-4 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          
          {/* Search */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder=""
              className="w-full px-3 py-2 pl-9 rounded-xl border border-[#BFDDF0] bg-white text-[#111110] focus:outline-none"
            />
            <Search className="w-4 h-4 text-[#4A5560] absolute left-3 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-[#BFDDF0] bg-white text-[#111110] focus:outline-none cursor-pointer"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="PAID">پرداخت شده</option>
            <option value="PROCESSING">در حال تولید و چاپ</option>
            <option value="SHIPPED">ارسال شده به پست</option>
            <option value="DELIVERED">تحویل شده</option>
            <option value="PENDING_PAYMENT">در انتظار پرداخت</option>
            <option value="PAYMENT_FAILED">خطا در پرداخت</option>
            <option value="CANCELED">لغو شده</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-[#BFDDF0] bg-white text-[#111110] focus:outline-none cursor-pointer"
          >
            <option value="all">همه وضعیت‌های تراکنش</option>
            <option value="PAID">موفق (PAID)</option>
            <option value="PENDING">در انتظار (PENDING)</option>
            <option value="FAILED">ناموفق (FAILED)</option>
          </select>

          {/* Custom Design Filter */}
          <select
            value={customFilter}
            onChange={(e) => {
              setCustomFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-[#BFDDF0] bg-white text-[#111110] focus:outline-none cursor-pointer"
          >
            <option value="all">همه سفارش‌ها (عادی و سفارشی)</option>
            <option value="custom">فقط دارای چاپ اختصاصی</option>
            <option value="regular">فقط محصولات ساده</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-[#BFDDF0] bg-white text-[#111110] focus:outline-none cursor-pointer"
          >
            <option value="dateDesc">تاریخ: جدیدترین</option>
            <option value="dateAsc">تاریخ: قدیمی‌ترین</option>
            <option value="totalDesc">مبلغ: بیشترین</option>
            <option value="totalAsc">مبلغ: کمترین</option>
          </select>

        </div>

        {/* Multi-Select Bulk Status Bar */}
        {selectedIds.length > 0 && (
          <div className="pt-3 border-t border-[#BFDDF0]/60 flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="font-semibold text-[#111110]">
              {formatPersianNumber(selectedIds.length)} سفارش انتخاب شده است:
            </span>
            <div className="flex items-center gap-2">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
                className="px-3 py-1.5 rounded-lg border border-[#BFDDF0] bg-white font-medium"
              >
                <option value="PROCESSING">تغییر به: در حال پردازش و چاپ</option>
                <option value="SHIPPED">تغییر به: تحویل به پست پیشتاز</option>
                <option value="DELIVERED">تغییر به: تحویل داده شده</option>
                <option value="CANCELED">تغییر به: لغو شده</option>
              </select>
              <button
                onClick={handleBulkStatusApply}
                className="px-3.5 py-1.5 bg-[#111110] text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
              >
                اعمال همگانی
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border bg-white border-[#BFDDF0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#E4F5FF]/50 border-b border-[#BFDDF0] text-[#4A5560]">
                <th className="py-3.5 px-4 w-10">
                  <button onClick={toggleSelectAll} className="p-0.5">
                    {selectedIds.length > 0 && selectedIds.length === paginatedOrders.length ? (
                      <CheckSquare className="w-4 h-4 text-[#111110]" />
                    ) : (
                      <Square className="w-4 h-4 text-[#4A5560]" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold">شماره سفارش</th>
                <th className="py-3.5 px-4 font-semibold">تاریخ و زمان</th>
                <th className="py-3.5 px-4 font-semibold">نام خریدار</th>
                <th className="py-3.5 px-4 font-semibold">شماره تماس</th>
                <th className="py-3.5 px-4 font-semibold">مبلغ کل</th>
                <th className="py-3.5 px-4 font-semibold">طراحی چاپی</th>
                <th className="py-3.5 px-4 font-semibold">وضعیت مرحله‌ای</th>
                <th className="py-3.5 px-4 font-semibold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#BFDDF0]/60">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-[#4A5560] text-xs">
                    هیچ سفارشی یافت نشد.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isSelected = selectedIds.includes(order.id);
                  const hasCustom =
                    order.items.some((i) => i.customization) || Boolean(order.customization);
                  const badge = getStatusBadge(order.status);
                  const orderNumber = order.orderNumber || order.id;

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-[#D3ECFA]/20 transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#D3ECFA]/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => toggleSelectOne(order.id)} className="p-0.5">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#111110]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#4A5560]" />
                          )}
                        </button>
                      </td>

                      {/* Order Number */}
                      <td
                        className="py-3 px-4 font-mono font-bold text-[#111110]"
                        onClick={() => setSelectedOrder(order)}
                      >
                        {orderNumber}
                      </td>

                      {/* Date */}
                      <td
                        className="py-3 px-4 text-[#4A5560]"
                        onClick={() => setSelectedOrder(order)}
                      >
                        {formatJalaliDateTime(order.date)}
                      </td>

                      {/* Customer */}
                      <td
                        className="py-3 px-4 font-medium text-[#111110]"
                        onClick={() => setSelectedOrder(order)}
                      >
                        {order.customerName}
                      </td>

                      {/* Phone */}
                      <td
                        className="py-3 px-4 font-mono text-[#4A5560] dir-ltr text-right"
                        onClick={() => setSelectedOrder(order)}
                      >
                        {formatPersianPhone(order.customerPhone)}
                      </td>

                      {/* Total */}
                      <td
                        className="py-3 px-4 font-bold text-[#111110]"
                        onClick={() => setSelectedOrder(order)}
                      >
                        {formatPrice(order.total ?? order.totalAmount)}
                      </td>

                      {/* Custom Design Badge */}
                      <td className="py-3 px-4" onClick={() => setSelectedOrder(order)}>
                        {hasCustom ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2B5876] bg-[#2B5876]/10 px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3" />
                            <span>سفارشی</span>
                          </span>
                        ) : (
                          <span className="text-[#4A5560] text-[11px]">عادی</span>
                        )}
                      </td>

                      {/* Quick Status Select */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold focus:outline-none cursor-pointer ${badge.className}`}
                        >
                          <option value="PENDING_PAYMENT">در انتظار پرداخت</option>
                          <option value="PAID">پرداخت شد</option>
                          <option value="PROCESSING">در حال تولید</option>
                          <option value="SHIPPED">ارسال پست</option>
                          <option value="DELIVERED">تحویل شد</option>
                          <option value="PAYMENT_FAILED">خطا بانک</option>
                          <option value="CANCELED">لغو شده</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg text-[#111110] hover:bg-[#D3ECFA]/60"
                            title="مشاهده فاکتور و جزئیات"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setPrintOrder(order);
                              setPrintMode('sheet');
                            }}
                            className="p-1.5 rounded-lg text-[#4A5560] hover:bg-[#D3ECFA]/60"
                            title="چاپ فاکتور A4"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#BFDDF0]/60 flex items-center justify-between text-xs text-[#4A5560]">
          <div>
            صفحه {formatPersianNumber(currentPage)} از {formatPersianNumber(totalPages)}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#BFDDF0] disabled:opacity-40 hover:bg-[#D3ECFA]/50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#BFDDF0] disabled:opacity-40 hover:bg-[#D3ECFA]/50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={onUpdateStatus}
        onDeleteOrder={onDeleteOrder}
        onPrintA4Sheet={(ord) => {
          setPrintOrder(ord);
          setPrintMode('sheet');
        }}
        onPrintShippingLabel={(ord) => {
          setPrintOrder(ord);
          setPrintMode('label');
        }}
        onPrintProductionSlip={(ord) => {
          setPrintOrder(ord);
          setPrintMode('production');
        }}
      />

      {/* Print Template Modal */}
      <PrintModal
        order={printOrder}
        mode={printMode}
        onClose={() => {
          setPrintOrder(null);
          setPrintMode(null);
        }}
      />

    </div>
  );
};
