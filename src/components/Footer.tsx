import React from 'react';
import { SiteContent, StaticPageId } from '../lib/types';
import { Sparkles, Phone, Mail, MapPin, Instagram, Send, ShieldCheck, Clock, ExternalLink } from 'lucide-react';

interface FooterProps {
  footerContent?: SiteContent['footer'];
  branding?: SiteContent['branding'];
  onNavigate: (sectionId: string) => void;
  onOpenCustomizer: () => void;
  onOpenStaticPage: (pageId: StaticPageId) => void;
}

export const Footer: React.FC<FooterProps> = ({
  footerContent,
  branding,
  onNavigate,
  onOpenCustomizer,
  onOpenStaticPage
}) => {
  const logoUrl = branding?.logoUrl || '/brand/morico-logo.jpg';
  const siteTitle = branding?.siteTitle || 'MORICO STYLE';
  const siteSubtitle = branding?.siteSubtitle || 'فروشگاه موریکو';
  const aboutText =
    footerContent?.aboutText && !footerContent.aboutText.includes('پنبه ارگانیک')
      ? footerContent.aboutText
      : 'فروشگاه اینترنتی موریکو؛ مرجع خرید آنلاین انواع کالای دیجیتال، دکوراسیون و نور، پوشاک و محصولات سفارشی با تضمین اصالت و ارسال سریع به سراسر کشور.';
  const copyrightText =
    footerContent?.copyrightText ||
    '© ۲۰۲۶ فروشگاه اینترنتی موریکو (MORICO STYLE). تمامی حقوق محفوظ است.';

  const rawPhone = footerContent?.phone || '۰۲۱-۲۲۰۸۹۴۱۰';
  const telHref = rawPhone.replace(/[^0-9+]/g, '') || '02122089410';
  const email = footerContent?.email || 'atelier@moricostyle.com';
  const address = footerContent?.address || 'تهران، خیابان فرشته (شهید فیاضی)، خیابان مریم غربی، پلاک ۲۴';

  return (
    <footer className="w-full bg-[#111110] text-[#FFFFFF] pt-16 sm:pt-20 pb-12 border-t border-white/10 text-right" dir="rtl">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        
        {/* Main 12-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-white/15">
          
          {/* Brand & Atelier Info (Col 1-5) */}
          <div className="md:col-span-5 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                <img
                  src={logoUrl}
                  alt={siteTitle}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/brand/morico-logo.jpg';
                  }}
                />
              </div>
              <div>
                <span className="font-serif text-xl sm:text-2xl tracking-[0.2em] font-bold text-white block uppercase">
                  {siteTitle}
                </span>
                <span className="text-xs text-[#D1D9E2] block mt-0.5 font-medium">
                  {siteSubtitle}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#D1D9E2] leading-[1.8] max-w-md">
              {aboutText}
            </p>

            {/* Actionable Contact Items with WCAG AA High Contrast */}
            <div className="space-y-3 pt-2 text-xs sm:text-sm text-[#E2E8F0]">
              {/* Address (actionable) */}
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 text-[#E2E8F0] hover:text-white transition-colors group cursor-pointer"
                title="مسیریابی در نقشه"
              >
                <MapPin className="w-4 h-4 text-[#BFDDF0] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="leading-relaxed group-hover:underline">{address}</span>
              </a>

              {/* Phone (actionable tel) */}
              <a
                href={`tel:${telHref}`}
                className="flex items-center gap-3 text-[#E2E8F0] hover:text-white transition-colors group cursor-pointer"
                title="تماس تلفنی مستقیم با آتلیه"
              >
                <Phone className="w-4 h-4 text-[#BFDDF0] shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-mono text-xs sm:text-sm tracking-wider group-hover:underline" dir="ltr">
                  {rawPhone}
                </span>
              </a>

              {/* Email (actionable mailto) */}
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-3 text-[#E2E8F0] hover:text-white transition-colors group cursor-pointer"
                title="ارسال ایمیل به آتلیه"
              >
                <Mail className="w-4 h-4 text-[#BFDDF0] shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-mono text-xs sm:text-sm group-hover:underline">
                  {email}
                </span>
              </a>

              {/* Working Hours */}
              {footerContent?.workingHours && (
                <div className="flex items-center gap-3 text-[#CBD5E1]">
                  <Clock className="w-4 h-4 text-[#BFDDF0] shrink-0" />
                  <span>{footerContent.workingHours}</span>
                </div>
              )}
            </div>
          </div>

          {/* Links: Website Sections (Col 6-8) */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-serif brand-tracking text-white uppercase font-bold tracking-wider">
              بخش‌های وبسایت
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-[#D1D9E2]">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-white hover:translate-x-[-2px] transition-all cursor-pointer flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BFDDF0]" />
                  <span>صفحه اصلی</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('catalog')}
                  className="hover:text-white hover:translate-x-[-2px] transition-all cursor-pointer flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BFDDF0]" />
                  <span>کاتالوگ کامل محصولات</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('bestsellers')}
                  className="hover:text-rose-400 hover:translate-x-[-2px] transition-all cursor-pointer flex items-center gap-2 text-rose-300 font-semibold"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4056]" />
                  <span>پرفروش‌ترین‌ها (پیشنهاد ویژه)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('top_weekly')}
                  className="hover:text-amber-400 hover:translate-x-[-2px] transition-all cursor-pointer flex items-center gap-2 text-amber-300 font-semibold"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>برترین‌های هفته (منتخب خریداران)</span>
                </button>
              </li>


              <li>
                <button
                  onClick={onOpenCustomizer}
                  className="hover:text-white hover:translate-x-[-2px] transition-all flex items-center gap-2 cursor-pointer font-semibold text-white"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#BFDDF0]" />
                  <span>استودیو طراحی آنلاین</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('story')}
                  className="hover:text-white hover:translate-x-[-2px] transition-all cursor-pointer flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BFDDF0]" />
                  <span>اصالت الیاف و داستان برند</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('track')}
                  className="hover:text-white hover:translate-x-[-2px] transition-all cursor-pointer flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BFDDF0]" />
                  <span>سامانه رهگیری مرسولات</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Links: Customer Service & Trust (Col 9-12) */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs font-serif brand-tracking text-white uppercase font-bold tracking-wider">
              خدمات مشتریان و راهنما
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-[#D1D9E2]">
              <li>
                <button
                  onClick={() => onOpenStaticPage('about')}
                  className="hover:text-white hover:translate-x-[-2px] transition-all cursor-pointer flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BFDDF0]" />
                  <span>درباره آتلیه موریکو</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenStaticPage('shipping')}
                  className="hover:text-white hover:translate-x-[-2px] transition-all cursor-pointer flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BFDDF0]" />
                  <span>شیوه‌ها و زمان ارسال</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenStaticPage('return-policy')}
                  className="hover:text-white hover:translate-x-[-2px] transition-all cursor-pointer flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BFDDF0]" />
                  <span>ضمانت ۷ روزه و شرایط تعویض</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenStaticPage('terms')}
                  className="hover:text-white hover:translate-x-[-2px] transition-all cursor-pointer flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BFDDF0]" />
                  <span>قوانین و حریم خصوصی</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenStaticPage('contact')}
                  className="hover:text-white hover:translate-x-[-2px] transition-all cursor-pointer flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BFDDF0]" />
                  <span>اطلاعات تماس و نشانی حضوری</span>
                </button>
              </li>
            </ul>

            {/* Social & Enamad Trust Badges */}
            <div className="pt-3 flex items-center gap-3 flex-wrap">
              {footerContent?.instagram && (
                <a
                  href={`https://instagram.com/${footerContent.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white hover:text-[#111110] flex items-center justify-center text-white transition-all shadow-xs"
                  title="صفحه رسمی اینستاگرام موریکو"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {footerContent?.telegram && (
                <a
                  href={footerContent.telegram.startsWith('http') ? footerContent.telegram : `https://${footerContent.telegram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white hover:text-[#111110] flex items-center justify-center text-white transition-all shadow-xs"
                  title="کانال رسمی تلگرام موریکو"
                >
                  <Send className="w-4 h-4" />
                </a>
              )}
              {footerContent?.enamadActive && (
                <div className="px-3 py-1.5 rounded-xl bg-white/10 text-xs text-white flex items-center gap-1.5 border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-[#BFDDF0]" />
                  <span>نماد اعتماد الکترونیکی</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Bottom copyright with high contrast */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#CBD5E1]">
          <div>
            {copyrightText}
          </div>
          <div className="font-serif brand-tracking uppercase text-[11px] tracking-[0.25em] text-[#94A3B8]">
            ATELIER 2026 · QUIET LUXURY & ORGANIC APPAREL
          </div>
        </div>

      </div>
    </footer>
  );
};
