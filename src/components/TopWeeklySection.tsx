import React, { useState, useRef, useMemo } from 'react';
import { Product, Category } from '../lib/types';
import { formatPrice, toPersianDigits } from '../lib/currency';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Star,
  ShoppingBag,
  Eye,
  Check,
  Award,
  Percent,
  Home,
  ArrowRight,
  LayoutGrid,
  Rows,
  ThumbsUp
} from 'lucide-react';

export interface TopWeeklyItem {
  id: string;
  rankThisWeek: number;
  rankLastWeek: number;
  name: string;
  category: string;
  image: string;
  price: number;
  discountPrice?: number;
  rating: number;
  satisfactionPercent: number;
  reviewsCount: number;
  tag: string;
  awardTitle?: string;
}

export const TOP_WEEKLY_ITEMS: TopWeeklyItem[] = [];

interface TopWeeklySectionProps {
  isStandalonePage?: boolean;
  items?: TopWeeklyItem[];
  categories?: Category[];
  onBackToHome?: () => void;
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onShowToast?: (type: 'success' | 'warning' | 'info' | 'error', message: string) => void;
}

export const TopWeeklySection: React.FC<TopWeeklySectionProps> = ({
  isStandalonePage = true,
  items,
  categories = [],
  onBackToHome,
  onSelectProduct,
  onAddToCart,
  onShowToast
}) => {
  const [timeframe, setTimeframe] = useState<'thisWeek' | 'lastWeek'>('thisWeek');
  const [selectedChip, setSelectedChip] = useState<string>('all');
  const [layoutMode, setLayoutMode] = useState<'horizontal' | 'grid'>('horizontal');
  const [addedItemIds, setAddedItemIds] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use dynamic items configured by Admin if provided, otherwise default dataset
  const activeItems = items && items.length > 0 ? items : TOP_WEEKLY_ITEMS;

  // Dynamic category chips strictly based on registered categories in store (eliminates unneeded extra chips)
  const dynamicChips = useMemo(() => {
    const list = [{ id: 'all', label: 'همه دسته‌ها' }];
    if (categories && categories.length > 0) {
      categories.forEach((c) => {
        list.push({ id: c.id, label: c.title });
      });
    } else {
      const uniqueCats = Array.from(new Set(activeItems.map((i) => i.category).filter(Boolean)));
      uniqueCats.forEach((cat) => {
        list.push({ id: cat, label: cat });
      });
    }
    return list;
  }, [categories, activeItems]);

  if (activeItems.length === 0) {
    if (!isStandalonePage) return null;
    return (
      <div className="w-full py-16 px-4 max-w-[1200px] mx-auto text-center" dir="rtl">
        <div className="bg-white rounded-3xl border border-[#BFDDF0] p-10 max-w-lg mx-auto shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#E4F5FF] text-[#111110] flex items-center justify-center mx-auto border border-[#BFDDF0]">
            <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-[#111110]">برترین‌های هفته</h2>
          <p className="text-sm text-[#4A5560] leading-relaxed">
            در حال حاضر کالایی در فهرست برترین‌های هفته ثبت نشده است. از طریق پنل مدیریت می‌توانید کالاهای دلخواه را به این بخش اضافه نمایید.
          </p>
          {onBackToHome && (
            <div className="pt-2">
              <button
                onClick={onBackToHome}
                className="px-6 py-2.5 rounded-xl bg-[#111110] text-white hover:bg-[#2A2A28] text-xs font-medium transition-colors cursor-pointer"
              >
                بازگشت به صفحه اصلی
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Filter items according to registered category chip
  const filteredItems = activeItems.filter((item) => {
    if (selectedChip === 'all') return true;
    const catObj = categories?.find((c) => c.id === selectedChip);
    const catTitle = catObj?.title || selectedChip;
    return (
      item.category === selectedChip ||
      item.category === catTitle ||
      (catObj?.slug && item.category === catObj.slug)
    );
  });

  // Sort items according to active timeframe rank
  const sortedItems = [...filteredItems].sort((a, b) => {
    const rankA = timeframe === 'thisWeek' ? a.rankThisWeek : a.rankLastWeek;
    const rankB = timeframe === 'thisWeek' ? b.rankThisWeek : b.rankLastWeek;
    return rankA - rankB;
  });

  // Scroll controls for horizontal carousel
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Convert top weekly item to standard store Product object
  const handleCardClick = (item: TopWeeklyItem) => {
    if (onSelectProduct) {
      const prod: Product = {
        id: item.id,
        name: item.name,
        price: item.price,
        discountPrice: item.discountPrice,
        categoryId: item.category,
        image: item.image,
        images: [item.image],
        description: `${item.name} — از محصولات برگزیده هفته در فروشگاه موریکو با بالاترین امتیاز رضایت و ضمانت اصالت فیزیکی.`,
        stock: 20,
        status: 'active',
        rating: item.rating,
        ratingCount: item.reviewsCount,
        isFeatured: true
      };
      onSelectProduct(prod);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent, item: TopWeeklyItem) => {
    e.stopPropagation();
    if (onAddToCart) {
      const prod: Product = {
        id: item.id,
        name: item.name,
        price: item.price,
        discountPrice: item.discountPrice,
        categoryId: item.category,
        image: item.image,
        images: [item.image],
        description: item.name,
        stock: 20,
        status: 'active',
        rating: item.rating,
        ratingCount: item.reviewsCount,
        isFeatured: true
      };
      onAddToCart(prod);
      setAddedItemIds((prev) => new Set(prev).add(item.id));
      setTimeout(() => {
        setAddedItemIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }, 2000);
      if (onShowToast) {
        onShowToast('success', `«${item.name.slice(0, 30)}...» به سبد خرید اضافه شد.`);
      }
    }
  };

  return (
    <div id="top-weekly-section" className="w-full py-4 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-[1440px] mx-auto select-none" dir="rtl">
      
      {/* =================================================================== */}
      {/* Standalone Page Breadcrumb & Header Controls                        */}
      {/* =================================================================== */}
      {isStandalonePage && (
        <div className="flex items-center justify-between mb-4 sm:mb-6 text-xs sm:text-sm">
          <nav className="flex items-center gap-2 text-gray-500 font-medium">
            <button
              type="button"
              onClick={onBackToHome}
              className="flex items-center gap-1.5 text-gray-700 hover:text-amber-600 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4 text-gray-400" />
              <span>صفحه اصلی</span>
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-amber-600 font-bold">برترین‌های هفته</span>
          </nav>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setLayoutMode('horizontal')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  layoutMode === 'horizontal' ? 'bg-amber-50 text-amber-600 font-bold' : 'text-gray-500 hover:text-gray-800'
                }`}
                title="نمایش افقی (نواری)"
              >
                <Rows className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  layoutMode === 'grid' ? 'bg-amber-50 text-amber-600 font-bold' : 'text-gray-500 hover:text-gray-800'
                }`}
                title="نمایش شبکه‌ای"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:text-amber-600 hover:border-amber-200 transition-all font-semibold text-xs cursor-pointer shadow-2xs"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>بازگشت به خانه</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 1. Header & Title Area with Decorative Celebration Pattern          */}
      {/* =================================================================== */}
      <div className="relative overflow-hidden bg-white rounded-3xl border border-amber-100/90 shadow-sm p-4 sm:p-7 md:p-9 transition-all">
        
        {/* Subtle Decorative Star & Ribbon Pattern Watermark */}
        <div className="absolute inset-x-0 top-0 h-32 pointer-events-none opacity-40 overflow-hidden" aria-hidden="true">
          <svg className="w-full h-full text-amber-300" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="pattern-stars" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 30 10 L 32 18 L 40 18 L 34 22 L 36 30 L 30 25 L 24 30 L 26 22 L 20 18 L 28 18 Z" fill="currentColor" fillOpacity="0.3" transform="scale(0.6)" />
                <circle cx="15" cy="45" r="2.5" fill="currentColor" fillOpacity="0.4" />
                <circle cx="50" cy="40" r="2" fill="currentColor" fillOpacity="0.3" />
                <path d="M 8 15 Q 12 12 16 15 Q 20 18 24 15" stroke="currentColor" strokeWidth="1" fill="none" strokeOpacity="0.35" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern-stars)" />
          </svg>
        </div>

        {/* Main Title: Centered, Bold, Crimson-Red with Gold Stars */}
        <div className="relative z-10 text-center mb-4">
          <div className="inline-flex items-center justify-center gap-2 mb-1.5">
            <Star className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 fill-amber-400 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#ef4056] tracking-tight font-sans">
              برترین‌های هفته
            </h1>
            <Star className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 fill-amber-400 animate-pulse" />
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium max-w-lg mx-auto">
            کالاهای منتخب و دارای بالاترین امتیاز رضایت خریداران و کارشناسان در فروشگاه اینترنتی موریکو
          </p>
        </div>

        {/* ================================================================= */}
        {/* 2. Timeframe Tabs: 7 Days (Active Red) & 30 Days with Side Lines  */}
        {/* ================================================================= */}
        <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-6 my-4 sm:my-6 max-w-2xl mx-auto">
          {/* Right Gradient Line (in RTL) */}
          <div className="h-[1.5px] flex-1 bg-gradient-to-r from-rose-400/80 via-amber-300/40 to-transparent rounded-full" />

          {/* Timeframe Buttons */}
          <div className="flex items-center gap-4 sm:gap-7 bg-white/95 px-4 py-1.5 rounded-full border border-gray-100 shadow-2xs">
            {/* This Week (Default Active & Red) */}
            <button
              type="button"
              onClick={() => setTimeframe('thisWeek')}
              className={`text-sm sm:text-base font-bold transition-all relative py-1 px-1 cursor-pointer select-none flex items-center gap-1.5 ${
                timeframe === 'thisWeek'
                  ? 'text-[#ef4056] scale-105'
                  : 'text-gray-600 hover:text-[#ef4056]'
              }`}
            >
              <span>۷ روز گذشته</span>
              {timeframe === 'thisWeek' && (
                <span className="absolute -bottom-1 inset-x-0 h-[2.5px] bg-[#ef4056] rounded-full shadow-xs" />
              )}
            </button>

            <span className="text-gray-300 font-light select-none">|</span>

            {/* Last 30 Days */}
            <button
              type="button"
              onClick={() => setTimeframe('lastWeek')}
              className={`text-sm sm:text-base font-bold transition-all relative py-1 px-1 cursor-pointer select-none flex items-center gap-1.5 ${
                timeframe === 'lastWeek'
                  ? 'text-[#ef4056] scale-105'
                  : 'text-gray-600 hover:text-[#ef4056]'
              }`}
            >
              <span>۳۰ روز گذشته</span>
              {timeframe === 'lastWeek' && (
                <span className="absolute -bottom-1 inset-x-0 h-[2.5px] bg-[#ef4056] rounded-full shadow-xs" />
              )}
            </button>
          </div>

          {/* Left Gradient Line (in RTL) */}
          <div className="h-[1.5px] flex-1 bg-gradient-to-l from-rose-400/80 via-amber-300/40 to-transparent rounded-full" />
        </div>

        {/* ================================================================= */}
        {/* 3. Category Filter Chips Row (Active chip with red border)       */}
        {/* ================================================================= */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-5xl mx-auto my-4 sm:my-6">
          {dynamicChips.map((chip) => {
            const isActive = selectedChip === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedChip(chip.id)}
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition-all duration-150 cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? 'border-[1.5px] border-[#ef4056] text-[#ef4056] font-bold bg-white shadow-xs'
                    : 'border border-gray-200/90 text-gray-700 bg-white hover:border-gray-300 hover:text-gray-900 font-medium'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* ================================================================= */}
        {/* 4. Products Showcase: Horizontal Row or Multi-Column Grid         */}
        {/* ================================================================= */}
        <div className="relative z-10 mt-6 sm:mt-8 group/carousel">
          
          {layoutMode === 'horizontal' ? (
            <>
              {/* Navigation Arrows for desktop carousel */}
              <button
                type="button"
                onClick={() => scroll('right')}
                className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-700 hover:text-[#ef4056] hover:border-rose-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                aria-label="محصولات قبلی"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => scroll('left')}
                className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-700 hover:text-[#ef4056] hover:border-rose-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                aria-label="محصولات بعدی"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Horizontal Scrollable Cards Container */}
              <div
                ref={scrollContainerRef}
                className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth no-scrollbar"
                style={{ scrollSnapType: 'x mandatory' }}
              >
                {sortedItems.map((item, index) => renderProductCard(item, index))}
              </div>
            </>
          ) : (
            /* Grid View Mode */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 pt-1">
              {sortedItems.map((item, index) => renderProductCard(item, index))}
            </div>
          )}

        </div>

        {/* Footer Info / Metrics */}
        <div className="relative z-10 text-center mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium">
          <span>
            نمایش {toPersianDigits(sortedItems.length)} محصول برگزیده در بازه {timeframe === 'thisWeek' ? '۷ روز گذشته' : '۳۰ روز گذشته'}
          </span>
          <span className="text-amber-600 font-semibold flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <span>محصولات دارای گواهینامه رضایت بالای ۹۵٪ خریداران موریکو</span>
          </span>
        </div>

      </div>

    </div>
  );

  function renderProductCard(item: TopWeeklyItem, index: number) {
    const currentRank = timeframe === 'thisWeek' ? item.rankThisWeek : item.rankLastWeek;
    const hasDiscount = !!item.discountPrice && item.discountPrice < item.price;
    const discountPercent = hasDiscount
      ? Math.round(((item.price - (item.discountPrice || 0)) / item.price) * 100)
      : 0;
    const isAdded = addedItemIds.has(item.id);

    return (
      <div
        key={item.id}
        onClick={() => handleCardClick(item)}
        style={{ scrollSnapAlign: 'start' }}
        className="bg-white rounded-2xl border border-gray-100/90 hover:border-amber-200 shadow-xs hover:shadow-lg p-3.5 sm:p-4 flex flex-col justify-between relative min-w-[210px] sm:min-w-[245px] md:min-w-[255px] flex-shrink-0 group cursor-pointer transition-all duration-200 hover:-translate-y-1 select-none"
      >
        
        {/* Top Bar: Red Special Offer / Award Label on Right & Blue Rank Badge on Left */}
        <div className="flex items-center justify-between w-full mb-2">
          
          {/* Red Label: «پیشنهاد شگفت‌انگیز» or «منتخب برتر هفته» */}
          <div className="inline-flex items-center gap-1 text-[#ef4056] text-[11px] sm:text-xs font-bold bg-rose-50/90 px-2 py-0.5 rounded-md border border-rose-100">
            <Sparkles className="w-3 h-3 text-[#ef4056]" />
            <span>پیشنهاد شگفت‌انگیز</span>
          </div>

          {/* Blue Ranking Badge (۱، ۲، ۳، ...) */}
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#008eb2] text-white flex items-center justify-center font-black text-sm sm:text-base shadow-xs shrink-0 font-sans">
            {toPersianDigits(currentRank || index + 1)}
          </div>
        </div>

        {/* Product Image */}
        <div className="relative w-full h-40 sm:h-44 md:h-48 flex items-center justify-center bg-gray-50/50 rounded-xl my-2 p-3 overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-300"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/brand/morico-logo.jpg';
            }}
          />

          {/* Quick View Hover Indicator */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-white/90 backdrop-blur-xs text-gray-800 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-gray-600" />
              <span>مشاهده کالا</span>
            </span>
          </div>
        </div>

        {/* Product Title in Persian */}
        <div className="mt-2 flex-1 flex flex-col justify-start">
          <h3 className="text-xs sm:text-[13px] md:text-sm font-semibold text-gray-800 leading-relaxed line-clamp-2 text-right group-hover:text-[#ef4056] transition-colors" title={item.name}>
            {item.name}
          </h3>
          {item.awardTitle && (
            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mt-1.5 self-start font-medium inline-flex items-center gap-1">
              <Award className="w-2.5 h-2.5 text-amber-600" />
              <span>{item.awardTitle}</span>
            </span>
          )}
        </div>

        {/* Price & Discount Section */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-col gap-1.5">
          
          {/* Discount & Original Price */}
          {hasDiscount && (
            <div className="flex items-center justify-between text-xs">
              <span className="bg-[#ef4056] text-white text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Percent className="w-2.5 h-2.5" />
                <span>{toPersianDigits(discountPercent)}٪</span>
              </span>
              <span className="line-through text-gray-400 text-[11px] sm:text-xs">
                {formatPrice(item.price)}
              </span>
            </div>
          )}

          {/* Final Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1 text-[#ef4056] font-bold text-sm sm:text-base">
              <span>{formatPrice(item.discountPrice ?? item.price)}</span>
            </div>

            {/* Quick Add To Cart Button */}
            <button
              type="button"
              onClick={(e) => handleQuickAdd(e, item)}
              className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                isAdded
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-rose-50 text-[#ef4056] hover:bg-[#ef4056] hover:text-white'
              }`}
              title="افزودن سریع به سبد"
              aria-label="افزودن به سبد خرید"
            >
              {isAdded ? (
                <Check className="w-4 h-4" />
              ) : (
                <ShoppingBag className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Rating & Satisfaction Metric Info */}
          <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ThumbsUp className="w-3 h-3" />
              <span>{toPersianDigits(item.satisfactionPercent)}٪ رضایت</span>
            </span>
            <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{toPersianDigits(item.rating)}</span>
            </span>
          </div>

        </div>

      </div>
    );
  }
};
