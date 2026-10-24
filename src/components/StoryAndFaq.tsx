import React, { useState } from 'react';
import { SiteContent } from '../lib/types';
import { ChevronDown, ChevronUp, Feather, ShieldCheck, Sparkles, Check, HelpCircle } from 'lucide-react';
import { formatPersianNumber } from '../lib/currency';

interface StoryAndFaqProps {
  craftsmanship: SiteContent['craftsmanship'];
  faqList: SiteContent['faq'];
}

export const StoryAndFaq: React.FC<StoryAndFaqProps> = ({ craftsmanship, faqList }) => {
  const [openFaqId, setOpenFaqId] = useState<string | null>(faqList?.[0]?.id || null);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  // Store showcase imagery
  const craftImage =
    craftsmanship?.image &&
    !craftsmanship.image.includes('morico-logo') &&
    craftsmanship.image.trim() !== ''
      ? craftsmanship.image
      : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&auto=format&fit=crop&q=80';

  const defaultFeatures = [
    {
      title: 'تضمین کیفیت و تطابق مشخصات فنی',
      subtitle: 'ارائه محصولات باکیفیت و کنترل‌شده با تطابق کامل اطلاعات مندرج در سایت.'
    },
    {
      title: 'پشتیبانی و همراهی مستمر خریداران',
      subtitle: 'پاسخگویی سریع و راهنمایی تخصصی کارشناسان به تمامی پرسش‌ها.'
    },
    {
      title: 'کنترل دقیق استانداردهای ساخت و دوخت',
      subtitle: 'بررسی کیفی موشکافانه تک‌تک محصولات پیش از آماده‌سازی و تحویل نهایی.'
    }
  ];

  const rawFeatures =
    craftsmanship?.features && craftsmanship.features.length > 0 && !craftsmanship.features[0].title.includes('پنبه ارگانیک')
      ? craftsmanship.features
      : defaultFeatures;

  // Filter out any shipping guarantee ("ضمانت ارسال") or product variety ("تنوع کالا")
  const featuresToDisplay = rawFeatures.filter((f) => {
    const text = `${f.title} ${f.subtitle || ''}`;
    return !text.includes('تنوع') && !text.includes('ضمانت ارسال') && !text.includes('ارسال سریع') && !text.includes('تحویل اکسپرس');
  });

  const craftBadge =
    craftsmanship?.badge && !craftsmanship.badge.includes('اصالت دوخت')
      ? craftsmanship.badge
      : 'درباره فروشگاه موریکو';

  const craftTitle =
    craftsmanship?.title && !craftsmanship.title.includes('الیاف ارگانیک') && !craftsmanship.title.includes('پنبه ناب') && !craftsmanship.title.includes('تنوع')
      ? craftsmanship.title
      : 'اصالت کیفیت، دقت در انتخاب و خرید مطمئن';

  const craftDesc =
    craftsmanship?.description && !craftsmanship.description.includes('پنبه ارگانیک') && !craftsmanship.description.includes('پارچه') && !craftsmanship.description.includes('متنوع')
      ? craftsmanship.description
      : 'فروشگاه موریکو با هدف عرضه کالاهای منتخب و باکیفیت در حوزه‌های تخصصی فعالیت می‌کند. کلیه محصولات پس از ارزیابی‌های کیفی در کاتالوگ فروشگاه درج می‌شوند.';

  return (
    <section className="w-full py-16 sm:py-20 md:py-24 bg-white border-t border-[#BFDDF0] text-right" dir="rtl">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 space-y-20 md:space-y-28">
        
        {/* CRAFTSMANSHIP & STORE STORY SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Text & Features Column (RTL first) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E4F5FF]/70 border border-[#BFDDF0]">
              <Sparkles className="w-3.5 h-3.5 text-[#111110]" />
              <span className="font-sans text-[11px] font-bold text-[#111110]">
                {craftBadge}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111110] leading-[1.3] tracking-tight">
              {craftTitle}
            </h2>

            <p className="text-sm sm:text-base text-[#4A5560] leading-[1.8] font-normal">
              {craftDesc}
            </p>

            <div className="space-y-3.5 pt-2">
              {featuresToDisplay.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#F8FBFE] border border-[#BFDDF0] hover:bg-white hover:shadow-md transition-all duration-300"
                >
                  <div className="w-7 h-7 rounded-xl bg-[#111110] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Check className="w-4 h-4 stroke-[2.2px]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-xs sm:text-sm text-[#111110]">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-[#4A5560] leading-relaxed">
                      {feat.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* High-fidelity Imagery Column */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-lg aspect-[4/3] sm:aspect-[5/4] rounded-3xl overflow-hidden border border-[#BFDDF0] shadow-xl group">
              <img
                src={craftImage}
                alt="فروشگاه اینترنتی موریکو"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/brand/morico-logo.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              
              <div className="absolute bottom-5 right-5 left-5 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-white/50 text-right shadow-lg">
                <span className="font-serif text-[10px] font-bold brand-tracking text-[#4A5560] uppercase block">
                  MORICO MULTI-CATEGORY STORE
                </span>
                <p className="text-xs font-bold text-[#111110] mt-0.5">
                  تضمین استانداردهای کیفی کالاها و پشتیبانی سریع خریداران
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* FAQ ACCORDION SECTION */}
        <div className="max-w-3xl mx-auto space-y-8 pt-6">
          <div className="text-center space-y-2">
            <span className="font-serif text-[11px] font-bold brand-tracking text-[#4A5560] uppercase tracking-wider block">
              FREQUENTLY ASKED · FAQ
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#111110]">
              پرسش‌های متداول مشتریان
            </h3>
            <p className="text-xs sm:text-sm text-[#4A5560] max-w-md mx-auto leading-relaxed">
              پاسخ به سوالات متداول درباره نحوه سفارش، ضمانت اصالت کالاها و روش‌های ارسال
            </p>
          </div>

          <div className="space-y-3.5">
            {faqList?.map((faq, index) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                    isOpen
                      ? 'border-[#111110] bg-white ring-1 ring-[#111110]/10'
                      : 'border-[#BFDDF0] bg-white hover:border-[#111110]/50'
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-4.5 sm:p-5 text-right flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-[#111110] hover:bg-gray-50/60 transition-colors cursor-pointer min-h-[52px]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-[#E4F5FF] text-[#111110] text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                        {formatPersianNumber(index + 1)}
                      </span>
                      <span>{faq.q}</span>
                    </div>

                    <div className="p-1 rounded-full bg-gray-100 text-[#111110] shrink-0">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 stroke-[2.2px]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 stroke-[2.2px]" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="p-5 pt-1 text-xs sm:text-sm text-[#2A333C] leading-[1.8] border-t border-[#BFDDF0]/40 bg-[#F8FBFE]/70 font-normal">
                      <p className="whitespace-pre-line">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
