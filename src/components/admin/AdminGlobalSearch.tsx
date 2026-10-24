import React, { useState, useEffect } from 'react';
import { Product, Order, Category } from '../../lib/types';
import { formatPrice } from '../../lib/currency';
import { Search, ShoppingBag, Package, Tag, ArrowRight, X, LayoutDashboard, Percent, Image, Users, FileText, Settings, Flame, Award, Grid } from 'lucide-react';

interface AdminGlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: Order[];
  categories: Category[];
  onNavigateTab: (tab: string) => void;
  onSelectProduct?: (prod: Product) => void;
  onSelectOrder?: (ord: Order) => void;
  dark?: boolean;
}

export const AdminGlobalSearch: React.FC<AdminGlobalSearchProps> = ({
  isOpen,
  onClose,
  products,
  orders,
  categories,
  onNavigateTab,
  onSelectOrder
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle handled by parent
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Search Results
  const matchedPages = [
    { title: 'داشبورد مدیریتی', tab: 'dashboard', icon: LayoutDashboard },
    { title: 'مدیریت سفارش‌ها و فاکتورها', tab: 'orders', icon: ShoppingBag },
    { title: 'کاتالوگ و محصولات', tab: 'products', icon: Package },
    { title: 'دسته‌بندی‌های کالا', tab: 'categories', icon: Tag },
    { title: 'دسته‌بندی‌های صفحه اصلی (ردیف گرد)', tab: 'quick_categories', icon: Grid },
    { title: 'پرفروش‌ترین‌ها (کالاهای داغ و پرفروش)', tab: 'bestsellers', icon: Flame },
    { title: 'برترین‌های هفته (مدال‌ها و رضایت خریداران)', tab: 'top_weekly', icon: Award },
    { title: 'کدهای تخفیف و پروموشن‌ها', tab: 'discounts', icon: Percent },
    { title: 'بنرها و اسلایدرها', tab: 'banners', icon: Image },
    { title: 'کاربران و مشتریان', tab: 'users', icon: Users },
    { title: 'مدیریت محتوا و FAQ', tab: 'content', icon: FileText },
    { title: 'تنظیمات درگاه و سرویس‌ها', tab: 'settings', icon: Settings }
  ].filter((p) => !q || p.title.toLowerCase().includes(q));

  const matchedProducts = products
    .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.slug && p.slug.toLowerCase().includes(q)))
    .slice(0, 5);

  const matchedOrders = orders
    .filter(
      (o) =>
        !q ||
        (o.orderNumber || o.id).toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
    )
    .slice(0, 5);

  const matchedCategories = categories
    .filter((c) => !q || c.title.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white border border-[#BFDDF0] rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#BFDDF0]">
          <Search className="w-5 h-5 text-[#4A5560] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder=""
            className="w-full bg-transparent text-sm text-[#111110] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-black"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 text-xs">
          
          {/* Quick Pages Navigation */}
          {matchedPages.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-[#4A5560] block mb-1.5 px-2">
                بخش‌های پنل مدیریت:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {matchedPages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <button
                      key={page.tab}
                      onClick={() => {
                        onNavigateTab(page.tab);
                        onClose();
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[#E4F5FF]/50 text-right transition-colors"
                    >
                      <Icon className="w-4 h-4 text-[#111110]" />
                      <span className="font-semibold text-[#111110] truncate">{page.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matched Orders */}
          {matchedOrders.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-[#4A5560] block mb-1.5 px-2">
                سفارشات مرتبط:
              </span>
              <div className="space-y-1">
                {matchedOrders.map((ord) => (
                  <button
                    key={ord.id}
                    onClick={() => {
                      if (onSelectOrder) onSelectOrder(ord);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#E4F5FF]/50 text-right transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShoppingBag className="w-4 h-4 text-[#2B5876]" />
                      <div>
                        <span className="font-mono font-bold text-[#111110]">
                          {ord.orderNumber || ord.id}
                        </span>
                        <span className="text-[11px] text-gray-500 mr-2">
                          {ord.customerName} · {ord.customerPhone}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-[#2F6B4F]">{formatPrice(ord.total)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Products */}
          {matchedProducts.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-[#4A5560] block mb-1.5 px-2">
                محصولات کاتالوگ:
              </span>
              <div className="space-y-1">
                {matchedProducts.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => {
                      onNavigateTab('products');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#E4F5FF]/50 text-right transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-8 h-8 rounded-lg object-cover border"
                      />
                      <span className="font-semibold text-[#111110]">
                        {prod.name}
                      </span>
                    </div>
                    <span className="font-bold text-gray-700">
                      {formatPrice(prod.discountPrice || prod.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer shortcuts hint */}
        <div className="px-5 py-2.5 bg-gray-50 border-t border-[#BFDDF0] flex items-center justify-between text-[11px] text-[#4A5560]">
          <span>برای جابه‌جایی از کلیدهای جهت‌نما استفاده کنید</span>
          <span className="font-mono">ESC برای بستن</span>
        </div>

      </div>
    </div>
  );
};
