import React, { useState, useEffect, useRef } from 'react';
import { Category, User, SiteContent } from '../lib/types';
import { formatPersianNumber } from '../lib/currency';
import {
  Menu,
  Search,
  ShoppingBag,
  Bell,
  MapPin,
  ChevronDown,
  ChevronLeft,
  X,
  User as UserIcon,
  LogOut,
  Shield,
  Flame,
  Star,
  Sparkles,
  Store,
  Check,
  ArrowLeft,
  FolderTree
} from 'lucide-react';
import { LocationPickerModal, LocationData } from './LocationPickerModal';
import { MegaMenu, renderCategoryIcon } from './MegaMenu';

interface HeaderProps {
  cartCount: number;
  categories: Category[];
  activeSection: string;
  selectedCategoryId?: string;
  currentUser: User | null;
  isAdmin: boolean;
  siteContent?: SiteContent;
  onOpenCart: () => void;
  onOpenCustomizer: () => void;
  onNavigate: (sectionId: string) => void;
  onSelectCategory?: (categoryId: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onToggleAdmin: () => void;
}

const POPULAR_SUGGESTIONS = [
  'هودی و سویشرت',
  'ساعت هوشمند',
  'لوازم دکوراتیو و منزل',
  'تیشرت و پیراهن',
  'اکسسوری و زیورآلات',
  'کفش و کتانی'
];

const IRAN_PROVINCES_CITIES = [
  { province: 'تهران', city: 'تهران' },
  { province: 'اصفهان', city: 'اصفهان' },
  { province: 'خراسان رضوی', city: 'مشهد' },
  { province: 'فارس', city: 'شیراز' },
  { province: 'آذربایجان شرقی', city: 'تبریز' },
  { province: 'البرز', city: 'کرج' },
  { province: 'خوزستان', city: 'اهواز' },
  { province: 'قم', city: 'قم' },
  { province: 'گیلان', city: 'رشت' },
  { province: 'مازندران', city: 'ساری' },
  { province: 'کرمانشاه', city: 'کرمانشاه' },
  { province: 'یزد', city: 'یزد' }
];

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  categories,
  activeSection,
  selectedCategoryId,
  currentUser,
  isAdmin: _isAdmin,
  siteContent,
  onOpenCart,
  onOpenCustomizer,
  onNavigate,
  onSelectCategory,
  onOpenAuth,
  onLogout,
  onToggleAdmin
}) => {
  // Navigation & dropdown states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesMenuOpen, setIsCategoriesMenuOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<Category | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoriesMenuRef = useRef<HTMLDivElement>(null);

  // Notifications dropdown
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // User profile dropdown
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Address modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    try {
      return localStorage.getItem('morico_selected_city') || 'تهران';
    } catch {
      return 'تهران';
    }
  });
  const [savedPelak, setSavedPelak] = useState<string>(() => {
    try {
      return localStorage.getItem('morico_chk_pelak') || '';
    } catch {
      return '';
    }
  });
  const [customAddressInput, setCustomAddressInput] = useState('');

  // Sample notifications list
  const notifications = [
    {
      id: 1,
      title: 'جشنواره شگفت‌انگیز موریکو',
      desc: 'تخفیف تا ۵۰٪ روی منتخب کالاهای فروشگاه',
      time: 'امروز',
      unread: true
    },
    {
      id: 2,
      title: 'کالکشن جدید محصولات',
      desc: 'محصولات برگزیده به کاتالوگ فروشگاه اضافه شدند',
      time: 'دیروز',
      unread: false
    }
  ];

  // Close popovers on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchFocused(false);
      }
      if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(target)) {
        setIsCategoriesMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Scroll detection for subtle elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent background scroll when mobile menu or address modal is open
  useEffect(() => {
    if (isMobileMenuOpen || isAddressModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, isAddressModalOpen]);

  // Filter root and subcategories
  const activeCategories = (categories || [])
    .filter((c) => c.active !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const rootCategories = activeCategories.filter((c) => !c.parentId);

  const getSubcategories = (parentId: string) =>
    activeCategories.filter((c) => c.parentId === parentId);

  // Set default hovered category when mega menu opens
  useEffect(() => {
    if (isCategoriesMenuOpen && rootCategories.length > 0 && !hoveredCategory) {
      setHoveredCategory(rootCategories[0]);
    }
  }, [isCategoriesMenuOpen, rootCategories, hoveredCategory]);

  // Execute search
  const handlePerformSearch = (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;
    setIsSearchFocused(false);
    onNavigate('catalog');
    // Dispatch search event so ShopCatalog updates immediately
    window.dispatchEvent(new CustomEvent('morico:search', { detail: trimmed }));
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('q', trimmed);
      window.history.replaceState(null, '', url.toString());
    } catch {}
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handlePerformSearch(searchQuery);
  };

  // Quick navigation handlers for secondary bar
  const handleNavigateCatalogWithSort = (sort: 'popular' | 'newest') => {
    onNavigate('catalog');
    window.dispatchEvent(new CustomEvent('morico:sort', { detail: sort }));
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('sort', sort);
      window.history.replaceState(null, '', url.toString());
    } catch {}
  };

  const handleConfirmLocation = (location: LocationData) => {
    const cityName = location.city || 'تهران';
    setSelectedCity(cityName);
    if (location.pelak) {
      setSavedPelak(location.pelak);
    }
    try {
      localStorage.setItem('morico_selected_city', cityName);
      localStorage.setItem('morico_selected_location', JSON.stringify(location));
    } catch {}
    setIsAddressModalOpen(false);
  };

  return (
    <>
      <div className="sticky top-0 z-40 w-full font-sans bg-white">
        {/* ================================================================= */}
        {/* Tier 1: Main Header (Digikala Style)                              */}
        {/* ================================================================= */}
        <header
          className={`w-full bg-white transition-all duration-200 border-b border-gray-100 ${
            isScrolled ? 'shadow-sm' : ''
          }`}
        >
          <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-6">
            
            {/* ------------------------------------------------------------- */}
            {/* Right: Red Brand Logo + Big Rounded Search Box                */}
            {/* ------------------------------------------------------------- */}
            <div className="flex items-center gap-3 sm:gap-6 flex-1 max-w-[850px] min-w-0">
              
              {/* Brand Logo: Dynamic from Admin Branding (siteTitle, siteSubtitle, logoUrl, primaryColor) */}
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="flex items-center gap-1.5 sm:gap-2 group shrink-0 cursor-pointer text-right focus-visible:outline-none"
                aria-label={siteContent?.branding?.siteTitle || 'فروشگاه اینترنتی موریکو'}
              >
                {/* Brand Symbol / Uploaded Logo */}
                {siteContent?.branding?.logoUrl && siteContent.branding.logoUrl !== '/brand/morico-logo.jpg' ? (
                  <img
                    src={siteContent.branding.logoUrl}
                    alt={siteContent.branding.siteTitle || 'لوگوی فروشگاه'}
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl object-contain shadow-xs group-hover:scale-105 transition-transform bg-neutral-50 p-0.5 border border-gray-100"
                  />
                ) : (
                  <div
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: siteContent?.branding?.primaryColor || '#ef394a' }}
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                  </div>
                )}

                {/* Brand Name & Subtitle configured in Admin */}
                <div className="flex flex-col text-right">
                  <span
                    className="font-black text-xl sm:text-2xl sm:text-[26px] tracking-tight leading-none transition-colors"
                    style={{ color: siteContent?.branding?.primaryColor || '#ef394a' }}
                  >
                    {siteContent?.branding?.siteTitle || 'موریکو'}
                  </span>
                  <span className="hidden sm:inline-block text-[10px] text-gray-400 font-medium tracking-normal mt-0.5">
                    {siteContent?.branding?.siteSubtitle || 'MORICO STORE'}
                  </span>
                </div>
              </button>

              {/* Big Rounded Search Box beside Logo */}
              <div
                ref={searchContainerRef}
                className="relative flex-1 max-w-[560px] hidden md:block"
              >
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                  <div
                    className={`flex items-center w-full h-11 lg:h-12 bg-neutral-100 rounded-2xl px-4 transition-all duration-200 border ${
                      isSearchFocused
                        ? 'bg-white border-[#ef394a] shadow-sm ring-2 ring-[#ef394a]/15'
                        : 'border-transparent hover:bg-neutral-200/70'
                    }`}
                  >
                    <Search className="w-5 h-5 text-neutral-400 shrink-0 ml-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      placeholder=""
                      className="w-full bg-transparent text-sm text-[#111110] focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 cursor-pointer"
                        aria-label="پاک کردن متن جستجو"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </form>

                {/* Search Suggestions Dropdown */}
                {isSearchFocused && (
                  <div className="absolute top-full mt-1.5 right-0 left-0 bg-white rounded-2xl border border-gray-200 shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-right">
                    <div className="text-xs font-semibold text-gray-500 mb-2.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        <span>بیشترین جستجوهای موریکو</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SUGGESTIONS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setSearchQuery(tag);
                            handlePerformSearch(tag);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs text-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Search className="w-3 h-3 text-neutral-400" />
                          <span>{tag}</span>
                        </button>
                      ))}
                    </div>

                    {/* Quick Category access in search */}
                    {rootCategories.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="text-[11px] text-gray-400 font-medium mb-2">دسته‌بندی‌های محبوب</div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {rootCategories.slice(0, 6).map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setIsSearchFocused(false);
                                if (onSelectCategory) onSelectCategory(cat.id);
                                else onNavigate('catalog');
                              }}
                              className="text-right px-2 py-1.5 rounded-lg text-xs text-gray-700 hover:bg-gray-50 hover:text-[#ef394a] transition-colors truncate cursor-pointer"
                            >
                              · {cat.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* ------------------------------------------------------------- */}
            {/* Left: Cart, User Auth, Search, Menu Toggle                   */}
            {/* ------------------------------------------------------------- */}
            <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
              
              {/* Notification Bell Icon (Desktop & Tablet) */}
              <div className="relative hidden sm:block" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationsOpen(!isNotificationsOpen);
                    setHasUnreadNotification(false);
                  }}
                  className="relative p-2 sm:p-2.5 rounded-xl text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors flex items-center justify-center cursor-pointer min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px]"
                  title="اعلان‌ها"
                  aria-label="اعلان‌ها"
                >
                  <Bell className="w-5 h-5" />
                  {hasUnreadNotification && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ef394a] ring-2 ring-white" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotificationsOpen && (
                  <div className="absolute top-full mt-2 left-0 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl p-4 z-50 animate-in fade-in duration-150 text-right">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
                      <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-[#ef394a]" />
                        <span>اعلان‌های موریکو</span>
                      </span>
                      <span className="text-[10px] text-gray-400">۳ پیام</span>
                    </div>
                    <div className="space-y-2.5 max-h-72 overflow-y-auto">
                      {notifications.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-gray-100"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold text-gray-800">
                            <span>{item.title}</span>
                            <span className="text-[10px] text-gray-400 font-normal">{item.time}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Search Button */}
              <button
                type="button"
                onClick={() => {
                  onNavigate('catalog');
                  setTimeout(() => {
                    const input = document.querySelector('input[type="search"], input[placeholder*="جستجو"]') as HTMLInputElement;
                    if (input) input.focus();
                  }, 200);
                }}
                className="p-2 md:hidden rounded-xl text-neutral-700 hover:bg-neutral-100 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                aria-label="جستجو"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* User Authentication: Button «ورود | ثبت‌نام» */}
              {currentUser ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-neutral-50 text-neutral-800 text-xs sm:text-sm font-semibold transition-all min-h-[40px] min-w-[40px] sm:min-h-[44px] cursor-pointer"
                    aria-label="حساب کاربری"
                  >
                    <div className="w-6 h-6 rounded-full bg-neutral-100 text-[#ef394a] flex items-center justify-center font-bold text-xs shrink-0">
                      {currentUser.name ? currentUser.name[0] : <UserIcon className="w-3.5 h-3.5" />}
                    </div>
                    <span className="hidden sm:inline-block max-w-[110px] truncate">
                      {currentUser.name || 'حساب کاربری'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:inline-block shrink-0" />
                  </button>

                  {/* Logged in User Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute top-full mt-2 left-0 w-52 bg-white rounded-2xl border border-gray-200 shadow-xl p-2 z-50 text-right animate-in fade-in duration-150">
                      <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
                        <div className="text-xs font-bold text-gray-900 truncate">{currentUser.name}</div>
                        <div className="text-[11px] text-gray-400 truncate">{currentUser.email || currentUser.phone}</div>
                      </div>

                      {currentUser.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onToggleAdmin();
                          }}
                          className="w-full text-right px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-neutral-100 flex items-center gap-2 cursor-pointer"
                        >
                          <Shield className="w-4 h-4 text-orange-600 shrink-0" />
                          <span>ورود به پنل ادمین</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('track');
                        }}
                        className="w-full text-right px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-neutral-100 flex items-center gap-2 cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4 text-gray-500 shrink-0" />
                        <span>سفارش‌های من</span>
                      </button>

                      <div className="border-t border-gray-100 my-1 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full text-right px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <span>خروج از حساب</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-gray-300 hover:border-gray-400 hover:bg-neutral-50 text-neutral-800 text-xs sm:text-sm font-semibold transition-all min-h-[40px] min-w-[40px] sm:min-h-[44px] cursor-pointer"
                  aria-label="ورود | ثبت‌نام"
                >
                  <UserIcon className="w-4 h-4 text-neutral-600 shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">ورود | ثبت‌نام</span>
                </button>
              )}

              {/* Divider in desktop */}
              <div className="w-[1px] h-6 bg-gray-200 hidden sm:block" />

              {/* Cart Icon with Counter Badge */}
              <button
                type="button"
                onClick={onOpenCart}
                className="relative p-2 sm:p-2.5 rounded-xl text-neutral-800 hover:bg-neutral-100 transition-colors flex items-center justify-center cursor-pointer min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px]"
                aria-label={`سبد خرید با ${cartCount} کالا`}
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-[#ef394a] text-white text-[10px] sm:text-[11px] font-bold font-persian-nums px-1.5 py-0.2 rounded-full min-w-[18px] sm:min-w-[20px] text-center shadow-xs">
                    {formatPersianNumber(cartCount)}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 md:hidden rounded-xl text-neutral-700 hover:bg-neutral-100 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                aria-label={isMobileMenuOpen ? 'بستن منو' : 'باز کردن منو'}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>

            </div>

          </div>
        </header>

        {/* ================================================================= */}
        {/* Tier 2: Secondary Horizontal Menu Bar (White Background)          */}
        {/* ================================================================= */}
        <div className="w-full bg-white border-b border-gray-200/80 relative" ref={categoriesMenuRef}>
          <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 h-11 sm:h-12 flex items-center justify-between gap-2 sm:gap-4 overflow-hidden">
            
            {/* ------------------------------------------------------------- */}
            {/* Right to Left Menu Items in a horizontal scrollable row       */}
            {/* ------------------------------------------------------------- */}
            <div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2 lg:gap-4 overflow-x-auto no-scrollbar scrollbar-none flex-nowrap py-1 scroll-smooth">
              
              {/* 1. دسته‌بندی کالاها (با آیکون همبرگر منو) */}
              <button
                type="button"
                onClick={() => setIsCategoriesMenuOpen(!isCategoriesMenuOpen)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer shrink-0 flex-shrink-0 whitespace-nowrap min-h-[34px] sm:min-h-[38px] ${
                  isCategoriesMenuOpen
                    ? 'text-[#ef394a] bg-rose-50'
                    : 'text-gray-900 hover:text-[#ef394a] hover:bg-gray-50'
                }`}
                aria-expanded={isCategoriesMenuOpen}
              >
                <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700 shrink-0" />
                <span>دسته‌بندی کالاها</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                    isCategoriesMenuOpen ? 'rotate-180 text-[#ef394a]' : 'text-gray-400'
                  }`}
                />
              </button>

              {/* 2. فروشگاه */}
              <button
                type="button"
                onClick={() => onNavigate('catalog')}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0 flex-shrink-0 whitespace-nowrap min-h-[34px] sm:min-h-[38px] ${
                  activeSection === 'catalog' && (!selectedCategoryId || selectedCategoryId === 'all')
                    ? 'text-gray-950 font-bold'
                    : 'text-gray-700 hover:text-gray-950 hover:bg-gray-50'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span>فروشگاه</span>
              </button>

              {/* 3. پر فروش ترین ها */}
              <button
                type="button"
                onClick={() => onNavigate('bestsellers')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0 flex-shrink-0 whitespace-nowrap min-h-[34px] sm:min-h-[38px] ${
                  activeSection === 'bestsellers'
                    ? 'text-[#ef4056] bg-rose-50 font-bold'
                    : 'text-gray-700 hover:text-[#ef4056] hover:bg-rose-50/60'
                }`}
              >
                <Flame className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-[#ef4056] ${activeSection === 'bestsellers' ? 'animate-bounce' : 'animate-pulse'}`} />
                <span className={activeSection === 'bestsellers' ? 'text-[#ef4056]' : ''}>پرفروش‌ترین‌ها</span>
              </button>

              {/* 4. برترین های هفته */}
              <button
                type="button"
                onClick={() => onNavigate('top_weekly')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0 flex-shrink-0 whitespace-nowrap min-h-[34px] sm:min-h-[38px] ${
                  activeSection === 'top_weekly'
                    ? 'text-amber-600 bg-amber-50 font-bold'
                    : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50/60'
                }`}
              >
                <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-amber-500 ${activeSection === 'top_weekly' ? 'fill-amber-400 animate-spin-slow' : 'fill-amber-400'}`} />
                <span className={activeSection === 'top_weekly' ? 'text-amber-600' : ''}>برترین‌های هفته</span>
              </button>

              {/* 5. موریکو استایل */}
              <button
                type="button"
                onClick={onOpenCustomizer}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-950 hover:bg-gray-50 transition-colors cursor-pointer shrink-0 flex-shrink-0 whitespace-nowrap min-h-[34px] sm:min-h-[38px]"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#ef394a]" />
                <span>موریکو استایل</span>
              </button>

              {/* 6. در موریکو بخرید ! */}
              <button
                type="button"
                onClick={() => onNavigate('story')}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0 flex-shrink-0 whitespace-nowrap min-h-[34px] sm:min-h-[38px]"
              >
                در موریکو بخرید !
              </button>

            </div>

            {/* ------------------------------------------------------------- */}
            {/* Left of Secondary Bar: Orange Button «انتخاب آدرس» with MapPin */}
            {/* ------------------------------------------------------------- */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(true)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 transition-colors cursor-pointer whitespace-nowrap min-h-[32px] sm:min-h-[36px] shrink-0"
                aria-label="انتخاب آدرس تحویل کالا"
              >
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0" />
                <span className="max-w-[72px] sm:max-w-none truncate">
                  {selectedCity
                    ? `ارسال به ${selectedCity}${savedPelak ? ` (${savedPelak})` : ''}`
                    : 'انتخاب آدرس'}
                </span>
              </button>
            </div>

          </div>

          {/* Digikala-Style Multi-Column Mega-Menu placed OUTSIDE overflow-x-auto container */}
          <MegaMenu
            isOpen={isCategoriesMenuOpen}
            onClose={() => setIsCategoriesMenuOpen(false)}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={(catId) => {
              setIsCategoriesMenuOpen(false);
              if (onSelectCategory) {
                onSelectCategory(catId);
              } else {
                onNavigate('catalog');
              }
            }}
            onNavigateToCatalog={() => onNavigate('catalog')}
          />
        </div>

      </div>

      {/* =================================================================== */}
      {/* Location Picker Modal (نقشه استایل نشان، پین آبی، جستجو و تایید)      */}
      {/* =================================================================== */}
      <LocationPickerModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onConfirm={handleConfirmLocation}
        initialCity={selectedCity}
      />

      {/* =================================================================== */}
      {/* Mobile Menu Drawer (Side Drawer)                                   */}
      {/* =================================================================== */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-start">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="relative w-[85vw] max-w-[320px] h-full bg-white shadow-2xl z-10 flex flex-col p-4 overflow-y-auto text-right">
            
            {/* Mobile Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#ef394a] flex items-center justify-center text-white font-bold text-xs">
                  M
                </div>
                <span className="text-[#ef394a] font-black text-xl tracking-tight">موریکو</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
                aria-label="بستن منو"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Address Banner */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAddressModalOpen(true);
              }}
              className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-700 font-semibold cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span>ارسال به {selectedCity}</span>
              </div>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Nav Links */}
            <nav className="py-3 space-y-1 text-right">
              <button
                type="button"
                onClick={() => {
                  onNavigate('catalog');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-right p-2.5 rounded-xl text-xs font-bold text-gray-800 hover:bg-neutral-50 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-gray-600" />
                  <span>فروشگاه محصولات</span>
                </span>
                <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('bestsellers');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-right p-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                  activeSection === 'bestsellers'
                    ? 'text-[#ef4056] bg-rose-50'
                    : 'text-[#ef4056] bg-rose-50/50 hover:bg-rose-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#ef4056] animate-pulse" />
                  <span>پرفروش‌ترین‌ها</span>
                </span>
                <ChevronLeft className="w-3.5 h-3.5 text-[#ef4056]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('top_weekly');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-right p-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                  activeSection === 'top_weekly'
                    ? 'text-amber-600 bg-amber-50'
                    : 'text-amber-700 bg-amber-50/50 hover:bg-amber-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>برترین‌های هفته</span>
                </span>
                <ChevronLeft className="w-3.5 h-3.5 text-amber-600" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenCustomizer();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-right p-2.5 rounded-xl text-xs font-bold text-gray-800 hover:bg-neutral-50 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ef394a]" />
                  <span>موریکو استایل (طراحی آنلاین)</span>
                </span>
                <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('story');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-right p-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-600 flex items-center justify-between"
              >
                <span>در موریکو بخرید !</span>
                <ChevronLeft className="w-3.5 h-3.5 text-gray-300" />
              </button>
            </nav>

            {/* Mobile Categories Accordion */}
            <div className="pt-2 border-t border-gray-100">
              <div className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                <Menu className="w-3.5 h-3.5 text-gray-600" />
                <span>دسته‌بندی‌های کالاها</span>
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto pl-1">
                {rootCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (onSelectCategory) onSelectCategory(cat.id);
                      else onNavigate('catalog');
                    }}
                    className="w-full text-right px-2.5 py-2 rounded-lg text-xs text-gray-700 hover:bg-neutral-50 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-neutral-400 shrink-0">
                        {renderCategoryIcon(cat, 'w-3.5 h-3.5')}
                      </span>
                      <span className="truncate">{cat.title}</span>
                    </div>
                    <ChevronLeft className="w-3 h-3 text-gray-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Auth & Admin Footer */}
            <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
              {currentUser ? (
                <>
                  <div className="text-xs text-gray-600 pb-1">
                    وارد شده با عنوان: <strong>{currentUser.name}</strong>
                  </div>
                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onToggleAdmin();
                      }}
                      className="w-full py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-orange-400" />
                      <span>پنل مدیریت ادمین</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full py-2 rounded-xl border border-rose-200 text-rose-600 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>خروج از حساب</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>ورود | ثبت‌نام</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};
