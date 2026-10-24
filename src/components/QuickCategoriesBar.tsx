import React, { useRef } from 'react';
import {
  ShoppingCart,
  Coins,
  Shirt,
  Laptop,
  Percent,
  CreditCard,
  Sparkles,
  Flame,
  Gift,
  Tag,
  Heart,
  Palette,
  Apple,
  Watch,
  Headphones,
  Gem,
  Store,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Book,
  Cpu,
  ShoppingBag
} from 'lucide-react';
import { CategoryQuickIcon, Category } from '../lib/types';

interface QuickCategoriesBarProps {
  items?: CategoryQuickIcon[];
  categories?: Category[];
  onSelectCategory?: (categoryId: string) => void;
  onNavigate?: (sectionId: string) => void;
  onOpenCustomizer?: () => void;
}

export const DEFAULT_QUICK_CATEGORIES: CategoryQuickIcon[] = [
  {
    id: 'qc-custom',
    title: 'طراحی آنلاین',
    badge: 'اختصاصی',
    icon: 'Palette',
    bgColor: '#DB2777',
    badgeBgColor: '#9D174D',
    linkType: 'action',
    linkTarget: 'customizer',
    active: true,
    sortOrder: 1
  }
];

// Helper to render icon by name
export const renderCategoryIcon = (
  iconName: string,
  customText?: string,
  className = 'w-6 h-6 text-white'
) => {
  if (customText && (iconName === 'Text' || !iconName)) {
    return <span className="font-black text-sm sm:text-base tracking-tighter text-white">{customText}</span>;
  }

  switch (iconName?.toLowerCase()) {
    case 'smartphone':
    case 'mobile':
    case 'phone':
      return <Smartphone className={className} />;
    case 'laptop':
    case 'computer':
      return <Laptop className={className} />;
    case 'headphones':
    case 'audio':
      return <Headphones className={className} />;
    case 'shirt':
    case 'clothes':
    case 'apparel':
      return <Shirt className={className} />;
    case 'home':
    case 'decor':
      return <Store className={className} />;
    case 'cpu':
    case 'appliances':
    case 'appliance':
      return <Cpu className={className} />;
    case 'sparkles':
    case 'sparkle':
    case 'beauty':
      return <Sparkles className={className} />;
    case 'palette':
    case 'customizer':
    case 'custom':
      return <Palette className={className} />;
    case 'book':
    case 'stationery':
      return <Book className={className} />;
    case 'gift':
    case 'local':
      return <Gift className={className} />;
    case 'shoppingbag':
    case 'bag':
      return <ShoppingBag className={className} />;
    case 'shoppingcart':
    case 'cart':
      return <ShoppingCart className={className} />;
    case 'coins':
    case 'coin':
    case 'gold':
      return <Coins className={className} />;
    case 'percent':
    case 'discount':
      return <Percent className={className} />;
    case 'creditcard':
    case 'card':
    case 'wallet':
      return <CreditCard className={className} />;
    case 'chevronup':
    case 'arrowup':
      return <span className="text-white font-black text-xl sm:text-2xl leading-none">▲</span>;
    case 'flame':
    case 'fire':
      return <Flame className={className} />;
    case 'tag':
      return <Tag className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'gem':
      return <Gem className={className} />;
    case 'watch':
      return <Watch className={className} />;
    case 'apple':
      return <Apple className={className} />;
    default:
      if (customText) {
        return <span className="font-bold text-sm text-white">{customText}</span>;
      }
      return <ShoppingBag className={className} />;
  }
};

export const QuickCategoriesBar: React.FC<QuickCategoriesBarProps> = ({
  items,
  onSelectCategory,
  onNavigate,
  onOpenCustomizer
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use provided active items or fall back to defaults, filtering out any "بیشتر" / more item
  const rawList = items && items.length > 0 ? items : DEFAULT_QUICK_CATEGORIES;
  const activeItems = rawList
    .filter(
      (i) =>
        i.active !== false &&
        i.linkType !== 'more' &&
        i.linkTarget !== 'more' &&
        i.title !== 'بیشتر'
    )
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  if (activeItems.length === 0) {
    return null;
  }

  const handleItemClick = (item: CategoryQuickIcon) => {
    if (item.linkTarget === 'customizer') {
      if (onOpenCustomizer) onOpenCustomizer();
      else if (onNavigate) onNavigate('customizer');
      return;
    }

    if (
      item.linkTarget === 'bestsellers' ||
      item.linkTarget === 'top_weekly' ||
      item.linkTarget === 'catalog' ||
      item.linkTarget === 'track' ||
      item.linkTarget === 'story'
    ) {
      if (onNavigate) onNavigate(item.linkTarget);
      return;
    }

    if (item.linkType === 'category' || item.linkTarget.startsWith('cat-')) {
      if (onSelectCategory) {
        onSelectCategory(item.linkTarget);
      } else if (onNavigate) {
        onNavigate('catalog');
      }
      return;
    }

    if (onNavigate) {
      onNavigate(item.linkTarget || 'catalog');
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  if (activeItems.length === 0) return null;

  return (
    <section className="w-full bg-white border-b border-gray-100 py-4 sm:py-6 relative z-10 select-none">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 relative group">
        {/* Desktop scroll arrows */}
        <button
          type="button"
          onClick={scrollRight}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 hidden lg:flex opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="اسکرول به راست"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={scrollLeft}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 hidden lg:flex opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="اسکرول به چپ"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Horizontal Category Strip */}
        <div
          ref={scrollContainerRef}
          className="flex items-start justify-start md:justify-between gap-3 sm:gap-6 overflow-x-auto no-scrollbar scrollbar-none flex-nowrap snap-x py-1 px-1 scroll-smooth"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {activeItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item)}
              className="group/item flex flex-col items-center justify-start gap-2 shrink-0 flex-shrink-0 w-[72px] sm:w-[88px] md:w-[96px] text-center snap-center cursor-pointer transition-transform duration-200 hover:-translate-y-1 focus:outline-hidden"
            >
              {/* Round Colored Circle */}
              <div className="relative">
                <div
                  className="w-13 h-13 sm:w-15 sm:h-15 rounded-full flex items-center justify-center shadow-xs group-hover/item:shadow-md transition-all duration-200"
                  style={{
                    backgroundColor: item.bgColor || '#111110',
                    color: item.textColor || '#FFFFFF'
                  }}
                >
                  {renderCategoryIcon(
                    item.icon,
                    item.customText,
                    'w-6.5 h-6.5 sm:w-7 sm:h-7 text-white'
                  )}
                </div>

                {/* Optional Mini-Badge */}
                {item.badge && (
                  <span
                    className="absolute -bottom-1 inset-x-0 mx-auto w-max max-w-[70px] truncate px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white shadow-xs border border-white leading-none text-center"
                    style={{
                      backgroundColor: item.badgeBgColor || '#DC2626'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Short Persian Label Underneath */}
              <span className="text-[11px] sm:text-[12px] md:text-[13px] font-bold text-gray-800 group-hover/item:text-red-600 transition-colors leading-[1.3] text-center line-clamp-2 px-1">
                {item.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
