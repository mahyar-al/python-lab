import React, { useState } from 'react';
import { Category, SiteContent, CategoryQuickIcon } from '../../lib/types';
import { DEFAULT_QUICK_CATEGORIES, renderCategoryIcon } from '../QuickCategoriesBar';
import {
  Grid,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Edit2,
  X,
  Palette,
  FolderTree,
  Tag,
  Check
} from 'lucide-react';

interface AdminQuickCategoriesProps {
  categories: Category[];
  siteContent: SiteContent;
  onUpdateContent: (content: SiteContent) => Promise<void>;
  onSyncPublicStore?: () => void;
}

const PRESET_COLORS = [
  { name: 'مشکی کربنی', hex: '#111110' },
  { name: 'قرمز یاقوتی', hex: '#DC2626' },
  { name: 'آبی کبالت', hex: '#2563EB' },
  { name: 'بنفش سلطنتی', hex: '#7C3AED' },
  { name: 'سبز زمردی', hex: '#059669' },
  { name: 'نارنجی تند', hex: '#EA580C' },
  { name: 'سرخابی پررنگ', hex: '#DB2777' },
  { name: 'طلایی خردلی', hex: '#D97706' },
  { name: 'صورتی گلی', hex: '#E11D48' },
  { name: 'نیلی تیره', hex: '#4F46E5' },
  { name: 'سبز کله‌غازی', hex: '#0D9488' },
  { name: 'خاکستری سربی', hex: '#4B5563' }
];

const AVAILABLE_ICONS = [
  { id: 'Smartphone', label: 'موبایل' },
  { id: 'Laptop', label: 'لپ‌تاپ و کامپیوتر' },
  { id: 'Headphones', label: 'هدفون و صوت' },
  { id: 'Shirt', label: 'مد و پوشاک' },
  { id: 'Home', label: 'خانه و دکور' },
  { id: 'Cpu', label: 'لوازم خانگی و قطعات' },
  { id: 'Sparkles', label: 'آرایشی و لوکس' },
  { id: 'Palette', label: 'طراحی و هنر' },
  { id: 'Book', label: 'کتاب و تحریر' },
  { id: 'Gift', label: 'هدیه و سوغات' },
  { id: 'ShoppingBag', label: 'کیسه خرید عمومی' },
  { id: 'ShoppingCart', label: 'سبد خرید سوپرمارکت' },
  { id: 'Coins', label: 'سکه و طلا' },
  { id: 'Percent', label: 'تخفیف و حراج' },
  { id: 'Tag', label: 'برچسب و پیشنهاد' },
  { id: 'Heart', label: 'محبوب‌ها و سلامت' }
];

export const AdminQuickCategories: React.FC<AdminQuickCategoriesProps> = ({
  categories,
  siteContent,
  onUpdateContent,
  onSyncPublicStore
}) => {
  const [items, setItems] = useState<CategoryQuickIcon[]>(() => {
    const raw = siteContent?.categoryQuickIcons;
    if (raw && raw.length > 0) {
      // Clean out any old "بیشتر" item
      return raw.filter((i) => i.linkType !== 'more' && i.linkTarget !== 'more' && i.title !== 'بیشتر');
    }
    return DEFAULT_QUICK_CATEGORIES;
  });

  const [showSection, setShowSection] = useState<boolean>(() => {
    return siteContent?.sections?.showQuickCategories !== false;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form states for adding a new category item
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newIcon, setNewIcon] = useState<string>('ShoppingBag');
  const [newBgColor, setNewBgColor] = useState<string>('#111110');
  const [newBadge, setNewBadge] = useState<string>('');
  const [newBadgeBgColor, setNewBadgeBgColor] = useState<string>('#DC2626');

  // Filter root/main categories
  const mainCategories = categories.filter((c) => !c.parentId);

  // When admin selects a category from the dropdown, auto-fill title, icon, and smart color
  const handleSelectStoreCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    if (!catId) return;

    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;

    setNewTitle(cat.title);

    // Map category icon or slug to default preset icon & color
    const slug = (cat.slug || '').toLowerCase();
    const id = cat.id.toLowerCase();

    if (slug.includes('mobile') || id.includes('mobile')) {
      setNewIcon('Smartphone');
      setNewBgColor('#DC2626');
    } else if (slug.includes('laptop') || id.includes('laptop')) {
      setNewIcon('Laptop');
      setNewBgColor('#7C3AED');
    } else if (slug.includes('digital') || id.includes('digital') || slug.includes('audio')) {
      setNewIcon('Headphones');
      setNewBgColor('#2563EB');
    } else if (slug.includes('apparel') || id.includes('apparel') || slug.includes('shirt') || slug.includes('hoodie')) {
      setNewIcon('Shirt');
      setNewBgColor('#111110');
    } else if (slug.includes('home') || id.includes('home') || slug.includes('decor')) {
      setNewIcon('Home');
      setNewBgColor('#059669');
    } else if (slug.includes('appliance') || id.includes('appliance')) {
      setNewIcon('Cpu');
      setNewBgColor('#EA580C');
    } else if (slug.includes('beauty') || id.includes('beauty')) {
      setNewIcon('Sparkles');
      setNewBgColor('#E11D48');
    } else if (slug.includes('custom') || id.includes('custom')) {
      setNewIcon('Palette');
      setNewBgColor('#DB2777');
    } else if (slug.includes('stationery') || id.includes('stationery') || slug.includes('book')) {
      setNewIcon('Book');
      setNewBgColor('#4F46E5');
    } else if (slug.includes('local') || id.includes('local')) {
      setNewIcon('Gift');
      setNewBgColor('#D97706');
    } else {
      setNewIcon('ShoppingBag');
      setNewBgColor('#111110');
    }
  };

  const handleAddItem = () => {
    if (!newTitle.trim()) {
      alert('لطفاً عنوان دسته‌بندی را وارد نمایید.');
      return;
    }

    const newItem: CategoryQuickIcon = {
      id: `qc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: newTitle.trim(),
      icon: newIcon,
      bgColor: newBgColor,
      badge: newBadge.trim() || undefined,
      badgeBgColor: newBadge ? newBadgeBgColor : undefined,
      linkType: selectedCategoryId ? 'category' : 'action',
      linkTarget: selectedCategoryId || 'catalog',
      active: true,
      sortOrder: items.length + 1
    };

    setItems((prev) => [...prev, newItem]);

    // Reset inputs
    setSelectedCategoryId('');
    setNewTitle('');
    setNewBadge('');
  };

  // One-click action to auto-populate from ALL top-level store categories
  const handleAutoPopulateFromStoreCategories = () => {
    if (!confirm('آیا مایلید تمام دسته‌بندی‌های اصلی تعریف شده در فروشگاه به صورت خودکار به این ردیف افزوده شوند؟')) {
      return;
    }

    const catsToUse = mainCategories.length > 0 ? mainCategories : categories.slice(0, 10);
    const generated: CategoryQuickIcon[] = catsToUse.map((cat, idx) => {
      let icon = 'ShoppingBag';
      let color = PRESET_COLORS[idx % PRESET_COLORS.length].hex;
      let badge: string | undefined = undefined;

      const slug = (cat.slug || '').toLowerCase();
      if (slug.includes('mobile')) {
        icon = 'Smartphone';
        color = '#DC2626';
        badge = 'پرفروش';
      } else if (slug.includes('laptop')) {
        icon = 'Laptop';
        color = '#7C3AED';
        badge = 'گارانتی';
      } else if (slug.includes('digital')) {
        icon = 'Headphones';
        color = '#2563EB';
      } else if (slug.includes('apparel')) {
        icon = 'Shirt';
        color = '#111110';
      } else if (slug.includes('home')) {
        icon = 'Home';
        color = '#059669';
      } else if (slug.includes('appliance')) {
        icon = 'Cpu';
        color = '#EA580C';
      } else if (slug.includes('beauty')) {
        icon = 'Sparkles';
        color = '#E11D48';
      } else if (slug.includes('custom')) {
        icon = 'Palette';
        color = '#DB2777';
        badge = 'اختصاصی';
      } else if (slug.includes('stationery')) {
        icon = 'Book';
        color = '#4F46E5';
      } else if (slug.includes('local')) {
        icon = 'Gift';
        color = '#D97706';
        badge = 'اصیل';
      }

      return {
        id: `qc-${cat.id}`,
        title: cat.title,
        icon,
        bgColor: color,
        badge,
        badgeBgColor: '#991B1B',
        linkType: 'category',
        linkTarget: cat.id,
        active: true,
        sortOrder: idx + 1
      };
    });

    setItems(generated);
  };

  const handleResetToDefaults = () => {
    if (confirm('آیا می‌خواهید ردیف دسته‌بندی‌ها به چینش پیش‌فرض فروشگاه بازگردانده شود؟')) {
      setItems(DEFAULT_QUICK_CATEGORIES);
    }
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleItemActive = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: !item.active } : item))
    );
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    // Update sortOrder
    const reordered = updated.map((it, idx) => ({ ...it, sortOrder: idx + 1 }));
    setItems(reordered);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      // Ensure no "بیشتر" item is saved
      const cleanedItems = items
        .filter((i) => i.linkType !== 'more' && i.linkTarget !== 'more' && i.title !== 'بیشتر')
        .map((it, idx) => ({ ...it, sortOrder: idx + 1 }));

      const updatedSiteContent: SiteContent = {
        ...siteContent,
        categoryQuickIcons: cleanedItems,
        sections: {
          ...siteContent.sections,
          showQuickCategories: showSection,
          showCatalog: false // User explicitly requested catalog removed from homepage
        }
      };

      await onUpdateContent(updatedSiteContent);
      onSyncPublicStore?.();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره‌سازی اطلاعات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-[#BFDDF0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#111110]">
                مدیریت ردیف دسته‌بندی‌های صفحه اصلی (آیکون‌های گرد)
              </h2>
              <p className="text-xs text-[#4A5560] mt-0.5">
                تنظیم دسته‌بندی‌های نمایش‌داده‌شده، رنگ دایره، آیکون، برچسب‌ها و ترتیب چینش زیر هیدر
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleAutoPopulateFromStoreCategories}
            className="px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            title="افزودن تمام دسته‌بندی‌های اصلی کاتالوگ فروشگاه"
          >
            <FolderTree className="w-4 h-4" />
            <span>ایجاد خودکار از دسته‌بندی‌های فروشگاه</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-[#111110] hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span>در حال ذخیره...</span>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ذخیره شد!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>ذخیره تغییرات</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visibility Toggle Switch */}
      <div className="p-4 rounded-xl border border-[#BFDDF0] bg-white flex items-center justify-between shadow-2xs">
        <div>
          <span className="font-bold text-xs sm:text-sm text-gray-900 block">
            نمایش این ردیف دسته‌بندی در صفحه نخست سایت
          </span>
          <span className="text-[11px] text-gray-500">
            با غیرفعال کردن این گزینه، ردیف دسته‌بندی‌های دایره‌ای در صفحه اصلی پنهان می‌گردد.
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={showSection}
            onChange={(e) => setShowSection(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
        </label>
      </div>

      {/* Live Preview Area */}
      <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
            <Eye className="w-4 h-4 text-blue-600" />
            <span>پیش‌نمایش زنده در صفحه اصلی (اسکرول افقی روی موبایل و دسکتاپ):</span>
          </div>
          <span className="text-[11px] text-gray-500">
            {items.filter((i) => i.active !== false).length} دسته‌بندی فعال
          </span>
        </div>

        <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 overflow-x-auto scrollbar-none py-6">
          <div className="flex items-start justify-start gap-4 sm:gap-6 min-w-max px-2">
            {items
              .filter((i) => i.active !== false)
              .map((item) => (
                <div key={item.id} className="flex flex-col items-center gap-2 shrink-0 w-20 text-center">
                  <div className="relative">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center shadow-xs transition-transform hover:scale-105"
                      style={{
                        backgroundColor: item.bgColor || '#111110',
                        color: item.textColor || '#FFFFFF'
                      }}
                    >
                      {renderCategoryIcon(item.icon, item.customText, 'w-6.5 h-6.5 text-white')}
                    </div>
                    {item.badge && (
                      <span
                        className="absolute -bottom-1 inset-x-0 mx-auto w-max max-w-[65px] truncate px-1.5 py-0.5 rounded-full text-[8.5px] font-bold text-white shadow-xs border border-white"
                        style={{
                          backgroundColor: item.badgeBgColor || '#DC2626'
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 line-clamp-2 leading-tight">
                    {item.title}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Add New Category to Quick Bar */}
      <div className="p-6 rounded-2xl border border-[#BFDDF0] bg-white shadow-sm space-y-5">
        <div className="border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>افزودن دسته‌بندی جدید به ردیف</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            می‌توانید مستقیم از دسته‌بندی‌های تعریف‌شده در فروشگاه انتخاب کنید یا مشخصات دلخواه وارد نمایید.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* 1. Pick from Store Categories */}
          <div>
            <label className="block font-bold text-gray-700 mb-1.5">
              انتخاب از دسته‌بندی‌های فروشگاه:
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => handleSelectStoreCategory(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-xl bg-white border-gray-300 focus:border-red-500 focus:outline-hidden"
            >
              <option value="">-- انتخاب دسته‌بندی --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? `↳ ${c.title}` : `📁 ${c.title}`}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Title */}
          <div>
            <label className="block font-bold text-gray-700 mb-1.5">
              عنوان فارسی دایره: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="مثال: موبایل یا پوشاک"
              className="w-full px-3 py-2.5 border rounded-xl bg-white border-gray-300 focus:border-red-500 focus:outline-hidden"
            />
          </div>

          {/* 3. Icon Selection */}
          <div>
            <label className="block font-bold text-gray-700 mb-1.5">
              آیکون داخل دایره:
            </label>
            <select
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-xl bg-white border-gray-300 focus:border-red-500 focus:outline-hidden"
            >
              {AVAILABLE_ICONS.map((ic) => (
                <option key={ic.id} value={ic.id}>
                  {ic.label} ({ic.id})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Badge text (optional) */}
          <div>
            <label className="block font-bold text-gray-700 mb-1.5">
              برچسب کوچک (اختیاری):
            </label>
            <input
              type="text"
              value={newBadge}
              onChange={(e) => setNewBadge(e.target.value)}
              placeholder="مثال: ویژه، تخفیف، جدید"
              className="w-full px-3 py-2.5 border rounded-xl bg-white border-gray-300 focus:border-red-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Color Presets */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <label className="block text-xs font-bold text-gray-700">
            انتخاب رنگ پس‌زمینه دایره:
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setNewBgColor(c.hex)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                  newBgColor.toLowerCase() === c.hex.toLowerCase()
                    ? 'ring-2 ring-offset-2 ring-black scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              >
                {newBgColor.toLowerCase() === c.hex.toLowerCase() && (
                  <Check className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            ))}
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-[11px] text-gray-500 font-mono">کد رنگ:</span>
              <input
                type="text"
                value={newBgColor}
                onChange={(e) => setNewBgColor(e.target.value)}
                className="w-20 px-2 py-1 border rounded-lg text-xs font-mono text-center"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleAddItem}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن به ردیف دسته‌بندی‌ها</span>
          </button>
        </div>
      </div>

      {/* Items Table & Reordering */}
      <div className="p-6 rounded-2xl border border-[#BFDDF0] bg-white shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold text-gray-900">
            لیست دسته‌بندی‌های موجود در ردیف ({items.length} آیتم)
          </h3>
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>بازنشانی به پیش‌فرض</span>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            هیچ دسته‌بندی در این ردیف تعریف نشده است. از فرم بالا دسته‌بندی اضافه کنید.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item, index) => {
              const targetCat = categories.find((c) => c.id === item.linkTarget);
              return (
                <div
                  key={item.id}
                  className={`py-3.5 px-3 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                    item.active === false ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50/70'
                  }`}
                >
                  {/* Left (RTL Right): Item Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center shadow-2xs"
                        style={{ backgroundColor: item.bgColor }}
                      >
                        {renderCategoryIcon(item.icon, item.customText, 'w-5.5 h-5.5 text-white')}
                      </div>
                      {item.badge && (
                        <span
                          className="absolute -bottom-1 inset-x-0 mx-auto w-max max-w-[50px] truncate px-1 py-0.2 rounded-full text-[7.5px] font-bold text-white shadow-2xs border border-white"
                          style={{ backgroundColor: item.badgeBgColor || '#DC2626' }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <span className="font-bold text-xs sm:text-sm text-gray-900 block truncate">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-gray-500 block truncate">
                        {targetCat ? `متصل به دسته‌بندی: ${targetCat.title}` : `مقصد: ${item.linkTarget}`}
                      </span>
                    </div>
                  </div>

                  {/* Right (RTL Left): Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Move Up / Down */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 disabled:opacity-30 cursor-pointer"
                        title="انتقال به راست / ابتدا"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveItem(index, 'down')}
                        disabled={index === items.length - 1}
                        className="p-1 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 disabled:opacity-30 cursor-pointer"
                        title="انتقال به چپ / انتها"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Active Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleItemActive(item.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                        item.active !== false
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {item.active !== false ? 'فعال' : 'غیرفعال'}
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="حذف از ردیف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#BFDDF0] shadow-sm">
        <span className="text-xs text-gray-600">
          برای اعمال تغییرات در سایت عمومی، دکمه ذخیره تغییرات را کلیک کنید.
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-[#111110] hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <span>در حال ذخیره...</span>
          ) : saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ذخیره شد!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>ذخیره تغییرات</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
