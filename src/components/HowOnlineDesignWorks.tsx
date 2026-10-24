import React from 'react';
import { SiteContent } from '../lib/types';
import { Sparkles, Shirt, Palette, PackageCheck, ArrowLeft } from 'lucide-react';

interface HowOnlineDesignWorksProps {
  content: SiteContent['howItWorks'];
  onOpenCustomizer: () => void;
}

export const HowOnlineDesignWorks: React.FC<HowOnlineDesignWorksProps> = ({
  content,
  onOpenCustomizer
}) => {
  const steps = [
    {
      num: '۰۱',
      icon: <Shirt className="w-5 h-5 text-white" />,
      title: content?.step1Title || 'انتخاب محصول دلخواه',
      desc: 'انتخاب کالای مورد نظر از میان محصولات سفارشی فروشگاه برای درج طرح و شخصی‌سازی.'
    },
    {
      num: '۰۲',
      icon: <Palette className="w-5 h-5 text-white" />,
      title: content?.step2Title || 'جانمایی طرح، متن یا مونوگرام',
      desc: 'بارگذاری لوگو، انتخاب تایپوگرافی یا نمادهای اختصاصی در محیط استودیو.'
    },
    {
      num: '۰۳',
      icon: <PackageCheck className="w-5 h-5 text-white" />,
      title: content?.step3Title || 'تولید اختصاصی و تحویل فوری',
      desc: 'تولید باکیفیت و کنترل نهایی سلامت کالا و ارسال سریع به سراسر کشور.'
    }
  ];

  return (
    <section className="w-full py-12 sm:py-16 md:py-20 bg-white border-y border-[#BFDDF0] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14 text-right">
          <div>
            <span className="font-serif text-[11px] font-bold brand-tracking text-[#4A5560] uppercase">
              STUDIO PROCESS · ATELIER
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111110] mt-1.5">
              مراحل خلق و سفارش اختصاصی در استودیو
            </h2>
          </div>

          <button
            onClick={onOpenCustomizer}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-5 py-3 rounded-xl bg-[#111110] text-white hover:bg-[#2A2A28] shadow-sm hover:shadow-md transition-all self-start sm:self-auto min-h-[44px] cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-[#E4F5FF]" />
            <span>ورود مستقیم به آتلیه طراحی</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Steps in RTL order (Step 1 on the right, 2 in center, 3 on left) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {/* RTL Connecting Line for Desktop */}
          <div className="hidden md:block absolute top-[52px] right-[15%] left-[15%] h-0.5 bg-[#BFDDF0] -z-0 pointer-events-none" />

          {steps.map((st, idx) => (
            <div
              key={idx}
              className="relative z-10 flex flex-col p-6 rounded-2xl border border-[#BFDDF0] bg-[#E4F5FF]/25 hover:bg-white hover:shadow-lg transition-all duration-300 text-right group"
            >
              <div className="flex items-center justify-between mb-5">
                {/* High-Contrast Icon Circle */}
                <div className="w-12 h-12 rounded-2xl bg-[#111110] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 shrink-0">
                  {st.icon}
                </div>

                {/* Large High-Contrast Step Number in Iranian Font */}
                <span className="font-sans text-3xl sm:text-4xl font-extrabold text-[#111110] font-persian-nums tracking-normal opacity-85">
                  {st.num}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-[#111110] leading-snug">
                  {st.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#4A5560] leading-relaxed">
                  {st.desc}
                </p>
              </div>

              {/* Step indicator tag */}
              <div className="mt-4 pt-3 border-t border-[#BFDDF0]/60 flex items-center justify-between text-[11px] text-[#4A5560]">
                <span>گام {st.num}</span>
                <span className="font-medium text-[#111110]">مرحله تایید خودکار</span>
              </div>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
};

