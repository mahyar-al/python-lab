import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Sparkles, Tag, ShoppingBag } from 'lucide-react';

export interface BannerSlide {
  id: string;
  badge?: string;
  logoUrl?: string;
  headline: string;
  subtitle: string;
  ctaText: string;
  linkUrl: string;
  bgGradient: string;
  accentColor: string;
  haloBorderColor: string;
  pedestalColor: string;
  products: {
    name: string;
    image: string;
    className?: string;
  }[];
}

interface MainSliderBannerProps {
  onNavigate: (sectionId: string) => void;
  onOpenCustomizer?: () => void;
}

export const MAIN_SLIDES: BannerSlide[] = [
  // Slide 1: Digikala-style Blue Banner (Digital & Mobile Goods)
  {
    id: 'slide-digital-blue',
    badge: 'جشنواره تکنولوژی موریکو',
    headline: 'تکنولوژی برتر؛ سرعت و ظرافت دیجیتال',
    subtitle: 'انواع گوشی‌های هوشمند، ساعت‌های پایش سلامت و هدفون‌های نویزکنسلینگ با گارانتی معتبر',
    ctaText: 'خرید',
    linkUrl: 'catalog',
    bgGradient: 'from-[#0091df] via-[#00a3f5] to-[#0284c7]',
    accentColor: '#fbbf24',
    haloBorderColor: '#facc15',
    pedestalColor: '#ffffff',
    products: [
      {
        name: 'گوشی هوشمند پرچمدار',
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&auto=format&fit=crop&q=80',
        className: 'w-24 sm:w-32 md:w-40 lg:w-48 z-20 -translate-y-2'
      },
      {
        name: 'هدفون سونی WH-1000XM5',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
        className: 'w-24 sm:w-32 md:w-40 lg:w-44 z-30 translate-y-2'
      },
      {
        name: 'ساعت هوشمند اپل واچ',
        image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=80',
        className: 'w-18 sm:w-24 md:w-32 lg:w-36 z-10 -translate-x-3 translate-y-5'
      },
      {
        name: 'ایرپاد پرو ۲',
        image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&auto=format&fit=crop&q=80',
        className: 'w-16 sm:w-20 md:w-26 lg:w-28 z-40 translate-x-4 translate-y-7'
      }
    ]
  },

  // Slide 2: Morico Apparel & Atelier (Crimson Red / Coral)
  {
    id: 'slide-apparel-red',
    badge: 'کالکشن جدید آتلیه موریکو',
    headline: 'استایل متمایز با الیاف ۱۰۰٪ پنبه ارگانیک',
    subtitle: 'تیشرت‌های جعبه‌ای ۳۲۰ گرم، هودی‌های ساختاریافته ۴۰۰ گرم و استودیوی طراحی آنلاین',
    ctaText: 'خرید',
    linkUrl: 'catalog',
    bgGradient: 'from-[#be123c] via-[#e11d48] to-[#f43f5e]',
    accentColor: '#ffffff',
    haloBorderColor: '#ffffff',
    pedestalColor: '#ffffff',
    products: [
      {
        name: 'هودی معماری ۴۰۰ گرم',
        image: '/mockups/hoodie-front.svg',
        className: 'w-28 sm:w-36 md:w-48 lg:w-56 z-20'
      },
      {
        name: 'تیشرت جعبه‌ای ۳۲۰ گرم',
        image: '/mockups/tee-front.svg',
        className: 'w-24 sm:w-32 md:w-44 lg:w-50 z-30 translate-x-6 translate-y-3'
      },
      {
        name: 'توت‌بگ کتان ضخیم ۱۶ اونس',
        image: '/brand/morico-logo.jpg',
        className: 'w-20 sm:w-26 md:w-36 lg:w-40 z-10 -translate-x-6 translate-y-5 rounded-2xl shadow-lg border-2 border-white'
      }
    ]
  },

  // Slide 3: Home & Modern Appliances (Teal / Emerald Green)
  {
    id: 'slide-home-green',
    badge: 'تجهیزات مدرن خانه و آشپزخانه',
    headline: 'آرامش، دوام و زیبایی در خانه شما',
    subtitle: 'سرخ‌کن‌های بدون روغن، اسپرسوسازهای خانگی پرقدرت و آباژورهای دست‌ساز سرامیکی',
    ctaText: 'خرید',
    linkUrl: 'catalog',
    bgGradient: 'from-[#065f46] via-[#059669] to-[#10b981]',
    accentColor: '#fde047',
    haloBorderColor: '#fde047',
    pedestalColor: '#ffffff',
    products: [
      {
        name: 'سرخ‌کن بدون روغن هوشمند',
        image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=500&auto=format&fit=crop&q=80',
        className: 'w-24 sm:w-32 md:w-44 lg:w-52 z-20'
      },
      {
        name: 'اسپرسوساز مباشی ایتالیایی',
        image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500&auto=format&fit=crop&q=80',
        className: 'w-22 sm:w-30 md:w-40 lg:w-48 z-30 translate-x-6 translate-y-2'
      },
      {
        name: 'آباژور سرامیک و برنج دست‌ساز',
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80',
        className: 'w-18 sm:w-24 md:w-32 lg:w-38 z-10 -translate-x-6 translate-y-4'
      }
    ]
  },

  // Slide 4: Health & Authentic Local Goods (Purple / Violet)
  {
    id: 'slide-health-purple',
    badge: 'سوغات اصیل و محصولات سلامت',
    headline: 'طعم اصیل سلامت؛ از مزرعه تا خانه',
    subtitle: 'زعفران سرگل قائنات، عسل طبیعی سبلان و مکمل‌های اصل با ضمانت سلامت و مهلت تست ۷ روزه',
    ctaText: 'خرید',
    linkUrl: 'catalog',
    bgGradient: 'from-[#4c1d95] via-[#6d28d9] to-[#8b5cf6]',
    accentColor: '#facc15',
    haloBorderColor: '#facc15',
    pedestalColor: '#ffffff',
    products: [
      {
        name: 'زعفران سرگل اعلای قائنات',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=80',
        className: 'w-24 sm:w-32 md:w-44 lg:w-50 z-20'
      },
      {
        name: 'قرص ویتامین D3 یوروویتال',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
        className: 'w-22 sm:w-28 md:w-38 lg:w-44 z-30 translate-x-6 translate-y-4'
      },
      {
        name: 'عسل طبیعی کوهستان',
        image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=80',
        className: 'w-18 sm:w-24 md:w-34 lg:w-38 z-10 -translate-x-5 translate-y-5'
      }
    ]
  }
];

export const MainSliderBanner: React.FC<MainSliderBannerProps> = ({
  onNavigate,
  onOpenCustomizer
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slideCount = MAIN_SLIDES.length;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance every 5 seconds (5000ms)
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, slideCount]);

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentSlide((prev) => (prev === 0 ? slideCount - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % slideCount);
  };

  const handleCtaClick = (linkUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (linkUrl === 'customizer' && onOpenCustomizer) {
      onOpenCustomizer();
    } else {
      onNavigate(linkUrl);
    }
  };

  return (
    <section
      className="relative w-full overflow-hidden select-none"
      dir="rtl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Banner Container */}
      <div className="relative w-full h-[470px] sm:h-[480px] md:h-[470px] lg:h-[500px] overflow-hidden">
        
        {MAIN_SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Vibrant Colored Background */}
              <div className={`w-full h-full bg-gradient-to-l ${slide.bgGradient} flex items-center relative overflow-hidden`}>
                
                {/* Subtle Geometric / Dot Texture Overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id={`pattern-slider-${slide.id}`} width="40" height="40" patternUnits="userSpaceOnUse">
                        <circle cx="20" cy="20" r="1.5" fill="#ffffff" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#pattern-slider-${slide.id})`} />
                  </svg>
                </div>

                {/* Content Layout Grid */}
                <div className="max-w-[1440px] w-full mx-auto px-3 sm:px-8 md:px-12 lg:px-16 h-full flex flex-col md:flex-row items-center justify-between relative z-10 py-3 sm:py-8">
                  
                  {/* --------------------------------------------------------- */}
                  {/* Right Side (Text & Buy Button - RTL first)                */}
                  {/* --------------------------------------------------------- */}
                  <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-right space-y-2 sm:space-y-4 lg:space-y-6 pt-1 sm:pt-4 md:pt-0 pb-14 sm:pb-16 md:pb-0 z-20">
                    
                    {/* Badge */}
                    {slide.badge && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] sm:text-sm font-bold border border-white/30 shadow-xs">
                        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 fill-amber-300" />
                        <span>{slide.badge}</span>
                      </div>
                    )}

                    {/* Big Bold Persian Headline */}
                    <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-[44px] font-black text-white leading-snug md:leading-[1.25] tracking-tight drop-shadow-sm font-sans max-w-xl line-clamp-2 md:line-clamp-none">
                      {slide.headline}
                    </h2>

                    {/* Supporting Subtitle */}
                    <p className="text-xs sm:text-sm md:text-base text-white/90 leading-relaxed max-w-md line-clamp-2 md:line-clamp-3 font-normal drop-shadow-2xs">
                      {slide.subtitle}
                    </p>

                    {/* White Round Pill Button: «خرید» */}
                    <div className="pt-0.5 sm:pt-2">
                      <button
                        type="button"
                        onClick={(e) => handleCtaClick(slide.linkUrl, e)}
                        className="px-6 sm:px-10 py-2 sm:py-3 rounded-full bg-white text-gray-900 font-extrabold text-xs sm:text-base hover:bg-gray-100 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer flex items-center gap-2 group/btn"
                      >
                        <span>{slide.ctaText}</span>
                        <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700 group-hover/btn:-translate-x-1 transition-transform" />
                      </button>
                    </div>

                  </div>

                  {/* --------------------------------------------------------- */}
                  {/* Left Side: 3D Pedestal Stage with Curated Products        */}
                  {/* --------------------------------------------------------- */}
                  <div className="w-full md:w-1/2 h-[180px] sm:h-[240px] md:h-full flex items-center justify-center relative mt-1 md:mt-0">
                    
                    {/* Glowing Circular / Heart Frame Halo behind Pedestal */}
                    <div
                      className="absolute w-[200px] sm:w-[320px] md:w-[400px] lg:w-[460px] aspect-square rounded-full border-4 sm:border-[6px] opacity-40 animate-pulse pointer-events-none"
                      style={{
                        borderColor: slide.haloBorderColor,
                        boxShadow: `0 0 60px ${slide.haloBorderColor}40`
                      }}
                    />

                    {/* White 3D Stage / Pedestal (Circular Plinth) */}
                    <div className="relative w-[200px] sm:w-[280px] md:w-[380px] lg:w-[440px] flex flex-col items-center justify-end">
                      
                      {/* Products Stacked on Pedestal */}
                      <div className="relative flex items-end justify-center w-full z-10 -mb-3 sm:-mb-6">
                        {slide.products.map((p, pIdx) => (
                          <div
                            key={pIdx}
                            className={`relative flex items-center justify-center transition-transform duration-500 hover:scale-110 drop-shadow-2xl ${p.className || ''}`}
                            title={p.name}
                          >
                            <img
                              src={p.image}
                              alt={p.name}
                              loading="lazy"
                              className="w-full h-auto max-h-[110px] sm:max-h-[190px] md:max-h-[250px] lg:max-h-[290px] object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.35)]"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/brand/morico-logo.jpg';
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* 3D Round Plinth Top Surface (Ellipse) */}
                      <div className="w-full h-10 sm:h-16 md:h-20 bg-gradient-to-b from-white via-gray-100 to-gray-200 rounded-[50%] shadow-2xl border-t border-white/80 transform scale-y-50 relative z-0" />
                      
                      {/* 3D Plinth Cylinder Body */}
                      <div className="w-[96%] h-5 sm:h-8 md:h-10 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-400 -mt-5 sm:-mt-8 md:-mt-10 rounded-b-3xl shadow-2xl relative z-[-1]" />
                    </div>

                  </div>

                </div>

              </div>
            </div>
          );
        })}

        {/* ================================================================= */}
        {/* Navigation Controls: Circular White Arrows on Bottom Left Corner  */}
        {/* ================================================================= */}
        <div className="absolute left-3 sm:left-8 md:left-12 bottom-3 sm:bottom-6 z-30 flex items-center gap-1.5 sm:gap-2">
          
          {/* Next Button (Arrow Right in RTL) */}
          <button
            type="button"
            onClick={handleNext}
            className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white/95 text-gray-800 hover:bg-white hover:text-black hover:scale-105 active:scale-95 shadow-md flex items-center justify-center transition-all cursor-pointer border border-gray-200/80"
            aria-label="اسلاید بعدی"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          {/* Prev Button (Arrow Left in RTL) */}
          <button
            type="button"
            onClick={handlePrev}
            className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white/95 text-gray-800 hover:bg-white hover:text-black hover:scale-105 active:scale-95 shadow-md flex items-center justify-center transition-all cursor-pointer border border-gray-200/80"
            aria-label="اسلاید قبلی"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

        </div>

        {/* ================================================================= */}
        {/* Pagination Dots in the Bottom Center                              */}
        {/* ================================================================= */}
        <div className="absolute inset-x-0 bottom-3 sm:bottom-6 z-30 flex items-center justify-center gap-1.5 pointer-events-auto">
          {MAIN_SLIDES.map((_, dotIdx) => {
            const isCurrent = dotIdx === currentSlide;
            return (
              <button
                key={dotIdx}
                type="button"
                onClick={() => setCurrentSlide(dotIdx)}
                className={`transition-all duration-300 cursor-pointer rounded-full ${
                  isCurrent
                    ? 'w-6 sm:w-8 h-1.5 sm:h-2.5 bg-black/80 shadow-xs'
                    : 'w-1.5 sm:w-2.5 h-1.5 sm:h-2.5 bg-black/30 hover:bg-black/50'
                }`}
                aria-label={`رفتن به اسلاید ${dotIdx + 1}`}
              />
            );
          })}
        </div>

      </div>
    </section>
  );
};
