import React, { useState } from 'react';
import { BannerAd } from '../lib/types';
import { ArrowLeft, Tag, Copy, Check, Sparkles } from 'lucide-react';
import defaultBannerDrop from '../assets/images/banner_collection_drop_1792400592647.jpg';
import defaultBannerStudio from '../assets/images/banner_studio_custom_1792400593263.jpg';

interface StoreBannersProps {
  banners?: BannerAd[];
  onNavigate: (sectionId: string) => void;
  onOpenCustomizer: () => void;
}

export const StoreBanners: React.FC<StoreBannersProps> = ({
  banners = [],
  onNavigate,
  onOpenCustomizer
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filter to active banners only
  const activeBanners = Array.isArray(banners) ? banners.filter((b) => b.active !== false) : [];

  if (activeBanners.length === 0) {
    return null;
  }

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleBannerClick = (linkUrl?: string) => {
    if (!linkUrl) {
      onNavigate('catalog');
      return;
    }
    if (linkUrl === 'customizer') {
      onOpenCustomizer();
    } else if (linkUrl === 'catalog') {
      onNavigate('catalog');
    } else {
      onNavigate(linkUrl);
    }
  };

  const gradientPresets = [
    'from-[#111110] via-[#1c1c1a] to-[#2a2a28]',
    'from-[#1a2228] via-[#111110] to-[#181d22]',
    'from-[#0c4a6e] via-[#075985] to-[#0369a1]',
    'from-[#881337] via-[#9f1239] to-[#be123c]'
  ];

  const getResolvedImage = (banner: BannerAd, idx: number): string => {
    const raw = banner.imageUrl || banner.image;
    if (raw && typeof raw === 'string' && raw.trim() !== '') {
      if (raw.startsWith('/src/assets/images/')) {
        return raw.replace('/src/assets/images/', '/assets/images/');
      }
      return raw;
    }
    return idx % 2 === 0 ? defaultBannerDrop : defaultBannerStudio;
  };

  return (
    <section className="w-full py-4 sm:py-6 px-3 sm:px-6 max-w-[1440px] mx-auto overflow-hidden">
      <div
        className={`grid gap-4 sm:gap-6 w-full ${
          activeBanners.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
        }`}
      >
        {activeBanners.map((banner, idx) => {
          const bannerImage = getResolvedImage(banner, idx);
          const bannerDesc = banner.description || banner.subtitle || '';
          const bannerCta = banner.linkText || banner.buttonText || 'مشاهده و بررسی';
          const bgGrad = banner.bgGradient || gradientPresets[idx % gradientPresets.length];
          const hasPromo = Boolean(banner.promoCode);

          return (
            <div
              key={banner.id}
              onClick={() => handleBannerClick(banner.linkUrl)}
              className={`group relative overflow-hidden rounded-[22px] border border-gray-800/80 bg-gradient-to-br ${bgGrad} text-white shadow-md hover:shadow-xl transition-all duration-300 p-5 sm:p-7 flex flex-col justify-between cursor-pointer min-h-[200px] sm:min-h-[250px] w-full min-w-0`}
              style={banner.backgroundColor ? { backgroundColor: banner.backgroundColor } : undefined}
            >
              {/* Background Decorative Pattern & Image */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Fallback Luxury Dot Pattern */}
                <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id={`pattern-banner-${banner.id}`} width="24" height="24" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill="#FFFFFF" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#pattern-banner-${banner.id})`} />
                </svg>

                {/* Banner Photo with Opacity & Scrim */}
                {bannerImage && (
                  <img
                    src={bannerImage}
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover opacity-35 group-hover:scale-105 group-hover:opacity-45 transition-all duration-700 ease-out"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/30" />
              </div>

              {/* Content Header: Badge + Discount */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                {banner.badge ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-[11px] font-bold font-sans tracking-normal border border-white/25">
                    <Sparkles className="w-3 h-3 text-[#E4F5FF]" />
                    <span>{banner.badge}</span>
                  </div>
                ) : <span />}

                {banner.discount && (
                  <div className="px-2.5 py-1 rounded-full bg-[#E4F5FF] text-[#111110] text-[10px] sm:text-xs font-bold shadow-2xs">
                    {banner.discount}
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div className="relative z-10 my-3 sm:my-4 space-y-1.5 text-right">
                <h3 className="text-base sm:text-2xl font-bold leading-tight group-hover:text-[#E4F5FF] transition-colors">
                  {banner.title}
                </h3>
                {bannerDesc && (
                  <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-normal line-clamp-2">
                    {bannerDesc}
                  </p>
                )}
              </div>

              {/* Bottom Row: Copyable Code Chip + CTA */}
              <div className="relative z-10 flex items-center justify-between gap-2 sm:gap-3 pt-3 border-t border-white/15">
                {/* Copyable Promo Code Chip */}
                {hasPromo ? (
                  <button
                    type="button"
                    onClick={(e) => handleCopyCode(banner.promoCode!, e)}
                    className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/30 text-xs font-mono uppercase tracking-wider text-white transition-all cursor-pointer min-h-[34px] sm:min-h-[36px]"
                    title="کپی کد تخفیف"
                  >
                    <Tag className="w-3 h-3 text-[#E4F5FF] shrink-0" />
                    <span>{banner.promoCode}</span>
                    {copiedCode === banner.promoCode ? (
                      <Check className="w-3.5 h-3.5 text-[#58A67B] shrink-0" />
                    ) : (
                      <Copy className="w-3 h-3 opacity-70 shrink-0" />
                    )}
                    {copiedCode === banner.promoCode && (
                      <span className="text-[10px] text-[#58A67B] font-sans font-bold">کپی شد</span>
                    )}
                  </button>
                ) : <span />}

                {/* Action Button */}
                <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white group-hover:translate-x-[-4px] transition-transform shrink-0">
                  <span>{bannerCta}</span>
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
