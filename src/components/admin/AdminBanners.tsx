import React, { useState } from 'react';
import { BannerAd, SiteContent, HeroSlideItem, HeroSlideProduct, Product, Category } from '../../lib/types';
import { formatPersianNumber } from '../../lib/currency';
import { DEFAULT_HERO_SLIDES } from '../HeroSlider';
import { ImageUploader } from './ImageUploader';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Eye,
  ExternalLink,
  ArrowRight,
  Layers,
  Sparkles,
  Flame,
  Tag,
  ArrowUp,
  ArrowDown,
  Save,
  CheckCircle2,
  Sliders,
  Image as ImageIcon,
  AlertTriangle,
  Package,
  Check,
  ChevronDown
} from 'lucide-react';

interface AdminBannersProps {
  initialTab?: 'hero_slides' | 'banners';
  banners: BannerAd[];
  products?: Product[];
  categories?: Category[];
  siteContent?: SiteContent;
  onUpdateSiteContent?: (content: SiteContent) => Promise<void>;
  onCreateBanner: (banner: Omit<BannerAd, 'id'>) => Promise<void>;
  onUpdateBanner: (id: string, banner: Partial<BannerAd>) => Promise<void>;
  onDeleteBanner: (id: string) => Promise<void>;
  onSyncPublicStore?: () => void;
  dark?: boolean;
}

const GRADIENT_PRESETS = [
  { name: 'آبی دیجیتال', value: 'from-[#0092E4] via-[#0284C7] to-[#0369A1]', accent: '#FDE047', glow: 'rgba(56, 189, 248, 0.45)' },
  { name: 'قرمز مد و پوشاک', value: 'from-[#BE123C] via-[#9F1239] to-[#881337]', accent: '#FACC15', glow: 'rgba(244, 63, 94, 0.4)' },
  { name: 'نارنجی دکور و خانه', value: 'from-[#EA580C] via-[#C2410C] to-[#9A3412]', accent: '#FEF08A', glow: 'rgba(249, 115, 22, 0.45)' },
  { name: 'بنفش سفارشی و طراحی', value: 'from-[#4338CA] via-[#3730A3] to-[#312E81]', accent: '#A5B4FC', glow: 'rgba(129, 140, 248, 0.45)' },
  { name: 'سبز زمردی', value: 'from-[#047857] via-[#065F46] to-[#064E3B]', accent: '#6EE7B7', glow: 'rgba(52, 211, 153, 0.45)' },
  { name: 'مشکی زغالی لوکس', value: 'from-[#27272A] via-[#18181B] to-[#09090B]', accent: '#E4E4E7', glow: 'rgba(161, 161, 170, 0.35)' },
  { name: 'طلایی و خردلی', value: 'from-[#B45309] via-[#92400E] to-[#78350F]', accent: '#FDE68A', glow: 'rgba(245, 158, 11, 0.45)' }
];

export const AdminBanners: React.FC<AdminBannersProps> = ({
  initialTab = 'hero_slides',
  banners,
  products = [],
  categories = [],
  siteContent,
  onUpdateSiteContent,
  onCreateBanner,
  onUpdateBanner,
  onDeleteBanner,
  onSyncPublicStore
}) => {
  const [activeTab, setActiveTab] = useState<'hero_slides' | 'banners'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // -------------------------------------------------------------
  // HERO SLIDES STATE
  // -------------------------------------------------------------
  const [heroSlides, setHeroSlides] = useState<HeroSlideItem[]>(() => {
    if (siteContent?.heroSlides && siteContent.heroSlides.length > 0) {
      return siteContent.heroSlides;
    }
    return DEFAULT_HERO_SLIDES;
  });

  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlideItem | null>(null);
  const [slideToDelete, setSlideToDelete] = useState<HeroSlideItem | null>(null);
  const [isSavingSlides, setIsSavingSlides] = useState(false);
  const [slidesSaveSuccess, setSlidesSaveSuccess] = useState(false);

  // Hero Slide Form States
  const [slideTitle, setSlideTitle] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideDescription, setSlideDescription] = useState('');
  const [slidePosterUrl, setSlidePosterUrl] = useState('');
  const [slideBadge, setSlideBadge] = useState('');
  const [slideBadgeIcon, setSlideBadgeIcon] = useState<'flame' | 'sparkles' | 'tag'>('flame');
  const [slideCtaText, setSlideCtaText] = useState('');
  const [slideTargetCategory, setSlideTargetCategory] = useState('');
  const [slideBgColor, setSlideBgColor] = useState(GRADIENT_PRESETS[0].value);
  const [slideAccentColor, setSlideAccentColor] = useState(GRADIENT_PRESETS[0].accent);
  const [slideGlowColor, setSlideGlowColor] = useState(GRADIENT_PRESETS[0].glow);

  // Products on stage form states
  const [centerProdName, setCenterProdName] = useState('');
  const [centerProdImg, setCenterProdImg] = useState('');
  const [centerProdBadge, setCenterProdBadge] = useState('');

  const [leftProdName, setLeftProdName] = useState('');
  const [leftProdImg, setLeftProdImg] = useState('');
  const [leftProdBadge, setLeftProdBadge] = useState('');

  const [rightProdName, setRightProdName] = useState('');
  const [rightProdImg, setRightProdImg] = useState('');
  const [rightProdBadge, setRightProdBadge] = useState('');

  // Active Menu Tab for 3D Stage Products Configuration ('center' | 'left' | 'right')
  const [stageMenuTab, setStageMenuTab] = useState<'center' | 'left' | 'right'>('center');

  const handleSelectProductFromCatalog = (pos: 'center' | 'left' | 'right', prodId: string) => {
    if (!prodId) return;
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const imgUrl = prod.images && prod.images.length > 0 ? prod.images[0] : '';
    if (pos === 'center') {
      setCenterProdName(prod.name);
      setCenterProdImg(imgUrl);
      if (!centerProdBadge) {
        setCenterProdBadge(prod.discountPrice ? 'پیشنهاد ویژه' : 'منتخب فروشگاه');
      }
    } else if (pos === 'left') {
      setLeftProdName(prod.name);
      setLeftProdImg(imgUrl);
    } else if (pos === 'right') {
      setRightProdName(prod.name);
      setRightProdImg(imgUrl);
    }
  };

  // -------------------------------------------------------------
  // MIDDLE & PROMO BANNERS STATE
  // -------------------------------------------------------------
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerAd | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<BannerAd | null>(null);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#111110');
  const [imageUrl, setImageUrl] = useState('/brand/morico-logo.jpg');
  const [placement, setPlacement] = useState<'hero' | 'top_bar' | 'middle_banner' | 'footer_popup'>('middle_banner');
  const [sortOrder, setSortOrder] = useState('1');
  const [active, setActive] = useState(true);

  // -------------------------------------------------------------
  // HERO SLIDES HANDLERS
  // -------------------------------------------------------------
  const openCreateSlideModal = () => {
    setEditingSlide(null);
    setSlideTitle('پیشنهاد شگفت‌انگیز جدید');
    setSlideSubtitle('');
    setSlideDescription('معرفی برترین محصولات روز با ضمانت اصالت کالا');
    setSlidePosterUrl('');
    setSlideBadge('');
    setSlideCtaText('');
    setSlideTargetCategory(categories[0]?.id || 'digital');
    setSlideBgColor(GRADIENT_PRESETS[0].value);
    setSlideAccentColor(GRADIENT_PRESETS[0].accent);
    setSlideGlowColor(GRADIENT_PRESETS[0].glow);

    setCenterProdName('محصول وسط (اصلی)');
    setCenterProdImg('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80');
    setCenterProdBadge('');

    setLeftProdName('محصول سمت چپ');
    setLeftProdImg('https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=450&auto=format&fit=crop&q=80');
    setLeftProdBadge('');

    setRightProdName('محصول سمت راست');
    setRightProdImg('https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&auto=format&fit=crop&q=80');
    setRightProdBadge('');

    setIsSlideModalOpen(true);
  };

  const openEditSlideModal = (slide: HeroSlideItem) => {
    setEditingSlide(slide);
    setSlideTitle(slide.title);
    setSlideSubtitle(slide.subtitle || '');
    setSlideDescription(slide.description || '');
    setSlidePosterUrl(slide.posterUrl || '');
    setSlideBadge('');
    setSlideCtaText('');
    setSlideTargetCategory(slide.targetCategory || '');
    setSlideBgColor(slide.bgColor);
    setSlideAccentColor(slide.accentColor || '#FDE047');
    setSlideGlowColor(slide.glowColor || 'rgba(56, 189, 248, 0.45)');

    setCenterProdName(slide.products?.center?.name || '');
    setCenterProdImg(slide.products?.center?.image || '');
    setCenterProdBadge('');

    setLeftProdName(slide.products?.left?.name || '');
    setLeftProdImg(slide.products?.left?.image || '');
    setLeftProdBadge('');

    setRightProdName(slide.products?.right?.name || '');
    setRightProdImg(slide.products?.right?.image || '');
    setRightProdBadge('');

    setIsSlideModalOpen(true);
  };

  const handleSlideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideTitle.trim()) return;

    const newSlideData: HeroSlideItem = {
      id: editingSlide ? editingSlide.id : `slide-${Date.now()}`,
      title: slideTitle.trim(),
      subtitle: slideSubtitle.trim(),
      description: slideDescription.trim(),
      posterUrl: slidePosterUrl.trim() || undefined,
      targetCategory: slideTargetCategory.trim() || undefined,
      targetAction: 'catalog',
      bgColor: slideBgColor,
      accentColor: slideAccentColor,
      podiumColor: 'linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 50%, #94A3B8 100%)',
      podiumHighlight: 'rgba(255, 255, 255, 0.85)',
      glowColor: slideGlowColor,
      active: editingSlide ? editingSlide.active !== false : true,
      products: {
        center: {
          name: centerProdName.trim() || 'محصول اصلی',
          image: centerProdImg.trim() || '/brand/morico-logo.jpg'
        },
        left: {
          name: leftProdName.trim() || 'محصول دوم',
          image: leftProdImg.trim() || '/brand/morico-logo.jpg'
        },
        right: {
          name: rightProdName.trim() || 'محصول سوم',
          image: rightProdImg.trim() || '/brand/morico-logo.jpg'
        }
      }
    };

    if (editingSlide) {
      setHeroSlides((prev) => prev.map((s) => (s.id === editingSlide.id ? newSlideData : s)));
    } else {
      setHeroSlides((prev) => [...prev, newSlideData]);
    }

    setIsSlideModalOpen(false);
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= heroSlides.length) return;

    const updated = [...heroSlides];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setHeroSlides(updated);
  };

  const handleToggleSlideActive = (id: string) => {
    setHeroSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: s.active === false ? true : false } : s))
    );
  };

  const confirmDeleteSlide = () => {
    if (!slideToDelete) return;
    setHeroSlides((prev) => prev.filter((s) => s.id !== slideToDelete.id));
    setSlideToDelete(null);
  };

  const handleSaveHeroSlides = async () => {
    if (!onUpdateSiteContent) return;
    setIsSavingSlides(true);
    setSlidesSaveSuccess(false);
    try {
      await onUpdateSiteContent({
        ...(siteContent || {}),
        heroSlides
      } as SiteContent);
      setSlidesSaveSuccess(true);
      setTimeout(() => setSlidesSaveSuccess(false), 3500);
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره اسلایدر هیرو');
    } finally {
      setIsSavingSlides(false);
    }
  };

  // -------------------------------------------------------------
  // BANNER HANDLERS
  // -------------------------------------------------------------
  const openCreateModal = () => {
    setEditingBanner(null);
    setTitle('کالکشن جدید پاییز و زمستان ۲۰۲۶');
    setSubtitle('الیاف ناب پنبه ۳۲۰ گرم با فرم جعبه‌ای آرام و مینیمال');
    setBadge('NEW ATELIER DROP');
    setLinkText('مشاهده کالکشن');
    setLinkUrl('catalog');
    setBackgroundColor('#111110');
    setImageUrl('/brand/morico-logo.jpg');
    setPlacement('middle_banner');
    setSortOrder('1');
    setActive(true);
    setIsBannerModalOpen(true);
  };

  const openEditModal = (banner: BannerAd) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setSubtitle(banner.subtitle);
    setBadge(banner.badge);
    setLinkText(banner.linkText);
    setLinkUrl(banner.linkUrl);
    setBackgroundColor(banner.backgroundColor);
    setImageUrl(banner.imageUrl);
    setPlacement(banner.placement);
    setSortOrder(String(banner.sortOrder));
    setActive(banner.active);
    setIsBannerModalOpen(true);
  };

  const handleSubmitBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: Omit<BannerAd, 'id'> = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      badge: badge.trim(),
      linkText: linkText.trim(),
      linkUrl: linkUrl.trim(),
      backgroundColor,
      imageUrl,
      placement,
      sortOrder: Number(sortOrder) || 1,
      active
    };

    if (editingBanner) {
      await onUpdateBanner(editingBanner.id, payload);
    } else {
      await onCreateBanner(payload);
    }
    setIsBannerModalOpen(false);
  };

  const confirmDeleteBanner = async () => {
    if (!bannerToDelete) return;
    try {
      await onDeleteBanner(bannerToDelete.id);
      setBannerToDelete(null);
    } catch (err: any) {
      alert(err.message || 'خطا در حذف بنر');
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Header & Subtabs */}
      <div className="p-6 rounded-2xl bg-white border border-[#BFDDF0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111110] flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>مدیریت بنرها، اسلایدرها و استیج معرفی</span>
          </h2>
          <span className="text-xs text-[#4A5560] mt-1 block">
            تنظیم اسلایدر ۳ بعدی اصلی صفحه نخست، تصاویر، محصولات روی استیج و بنرهای تبلیغاتی
          </span>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('hero_slides')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'hero_slides'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            اسلایدر اصلی هیرو ({heroSlides.length} اسلاید)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('banners')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'banners'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            بنرهای میانی و کمپین‌ها ({banners.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HERO SLIDER MANAGEMENT                                            */}
      {/* ========================================================================= */}
      {activeTab === 'hero_slides' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              اسلایدهای استیج ۳ بعدی صفحه نخست که هر ۵ ثانیه ورق می‌خورند و روی دسکتاپ و موبایل نمایش داده می‌شوند.
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={openCreateSlideModal}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن اسلاید جدید به هیرو</span>
              </button>

              <button
                type="button"
                onClick={handleSaveHeroSlides}
                disabled={isSavingSlides}
                className="px-5 py-2 rounded-xl bg-[#111110] hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSavingSlides ? (
                  <span>در حال ذخیره...</span>
                ) : slidesSaveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>ذخیره شد!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>ذخیره تغییرات اسلایدر</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* List of Hero Slides */}
          <div className="grid grid-cols-1 gap-5">
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={`p-5 rounded-2xl border bg-white shadow-sm transition-all ${
                  slide.active === false ? 'opacity-60 border-dashed border-gray-300' : 'border-[#BFDDF0]'
                }`}
              >
                {/* Visual Banner Bar Preview */}
                <div
                  className={`rounded-xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden bg-gradient-to-l ${slide.bgColor} shadow-md`}
                >
                  <div className="space-y-2 z-10 max-w-lg">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold">
                      {slide.badgeIcon === 'flame' ? (
                        <Flame className="w-3.5 h-3.5 text-yellow-300" />
                      ) : slide.badgeIcon === 'sparkles' ? (
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      ) : (
                        <Tag className="w-3.5 h-3.5 text-yellow-300" />
                      )}
                      <span>{slide.badge}</span>
                    </div>
                    <h3 className="text-xl font-black leading-tight drop-shadow-sm">{slide.title}</h3>
                    <p className="text-xs text-white/90 leading-relaxed line-clamp-2">{slide.description}</p>
                    <div className="pt-1">
                      <span className="inline-block px-3.5 py-1 rounded-full bg-white text-gray-900 text-xs font-bold shadow-xs">
                        دکمه: {slide.ctaText}
                      </span>
                    </div>
                  </div>

                  {/* 3 Products Preview on Podium */}
                  <div className="flex items-center justify-center gap-2 z-10 shrink-0">
                    {/* Left Prod */}
                    {slide.products.left?.image && (
                      <div className="w-16 h-16 rounded-xl bg-white/10 p-1 border border-white/20 backdrop-blur-xs flex flex-col items-center justify-center text-center">
                        <img
                          src={slide.products.left.image}
                          alt={slide.products.left.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    {/* Center Prod */}
                    {slide.products.center?.image && (
                      <div className="w-22 h-22 rounded-2xl bg-white/20 p-1.5 border border-white/40 shadow-lg flex flex-col items-center justify-center text-center -translate-y-1">
                        <img
                          src={slide.products.center.image}
                          alt={slide.products.center.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    {/* Right Prod */}
                    {slide.products.right?.image && (
                      <div className="w-16 h-16 rounded-xl bg-white/10 p-1 border border-white/20 backdrop-blur-xs flex flex-col items-center justify-center text-center">
                        <img
                          src={slide.products.right.image}
                          alt={slide.products.right.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between text-xs pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[#4A5560] font-mono">اسلاید شماره {formatPersianNumber(index + 1)}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        slide.active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {slide.active !== false ? 'فعال در چرخه' : 'غیرفعال'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Move Up/Down */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 disabled:opacity-30 cursor-pointer"
                        title="انتقال به بالا"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(index, 'down')}
                        disabled={index === heroSlides.length - 1}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 disabled:opacity-30 cursor-pointer"
                        title="انتقال به پایین"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Active Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleSlideActive(slide.id)}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold cursor-pointer"
                    >
                      {slide.active !== false ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => openEditSlideModal(slide)}
                      className="p-1.5 rounded-lg border border-[#BFDDF0] bg-white text-[#111110] hover:bg-gray-50 cursor-pointer"
                      title="ویرایش اسلاید"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setSlideToDelete(slide)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                      title="حذف اسلاید"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PROMO & MIDDLE BANNERS MANAGEMENT                                  */}
      {/* ========================================================================= */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              بنرهای تبلیغاتی افقی میانی و تخفیفی که بین بخش‌های صفحه قرار می‌گیرند.
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-[#111110] text-[#FFFFFF] text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ایجاد بنر جدید</span>
            </button>
          </div>

          {banners.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-[#BFDDF0] bg-white/50 text-xs text-[#4A5560]">
              هیچ بنری در سیستم ثبت نشده است. با دکمه بالا یک بنر جدید بسازید.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {banners.map((b) => (
                <div key={b.id} className="p-5 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-4">
                  {/* Live Banner Box */}
                  <div
                    style={{ backgroundColor: b.backgroundColor }}
                    className="rounded-xl p-5 text-white flex items-center justify-between gap-4 relative overflow-hidden min-h-[140px]"
                  >
                    <div className="space-y-1 z-10 text-right max-w-xs">
                      {b.badge && (
                        <span className="font-serif text-[10px] tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded-full inline-block">
                          {b.badge}
                        </span>
                      )}
                      <h4 className="text-base font-bold leading-tight">{b.title}</h4>
                      <p className="text-xs opacity-80 line-clamp-2">{b.subtitle}</p>
                      {b.linkText && (
                        <div className="pt-2">
                          <span className="text-xs font-semibold underline underline-offset-4 flex items-center gap-1">
                            <span>{b.linkText}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      )}
                    </div>

                    {b.imageUrl && (
                      <img
                        src={b.imageUrl}
                        alt={b.title}
                        className="w-24 h-24 object-cover rounded-xl shrink-0 border border-white/20 shadow-md"
                      />
                    )}
                  </div>

                  {/* Banner Metadata & Actions */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#4A5560]">
                        موقعیت:{' '}
                        {b.placement === 'hero'
                          ? 'اسلایدر هیرو'
                          : b.placement === 'middle_banner'
                          ? 'بنر میانی'
                          : b.placement}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.active ? 'bg-[#2F6B4F]/10 text-[#2F6B4F]' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {b.active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(b)}
                        className="p-1.5 rounded-lg text-[#4A5560] hover:bg-[#D3ECFA]/60 cursor-pointer"
                        title="ویرایش"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setBannerToDelete(b)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                        title="حذف بنر"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* IN-APP CONFIRMATION MODAL: DELETE BANNER (Fixes iframe confirm bug)       */}
      {/* ========================================================================= */}
      {bannerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-red-100 text-right space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">تایید حذف بنر</h3>
                <p className="text-xs text-gray-500 mt-0.5">این عملیات بلافاصله انجام شده و غیرقابل بازگشت است.</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-700">
              آیا از حذف بنر <span className="font-bold text-gray-900">«{bannerToDelete.title}»</span> اطمینان دارید؟
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBannerToDelete(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={confirmDeleteBanner}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                تایید و حذف بنر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* IN-APP CONFIRMATION MODAL: DELETE HERO SLIDE                              */}
      {/* ========================================================================= */}
      {slideToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-red-100 text-right space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">حذف اسلاید از هیرو</h3>
                <p className="text-xs text-gray-500 mt-0.5">این اسلاید از چرخه استیج صفحه اول حذف خواهد شد.</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-700">
              آیا از حذف اسلاید <span className="font-bold text-gray-900">«{slideToDelete.title}»</span> اطمینان دارید؟
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSlideToDelete(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={confirmDeleteSlide}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                تایید و حذف اسلاید
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: HERO SLIDE EDIT / CREATE                                           */}
      {/* ========================================================================= */}
      {isSlideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#BFDDF0] rounded-2xl p-6 sm:p-8 max-w-3xl w-full text-right shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {editingSlide ? 'ویرایش اسلاید هیرو' : 'ایجاد اسلاید جدید برای هیرو'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  تنظیم متون، محصولات روی استیج و رنگ گرادیان پس‌زمینه
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSlideModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Gradient Preview Box */}
            <div className={`p-5 rounded-2xl bg-gradient-to-l ${slideBgColor} text-white shadow-md space-y-2`}>
              <span className="text-[10px] font-bold uppercase bg-white/20 px-2 py-0.5 rounded-full">
                {slideBadge || 'نشان اسلاید'}
              </span>
              <h4 className="text-lg font-black leading-tight drop-shadow-sm">{slideTitle || 'عنوان اسلاید'}</h4>
              <p className="text-xs opacity-90 line-clamp-2">{slideDescription || 'توضیحات معرفی اسلاید...'}</p>
            </div>

            <form onSubmit={handleSlideSubmit} className="space-y-5 text-xs">
              {/* Row 1: Title & Target Category (No sale badge, no buy button text) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    عنوان بزرگ اسلاید: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={slideTitle}
                    onChange={(e) => setSlideTitle(e.target.value)}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-white border-gray-300 focus:border-indigo-600 focus:outline-hidden text-[#111110]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">دسته‌بندی یا لینک مقصد:</label>
                  {categories && categories.length > 0 ? (
                    <select
                      value={slideTargetCategory}
                      onChange={(e) => setSlideTargetCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 border rounded-xl bg-white border-gray-300 text-xs text-[#111110]"
                    >
                      <option value="">-- انتخاب از دسته‌بندی‌های سایت --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug || c.id}>
                          {c.parentId ? `↳ ${c.title}` : `📁 ${c.title}`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={slideTargetCategory}
                      onChange={(e) => setSlideTargetCategory(e.target.value)}
                      placeholder=""
                      className="w-full px-3.5 py-2.5 border rounded-xl bg-white border-gray-300 text-[#111110]"
                    />
                  )}
                </div>
              </div>

              {/* Row 2: Description */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  متن توضیحات اسلاید:
                </label>
                <textarea
                  rows={2}
                  value={slideDescription}
                  onChange={(e) => setSlideDescription(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2 border rounded-xl bg-white border-gray-300 focus:border-indigo-600 focus:outline-hidden leading-relaxed text-[#111110]"
                />
              </div>

              {/* Row 3: Dedicated Hero Poster Upload Section */}
              <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                    <label className="font-bold text-gray-900 text-xs">
                      بخش آپلود پوستر هیرو (Hero Poster Banner):
                    </label>
                  </div>
                  {slidePosterUrl && (
                    <button
                      type="button"
                      onClick={() => setSlidePosterUrl('')}
                      className="text-[11px] text-red-500 hover:underline cursor-pointer"
                    >
                      حذف پوستر و بازگشت به استیج سه‌بعدی
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  با آپلود پوستر کامل، بنر گرافیکی بارگذاری‌شده در اندازه تمام‌عرض نمایش داده می‌شود. در صورت خالی بودن، استیج سه‌بعدی محصولات با انیمیشن فعال ۳ ثانیه‌ای اجرا می‌گردد.
                </p>
                <ImageUploader
                  label="بارگذاری فایل پوستر هیرو از سیستم:"
                  value={slidePosterUrl}
                  onChange={(url) => setSlidePosterUrl(url)}
                  onRemove={() => setSlidePosterUrl('')}
                />
              </div>

              {/* Row 4: Gradient Color Presets */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="block font-bold text-gray-700">رنگ گرادیان پس‌زمینه اسلاید:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GRADIENT_PRESETS.map((gp) => (
                    <button
                      key={gp.name}
                      type="button"
                      onClick={() => {
                        setSlideBgColor(gp.value);
                        setSlideAccentColor(gp.accent);
                        setSlideGlowColor(gp.glow);
                      }}
                      className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        slideBgColor === gp.value
                          ? 'border-indigo-600 ring-2 ring-indigo-100 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg bg-gradient-to-l ${gp.value} shrink-0`} />
                      <span className="text-[11px] font-semibold text-gray-800 truncate">{gp.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 5: 3D Stage Products Configuration - Interactive Menu with Direct System Upload */}
              <div className="p-3.5 sm:p-4 rounded-2xl border border-indigo-200 bg-white shadow-xs space-y-3">
                {/* Main Position Menu Tabs */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 bg-gray-100/80 rounded-xl">
                  {/* Position 1: Center */}
                  <button
                    type="button"
                    onClick={() => setStageMenuTab('center')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      stageMenuTab === 'center'
                        ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    <span className="truncate">۱. محصول وسط (اصلی)</span>
                    {centerProdImg && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </button>

                  {/* Position 2: Left */}
                  <button
                    type="button"
                    onClick={() => setStageMenuTab('left')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      stageMenuTab === 'left'
                        ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="truncate">۲. محصول سمت چپ</span>
                    {leftProdImg && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </button>

                  {/* Position 3: Right */}
                  <button
                    type="button"
                    onClick={() => setStageMenuTab('right')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      stageMenuTab === 'right'
                        ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                    <span className="truncate">۳. محصول سمت راست</span>
                    {rightProdImg && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </button>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>
                    انیمیشن فعال هیرو: محصولات سه جایگاه (وسط/اصلی، چپ و راست) در اسلایدر هر ۳ ثانیه یک‌بار با یکدیگر جابه‌جا و متحرک می‌شوند.
                  </span>
                </div>

                {/* Position 1 Panel (Center Product) */}
                {stageMenuTab === 'center' && (
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/40 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-1">
                      <span className="font-bold text-gray-800 text-xs">
                        ۱. محصول وسط استیج (اصلی)
                      </span>
                      {centerProdName && (
                        <button
                          type="button"
                          onClick={() => {
                            setCenterProdName('');
                            setCenterProdImg('');
                            setCenterProdBadge('');
                          }}
                          className="text-[11px] text-red-500 hover:underline cursor-pointer"
                        >
                          پاکسازی این جایگاه
                        </button>
                      )}
                    </div>

                    {/* Store Catalog Select Menu */}
                    {products && products.length > 0 && (
                      <div>
                        <select
                          onChange={(e) => handleSelectProductFromCatalog('center', e.target.value)}
                          defaultValue=""
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs font-medium focus:border-indigo-600 focus:outline-hidden text-[#111110]"
                        >
                          <option value="">انتخاب از منوی کاتالوگ فروشگاه (تکمیل خودکار)</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.brand ? `(${p.brand})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-gray-700 font-semibold mb-1 text-[11px]">نام محصول اصلی:</label>
                      <input
                        type="text"
                        value={centerProdName}
                        onChange={(e) => setCenterProdName(e.target.value)}
                        placeholder=""
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white text-[#111110]"
                      />
                    </div>

                    {/* Image Upload from System */}
                    <div>
                      <ImageUploader
                        label="آپلود تصویر محصول وسط از روی سیستم:"
                        value={centerProdImg}
                        onChange={(url) => setCenterProdImg(url)}
                        onRemove={() => setCenterProdImg('')}
                      />
                    </div>
                  </div>
                )}

                {/* Position 2 Panel (Left Product) */}
                {stageMenuTab === 'left' && (
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/40 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-1">
                      <span className="font-bold text-gray-800 text-xs">
                        ۲. محصول سمت چپ استیج
                      </span>
                      {leftProdName && (
                        <button
                          type="button"
                          onClick={() => {
                            setLeftProdName('');
                            setLeftProdImg('');
                            setLeftProdBadge('');
                          }}
                          className="text-[11px] text-red-500 hover:underline cursor-pointer"
                        >
                          پاکسازی این جایگاه
                        </button>
                      )}
                    </div>

                    {/* Store Catalog Select Menu */}
                    {products && products.length > 0 && (
                      <div>
                        <select
                          onChange={(e) => handleSelectProductFromCatalog('left', e.target.value)}
                          defaultValue=""
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs font-medium focus:border-indigo-600 focus:outline-hidden text-[#111110]"
                        >
                          <option value="">انتخاب از منوی کاتالوگ فروشگاه (تکمیل خودکار)</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.brand ? `(${p.brand})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-gray-700 font-semibold mb-1 text-[11px]">نام محصول سمت چپ:</label>
                      <input
                        type="text"
                        value={leftProdName}
                        onChange={(e) => setLeftProdName(e.target.value)}
                        placeholder=""
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white text-[#111110]"
                      />
                    </div>

                    {/* Image Upload from System */}
                    <div>
                      <ImageUploader
                        label="آپلود تصویر محصول چپ از روی سیستم:"
                        value={leftProdImg}
                        onChange={(url) => setLeftProdImg(url)}
                        onRemove={() => setLeftProdImg('')}
                      />
                    </div>
                  </div>
                )}

                {/* Position 3 Panel (Right Product) */}
                {stageMenuTab === 'right' && (
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/40 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-1">
                      <span className="font-bold text-gray-800 text-xs">
                        ۳. محصول سمت راست استیج
                      </span>
                      {rightProdName && (
                        <button
                          type="button"
                          onClick={() => {
                            setRightProdName('');
                            setRightProdImg('');
                            setRightProdBadge('');
                          }}
                          className="text-[11px] text-red-500 hover:underline cursor-pointer"
                        >
                          پاکسازی این جایگاه
                        </button>
                      )}
                    </div>

                    {/* Store Catalog Select Menu */}
                    {products && products.length > 0 && (
                      <div>
                        <select
                          onChange={(e) => handleSelectProductFromCatalog('right', e.target.value)}
                          defaultValue=""
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs font-medium focus:border-indigo-600 focus:outline-hidden text-[#111110]"
                        >
                          <option value="">انتخاب از منوی کاتالوگ فروشگاه (تکمیل خودکار)</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.brand ? `(${p.brand})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-gray-700 font-semibold mb-1 text-[11px]">نام محصول سمت راست:</label>
                      <input
                        type="text"
                        value={rightProdName}
                        onChange={(e) => setRightProdName(e.target.value)}
                        placeholder=""
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white text-[#111110]"
                      />
                    </div>

                    {/* Image Upload from System */}
                    <div>
                      <ImageUploader
                        label="آپلود تصویر محصول راست از روی سیستم:"
                        value={rightProdImg}
                        onChange={(url) => setRightProdImg(url)}
                        onRemove={() => setRightProdImg('')}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsSlideModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  {editingSlide ? 'ثبت تغییرات اسلاید' : 'افزودن اسلاید به لیست'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PROMO / MIDDLE BANNER CREATE & EDIT                                */}
      {/* ========================================================================= */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#BFDDF0] rounded-2xl p-6 sm:p-8 max-w-2xl w-full text-right shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#BFDDF0]">
              <h3 className="text-base font-bold text-[#111110]">
                {editingBanner ? 'ویرایش بنر تبلیغاتی' : 'ایجاد بنر جدید'}
              </h3>
              <button
                type="button"
                onClick={() => setIsBannerModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* LIVE REAL-TIME PREVIEW OF THE BANNER */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#111110] block">پیش‌نمایش زنده بنر (Live Preview):</span>
              <div
                style={{ backgroundColor }}
                className="rounded-2xl p-6 text-white flex items-center justify-between gap-4 transition-colors min-h-[160px] shadow-md overflow-hidden"
              >
                <div className="space-y-2 text-right max-w-sm">
                  {badge && (
                    <span className="font-serif text-[10px] tracking-wider uppercase bg-white/20 px-2.5 py-0.5 rounded-full inline-block font-semibold">
                      {badge}
                    </span>
                  )}
                  <h3 className="text-lg sm:text-xl font-bold leading-tight">{title || 'عنوان بنر'}</h3>
                  <p className="text-xs opacity-85 leading-relaxed">{subtitle || 'توضیحات معرفی بنر...'}</p>
                  {linkText && (
                    <span className="inline-block text-xs font-bold underline underline-offset-4 pt-1">
                      {linkText} ←
                    </span>
                  )}
                </div>

                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-28 h-28 object-cover rounded-xl border border-white/20 shadow-md shrink-0"
                  />
                )}
              </div>
            </div>

            <form onSubmit={handleSubmitBanner} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">عنوان بنر: *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">نشان بالا (Badge):</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">زیرعنوان / توضیحات کوتاه:</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">متن دکمه / لینک:</label>
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">آدرس لینک مقصد:</label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium mb-1">موقعیت قرارگیری:</label>
                  <select
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="middle_banner">بنر میانی صفحه</option>
                    <option value="hero">اسلایدر هیرو</option>
                    <option value="top_bar">نوار بالای سایت</option>
                    <option value="footer_popup">پاپ‌آپ پایین</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">رنگ پس‌زمینه:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-9 h-9 p-0.5 border rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-xl text-center font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1">ترتیب نمایش:</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-center"
                  />
                </div>
              </div>

              {/* Image Uploader */}
              <div className="pt-2">
                <ImageUploader
                  label="تصویر محصول یا بنر:"
                  value={imageUrl}
                  onChange={(url) => setImageUrl(url)}
                  onRemove={() => setImageUrl('/brand/morico-logo.jpg')}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="active_banner_cb"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded text-[#111110] focus:ring-black"
                />
                <label htmlFor="active_banner_cb" className="text-xs cursor-pointer select-none">
                  بنر فعال باشد و در سایت نمایش داده شود
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#BFDDF0]">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#4A5560] hover:bg-gray-100 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#111110] text-[#FFFFFF] text-xs font-semibold hover:opacity-90 shadow-sm cursor-pointer"
                >
                  {editingBanner ? 'ذخیره تغییرات بنر' : 'ایجاد و ذخیره بنر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
