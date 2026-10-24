import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, ChevronLeft, ArrowLeft, Sparkles, ShoppingBag, Flame, Tag } from 'lucide-react';
import { toPersianDigits } from '../lib/currency';
import { HeroSlideItem } from '../lib/types';

interface HeroSliderProps {
  slides?: HeroSlideItem[];
  onExploreCatalog?: () => void;
  onOpenCustomizer?: () => void;
  onNavigate?: (sectionId: string) => void;
  onSelectCategory?: (categoryId: string) => void;
}

export const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    id: 'hero-slide-default-1',
    title: 'کالکشن برگزیده و استودیوی طراحی اختصاصی MORICO',
    description: 'منتخب محصولات مدرن با امکان طراحی آنلاین و سفارشی‌سازی اختصاصی',
    targetAction: 'catalog',
    bgColor: 'from-[#0B1528] via-[#1E293B] to-[#0F172A]',
    accentColor: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    podiumColor: 'linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 50%, #94A3B8 100%)',
    active: true,
    products: {
      center: {
        name: 'هدفون استودیویی پرو',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
      },
      left: {
        name: 'ساعت هوشمند اولترا',
        image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80'
      },
      right: {
        name: 'اسپیکر مانیتورینگ',
        image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80'
      }
    }
  },
  {
    id: 'hero-slide-default-2',
    title: 'استودیوی اختصاصی چاپ و پوشاک سفارشی',
    description: 'طراحی آنلاین انواع هودی و تیشرت با چاپ مستقیم باکیفیت',
    targetAction: 'customizer',
    bgColor: 'from-[#1E1B4B] via-[#312E81] to-[#0F172A]',
    accentColor: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    podiumColor: 'linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 50%, #94A3B8 100%)',
    active: true,
    products: {
      center: {
        name: 'هودی اختصاصی موریکو',
        image: '/mockups/hoodie-front.svg'
      },
      left: {
        name: 'تیشرت نخی',
        image: '/mockups/tee-front.svg'
      },
      right: {
        name: 'هودی نمای پشت',
        image: '/mockups/hoodie-back.svg'
      }
    }
  }
];

export const HeroSlider: React.FC<HeroSliderProps> = ({
  slides,
  onExploreCatalog,
  onOpenCustomizer,
  onNavigate,
  onSelectCategory
}) => {
  const activeSlides = (slides || []).filter((s) => s.active !== false);
  const slidesToRender = activeSlides.length > 0 ? activeSlides : DEFAULT_HERO_SLIDES;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [stageRotation, setStageRotation] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 3-second active rotation for the 3 stage sections (main, left, right)
  useEffect(() => {
    const stageInterval = setInterval(() => {
      setStageRotation((prev) => (prev + 1) % 3);
    }, 3000);

    return () => clearInterval(stageInterval);
  }, []);

  // Slide advance
  const handleNext = useCallback(() => {
    if (slidesToRender.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % slidesToRender.length);
  }, [slidesToRender.length]);

  const handlePrev = useCallback(() => {
    if (slidesToRender.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + slidesToRender.length) % slidesToRender.length);
  }, [slidesToRender.length]);

  useEffect(() => {
    if (isPaused || slidesToRender.length <= 1) return;

    timerRef.current = setInterval(() => {
      handleNext();
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, handleNext, slidesToRender.length]);

  if (slidesToRender.length === 0) {
    return null;
  }

  const handleCtaClick = (slide: HeroSlideItem) => {
    if (slide.targetAction === 'customizer' && onOpenCustomizer) {
      onOpenCustomizer();
    } else if (slide.targetCategory && onSelectCategory) {
      onSelectCategory(slide.targetCategory);
    } else if (onExploreCatalog) {
      onExploreCatalog();
    } else if (onNavigate) {
      onNavigate('catalog');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    setTouchStartX(null);
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-white select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="بنر اسلایدر اصلی موریکو"
    >
      {/* Container: Full width with subtle top border */}
      <div className="w-full relative">
        {/* Banner Slide Viewport */}
        <div className="relative w-full h-[490px] sm:h-[500px] md:h-[510px] lg:h-[520px] overflow-hidden">
          {slidesToRender.map((slide, idx) => {
            const isActive = idx === currentIndex;

            // Define the 3 stage items (Center/Main, Left, Right)
            const stageItems = [
              {
                id: 'center',
                basePos: 0, // 0 = main, 1 = left, 2 = right
                name: slide.products?.center?.name || 'محصول اصلی',
                image: slide.products?.center?.image || ''
              },
              {
                id: 'left',
                basePos: 1,
                name: slide.products?.left?.name || 'محصول سمت چپ',
                image: slide.products?.left?.image || ''
              },
              {
                id: 'right',
                basePos: 2,
                name: slide.products?.right?.name || 'محصول سمت راست',
                image: slide.products?.right?.image || ''
              }
            ].filter((it) => it.image && it.image.trim() !== '');

            return (
              <div
                key={slide.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                  isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {/* Background Gradient & Graphic Atmosphere */}
                <div className={`absolute inset-0 bg-gradient-to-l ${slide.bgColor}`}>
                  {/* Subtle 3D Depth Backdrop Pattern / Radial Glow */}
                  <div
                    className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
                    style={{
                      backgroundImage: `radial-gradient(circle at 75% 50%, white 0%, transparent 60%)`
                    }}
                  />
                  {/* Secondary Ambient Accent Circles */}
                  <div
                    className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl pointer-events-none"
                    style={{ backgroundColor: slide.glowColor }}
                  />
                  <div
                    className="absolute -bottom-24 right-1/4 w-[500px] h-96 rounded-full blur-3xl pointer-events-none"
                    style={{ backgroundColor: slide.glowColor }}
                  />
                </div>

                {/* If Poster Banner Image is uploaded for this slide */}
                {slide.posterUrl && slide.posterUrl.trim() !== '' ? (
                  <div
                    onClick={() => handleCtaClick(slide)}
                    className="relative max-w-[1440px] mx-auto h-full px-4 sm:px-8 flex items-center justify-center cursor-pointer"
                  >
                    <div className="relative w-full h-[90%] rounded-3xl overflow-hidden shadow-2xl border border-white/20 group">
                      <img
                        src={slide.posterUrl}
                        alt={slide.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex flex-col justify-end p-4 pb-14 sm:p-10 text-right">
                        <h2 className="text-xl sm:text-4xl font-black text-white leading-tight drop-shadow-md">
                          {slide.title}
                        </h2>
                        {slide.description && (
                          <p className="text-xs sm:text-base text-white/90 mt-1 max-w-xl font-medium drop-shadow-sm">
                            {slide.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Grid: Title & Description on Right, 3-Card Stage on Left */
                  <div
                    onClick={() => handleCtaClick(slide)}
                    className="relative max-w-[1440px] mx-auto h-full px-3 sm:px-8 md:px-12 flex flex-col justify-center cursor-pointer"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 lg:gap-8 items-center h-full py-3 sm:py-8">
                      
                      {/* Text Column with mobile padding bottom to clear controls */}
                      <div className="lg:col-span-5 space-y-1.5 sm:space-y-4 text-right z-20 flex flex-col justify-center order-2 lg:order-1 pt-1 lg:pt-0 pb-14 sm:pb-16 lg:pb-0 px-1 sm:px-0">
                        {/* Headline */}
                        <h2 className="text-lg sm:text-2xl md:text-4xl lg:text-[42px] font-black text-white leading-snug md:leading-[1.25] tracking-tight drop-shadow-md line-clamp-2 sm:line-clamp-none">
                          {slide.title}
                        </h2>

                        {/* Supporting Subtitle / Description */}
                        {slide.description && (
                          <p className="text-xs sm:text-sm md:text-lg text-white/95 font-medium leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-none drop-shadow-xs">
                            {slide.description}
                          </p>
                        )}

                        {slide.subtitle && (
                          <p className="text-[11px] sm:text-sm text-white/80 font-medium line-clamp-1 sm:line-clamp-none">
                            {slide.subtitle}
                          </p>
                        )}
                      </div>

                      {/* 3D Stage Column: Main, Left, Right with active 3-second position swapping */}
                      <div className="lg:col-span-7 relative h-[210px] sm:h-[260px] md:h-[340px] lg:h-[430px] flex items-center justify-center order-1 lg:order-2">
                        
                        {/* Glow backdrop */}
                        <div
                          className="absolute inset-0 rounded-full blur-3xl opacity-30 transform scale-75 pointer-events-none"
                          style={{ backgroundColor: slide.glowColor }}
                        />

                        {/* Pedestal Stage */}
                        <div className="absolute bottom-2 sm:bottom-4 md:bottom-6 w-[88%] sm:w-[80%] max-w-[580px] h-[60px] sm:h-[95px] md:h-[115px] pointer-events-none z-0">
                          <div
                            className="absolute top-0 inset-x-0 h-[40px] sm:h-[60px] md:h-[70px] rounded-[50%] shadow-[inset_0_4px_12px_rgba(255,255,255,0.9),_0_20px_35px_rgba(0,0,0,0.35)] border border-white/50"
                            style={{ background: slide.podiumColor || '#ffffff' }}
                          >
                            <div className="absolute inset-[4px] sm:inset-[6px] rounded-[50%] border border-white/60 opacity-70" />
                          </div>
                          <div
                            className="absolute top-[20px] sm:top-[30px] md:top-[35px] inset-x-0 h-[30px] sm:h-[50px] md:h-[60px] rounded-b-[50%] opacity-90 shadow-2xl"
                            style={{
                              background: 'linear-gradient(180deg, #64748B 0%, #334155 60%, #0F172A 100%)'
                            }}
                          />
                          <div className="absolute -bottom-4 inset-x-8 h-8 rounded-[50%] bg-black/40 blur-md" />
                        </div>

                        {/* The 3 Stage Cards animating and swapping positions every 3 seconds */}
                        <div className="relative z-10 w-full max-w-[580px] h-full flex items-end justify-center pb-4 sm:pb-12 md:pb-16">
                          {stageItems.map((item) => {
                            // Calculate current rotated position (0 = main center, 1 = left, 2 = right)
                            const currentPos = (item.basePos + stageRotation) % 3;
                            
                            // Visual properties based on current position
                            const isMain = currentPos === 0;
                            const isLeft = currentPos === 1;
                            const isRight = currentPos === 2;

                            return (
                              <div
                                key={item.id}
                                className={`absolute bottom-4 sm:bottom-12 transition-all duration-700 ease-in-out cursor-pointer ${
                                  isMain
                                    ? 'z-30 scale-100 sm:scale-110 translate-x-0 -translate-y-2 sm:-translate-y-4 opacity-100'
                                    : isLeft
                                    ? 'z-10 scale-85 sm:scale-90 translate-x-12 sm:translate-x-32 translate-y-1 sm:translate-y-2 opacity-80 hover:opacity-100'
                                    : 'z-10 scale-85 sm:scale-90 -translate-x-12 sm:-translate-x-32 translate-y-1 sm:translate-y-2 opacity-80 hover:opacity-100'
                                }`}
                              >
                                <div className="relative w-28 sm:w-44 md:w-56 h-28 sm:h-44 md:h-56 flex items-center justify-center">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    loading="eager"
                                    className={`max-h-full max-w-full object-contain rounded-2xl transition-all duration-500 ${
                                      isMain
                                        ? 'drop-shadow-[0_20px_25px_rgba(0,0,0,0.45)]'
                                        : 'drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]'
                                    }`}
                                  />
                                  <div className="absolute -bottom-4 inset-x-3 h-5 bg-black/30 rounded-[50%] blur-sm pointer-events-none" />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Digikala Style Navigation Buttons (Positioned neatly in bottom-left) */}
        <div className="absolute bottom-3 sm:bottom-5 left-3 sm:left-10 z-30 flex items-center gap-1.5 sm:gap-2">
          {/* Previous Slide Button (Right arrow in RTL) */}
          <button
            type="button"
            onClick={handlePrev}
            className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white text-gray-800 shadow-md hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center border border-gray-200 cursor-pointer"
            aria-label="اسلاید قبلی"
            title="اسلاید قبلی"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Next Slide Button (Left arrow in RTL) */}
          <button
            type="button"
            onClick={handleNext}
            className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white text-gray-800 shadow-md hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center border border-gray-200 cursor-pointer"
            aria-label="اسلاید بعدی"
            title="اسلاید بعدی"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Side Floating Arrows (Desktop Hover) */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/80 hover:bg-white text-gray-900 shadow-lg backdrop-blur-xs hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="اسلاید قبلی"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/80 hover:bg-white text-gray-900 shadow-lg backdrop-blur-xs hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="اسلاید بعدی"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Pagination Indicator Dots at Bottom Center */}
        <div className="absolute bottom-3 sm:bottom-5 inset-x-0 z-30 flex items-center justify-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/25 backdrop-blur-md">
            {slidesToRender.map((slide, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    isActive
                      ? 'w-6 sm:w-8 h-1.5 sm:h-2 bg-white'
                      : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`رفتن به اسلاید ${toPersianDigits(idx + 1)}`}
                  title={slide.title}
                />
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
