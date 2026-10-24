import React, { useState } from 'react';
import { SiteContent, FaqItem, NavLinkItem, CategoryQuickIcon } from '../../lib/types';
import { DEFAULT_SITE_CONTENT } from '../../lib/api';
import { DEFAULT_QUICK_CATEGORIES, renderCategoryIcon } from '../QuickCategoriesBar';
import { ImageUploader } from './ImageUploader';
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  FileText,
  Bell,
  Link as LinkIcon,
  Palette,
  Sparkles,
  LayoutList,
  Layers,
  ArrowUp,
  ArrowDown,
  Eye,
  Sliders,
  Phone,
  Grid,
  CircleDot
} from 'lucide-react';

interface AdminSiteContentProps {
  siteContent: SiteContent;
  onUpdateContent: (content: SiteContent) => Promise<void>;
  dark?: boolean;
}

export const AdminSiteContent: React.FC<AdminSiteContentProps> = ({
  siteContent,
  onUpdateContent
}) => {
  const [content, setContent] = useState<SiteContent>({
    ...DEFAULT_SITE_CONTENT,
    ...siteContent,
    branding: {
      ...DEFAULT_SITE_CONTENT.branding,
      ...(siteContent?.branding || {})
    },
    hero: {
      ...DEFAULT_SITE_CONTENT.hero,
      ...(siteContent?.hero || {})
    },
    categoryQuickIcons: siteContent?.categoryQuickIcons && siteContent.categoryQuickIcons.length > 0
      ? siteContent.categoryQuickIcons
      : DEFAULT_QUICK_CATEGORIES,
    sections: {
      ...DEFAULT_SITE_CONTENT.sections,
      showQuickCategories: siteContent?.sections?.showQuickCategories !== false,
      showCatalog: siteContent?.sections?.showCatalog === true,
      ...(siteContent?.sections || {})
    },
    craftsmanship: {
      ...DEFAULT_SITE_CONTENT.craftsmanship,
      ...(siteContent?.craftsmanship || {})
    },
    howItWorks: {
      ...DEFAULT_SITE_CONTENT.howItWorks,
      ...(siteContent?.howItWorks || {})
    },
    footer: {
      ...DEFAULT_SITE_CONTENT.footer,
      ...(siteContent?.footer || {})
    },
    announcementBar: {
      ...DEFAULT_SITE_CONTENT.announcementBar,
      ...(siteContent?.announcementBar || {})
    },
    navLinks: siteContent?.navLinks && siteContent.navLinks.length > 0
      ? siteContent.navLinks
      : DEFAULT_SITE_CONTENT.navLinks || [],
    faq: siteContent?.faq && siteContent.faq.length > 0
      ? siteContent.faq
      : DEFAULT_SITE_CONTENT.faq,
    policyPages: {
      ...DEFAULT_SITE_CONTENT.policyPages,
      ...(siteContent?.policyPages || {})
    }
  });

  const [activeSubTab, setActiveSubTab] = useState<
    | 'branding'
    | 'hero'
    | 'quick_categories'
    | 'sections'
    | 'process'
    | 'craftsmanship'
    | 'announcement'
    | 'navigation'
    | 'faq'
    | 'policies'
  >('branding');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New FAQ inputs
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // New NavLink inputs
  const [newNavLabel, setNewNavLabel] = useState('');
  const [newNavHref, setNewNavHref] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateContent(content);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('آیا از بازنشانی کلیه متون، تنظیمات و رنگ‌های سایت به تنظیمات پیش‌فرض اطمینان دارید؟')) {
      setContent({ ...DEFAULT_SITE_CONTENT });
    }
  };

  const addFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    const newItem: FaqItem = {
      id: `faq-${Date.now()}`,
      q: newFaqQ.trim(),
      a: newFaqA.trim()
    };
    setContent({ ...content, faq: [...content.faq, newItem] });
    setNewFaqQ('');
    setNewFaqA('');
  };

  const addNavLink = () => {
    if (!newNavLabel.trim() || !newNavHref.trim()) return;
    const newLink: NavLinkItem = {
      id: `nav-${Date.now()}`,
      label: newNavLabel.trim(),
      href: newNavHref.trim(),
      active: true,
      sortOrder: (content.navLinks?.length || 0) + 1
    };
    setContent({ ...content, navLinks: [...(content.navLinks || []), newLink] });
    setNewNavLabel('');
    setNewNavHref('');
  };

  // New Quick Category item state
  const [newQcTitle, setNewQcTitle] = useState('');
  const [newQcBadge, setNewQcBadge] = useState('');
  const [newQcIcon, setNewQcIcon] = useState('ShoppingCart');
  const [newQcCustomText, setNewQcCustomText] = useState('');
  const [newQcBgColor, setNewQcBgColor] = useState('#E03E2D');
  const [newQcBadgeBgColor, setNewQcBadgeBgColor] = useState('#DC2626');
  const [newQcLinkType, setNewQcLinkType] = useState<'category' | 'action' | 'page' | 'more'>('category');
  const [newQcLinkTarget, setNewQcLinkTarget] = useState('cat-groceries');

  const addQuickCategory = () => {
    if (!newQcTitle.trim()) return;
    const newItem: CategoryQuickIcon = {
      id: `qc-${Date.now()}`,
      title: newQcTitle.trim(),
      badge: newQcBadge.trim() || undefined,
      icon: newQcIcon,
      customText: newQcCustomText.trim() || undefined,
      bgColor: newQcBgColor,
      badgeBgColor: newQcBadgeBgColor,
      linkType: newQcLinkType,
      linkTarget: newQcLinkTarget.trim() || 'catalog',
      active: true,
      sortOrder: (content.categoryQuickIcons?.length || 0) + 1
    };
    setContent({
      ...content,
      categoryQuickIcons: [...(content.categoryQuickIcons || []), newItem]
    });
    setNewQcTitle('');
    setNewQcBadge('');
    setNewQcCustomText('');
  };

  const removeQuickCategory = (id: string) => {
    setContent({
      ...content,
      categoryQuickIcons: (content.categoryQuickIcons || []).filter((item) => item.id !== id)
    });
  };

  const moveQuickCategory = (index: number, direction: 'up' | 'down') => {
    const list = [...(content.categoryQuickIcons || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    setContent({
      ...content,
      categoryQuickIcons: list.map((item, idx) => ({ ...item, sortOrder: idx + 1 }))
    });
  };

  const resetQuickCategoriesToDefault = () => {
    if (window.confirm('آیا مایلید آیکون‌های گرد دسته‌بندی به حالت پیش‌فرض (مشابه دیجی‌کالا) بازنشانی شوند؟')) {
      setContent({
        ...content,
        categoryQuickIcons: [...DEFAULT_QUICK_CATEGORIES]
      });
    }
  };

  // Move section in order
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const list = [...(content.sections?.sectionOrder || ['hero', 'quick_categories', 'banners', 'process', 'catalog', 'craftsmanship', 'faq'])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    setContent({
      ...content,
      sections: {
        ...content.sections!,
        sectionOrder: list as any
      }
    });
  };

  const SECTION_TITLES: Record<string, string> = {
    hero: 'بنر اسلایدر بزرگ بالای صفحه (Hero Slider)',
    quick_categories: 'ردیف آیکون‌های گرد دسته‌بندی (Quick Categories)',
    banners: 'کمپین‌ها و بنرهای تبلیغاتی (Banners)',
    best_sellers: 'پرفروش‌ترین‌ها شبیه دیجیکالا (Best Sellers)',
    bestsellers: 'ویترین پرفروش‌ترین‌ها (Best Sellers)',
    top_weekly: 'ویترین برترین‌های هفته (Top Weekly)',
    process: 'فرآیند ۳ مرحله‌ای طراحی آنلاین (Process)',
    catalog: 'کاتالوگ و محصولات فروشگاه (Shop Catalog)',
    craftsmanship: 'اصالت پارچه و فلسفه دوخت (Craftsmanship)',
    faq: 'پرسش‌های متداول مشتریان (FAQ)'
  };


  return (
    <div className="space-y-6 text-right">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111110]">
            مدیریت کامل هویت، محتوا و چیدمان سایت
          </h2>
          <span className="text-xs text-[#4A5560]">
            تمام تغییراتی که در این بخش اعمال و ذخیره می‌کنید بلافاصله در صفحات عمومی سایت اعمال می‌شوند.
          </span>
        </div>

        <button
          type="button"
          onClick={handleResetToDefault}
          className="px-3.5 py-2 rounded-xl border border-[#A33A3A] text-xs font-semibold text-[#A33A3A] hover:bg-[#A33A3A]/10 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>بازنشانی به پیش‌فرض (Reset)</span>
        </button>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-[#BFDDF0] rounded-2xl shadow-sm text-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('branding')}
          className={`px-3 py-2 rounded-xl transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'branding' ? 'bg-[#111110] text-white shadow-sm font-bold' : 'text-[#4A5560] hover:bg-gray-50'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>هویت برند و لوگو</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('hero')}
          className={`px-3 py-2 rounded-xl transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'hero' ? 'bg-[#111110] text-white shadow-sm font-bold' : 'text-[#4A5560] hover:bg-gray-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>اسلایدر و هیرو</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('quick_categories')}
          className={`px-3 py-2 rounded-xl transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'quick_categories' ? 'bg-[#111110] text-white shadow-sm font-bold' : 'text-[#4A5560] hover:bg-gray-50'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>آیکون‌های گرد دسته‌بندی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('sections')}
          className={`px-3 py-2 rounded-xl transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'sections' ? 'bg-[#111110] text-white shadow-sm font-bold' : 'text-[#4A5560] hover:bg-gray-50'
          }`}
        >
          <LayoutList className="w-3.5 h-3.5" />
          <span>چیدمان و نمایش سکشن‌ها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('process')}
          className={`px-3 py-2 rounded-xl transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'process' ? 'bg-[#111110] text-white shadow-sm font-bold' : 'text-[#4A5560] hover:bg-gray-50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>مراحل طراحی آنلاین</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('craftsmanship')}
          className={`px-3 py-2 rounded-xl transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'craftsmanship' ? 'bg-[#111110] text-white shadow-sm font-bold' : 'text-[#4A5560] hover:bg-gray-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>اصالت پارچه و فوتر</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('announcement')}
          className={`px-3 py-2 rounded-xl transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'announcement' ? 'bg-[#111110] text-white shadow-sm font-bold' : 'text-[#4A5560] hover:bg-gray-50'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>نوار اعلان</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('navigation')}
          className={`px-3 py-2 rounded-xl transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'navigation' ? 'bg-[#111110] text-white shadow-sm font-bold' : 'text-[#4A5560] hover:bg-gray-50'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>پیوندهای منو</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('faq')}
          className={`px-3 py-2 rounded-xl transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'faq' ? 'bg-[#111110] text-white shadow-sm font-bold' : 'text-[#4A5560] hover:bg-gray-50'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>پرسش‌های متداول</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('policies')}
          className={`px-3 py-2 rounded-xl transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'policies' ? 'bg-[#111110] text-white shadow-sm font-bold' : 'text-[#4A5560] hover:bg-gray-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>صفحات قوانین و راهنما</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* SUBTAB 1: Branding & Visuals */}
        {activeSubTab === 'branding' && (
          <div className="p-6 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-6">
            <div className="border-b border-[#BFDDF0]/60 pb-3">
              <h3 className="text-base font-bold text-[#111110]">
                هویت برند، لوگو و پالت رنگی آتلیه
              </h3>
              <p className="text-xs text-[#4A5560] mt-1">
                تغییر عنوان، زیرعنوان، لوگو و رنگ‌های اصلی بلافاصله در هدر، فوتر و تم بصری سایت منعکس می‌شود.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-1.5 text-neutral-800">
                    عنوان برند در هدر سایت (Header Brand Title):
                  </label>
                  <input
                    type="text"
                    value={content.branding?.siteTitle || ''}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        branding: { ...content.branding!, siteTitle: e.target.value }
                      })
                    }
                    placeholder="موریکو"
                    className="w-full px-3.5 py-2.5 border rounded-xl font-bold text-sm bg-neutral-50/50 focus:bg-white focus:outline-none focus:border-[#ef394a]"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    نام فارسی یا برند که با فونت درشت در هدر سایت نمایش داده می‌شود (مانند «موریکو»).
                  </span>
                </div>

                <div>
                  <label className="block font-bold mb-1.5 text-neutral-800">
                    زیرعنوان یا عبارت انگلیسی در هدر (Header Subtitle):
                  </label>
                  <input
                    type="text"
                    value={content.branding?.siteSubtitle || ''}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        branding: { ...content.branding!, siteSubtitle: e.target.value }
                      })
                    }
                    placeholder="MORICO STORE"
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-neutral-50/50 focus:bg-white focus:outline-none focus:border-[#ef394a]"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    عبارت انگلیسی یا شعار برند که زیر نام اصلی هدر قرار می‌گیرد (مانند «MORICO STORE»).
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block font-bold mb-1.5 text-neutral-800">رنگ برند و لوگو (Primary):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={content.branding?.primaryColor || '#ef394a'}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            branding: { ...content.branding!, primaryColor: e.target.value }
                          })
                        }
                        className="w-10 h-10 rounded-lg cursor-pointer border p-0.5"
                      />
                      <input
                        type="text"
                        value={content.branding?.primaryColor || '#ef394a'}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            branding: { ...content.branding!, primaryColor: e.target.value }
                          })
                        }
                        className="flex-1 px-2.5 py-1.5 border rounded-lg dir-ltr font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-neutral-800">رنگ ثانویه (Accent):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={content.branding?.accentColor || '#FFFFFF'}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            branding: { ...content.branding!, accentColor: e.target.value }
                          })
                        }
                        className="w-10 h-10 rounded-lg cursor-pointer border p-0.5"
                      />
                      <input
                        type="text"
                        value={content.branding?.accentColor || '#FFFFFF'}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            branding: { ...content.branding!, accentColor: e.target.value }
                          })
                        }
                        className="flex-1 px-2.5 py-1.5 border rounded-lg dir-ltr font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <ImageUploader
                  label="تصویر اختصاصی لوگوی هدر (اختیاری - PNG یا SVG شفاف):"
                  value={content.branding?.logoUrl || '/brand/morico-logo.jpg'}
                  onChange={(url) =>
                    setContent({
                      ...content,
                      branding: { ...content.branding!, logoUrl: url }
                    })
                  }
                  onRemove={() =>
                    setContent({
                      ...content,
                      branding: { ...content.branding!, logoUrl: '/brand/morico-logo.jpg' }
                    })
                  }
                />

                {/* Live Preview Box of Header Button */}
                <div className="p-4 rounded-xl border border-gray-200 bg-neutral-50/80 space-y-2">
                  <div className="text-[11px] font-bold text-gray-700 flex items-center justify-between">
                    <span>پیش‌نمایش زنده دکمه لوگو در هدر سایت:</span>
                    <span className="text-[10px] text-[#ef394a] bg-rose-50 px-2 py-0.5 rounded-full font-bold">
                      Header Preview
                    </span>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center justify-start shadow-xs">
                    <div className="flex items-center gap-2 text-right">
                      {content.branding?.logoUrl && content.branding.logoUrl !== '/brand/morico-logo.jpg' ? (
                        <img
                          src={content.branding.logoUrl}
                          alt="لوگو"
                          className="w-9 h-9 rounded-xl object-contain bg-neutral-50 p-0.5 border border-gray-100"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                          style={{ backgroundColor: content.branding?.primaryColor || '#ef394a' }}
                        >
                          <svg
                            className="w-5 h-5 text-white"
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
                      <div className="flex flex-col text-right">
                        <span
                          className="font-black text-2xl tracking-tight leading-none"
                          style={{ color: content.branding?.primaryColor || '#ef394a' }}
                        >
                          {content.branding?.siteTitle || 'موریکو'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium tracking-normal mt-0.5">
                          {content.branding?.siteSubtitle || 'MORICO STORE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: Hero Section */}
        {activeSubTab === 'hero' && (
          <div className="p-6 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-6">
            <div className="border-b border-[#BFDDF0]/60 pb-3">
              <h3 className="text-base font-bold text-[#111110]">
                بخش معرفی و هیروی صفحه نخست (Hero Section)
              </h3>
              <p className="text-xs text-[#4A5560] mt-1">
                تیتر بزرگ، نشان بالا، توضیحات، دکمه‌های اقدام (CTA) و تصویر شاخص هیرو.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-1.5">نشان انگلیسی بالا (Hero Badge):</label>
                  <input
                    type="text"
                    value={content.hero?.badge || ''}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero!, badge: e.target.value }
                      })
                    }
                    placeholder="ATELIER 2026 · QUIET LUXURY"
                    className="w-full px-3.5 py-2.5 border rounded-xl font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1.5">عنوان بزرگ اصلی (Main Title):</label>
                  <textarea
                    rows={2}
                    value={content.hero?.title || ''}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero!, title: e.target.value }
                      })
                    }
                    placeholder="سکوت لوکس، خلوص پنبه ارگانیک و طراحی شخصی شما."
                    className="w-full px-3.5 py-2.5 border rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1.5">متن توضیحات هیرو (Description):</label>
                  <textarea
                    rows={3}
                    value={content.hero?.description || ''}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero!, description: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 border rounded-xl leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1.5">متن دکمه اصلی (Primary CTA):</label>
                    <input
                      type="text"
                      value={content.hero?.ctaPrimary || ''}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: { ...content.hero!, ctaPrimary: e.target.value }
                        })
                      }
                      placeholder="ورود به استودیو طراحی آنلاین"
                      className="w-full px-3.5 py-2 border rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5">متن دکمه دوم (Secondary CTA):</label>
                    <input
                      type="text"
                      value={content.hero?.ctaSecondary || ''}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: { ...content.hero!, ctaSecondary: e.target.value }
                        })
                      }
                      placeholder="مشاهده کلکسیون پوشاک"
                      className="w-full px-3.5 py-2 border rounded-xl"
                    />
                  </div>
                </div>

                {/* Showcase Card Section (کارت ویترین و تصویر شاخص) */}
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      تنظیمات کارت ویترین شاخص (Showcase Card):
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold text-indigo-900">
                      <input
                        type="checkbox"
                        checked={content.hero?.showShowcaseCard !== false}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            hero: { ...content.hero!, showShowcaseCard: e.target.checked }
                          })
                        }
                        className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span>نمایش کادر تصویر ویترین</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-indigo-100">
                    <span className="text-[11px] text-[#4A5560]">کارت برچسب شناور روی تصویر:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-indigo-900">
                      <input
                        type="checkbox"
                        checked={content.hero?.showFloatingTag !== false}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            hero: { ...content.hero!, showFloatingTag: e.target.checked }
                          })
                        }
                        className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>نمایش برچسب شناور</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-bold mb-1">تیتر برچسب شناور روی تصویر:</label>
                      <input
                        type="text"
                        value={content.hero?.floatingTagTitle || ''}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            hero: { ...content.hero!, floatingTagTitle: e.target.value }
                          })
                        }
                        placeholder="تنوع گسترده محصولات و دسته‌بندی‌ها"
                        className="w-full px-3 py-2 border rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">متن دکمه برچسب شناور:</label>
                      <input
                        type="text"
                        value={content.hero?.floatingTagCtaText || ''}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            hero: { ...content.hero!, floatingTagCtaText: e.target.value }
                          })
                        }
                        placeholder="مشاهده"
                        className="w-full px-3 py-2 border rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">زیرعنوان برچسب شناور:</label>
                    <input
                      type="text"
                      value={content.hero?.floatingTagSubtitle || ''}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: { ...content.hero!, floatingTagSubtitle: e.target.value }
                        })
                      }
                      placeholder="کالای دیجیتال، دکوراسیون، پوشاک و محصولات سفارشی"
                      className="w-full px-3 py-2 border rounded-xl bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <ImageUploader
                  label="تصویر بزرگ و شاخص ویترین هیرو:"
                  value={content.hero?.imageUrl || '/brand/morico-logo.jpg'}
                  onChange={(url) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero!, imageUrl: url }
                    })
                  }
                  onRemove={() =>
                    setContent({
                      ...content,
                      hero: { ...content.hero!, imageUrl: '/brand/morico-logo.jpg' }
                    })
                  }
                />

                <div className="p-4 rounded-xl border border-[#BFDDF0] bg-gray-50/50 space-y-3">
                  <span className="font-bold block">۳ ویژگی بارز پایین هیرو:</span>
                  {[0, 1, 2].map((fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2">
                      <span className="font-mono text-[11px] w-6">{fIdx + 1}.</span>
                      <input
                        type="text"
                        value={content.hero?.features?.[fIdx]?.title || ''}
                        onChange={(e) => {
                          const feats = [...(content.hero?.features || [{ title: '' }, { title: '' }, { title: '' }])];
                          feats[fIdx] = { ...feats[fIdx], title: e.target.value };
                          setContent({
                            ...content,
                            hero: { ...content.hero!, features: feats }
                          });
                        }}
                        placeholder={`ویژگی ${fIdx + 1}`}
                        className="flex-1 px-3 py-1.5 border rounded-lg bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB: Quick Categories (ردیف دسته‌بندی با آیکون‌های گرد) */}
        {activeSubTab === 'quick_categories' && (
          <div className="p-6 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#BFDDF0]/60 pb-4">
              <div>
                <h3 className="text-base font-bold text-[#111110] flex items-center gap-2">
                  <Grid className="w-5 h-5 text-red-600" />
                  <span>مدیریت ردیف دسته‌بندی افقی با آیکون‌های رنگی گرد</span>
                </h3>
                <p className="text-xs text-[#4A5560] mt-1">
                  ردیف دایره‌های رنگی با آیکون‌های سفید و متن فارسی کوتاه که دقیقاً زیر بنر اصلی سایت نمایش داده می‌شود (طراحی مشابه دیجی‌کالا).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetQuickCategoriesToDefault}
                  className="px-3 py-1.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="بازنشانی به آیتم‌های اولیه"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>بازنشانی به پیش‌فرض (دیجی‌کالا)</span>
                </button>
              </div>
            </div>

            {/* Section Visibility Toggle */}
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs sm:text-sm text-gray-900 block">
                  نمایش ردیف دسته‌بندی‌های گرد در صفحه اصلی
                </span>
                <span className="text-[11px] text-gray-500">
                  در صورت غیرفعال بودن، این ردیف از صفحه اصلی پنهان خواهد شد.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={content.sections?.showQuickCategories !== false}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      sections: {
                        ...content.sections!,
                        showQuickCategories: e.target.checked
                      }
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* Live Visual Preview */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-2">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>پیش‌نمایش زنده در صفحه اصلی (اسکرول افقی):</span>
              </span>

              <div className="bg-white rounded-xl p-3 border border-gray-200 overflow-x-auto scrollbar-none py-4">
                <div className="flex items-start justify-between gap-4 min-w-[700px] px-2">
                  {(content.categoryQuickIcons || DEFAULT_QUICK_CATEGORIES)
                    .filter((item) => item.active !== false)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col items-center gap-1.5 shrink-0 text-center w-18"
                      >
                        <div className="relative">
                          <div
                            className="w-13 h-13 rounded-full flex items-center justify-center shadow-xs"
                            style={{
                              backgroundColor: item.bgColor || '#111110',
                              color: item.textColor || '#FFFFFF'
                            }}
                          >
                            {renderCategoryIcon(
                              item.icon,
                              item.customText,
                              item.linkType === 'more'
                                ? 'w-6 h-6 text-gray-500'
                                : 'w-6 h-6 text-white'
                            )}
                          </div>
                          {item.badge && (
                            <span
                              className="absolute -bottom-1 inset-x-0 mx-auto w-max max-w-[65px] truncate px-1 py-0.2 rounded-full text-[8px] font-bold text-white shadow-xs border border-white"
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

            {/* Add New Item Form */}
            <div className="p-5 rounded-xl border border-gray-200 bg-white space-y-4 shadow-2xs">
              <span className="text-xs sm:text-sm font-bold text-gray-900 block border-b border-gray-100 pb-2">
                افزودن آیتم جدید به ردیف دسته‌بندی‌ها
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {/* Title */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    عنوان فارسی کوتاه <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    value={newQcTitle}
                    onChange={(e) => setNewQcTitle(e.target.value)}
                    placeholder="مثال: سوپرمارکت یا اکسسوری"
                    className="w-full px-3 py-2 border rounded-xl bg-white focus:border-red-500 focus:outline-hidden"
                  />
                </div>

                {/* Badge text */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    برچسب کوچک روی دایره (اختیاری):
                  </label>
                  <input
                    type="text"
                    value={newQcBadge}
                    onChange={(e) => setNewQcBadge(e.target.value)}
                    placeholder="مثال: کالابرگ، جدید، اورجینال"
                    className="w-full px-3 py-2 border rounded-xl bg-white focus:border-red-500 focus:outline-hidden"
                  />
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    آیکون سفید داخل دایره:
                  </label>
                  <select
                    value={newQcIcon}
                    onChange={(e) => setNewQcIcon(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-white focus:border-red-500 focus:outline-hidden"
                  >
                    <option value="ShoppingCart">سبد خرید (سوپرمارکت)</option>
                    <option value="Coins">سکه و طلا (Coins)</option>
                    <option value="Shirt">تیشرت و پوشاک (Shirt)</option>
                    <option value="Laptop">لپ‌تاپ و کالای دیجیتال (Laptop)</option>
                    <option value="Percent">درصد تخفیف و حراج (Percent)</option>
                    <option value="ChevronUp">فلش رو به بالا (اعتبار / وام)</option>
                    <option value="CreditCard">کارت بانکی (CreditCard)</option>
                    <option value="Sparkles">ستاره درخشان (پلاس / ویژه)</option>
                    <option value="Flame">شعله آتش (شگفت‌انگیز)</option>
                    <option value="Gift">جعبه کادو (Gift)</option>
                    <option value="Tag">برچسب قیمت (Tag)</option>
                    <option value="Gem">الماس و نقره (Gem)</option>
                    <option value="Headphones">هدفون صوتی (Headphones)</option>
                    <option value="Watch">ساعت مچی (Watch)</option>
                    <option value="Palette">پالت طراحی آنلاین (Palette)</option>
                    <option value="Text">حروف متنی (Custom Text)</option>
                    <option value="MoreHorizontal">سه‌نقطه بیشتر (More)</option>
                  </select>
                </div>

                {/* Custom text if Text */}
                {newQcIcon === 'Text' && (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      متن یا حروف داخل دایره:
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={newQcCustomText}
                      onChange={(e) => setNewQcCustomText(e.target.value)}
                      placeholder="مثال: DS یا MS"
                      className="w-full px-3 py-2 border rounded-xl bg-white font-mono uppercase"
                    />
                  </div>
                )}

                {/* Circle Color */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    رنگ دایره:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newQcBgColor}
                      onChange={(e) => setNewQcBgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border p-0.5 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={newQcBgColor}
                      onChange={(e) => setNewQcBgColor(e.target.value)}
                      className="w-full px-2 py-2 border rounded-xl bg-white font-mono text-[11px]"
                      placeholder="#E03E2D"
                    />
                  </div>
                </div>

                {/* Color presets */}
                <div className="col-span-full flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-gray-500 font-bold ml-1">پالت‌های سریع:</span>
                  {[
                    { name: 'قرمز نارنجی', hex: '#E03E2D' },
                    { name: 'سبز آبی تیره', hex: '#005953' },
                    { name: 'مشکی', hex: '#111110' },
                    { name: 'طلایی', hex: '#DAA520' },
                    { name: 'قرمز گیلاسی', hex: '#EF394E' },
                    { name: 'آبی کاربنی', hex: '#001AFF' },
                    { name: 'زرشکی', hex: '#6B0F2B' },
                    { name: 'بنفش یاسی', hex: '#8B70CD' },
                    { name: 'ارغوانی پلاس', hex: '#991B6B' },
                    { name: 'سبز زمردی', hex: '#059669' },
                    { name: 'طوسی ملایم', hex: '#F3F4F6' }
                  ].map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setNewQcBgColor(p.hex)}
                      className="w-6 h-6 rounded-full border border-white shadow-2xs hover:scale-110 transition-transform cursor-pointer"
                      style={{ backgroundColor: p.hex }}
                      title={p.name}
                    />
                  ))}
                </div>

                {/* Link Type & Target */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">نوع عملکرد / پیوند:</label>
                  <select
                    value={newQcLinkType}
                    onChange={(e) => setNewQcLinkType(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl bg-white focus:border-red-500 focus:outline-hidden"
                  >
                    <option value="category">فیلتر دسته‌بندی در کاتالوگ</option>
                    <option value="action">صفحه پرفروش‌ترین‌ها یا برترین‌های هفته</option>
                    <option value="page">استودیو طراحی آنلاین</option>
                    <option value="more">پنجره کلیه دسته‌بندی‌ها (بیشتر)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">مقصد پیوند:</label>
                  {newQcLinkType === 'action' ? (
                    <select
                      value={newQcLinkTarget}
                      onChange={(e) => setNewQcLinkTarget(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-white"
                    >
                      <option value="bestsellers">صفحه پرفروش‌ترین‌ها</option>
                      <option value="top_weekly">صفحه برترین‌های هفته</option>
                      <option value="track">رهگیری سفارش</option>
                      <option value="story">درباره ما و اصالت</option>
                    </select>
                  ) : newQcLinkType === 'page' ? (
                    <select
                      value={newQcLinkTarget}
                      onChange={(e) => setNewQcLinkTarget(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-white"
                    >
                      <option value="customizer">استودیو طراحی آنلاین</option>
                      <option value="catalog">کاتالوگ کامل محصولات</option>
                    </select>
                  ) : newQcLinkType === 'more' ? (
                    <input
                      type="text"
                      disabled
                      value="پنجره دسته‌بندی‌ها (بیشتر)"
                      className="w-full px-3 py-2 border rounded-xl bg-gray-100 text-gray-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={newQcLinkTarget}
                      onChange={(e) => setNewQcLinkTarget(e.target.value)}
                      placeholder="شناسه دسته‌بندی (مثال: cat-digital)"
                      className="w-full px-3 py-2 border rounded-xl bg-white font-mono"
                    />
                  )}
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addQuickCategory}
                    disabled={!newQcTitle.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#111110] hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن دسته‌بندی</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Quick Categories List */}
            <div className="space-y-3">
              <span className="text-xs sm:text-sm font-bold text-gray-900 block">
                لیست دسته‌بندی‌های فعلی ({content.categoryQuickIcons?.length || 0} آیتم):
              </span>

              <div className="space-y-2">
                {(content.categoryQuickIcons || DEFAULT_QUICK_CATEGORIES).map((item, index) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-all text-xs"
                  >
                    {/* Circle preview & Title */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shadow-2xs shrink-0"
                          style={{
                            backgroundColor: item.bgColor || '#111110',
                            color: item.textColor || '#FFFFFF'
                          }}
                        >
                          {renderCategoryIcon(
                            item.icon,
                            item.customText,
                            item.linkType === 'more'
                              ? 'w-5 h-5 text-gray-500'
                              : 'w-5 h-5 text-white'
                          )}
                        </div>
                        {item.badge && (
                          <span
                            className="absolute -bottom-1 inset-x-0 mx-auto w-max max-w-[55px] truncate px-1 py-0.2 rounded-full text-[7px] font-bold text-white shadow-2xs border border-white"
                            style={{
                              backgroundColor: item.badgeBgColor || '#DC2626'
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => {
                              const updated = [...(content.categoryQuickIcons || [])];
                              updated[index] = { ...updated[index], title: e.target.value };
                              setContent({ ...content, categoryQuickIcons: updated });
                            }}
                            className="font-bold text-gray-900 px-2 py-0.5 border rounded-lg bg-gray-50 focus:bg-white text-xs w-36"
                          />
                          <input
                            type="text"
                            value={item.badge || ''}
                            onChange={(e) => {
                              const updated = [...(content.categoryQuickIcons || [])];
                              updated[index] = { ...updated[index], badge: e.target.value || undefined };
                              setContent({ ...content, categoryQuickIcons: updated });
                            }}
                            placeholder="برچسب (کالابرگ...)"
                            className="text-[11px] text-gray-600 px-2 py-0.5 border rounded-lg bg-gray-50 focus:bg-white w-28"
                          />
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <span>نوع پیوند: <strong className="text-gray-700">{item.linkType}</strong></span>
                          <span>•</span>
                          <span>مقصد: <strong className="text-gray-700 font-mono">{item.linkTarget}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Color picker & Controls */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <div className="flex items-center gap-1.5 ml-2">
                        <span className="text-[10px] text-gray-500">رنگ:</span>
                        <input
                          type="color"
                          value={item.bgColor}
                          onChange={(e) => {
                            const updated = [...(content.categoryQuickIcons || [])];
                            updated[index] = { ...updated[index], bgColor: e.target.value };
                            setContent({ ...content, categoryQuickIcons: updated });
                          }}
                          className="w-6 h-6 rounded-md border p-0 cursor-pointer"
                        />
                      </div>

                      {/* Active toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(content.categoryQuickIcons || [])];
                          updated[index] = { ...updated[index], active: !item.active };
                          setContent({ ...content, categoryQuickIcons: updated });
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                          item.active !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {item.active !== false ? 'فعال' : 'غیرفعال'}
                      </button>

                      {/* Sort Up / Down */}
                      <button
                        type="button"
                        onClick={() => moveQuickCategory(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 cursor-pointer"
                        title="جابجایی به بالا"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuickCategory(index, 'down')}
                        disabled={index === (content.categoryQuickIcons || []).length - 1}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 cursor-pointer"
                        title="جابجایی به پایین"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeQuickCategory(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                        title="حذف آیتم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: Sections Visibility & Order */}
        {activeSubTab === 'sections' && (
          <div className="p-6 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-6">
            <div className="border-b border-[#BFDDF0]/60 pb-3">
              <h3 className="text-base font-bold text-[#111110]">
                چیدمان، ترتیب و نمایش سکشن‌های صفحه اصلی
              </h3>
              <p className="text-xs text-[#4A5560] mt-1">
                می‌توانید هر بخش از صفحه اصلی را فعال/غیرفعال کرده و اولویت چیدمان آن‌ها را با دکمه‌های بالا و پایین تغییر دهید.
              </p>
            </div>

            {/* Visibility Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <label className="p-3 rounded-xl border border-[#BFDDF0] bg-gray-50/50 flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={content.sections?.showHero !== false}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      sections: { ...content.sections!, showHero: e.target.checked }
                    })
                  }
                  className="rounded"
                />
                <span className="font-bold">بخش اسلایدر و هیرو (Hero)</span>
              </label>

              <label className="p-3 rounded-xl border border-[#BFDDF0] bg-gray-50/50 flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={content.sections?.showQuickCategories !== false}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      sections: { ...content.sections!, showQuickCategories: e.target.checked }
                    })
                  }
                  className="rounded"
                />
                <span className="font-bold text-red-600">ردیف آیکون‌های گرد دسته‌بندی (Quick Categories)</span>
              </label>

              <label className="p-3 rounded-xl border border-[#BFDDF0] bg-gray-50/50 flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={content.sections?.showBanners !== false}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      sections: { ...content.sections!, showBanners: e.target.checked }
                    })
                  }
                  className="rounded"
                />
                <span className="font-bold">بنرها و کمپین‌ها (Banners)</span>
              </label>

              <label className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={content.sections?.showBestSellers === true}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      sections: { ...content.sections!, showBestSellers: e.target.checked }
                    })
                  }
                  className="rounded"
                />
                <span className="font-bold text-[#ef4056]">ویترین پرفروش‌ترین‌ها (Best Sellers)</span>
              </label>

              <label className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={content.sections?.showTopWeekly === true}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      sections: { ...content.sections!, showTopWeekly: e.target.checked }
                    })
                  }
                  className="rounded"
                />
                <span className="font-bold text-amber-700">ویترین برترین‌های هفته (Top Weekly)</span>
              </label>

              <label className="p-3 rounded-xl border border-[#BFDDF0] bg-gray-50/50 flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={content.sections?.showProcess !== false}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      sections: { ...content.sections!, showProcess: e.target.checked }
                    })
                  }
                  className="rounded"
                />
                <span className="font-bold">مراحل طراحی آنلاین (Process)</span>
              </label>

              <label className="p-3 rounded-xl border border-[#BFDDF0] bg-gray-50/50 flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={content.sections?.showCatalog === true}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      sections: { ...content.sections!, showCatalog: e.target.checked }
                    })
                  }
                  className="rounded"
                />
                <span className="font-bold">کاتالوگ پوشاک و محصولات در صفحه اصلی (Catalog)</span>
              </label>

              <label className="p-3 rounded-xl border border-[#BFDDF0] bg-gray-50/50 flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={content.sections?.showCraftsmanship !== false}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      sections: { ...content.sections!, showCraftsmanship: e.target.checked }
                    })
                  }
                  className="rounded"
                />
                <span className="font-bold">اصالت و دوخت (Craftsmanship)</span>
              </label>

              <label className="p-3 rounded-xl border border-[#BFDDF0] bg-gray-50/50 flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={content.sections?.showFaq !== false}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      sections: { ...content.sections!, showFaq: e.target.checked }
                    })
                  }
                  className="rounded"
                />
                <span className="font-bold">پرسش‌های متداول (FAQ)</span>
              </label>
            </div>

            {/* Ordering List */}
            <div className="space-y-2 pt-4">
              <span className="text-xs font-bold text-[#111110] block">ترتیب نمایش سکشن‌ها از بالا به پایین:</span>
              {(content.sections?.sectionOrder || ['hero', 'banners', 'process', 'catalog', 'craftsmanship', 'faq']).map((key, idx, arr) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#BFDDF0] bg-white text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#E4F5FF] text-[#111110] font-mono font-bold flex items-center justify-center text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-[#111110]">
                      {SECTION_TITLES[key] || key}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, 'up')}
                      className="p-1.5 rounded-lg border border-[#BFDDF0] hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="انتقال به بالا"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === arr.length - 1}
                      onClick={() => moveSection(idx, 'down')}
                      className="p-1.5 rounded-lg border border-[#BFDDF0] hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="انتقال به پایین"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 4: Process Steps */}
        {activeSubTab === 'process' && (
          <div className="p-6 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-6">
            <div className="border-b border-[#BFDDF0]/60 pb-3">
              <h3 className="text-base font-bold text-[#111110]">
                مراحل ۳ گانه فرآیند طراحی آنلاین (Process Steps)
              </h3>
              <p className="text-xs text-[#4A5560] mt-1">
                عناوین و توضیحات هر یک از مراحل راهنمای طراحی پوشاک در سایت.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Step 1 */}
              <div className="p-4 rounded-xl border border-[#BFDDF0] bg-gray-50/50 space-y-3">
                <span className="font-bold text-[#111110] block">مرحله اول (انتخاب محصول):</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block mb-1">عنوان مرحله اول:</label>
                    <input
                      type="text"
                      value={content.howItWorks?.step1Title || ''}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          howItWorks: { ...content.howItWorks!, step1Title: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xl bg-white font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block mb-1">توضیحات مرحله اول:</label>
                    <input
                      type="text"
                      value={content.howItWorks?.step1Desc || ''}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          howItWorks: { ...content.howItWorks!, step1Desc: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xl bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl border border-[#BFDDF0] bg-gray-50/50 space-y-3">
                <span className="font-bold text-[#111110] block">مرحله دوم (چیدمان و طرح):</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block mb-1">عنوان مرحله دوم:</label>
                    <input
                      type="text"
                      value={content.howItWorks?.step2Title || ''}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          howItWorks: { ...content.howItWorks!, step2Title: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xl bg-white font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block mb-1">توضیحات مرحله دوم:</label>
                    <input
                      type="text"
                      value={content.howItWorks?.step2Desc || ''}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          howItWorks: { ...content.howItWorks!, step2Desc: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xl bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl border border-[#BFDDF0] bg-gray-50/50 space-y-3">
                <span className="font-bold text-[#111110] block">مرحله سوم (تولید و تحویل):</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block mb-1">عنوان مرحله سوم:</label>
                    <input
                      type="text"
                      value={content.howItWorks?.step3Title || ''}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          howItWorks: { ...content.howItWorks!, step3Title: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xl bg-white font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block mb-1">توضیحات مرحله سوم:</label>
                    <input
                      type="text"
                      value={content.howItWorks?.step3Desc || ''}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          howItWorks: { ...content.howItWorks!, step3Desc: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xl bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 5: Craftsmanship & Footer */}
        {activeSubTab === 'craftsmanship' && (
          <div className="space-y-6">
            
            {/* Craftsmanship */}
            <div className="p-6 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#111110] border-b border-[#BFDDF0]/60 pb-2">
                بخش اصالت پارچه و فلسفه دوخت (Craftsmanship)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium mb-1">نشان انگلیسی بالا (Badge):</label>
                  <input
                    type="text"
                    value={content.craftsmanship.badge}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        craftsmanship: { ...content.craftsmanship, badge: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">عنوان بخش فارسی:</label>
                  <input
                    type="text"
                    value={content.craftsmanship.title}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        craftsmanship: { ...content.craftsmanship, title: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium mb-1">متن توضیحات اصالت و پنبه ارگانیک:</label>
                  <textarea
                    rows={2}
                    value={content.craftsmanship.description}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        craftsmanship: { ...content.craftsmanship, description: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#111110] border-b border-[#BFDDF0]/60 pb-2">
                اطلاعات تماس و پاورقی سایت (Footer)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium mb-1">شماره تماس پشتیبانی:</label>
                  <input
                    type="text"
                    value={content.footer.phone}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        footer: { ...content.footer, phone: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl font-mono dir-ltr"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">پست الکترونیک (Email):</label>
                  <input
                    type="text"
                    value={content.footer.email}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        footer: { ...content.footer, email: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl dir-ltr font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium mb-1">نشانی پستی آتلیه مرکزی:</label>
                  <input
                    type="text"
                    value={content.footer.address}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        footer: { ...content.footer, address: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">ساعات کاری آتلیه:</label>
                  <input
                    type="text"
                    value={content.footer.workingHours || ''}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        footer: { ...content.footer, workingHours: e.target.value }
                      })
                    }
                    placeholder="شنبه تا پنج‌شنبه: ۱۰:۰۰ الی ۱۹:۰۰"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">آیدی اینستاگرام:</label>
                  <input
                    type="text"
                    value={content.footer.instagram}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        footer: { ...content.footer, instagram: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl dir-ltr"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">آیدی یا لینک تلگرام:</label>
                  <input
                    type="text"
                    value={content.footer.telegram}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        footer: { ...content.footer, telegram: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl dir-ltr"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium mb-1">متن معرفی کوتاه برند در فوتر:</label>
                  <textarea
                    rows={2}
                    value={content.footer.aboutText || ''}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        footer: { ...content.footer, aboutText: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium mb-1">متن کپی‌رایت:</label>
                  <input
                    type="text"
                    value={content.footer.copyrightText || ''}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        footer: { ...content.footer, copyrightText: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={content.footer.enamadActive}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          footer: { ...content.footer, enamadActive: e.target.checked }
                        })
                      }
                      className="rounded"
                    />
                    <span>نمایش نشان نماد اعتماد الکترونیکی (eNamad) در فوتر</span>
                  </label>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* SUBTAB 6: Announcement Bar */}
        {activeSubTab === 'announcement' && (
          <div className="p-6 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#111110] border-b border-[#BFDDF0]/60 pb-2">
              تنظیمات نوار اطلاعیه بالای سایت (Announcement Bar)
            </h3>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={content.announcementBar?.enabled}
                onChange={(e) =>
                  setContent({
                    ...content,
                    announcementBar: {
                      ...content.announcementBar!,
                      enabled: e.target.checked
                    }
                  })
                }
                className="rounded"
              />
              <span>نمایش نوار اعلان در بالای تمامی صفحات</span>
            </label>

            <div className="space-y-3 text-xs pt-2">
              <div>
                <label className="block font-medium mb-1">متن اعلان:</label>
                <input
                  type="text"
                  value={content.announcementBar?.text || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      announcementBar: {
                        ...content.announcementBar!,
                        text: e.target.value
                      }
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">کد تخفیف پیشنهادی:</label>
                  <input
                    type="text"
                    value={content.announcementBar?.discountCode || ''}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        announcementBar: {
                          ...content.announcementBar!,
                          discountCode: e.target.value
                        }
                      })
                    }
                    placeholder="WELCOME10"
                    className="w-full px-3 py-2 border rounded-xl uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">شماره پشتیبانی نوار:</label>
                  <input
                    type="text"
                    value={content.announcementBar?.supportPhone || ''}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        announcementBar: {
                          ...content.announcementBar!,
                          supportPhone: e.target.value
                        }
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl font-mono dir-ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-medium mb-1">رنگ پس‌زمینه نوار:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={content.announcementBar?.bgColor || '#111110'}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          announcementBar: {
                            ...content.announcementBar!,
                            bgColor: e.target.value
                          }
                        })
                      }
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={content.announcementBar?.bgColor || '#111110'}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          announcementBar: {
                            ...content.announcementBar!,
                            bgColor: e.target.value
                          }
                        })
                      }
                      className="flex-1 px-2.5 py-1.5 border rounded-lg dir-ltr font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1">رنگ متن اعلان:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={content.announcementBar?.textColor || '#FFFFFF'}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          announcementBar: {
                            ...content.announcementBar!,
                            textColor: e.target.value
                          }
                        })
                      }
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={content.announcementBar?.textColor || '#FFFFFF'}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          announcementBar: {
                            ...content.announcementBar!,
                            textColor: e.target.value
                          }
                        })
                      }
                      className="flex-1 px-2.5 py-1.5 border rounded-lg dir-ltr font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 7: Navigation Links */}
        {activeSubTab === 'navigation' && (
          <div className="p-6 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#111110] border-b border-[#BFDDF0]/60 pb-2">
              پیوندهای ناوبری اصلی (Navigation Links)
            </h3>

            <div className="space-y-3">
              {(content.navLinks || []).map((link, lIdx) => (
                <div
                  key={link.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#BFDDF0] bg-white text-xs"
                >
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => {
                      const copy = [...(content.navLinks || [])];
                      copy[lIdx] = { ...copy[lIdx], label: e.target.value };
                      setContent({ ...content, navLinks: copy });
                    }}
                    placeholder="عنوان منو"
                    className="w-36 px-2.5 py-1.5 border rounded-lg font-bold"
                  />
                  <input
                    type="text"
                    value={link.href}
                    onChange={(e) => {
                      const copy = [...(content.navLinks || [])];
                      copy[lIdx] = { ...copy[lIdx], href: e.target.value };
                      setContent({ ...content, navLinks: copy });
                    }}
                    placeholder="آدرس یا شناسه بخش (مثلاً home, catalog, #customizer)"
                    className="flex-1 px-2.5 py-1.5 border rounded-lg dir-ltr font-mono text-[11px]"
                  />
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={link.active}
                      onChange={(e) => {
                        const copy = [...(content.navLinks || [])];
                        copy[lIdx] = { ...copy[lIdx], active: e.target.checked };
                        setContent({ ...content, navLinks: copy });
                      }}
                      className="rounded"
                    />
                    <span>فعال</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setContent({
                        ...content,
                        navLinks: (content.navLinks || []).filter((_, i) => i !== lIdx)
                      });
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Link */}
            <div className="flex gap-2 text-xs pt-2">
              <input
                type="text"
                value={newNavLabel}
                onChange={(e) => setNewNavLabel(e.target.value)}
                placeholder="عنوان جدید (مثلاً ژورنال)"
                className="w-36 px-3 py-2 border rounded-xl"
              />
              <input
                type="text"
                value={newNavHref}
                onChange={(e) => setNewNavHref(e.target.value)}
                placeholder="story یا #about"
                className="flex-1 px-3 py-2 border rounded-xl dir-ltr font-mono"
              />
              <button
                type="button"
                onClick={addNavLink}
                className="px-4 py-2 bg-[#111110] text-white rounded-xl font-bold cursor-pointer"
              >
                + افزودن پیوند
              </button>
            </div>
          </div>
        )}

        {/* SUBTAB 8: FAQ */}
        {activeSubTab === 'faq' && (
          <div className="p-6 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#111110] border-b border-[#BFDDF0]/60 pb-2">
              پرسش‌های متداول مشتریان (FAQ)
            </h3>

            <div className="space-y-3">
              {content.faq.map((item, fIdx) => (
                <div key={item.id} className="p-4 rounded-xl border border-[#BFDDF0] bg-white space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={item.q}
                      onChange={(e) => {
                        const copy = [...content.faq];
                        copy[fIdx] = { ...copy[fIdx], q: e.target.value };
                        setContent({ ...content, faq: copy });
                      }}
                      className="flex-1 px-3 py-1.5 border rounded-lg font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setContent({ ...content, faq: content.faq.filter((_, i) => i !== fIdx) })}
                      className="text-red-500 hover:bg-red-50 p-1 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={item.a}
                    onChange={(e) => {
                      const copy = [...content.faq];
                      copy[fIdx] = { ...copy[fIdx], a: e.target.value };
                      setContent({ ...content, faq: copy });
                    }}
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
              ))}
            </div>

            {/* Add FAQ */}
            <div className="p-4 rounded-xl border border-dashed border-[#BFDDF0] bg-[#E4F5FF]/30 space-y-2 text-xs">
              <span className="font-bold block">افزودن سوال جدید:</span>
              <input
                type="text"
                value={newFaqQ}
                onChange={(e) => setNewFaqQ(e.target.value)}
                placeholder="متن پرسش..."
                className="w-full px-3 py-2 border rounded-xl bg-white"
              />
              <textarea
                rows={2}
                value={newFaqA}
                onChange={(e) => setNewFaqA(e.target.value)}
                placeholder="پاسخ کامل..."
                className="w-full px-3 py-2 border rounded-xl bg-white"
              />
              <button
                type="button"
                onClick={addFaq}
                className="px-4 py-2 bg-[#111110] text-white rounded-xl font-bold cursor-pointer"
              >
                + ثبت در لیست پرسش‌ها
              </button>
            </div>
          </div>
        )}

        {/* SUBTAB 9: Policy Pages */}
        {activeSubTab === 'policies' && (
          <div className="p-6 rounded-2xl border bg-white border-[#BFDDF0] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#111110] border-b border-[#BFDDF0]/60 pb-2">
              متن صفحات راهنما، حریم خصوصی، رویه ارسال و درباره آتلیه
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">درباره آتلیه مد (About Us):</label>
                <textarea
                  rows={4}
                  value={content.policyPages?.about || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      policyPages: { ...content.policyPages!, about: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">شیوه‌ها و زمان‌بندی ارسال سفارشات (Shipping):</label>
                <textarea
                  rows={4}
                  value={content.policyPages?.shipping || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      policyPages: { ...content.policyPages!, shipping: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">ضمانت اصالت و شرایط بازگشت ۷ روزه کالا (Returns):</label>
                <textarea
                  rows={4}
                  value={content.policyPages?.returns || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      policyPages: { ...content.policyPages!, returns: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">قوانین و شرایط استفاده از خدمات (Terms):</label>
                <textarea
                  rows={4}
                  value={content.policyPages?.terms || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      policyPages: { ...content.policyPages!, terms: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">حریم خصوصی کاربران (Privacy):</label>
                <textarea
                  rows={4}
                  value={content.policyPages?.privacy || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      policyPages: { ...content.policyPages!, privacy: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">متن صفحه ارتباط و پشتیبانی (Contact):</label>
                <textarea
                  rows={3}
                  value={content.policyPages?.contact || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      policyPages: { ...content.policyPages!, contact: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-between p-4 bg-white border border-[#BFDDF0] rounded-2xl shadow-sm sticky bottom-4 z-20">
          <div>
            {saveSuccess && (
              <span className="text-xs font-bold text-[#2F6B4F] flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>تغییرات با موفقیت در پایگاه داده ثبت و در سایت اصلی اعمال شد.</span>
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#111110] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:bg-[#2A2A28] disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'در حال ارسال و ذخیره در سرور...' : 'ذخیره تغییرات کلی سایت'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
