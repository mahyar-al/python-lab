import React from 'react';
import { Product, Order, DiscountCode, Category, PaymentGatewayStatus, AdminUser } from '../../lib/types';
import { formatPrice, formatPersianNumber, toPersianDigits } from '../../lib/currency';
import { formatJalaliDateText, formatJalaliDateTime } from '../../lib/dateUtils';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  Package,
  CreditCard,
  ArrowUpRight,
  ShieldCheck,
  Percent,
  Calendar,
  Flame,
  Award,
  Sparkles
} from 'lucide-react';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  discounts: DiscountCode[];
  categories: Category[];
  users: AdminUser[];
  gatewayStatus: PaymentGatewayStatus;
  onNavigateTab: (tab: string) => void;
  onSelectOrder: (order: Order) => void;
  dark?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  discounts,
  categories,
  users,
  gatewayStatus,
  onNavigateTab,
  onSelectOrder
}) => {
  // 1. KPI Calculations (from latest 300 orders)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const thirtyDaysAgo = now.getTime() - 30 * 86400000;

  // Paid orders list
  const paidOrders = orders.filter((o) =>
    ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status)
  );

  // Today sales
  const todayPaidOrders = paidOrders.filter((o) => new Date(o.date).getTime() >= startOfToday);
  const todaySales = todayPaidOrders.reduce((sum, o) => sum + o.total, 0);

  // This month (last 30 days) sales
  const monthPaidOrders = paidOrders.filter((o) => new Date(o.date).getTime() >= thirtyDaysAgo);
  const monthSales = monthPaidOrders.reduce((sum, o) => sum + o.total, 0);

  // Orders waiting to be processed
  const waitingOrders = orders.filter((o) => o.status === 'PAID' || o.status === 'PROCESSING');

  // Average order value
  const avgOrderValue = paidOrders.length > 0 ? Math.round(monthSales / (monthPaidOrders.length || 1)) : 0;

  // Number of unique customers
  const customerPhoneSet = new Set(orders.map((o) => o.customerPhone).filter(Boolean));
  const totalCustomersCount = customerPhoneSet.size || users.length;

  // 2. Charts Data
  // (A) Revenue per day for last 30 days
  const dailyRevenueMap: { [day: string]: number } = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateKey = d.toISOString().slice(0, 10);
    dailyRevenueMap[dateKey] = 0;
  }
  paidOrders.forEach((o) => {
    const dKey = o.date.slice(0, 10);
    if (dailyRevenueMap[dKey] !== undefined) {
      dailyRevenueMap[dKey] += o.total;
    }
  });

  const dailyEntries = Object.entries(dailyRevenueMap);
  const maxDayRevenue = Math.max(...Object.values(dailyRevenueMap), 1000000);

  // (B) Orders by status
  const statusCounts: { [status: string]: number } = {
    PAID: orders.filter((o) => o.status === 'PAID').length,
    PROCESSING: orders.filter((o) => o.status === 'PROCESSING').length,
    SHIPPED: orders.filter((o) => o.status === 'SHIPPED').length,
    DELIVERED: orders.filter((o) => o.status === 'DELIVERED').length,
    PENDING_PAYMENT: orders.filter((o) => o.status === 'PENDING_PAYMENT').length,
    CANCELED: orders.filter((o) => o.status === 'CANCELED').length
  };

  // (C) Top 5 Selling Products by quantity from paid orders
  const productSalesMap: { [pName: string]: { qty: number; revenue: number; image: string } } = {};
  paidOrders.forEach((o) => {
    o.items.forEach((item) => {
      const pName = item.product.name;
      if (!productSalesMap[pName]) {
        productSalesMap[pName] = {
          qty: 0,
          revenue: 0,
          image: item.product.image || '/brand/morico-logo.jpg'
        };
      }
      productSalesMap[pName].qty += item.quantity;
      productSalesMap[pName].revenue += (item.product.discountPrice || item.product.price) * item.quantity;
    });
  });

  const topSellingProducts = Object.entries(productSalesMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // (D) Sales by category
  const categorySalesMap: { [catId: string]: number } = {};
  categories.forEach((c) => (categorySalesMap[c.id] = 0));
  paidOrders.forEach((o) => {
    o.items.forEach((item) => {
      const cid = item.product.categoryId;
      if (categorySalesMap[cid] !== undefined) {
        categorySalesMap[cid] += (item.product.discountPrice || item.product.price) * item.quantity;
      }
    });
  });

  const totalCatRevenue = Object.values(categorySalesMap).reduce((a, b) => a + b, 0) || 1;

  // 3. Lists
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 5 && p.status !== 'archived');
  const outOfStockProducts = products.filter((p) => p.stock === 0 && p.status !== 'archived');
  const expiringDiscounts = discounts.filter((d) => {
    if (!d.active) return false;
    const isCloseToMax = d.maxUses && d.usedCount ? d.usedCount >= d.maxUses * 0.85 : false;
    const isCloseToDate = d.expiryDate
      ? new Date(d.expiryDate).getTime() - now.getTime() < 86400000 * 7
      : false;
    return isCloseToMax || isCloseToDate;
  });

  return (
    <div className="space-y-8 text-right">
      
      {/* Notice & Gateway Health Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E4F5FF] border border-[#BFDDF0] text-[#111110]">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#111110] flex items-center gap-2">
              <span>درگاه پرداخت متصل: {gatewayStatus.gatewayName}</span>
              {gatewayStatus.configured ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2F6B4F] bg-[#2F6B4F]/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>فعال ({gatewayStatus.mode === 'production' ? 'محیط عملیاتی' : 'آزمایشی'})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#A33A3A] bg-[#A33A3A]/10 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                  <span>پیکربندی نشده (خطا)</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#4A5560] mt-0.5">
              آمار و شاخص‌های مالی این صفحه بر اساس آخرین ۳۰۰ سفارش ثبت‌شده در پایگاه داده محاسبه شده است.
            </p>
          </div>
        </div>

        <div className="text-xs text-[#4A5560] flex items-center gap-2 self-end lg:self-auto">
          <Calendar className="w-4 h-4" />
          <span>امروز: {formatJalaliDateText(now)}</span>
        </div>
      </div>

      {/* 6 Core KPI Cards with Persian Numerals */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        
        {/* ۱. فروش امروز */}
        <div className="p-4 rounded-2xl border bg-white border-[#BFDDF0] shadow-[0_4px_20px_rgba(17,17,16,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#4A5560] mb-2">
            <span className="text-xs font-medium">فروش امروز</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-[#111110] truncate">
            {formatPrice(todaySales)}
          </div>
          <span className="text-[10px] text-[#2F6B4F] mt-1 font-medium">
            {formatPersianNumber(todayPaidOrders.length)} سفارش پرداخت شده
          </span>
        </div>

        {/* ۲. فروش این ماه (۳۰ روز) */}
        <div className="p-4 rounded-2xl border bg-white border-[#BFDDF0] shadow-[0_4px_20px_rgba(17,17,16,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#4A5560] mb-2">
            <span className="text-xs font-medium">فروش ۳۰ روز اخیر</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-[#111110] truncate">
            {formatPrice(monthSales)}
          </div>
          <span className="text-[10px] text-[#2F6B4F] mt-1 font-medium">گردش مالی ناخالص</span>
        </div>

        {/* ۳. سفارشات پرداخت‌شده */}
        <div className="p-4 rounded-2xl border bg-white border-[#BFDDF0] shadow-[0_4px_20px_rgba(17,17,16,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#4A5560] mb-2">
            <span className="text-xs font-medium">سفارشات موفق</span>
            <CheckCircle2 className="w-4 h-4 text-[#2F6B4F]" />
          </div>
          <div className="text-2xl font-bold text-[#111110]">
            {formatPersianNumber(paidOrders.length)}
          </div>
          <span className="text-[10px] text-[#4A5560] mt-1">تراکنش‌های تاییدشده</span>
        </div>

        {/* ۴. در نوبت پردازش */}
        <div className="p-4 rounded-2xl border bg-white border-[#BFDDF0] shadow-[0_4px_20px_rgba(17,17,16,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#4A5560] mb-2">
            <span className="text-xs font-medium">در نوبت پردازش</span>
            <Clock className="w-4 h-4 text-[#9A6B1F]" />
          </div>
          <div className="text-2xl font-bold text-[#9A6B1F]">
            {formatPersianNumber(waitingOrders.length)}
          </div>
          <span className="text-[10px] text-[#9A6B1F] mt-1 font-medium">نیازمند اقدام آتلیه</span>
        </div>

        {/* ۵. میانگین سبد خرید (AOV) */}
        <div className="p-4 rounded-2xl border bg-white border-[#BFDDF0] shadow-[0_4px_20px_rgba(17,17,16,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#4A5560] mb-2">
            <span className="text-xs font-medium">میانگین ارزش سبد</span>
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="text-base sm:text-lg font-bold text-[#111110] truncate">
            {formatPrice(avgOrderValue)}
          </div>
          <span className="text-[10px] text-[#4A5560] mt-1">به ازای هر سفارش</span>
        </div>

        {/* ۶. تعداد مشتریان */}
        <div className="p-4 rounded-2xl border bg-white border-[#BFDDF0] shadow-[0_4px_20px_rgba(17,17,16,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#4A5560] mb-2">
            <span className="text-xs font-medium">مشتریان ثبت‌شده</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-[#111110]">
            {formatPersianNumber(totalCustomersCount)}
          </div>
        </div>

      </div>

      {/* Quick Showcase Management Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bestsellers Card */}
        <div
          onClick={() => onNavigateTab('bestsellers')}
          className="p-4 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50/80 to-white hover:border-[#ef4056]/50 shadow-sm transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#ef4056]/10 text-[#ef4056] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#111110]">مدیریت ویترین پرفروش‌ترین‌ها</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-[#ef4056]">
                  ۷ و ۳۰ روزه
                </span>
              </div>
              <p className="text-xs text-[#4A5560] mt-0.5">
                تغییر رتبه‌بندی، افزودن کالاهای داغ و نرخ فروش
              </p>
            </div>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-xs font-semibold text-[#ef4056] group-hover:bg-[#ef4056] group-hover:text-white transition-all shrink-0 cursor-pointer"
          >
            مدیریت بخش
          </button>
        </div>

        {/* Top Weekly Card */}
        <div
          onClick={() => onNavigateTab('top_weekly')}
          className="p-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/80 to-white hover:border-amber-400/50 shadow-sm transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#111110]">مدیریت ویترین برترین‌های هفته</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  مدال‌ها و رضایت
                </span>
              </div>
              <p className="text-xs text-[#4A5560] mt-0.5">
                تنظیم نشان‌های افتخار، درصد رضایت خریداران و رتبه‌های هفتگی
              </p>
            </div>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-xs font-semibold text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-all shrink-0 cursor-pointer"
          >
            مدیریت بخش
          </button>
        </div>
      </div>

      {/* 4 Accessible Clean Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart 1: Revenue last 30 days (8 cols) */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#BFDDF0]/60 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#111110]">
                نمودار روند درآمد روزانه (۳۰ روز اخیر)
              </h3>
              <span className="text-[11px] text-[#4A5560]">
                بر اساس تاریخ سفارشات تایید و پرداخت شده
              </span>
            </div>
            <span className="text-xs font-bold text-[#2F6B4F]">
              مجموع: {formatPrice(monthSales)}
            </span>
          </div>

          {/* SVG Bar Chart with Tooltips */}
          <div className="h-48 w-full flex items-end gap-1.5 pt-4 pb-2 px-1">
            {dailyEntries.map(([dKey, val], idx) => {
              const heightPercent = Math.max(6, Math.min(100, Math.round((val / maxDayRevenue) * 100)));
              const dayNum = dKey.slice(8);
              return (
                <div
                  key={dKey}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-[#111110] text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none">
                    <span>{dKey}</span>
                    <span className="font-bold">{formatPrice(val)}</span>
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      val > 0
                        ? 'bg-[#111110] group-hover:bg-[#2F6B4F]'
                        : 'bg-[#D3ECFA]/40'
                    }`}
                  />
                  {idx % 5 === 0 && (
                    <span className="text-[9px] text-[#4A5560] mt-1 select-none">
                      {toPersianDigits(dayNum)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Orders by status (4 cols) */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-4">
          <div className="border-b border-[#BFDDF0]/60 pb-3">
            <h3 className="text-sm font-bold text-[#111110]">
              تفکیک وضعیت سفارش‌ها
            </h3>
            <span className="text-[11px] text-[#4A5560]">
              توزیع بر اساس مراحل پردازش
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { label: 'پرداخت شده', count: statusCounts.PAID, color: '#2F6B4F' },
              { label: 'در حال تولید و چاپ', count: statusCounts.PROCESSING, color: '#2B5876' },
              { label: 'ارسال شده به پست', count: statusCounts.SHIPPED, color: '#9A6B1F' },
              { label: 'تحویل داده شده', count: statusCounts.DELIVERED, color: '#111110' },
              { label: 'در انتظار پرداخت', count: statusCounts.PENDING_PAYMENT, color: '#6B7280' },
              { label: 'لغو شده / انصراف', count: statusCounts.CANCELED, color: '#A33A3A' }
            ].map((item) => {
              const pct = orders.length > 0 ? Math.round((item.count / orders.length) * 100) : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#111110] font-medium">{item.label}</span>
                    <span className="text-[#4A5560]">
                      {formatPersianNumber(item.count)} ({toPersianDigits(pct)}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#E4F5FF] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Top 5 Selling Products (6 cols) */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#BFDDF0]/60 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#111110]">
                ۵ محصول پرفروش (بر حسب تعداد)
              </h3>
              <span className="text-[11px] text-[#4A5560]">
                استخراج شده از سفارشات موفق
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs text-[#111110] hover:underline flex items-center gap-1 font-medium"
            >
              <span>همه محصولات</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topSellingProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#4A5560]">
                هنوز سفارشی ثبت نشده است.
              </div>
            ) : (
              topSellingProducts.map((prod, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[#BFDDF0]/60 bg-[#E4F5FF]/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#111110] text-white text-xs font-bold flex items-center justify-center">
                      {formatPersianNumber(idx + 1)}
                    </span>
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-10 h-10 object-cover rounded-lg border border-[#BFDDF0]"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#111110] line-clamp-1">
                        {prod.name}
                      </div>
                      <div className="text-[11px] text-[#4A5560]">
                        گردش مالی: {formatPrice(prod.revenue)}
                      </div>
                    </div>
                  </div>

                  <div className="text-left font-bold text-xs text-[#2F6B4F]">
                    {formatPersianNumber(prod.qty)} عدد
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chart 4: Sales by Category (6 cols) */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#BFDDF0]/60 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#111110]">
                سهم فروش به تفکیک دسته‌بندی
              </h3>
              <span className="text-[11px] text-[#4A5560]">
                پوشاک، عطر و روایح، کفش، کیف و چرم
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('categories')}
              className="text-xs text-[#111110] hover:underline flex items-center gap-1 font-medium"
            >
              <span>مدیریت دسته‌ها</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {categories.map((cat) => {
              const catRev = categorySalesMap[cat.id] || 0;
              const pct = Math.round((catRev / totalCatRevenue) * 100);
              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#111110]">{cat.title}</span>
                    <span className="text-[#4A5560]">
                      {formatPrice(catRev)} ({toPersianDigits(pct)}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#E4F5FF] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#111110] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3 Quick Action Critical Lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* List 1: Low-stock & Out-of-stock Products */}
        <div className="p-5 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#BFDDF0]/60">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#A33A3A]" />
              <h3 className="text-xs font-bold text-[#111110]">
                موجودی بحرانی و ناموجود
              </h3>
            </div>
            <span className="text-xs font-bold text-[#A33A3A]">
              {formatPersianNumber(lowStockProducts.length + outOfStockProducts.length)} کالا
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {outOfStockProducts.map((p) => (
              <div
                key={p.id}
                className="p-2.5 rounded-xl border border-[#A33A3A]/20 bg-[#A33A3A]/5 flex items-center justify-between text-xs"
              >
                <span className="font-medium text-[#111110] truncate max-w-[180px]">
                  {p.name}
                </span>
                <span className="text-[11px] font-bold text-[#A33A3A] px-2 py-0.5 rounded bg-white">
                  ناموجود
                </span>
              </div>
            ))}
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="p-2.5 rounded-xl border border-[#9A6B1F]/20 bg-[#9A6B1F]/5 flex items-center justify-between text-xs"
              >
                <span className="font-medium text-[#111110] truncate max-w-[180px]">
                  {p.name}
                </span>
                <span className="text-[11px] font-bold text-[#9A6B1F] px-2 py-0.5 rounded bg-white">
                  فقط {formatPersianNumber(p.stock)} عدد
                </span>
              </div>
            ))}
            {lowStockProducts.length === 0 && outOfStockProducts.length === 0 && (
              <div className="py-6 text-center text-xs text-[#2F6B4F]">
                همه کالاها موجودی انبار کافی دارند.
              </div>
            )}
          </div>
        </div>

        {/* List 2: Latest Orders */}
        <div className="p-5 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#BFDDF0]/60">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#111110]" />
              <h3 className="text-xs font-bold text-[#111110]">
                آخرین سفارش‌های ثبت‌شده
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-[#111110] hover:underline"
            >
              مشاهده همه
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {orders.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#4A5560]">
                هیچ سفارشی ثبت نشده است.
              </div>
            ) : (
              orders.slice(0, 5).map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => onSelectOrder(ord)}
                  className="p-2.5 rounded-xl border border-[#BFDDF0]/60 hover:bg-[#D3ECFA]/30 cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-[#111110]">
                      {ord.orderNumber || ord.id}
                    </div>
                    <div className="text-[11px] text-[#4A5560]">
                      {ord.customerName} · {formatPrice(ord.total)}
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#111110] text-white">
                    {ord.status === 'PAID' ? 'پرداخت شد' : ord.status === 'PROCESSING' ? 'در حال تولید' : ord.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* List 3: Expiring or Limit-Reached Discount Codes */}
        <div className="p-5 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#BFDDF0]/60">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#9A6B1F]" />
              <h3 className="text-xs font-bold text-[#111110]">
                کدهای تخفیف در آستانه انقضا یا تکمیل
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('discounts')}
              className="text-xs text-[#111110] hover:underline"
            >
              مدیریت کوپن‌ها
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {expiringDiscounts.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#4A5560]">
                هیچ کد تخفیف فعالی در سیستم وجود ندارد.
              </div>
            ) : (
              expiringDiscounts.map((d) => (
                <div
                  key={d.code}
                  className="p-2.5 rounded-xl border border-[#9A6B1F]/20 bg-[#9A6B1F]/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-[#111110]">
                      {d.code}
                    </span>
                    <div className="text-[11px] text-[#4A5560]">
                      مصرف: {formatPersianNumber(d.usedCount || 0)} از {formatPersianNumber(d.maxUses || 0)}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#9A6B1F]">
                    %{formatPersianNumber(d.percent)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
