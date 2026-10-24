import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Category } from '../lib/types';
import { formatPersianNumber } from '../lib/currency';
import {
  Smartphone,
  Laptop,
  Headphones,
  Shirt,
  Home,
  Lamp,
  Palette,
  BookOpen,
  Cpu,
  Gift,
  Sparkles,
  ShoppingBag,
  Shield,
  Watch,
  Camera,
  Coffee,
  Heart,
  Car,
  Activity,
  Wrench,
  ChevronLeft,
  ChevronDown,
  ArrowLeft,
  Search,
  FolderTree,
  X,
  ExternalLink
} from 'lucide-react';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategoryId?: string;
  onSelectCategory: (categoryId: string) => void;
  onNavigateToCatalog: () => void;
}

// Icon dictionary matching preset IDs and category titles
export function renderCategoryIcon(cat: Category, className: string = 'w-4 h-4') {
  const iconKey = cat.icon || '';
  const title = cat.title || '';

  // Explicit preset match
  if (iconKey === 'Smartphone' || title.includes('موبایل') || title.includes('گوشی')) {
    return <Smartphone className={className} />;
  }
  if (iconKey === 'Laptop' || title.includes('لپ‌تاپ') || title.includes('کامپیوتر')) {
    return <Laptop className={className} />;
  }
  if (iconKey === 'Headphones' || title.includes('صوتی') || title.includes('هدفون') || title.includes('دیجیتال')) {
    return <Headphones className={className} />;
  }
  if (iconKey === 'Shirt' || title.includes('پوشاک') || title.includes('لباس') || title.includes('مد')) {
    return <Shirt className={className} />;
  }
  if (iconKey === 'Palette' || title.includes('چاپ') || title.includes('استودیو') || title.includes('طراحی')) {
    return <Palette className={className} />;
  }
  if (iconKey === 'Home' || title.includes('خانه') || title.includes('دکوراسیون')) {
    return <Home className={className} />;
  }
  if (iconKey === 'Lamp' || title.includes('نور') || title.includes('روشنایی') || title.includes('آباژور')) {
    return <Lamp className={className} />;
  }
  if (iconKey === 'Book' || iconKey === 'BookOpen' || title.includes('کتاب') || title.includes('تحریر')) {
    return <BookOpen className={className} />;
  }
  if (iconKey === 'Cpu' || title.includes('برقی') || title.includes('لوازم خانگی')) {
    return <Cpu className={className} />;
  }
  if (iconKey === 'Gift' || title.includes('بومی') || title.includes('محلی') || title.includes('هدیه')) {
    return <Gift className={className} />;
  }
  if (iconKey === 'Sparkles' || title.includes('زیبایی') || title.includes('آرایشی')) {
    return <Sparkles className={className} />;
  }
  if (iconKey === 'Car' || title.includes('خودرو') || title.includes('موتور')) {
    return <Car className={className} />;
  }
  if (iconKey === 'Activity' || title.includes('سلامت') || title.includes('پزشکی')) {
    return <Activity className={className} />;
  }
  if (iconKey === 'Wrench' || title.includes('ابزار')) {
    return <Wrench className={className} />;
  }
  if (iconKey === 'Watch' || title.includes('ساعت')) {
    return <Watch className={className} />;
  }
  if (iconKey === 'Camera' || title.includes('دوربین')) {
    return <Camera className={className} />;
  }
  if (iconKey === 'Coffee' || title.includes('کافه') || title.includes('آشپزخانه')) {
    return <Coffee className={className} />;
  }
  if (iconKey === 'Heart') {
    return <Heart className={className} />;
  }
  if (iconKey === 'Shield') {
    return <Shield className={className} />;
  }

  // If it's an emoji string or custom text
  if (iconKey.length <= 3 && iconKey.trim() !== '') {
    return <span className="text-sm select-none">{iconKey}</span>;
  }

  return <ShoppingBag className={className} />;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({
  isOpen,
  onClose,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onNavigateToCatalog
}) => {
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Active root categories (Level 1: parentId is null or empty)
  const rootCategories = useMemo(() => {
    return categories
      .filter((c) => !c.parentId && c.active !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [categories]);

  // Selected or hovered root category
  const [activeRootId, setActiveRootId] = useState<string>('');

  // Search input inside megamenu for instant subcategory discovery
  const [searchTerm, setSearchTerm] = useState('');

  // Sync initial root category when opened or categories change
  useEffect(() => {
    if (rootCategories.length > 0) {
      if (!activeRootId || !rootCategories.some((r) => r.id === activeRootId)) {
        // If selectedCategoryId is a root or child of a root, prioritize that
        const matchingRoot = rootCategories.find((r) => {
          if (r.id === selectedCategoryId) return true;
          const isChild = categories.some(
            (c) => c.id === selectedCategoryId && (c.parentId === r.id || categories.some((p) => p.id === c.parentId && p.parentId === r.id))
          );
          return isChild;
        });

        setActiveRootId(matchingRoot ? matchingRoot.id : rootCategories[0].id);
      }
    }
  }, [isOpen, rootCategories, selectedCategoryId, categories, activeRootId]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Active root object
  const activeRoot = useMemo(() => {
    return rootCategories.find((r) => r.id === activeRootId) || rootCategories[0];
  }, [rootCategories, activeRootId]);

  // Sub-groups (Level 2: parentId === activeRoot.id)
  const subGroups = useMemo(() => {
    if (!activeRoot) return [];
    return categories
      .filter((c) => c.parentId === activeRoot.id && c.active !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [categories, activeRoot]);

  // Helper to fetch leaf items (Level 3: parentId === subGroup.id)
  const getGroupItems = (groupId: string): Category[] => {
    return categories
      .filter((c) => c.parentId === groupId && c.active !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  };

  // Flattened search items when user types in the search filter
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const term = searchTerm.toLowerCase().trim();
    return categories.filter(
      (c) => c.active !== false && (c.title.toLowerCase().includes(term) || (c.description && c.description.toLowerCase().includes(term)))
    );
  }, [categories, searchTerm]);

  if (!isOpen) return null;

  return (
    <>
      {/* ------------------------------------------------------------------- */}
      {/* 1. Backdrop Overlay (Transparent to remove dark background tint)   */}
      {/* ------------------------------------------------------------------- */}
      <div
        className="fixed inset-0 top-[108px] sm:top-[116px] bg-transparent z-40 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ------------------------------------------------------------------- */}
      {/* 2. Mega Menu Container (Opens right beneath secondary menu bar)     */}
      {/* ------------------------------------------------------------------- */}
      <div
        ref={menuContainerRef}
        dir="rtl"
        className="absolute top-full right-2 sm:right-6 lg:right-[max(1rem,calc((100vw-1440px)/2+1.5rem))] mt-1.5 w-[960px] lg:w-[1140px] xl:w-[1240px] max-w-[calc(100vw-16px)] bg-white rounded-2xl shadow-2xl border border-neutral-200/90 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 origin-top-right select-none text-right"
      >
        {/* ================================================================= */}
        {/* Top Utility Bar (Search Filter & Close Button)                     */}
        {/* ================================================================= */}
        <div className="px-5 py-2.5 bg-neutral-50/90 border-b border-neutral-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-800">
            <span className="w-2 h-2 rounded-full bg-[#ef4056] animate-pulse" />
            <span>دسته‌بندی جامع کالاهای فروشگاه موریکو</span>
            <span className="text-[11px] font-normal text-neutral-400 font-persian-nums mr-1">
              ({formatPersianNumber(rootCategories.length)} دسته‌بندی اصلی)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick in-menu category filter */}
            <div className="relative hidden md:block">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder=""
                className="w-56 lg:w-72 bg-white text-xs text-[#111110] border border-neutral-200 rounded-xl pr-8 pl-6 py-1.5 focus:outline-none focus:border-[#ef4056] focus:ring-1 focus:ring-[#ef4056]/20 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* View All in Catalog link */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectCategory('all');
                onNavigateToCatalog();
              }}
              className="text-xs font-semibold text-[#ef4056] hover:text-[#d72c41] flex items-center gap-1 cursor-pointer transition-colors px-2.5 py-1 rounded-lg hover:bg-rose-50"
            >
              <span>مشاهده تمام کاتالوگ</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* Main Content Area: Split 2-Section Layout                          */}
        {/* Right Side: Main Categories Vertical List                         */}
        {/* Left Side: Multi-Column Subcategories Grid                         */}
        {/* ================================================================= */}
        {searchResults ? (
          /* Instant Search Results Mode inside MegaMenu */
          <div className="p-6 max-h-[500px] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100">
              <span className="text-xs font-bold text-neutral-700 font-persian-nums">
                نتایج جستجو برای «{searchTerm}» ({formatPersianNumber(searchResults.length)} مورد)
              </span>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-xs text-[#ef4056] hover:underline cursor-pointer"
              >
                بازگشت به فهرست دسته‌بندی‌ها
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-xs">
                دسته‌بندی با این عنوان یافت نشد. می‌توانید نام کلی‌تری را جستجو کنید.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectCategory(item.id);
                      onNavigateToCatalog();
                    }}
                    className="text-right p-3 rounded-xl border border-neutral-200/80 hover:border-[#ef4056] hover:bg-rose-50/40 transition-all cursor-pointer group flex items-start gap-2.5"
                  >
                    <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-600 group-hover:bg-[#ef4056] group-hover:text-white transition-colors shrink-0">
                      {renderCategoryIcon(item, 'w-4 h-4')}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-neutral-800 group-hover:text-[#ef4056] transition-colors truncate">
                        {item.title}
                      </div>
                      {item.description && (
                        <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Standard Digikala 2-Pane Mega Menu */
          <div className="flex h-[490px] max-h-[70vh]">
            {/* --------------------------------------------------------------- */}
            {/* 1. RIGHT SIDEBAR: Vertical list of Main / Root Categories       */}
            {/* --------------------------------------------------------------- */}
            <div className="w-44 sm:w-56 lg:w-64 shrink-0 bg-[#f8f9fa] border-l border-neutral-200/80 p-1.5 sm:p-2 overflow-y-auto space-y-0.5">
              {rootCategories.length === 0 ? (
                <div className="py-12 px-3 text-center text-xs text-neutral-400">
                  دسته‌بندی تعریف نشده است
                </div>
              ) : (
                rootCategories.map((root) => {
                  const isActive = activeRoot?.id === root.id;

                  return (
                    <button
                      key={root.id}
                      type="button"
                      onMouseEnter={() => setActiveRootId(root.id)}
                      onClick={() => {
                        setActiveRootId(root.id);
                      }}
                      className={`w-full text-right px-3.5 py-3 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer select-none relative ${
                        isActive
                          ? 'bg-white text-[#ef4056] font-extrabold shadow-sm border-r-4 border-[#ef4056]'
                          : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/50 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span
                          className={`transition-colors shrink-0 ${
                            isActive ? 'text-[#ef4056]' : 'text-neutral-400'
                          }`}
                        >
                          {renderCategoryIcon(root, 'w-4 h-4')}
                        </span>
                        <span className="truncate">{root.title}</span>
                      </div>

                      <ChevronLeft
                        className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                          isActive ? 'text-[#ef4056] translate-x-[-2px]' : 'text-neutral-300'
                        }`}
                      />
                    </button>
                  );
                })
              )}
            </div>

            {/* --------------------------------------------------------------- */}
            {/* 2. LEFT PANE: Multi-Column Subcategories & Groups               */}
            {/* --------------------------------------------------------------- */}
            <div className="flex-1 bg-white p-4 sm:p-6 overflow-y-auto flex flex-col">
              {activeRoot ? (
                <>
                  {/* Top Category Link (Like Digikala: «همه محصولات موبایل >») */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 mb-5">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectCategory(activeRoot.id);
                        onNavigateToCatalog();
                      }}
                      className="text-xs sm:text-sm font-extrabold text-[#ef4056] hover:text-[#d72c41] flex items-center gap-1.5 cursor-pointer group transition-colors"
                    >
                      <span>همه محصولات {activeRoot.title}</span>
                      <ChevronLeft className="w-4 h-4 text-[#ef4056] group-hover:translate-x-[-3px] transition-transform" />
                    </button>

                    {activeRoot.description && (
                      <span className="text-[11px] text-neutral-400 max-w-[50%] truncate hidden sm:inline">
                        {activeRoot.description}
                      </span>
                    )}
                  </div>

                  {/* Multi-Column Subcategories Layout */}
                  {subGroups.length === 0 ? (
                    /* Fallback when category has no sub-groups yet */
                    <div className="my-auto py-12 text-center text-neutral-400">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-50 text-neutral-400 flex items-center justify-center mx-auto mb-3">
                        {renderCategoryIcon(activeRoot, 'w-6 h-6')}
                      </div>
                      <p className="text-xs font-semibold text-neutral-600 mb-1">
                        زیرمجموعه‌ای برای این دسته‌بندی تعریف نشده است.
                      </p>
                      <p className="text-[11px] text-neutral-400 mb-4">
                        می‌توانید تمامی کالاهای این دسته‌بندی را مستقیماً در کاتالوگ فروشگاه مشاهده فرمایید.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectCategory(activeRoot.id);
                          onNavigateToCatalog();
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-50 text-[#ef4056] font-bold text-xs hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        مشاهده محصولات {activeRoot.title}
                      </button>
                    </div>
                  ) : (
                    /* 4-Column Grid of Groups & Links (Exact Digikala Architecture) */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-7 content-start">
                      {subGroups.map((group) => {
                        const leafItems = getGroupItems(group.id);

                        return (
                          <div key={group.id} className="space-y-2.5">
                            {/* Column / Group Title (Red Bar + Bold Text + Arrow) */}
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onSelectCategory(group.id);
                                onNavigateToCatalog();
                              }}
                              className="w-full text-right group/header flex items-center justify-between border-r-[3px] border-[#ef4056] pr-2.5 py-0.5 cursor-pointer"
                            >
                              <span className="text-xs font-black text-neutral-900 group-hover/header:text-[#ef4056] transition-colors truncate">
                                {group.title}
                              </span>
                              <ChevronLeft className="w-3.5 h-3.5 text-neutral-400 group-hover/header:text-[#ef4056] group-hover/header:translate-x-[-2px] transition-transform shrink-0" />
                            </button>

                            {/* Under Group Title: Gray Leaf Links List */}
                            {leafItems.length > 0 ? (
                              <div className="space-y-1.5 pr-2.5">
                                {leafItems.map((leaf) => (
                                  <button
                                    key={leaf.id}
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      onSelectCategory(leaf.id);
                                      onNavigateToCatalog();
                                    }}
                                    className="block w-full text-right text-xs text-neutral-600 hover:text-[#ef4056] transition-colors truncate font-medium cursor-pointer py-0.5 hover:translate-x-[-1px]"
                                  >
                                    {leaf.title}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              /* If group has no direct leaf children, provide direct click */
                              <div className="pr-2.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onSelectCategory(group.id);
                                    onNavigateToCatalog();
                                  }}
                                  className="text-[11px] text-neutral-400 hover:text-[#ef4056] transition-colors"
                                >
                                  مشاهده مدل‌ها و اقلام...
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="my-auto py-16 text-center text-neutral-400 text-xs">
                  هنوز هیچ دسته‌بندی در فروشگاه تعریف نشده است. از پنل مدیریت می‌توانید دسته‌بندی‌های دلخواه را اضافه نمایید.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* Bottom Banner Strip: Fast Access To Online Custom Studio          */}
        {/* ================================================================= */}
        <div className="px-5 py-2.5 bg-neutral-100/70 border-t border-neutral-200/80 flex items-center justify-between text-xs text-neutral-600">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ef4056]" />
            <span className="font-semibold text-neutral-800">سفارش و چاپ اختصاصی:</span>
            <span className="text-neutral-500 hidden sm:inline">
              امکان طراحی آنلاین، درج لوگو و مونوگرام شخصی روی کلیه محصولات با تحویل فوری
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectCategory('cat-custom');
              onNavigateToCatalog();
            }}
            className="text-[11px] font-bold text-[#ef4056] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>ورود به استودیو طراحی</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
};
