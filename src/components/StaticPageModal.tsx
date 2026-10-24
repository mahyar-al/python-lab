import React from 'react';
import { StaticPageId, SiteContent } from '../lib/types';
import { X, ShieldCheck, FileText, Phone, Mail, MapPin } from 'lucide-react';

interface StaticPageModalProps {
  pageId: StaticPageId | null;
  onClose: () => void;
  footerContent?: SiteContent['footer'];
  policyPages?: SiteContent['policyPages'];
  branding?: SiteContent['branding'];
}

export const StaticPageModal: React.FC<StaticPageModalProps> = ({
  pageId,
  onClose,
  footerContent,
  policyPages,
  branding
}) => {
  if (!pageId) return null;

  const siteTitle = branding?.siteTitle || 'MORICO STYLE';

  const getPageData = () => {
    switch (pageId) {
      case 'about':
        return {
          title: `درباره آتلیه مد ${siteTitle}`,
          content: (
            <div className="space-y-4 text-xs leading-relaxed text-[#4A5560] whitespace-pre-line">
              <p>
                {policyPages?.about ||
                  `استودیو موریکو استایل (${siteTitle}) با هدف ارائه پوشاک مینیمال، باکیفیت و بدون تاریخ انقضا تأسیس شده است. تمرکز ما بر روی طراحی بی‌صدا و لوکس (Quiet Luxury)، انتخاب دقیق الیاف صددرصد پنبه ارگانیک با گرماژ بالا و تولید در تیراژ محدود است.`}
              </p>
            </div>
          )
        };
      case 'terms':
        return {
          title: 'قوانین و شرایط استفاده از خدمات',
          content: (
            <div className="space-y-3 text-xs leading-relaxed text-[#4A5560] whitespace-pre-line">
              {policyPages?.terms ? (
                <p>{policyPages.terms}</p>
              ) : (
                <>
                  <p>۱. ثبت سفارش در {siteTitle} به منزله پذیرش کامل قوانین و رویه‌های استودیو است.</p>
                  <p>۲. کلیه سفارشات شخصی‌سازی شده در استودیو آنلاین پس از تایید نهایی خریدار و ورود به چرخه چاپ، امکان تغییر در محتوای طرح را ندارند.</p>
                  <p>۳. حقوق معنوی تمامی طرح‌های اختصاصی ثبت شده توسط مشتریان محفوظ است.</p>
                </>
              )}
            </div>
          )
        };
      case 'privacy':
        return {
          title: 'حریم خصوصی کاربران',
          content: (
            <div className="space-y-3 text-xs leading-relaxed text-[#4A5560] whitespace-pre-line">
              <p>
                {policyPages?.privacy ||
                  `استودیو ${siteTitle} به حریم خصوصی تمامی همراهان خود احترام کامل می‌گذارد. شماره‌های تماس و نشانی‌های پستی ثبت‌شده صرفاً برای تحویل مرسولات پستی استفاده شده و هرگز در اختیار شخص یا شرکت ثالث قرار نخواهد گرفت.`}
              </p>
            </div>
          )
        };
      case 'return-policy':
        return {
          title: 'ضمانت اصالت و شرایط بازگشت کالا',
          content: (
            <div className="space-y-3 text-xs leading-relaxed text-[#4A5560] whitespace-pre-line">
              <p>
                {policyPages?.returns ||
                  `تمامی اقلام دارای ۷ روز ضمانت تعویض یا مرجوعی بدون قید و شرط در صورت بروز هرگونه ایراد در دوخت، پارچه یا خطای چاپ هستند.\nکالا باید در شرایط اولیه و بدون بوگرفتگی یا شستشو به همراه بسته‌بندی اصلی مرجوع شود.`}
              </p>
            </div>
          )
        };
      case 'shipping':
        return {
          title: 'شیوه‌ها و زمان‌بندی ارسال سفارشات',
          content: (
            <div className="space-y-3 text-xs leading-relaxed text-[#4A5560] whitespace-pre-line">
              <p>
                {policyPages?.shipping ||
                  `سفارشات تهران: امکان تحویل اکسپرس ظرف ۲۴ ساعت کاری.\nسفارشات شهرستان: ارسال با پست پیشتاز بیمه‌شده ظرف ۲ الی ۴ روز کاری.\nسفارشات سفارشی آنلاین: به دلیل ظرافت چاپ دیجیتال مستقیم، ۳ الی ۴ روز کاری زمان آماده‌سازی نیاز دارند.`}
              </p>
            </div>
          )
        };
      case 'contact':
        return {
          title: 'ارتباط با استودیو و پشتیبانی',
          content: (
            <div className="space-y-4 text-xs text-[#111110]">
              {policyPages?.contact ? (
                <div className="text-[#4A5560] whitespace-pre-line leading-relaxed pb-2 border-b border-[#BFDDF0]">
                  {policyPages.contact}
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#4A5560]" />
                <span>شماره تماس: <span className="font-mono">{footerContent?.phone || '۰۲۱-۲۲۰۸۹۴۱۰'}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#4A5560]" />
                <span>ایمیل استودیو: <span className="font-mono">{footerContent?.email || 'atelier@moricostyle.com'}</span></span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#4A5560] shrink-0 mt-0.5" />
                <span>نشانی: {footerContent?.address || 'تهران، خیابان فرشته (شهید فیاضی)، خیابان مریم غربی، پلاک ۲۴'}</span>
              </div>
            </div>
          )
        };
      default:
        return {
          title: 'راهنما و اطلاعات',
          content: <p className="text-xs text-[#4A5560]">اطلاعات این بخش به زودی به‌روزرسانی خواهد شد.</p>
        };
    }
  };

  const { title, content } = getPageData();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#BFDDF0] rounded-[24px] w-full max-w-xl max-h-[90vh] overflow-y-auto text-right p-6 sm:p-8 shadow-2xl relative space-y-6">
        
        <div className="flex items-center justify-between pb-4 border-b border-[#BFDDF0]">
          <h3 className="text-lg font-bold text-[#111110]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-[#BFDDF0] text-[#4A5560] hover:text-[#111110] hover:bg-gray-50 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            aria-label="بستن پنجره"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-2">
          {content}
        </div>

        <div className="pt-4 border-t border-[#BFDDF0] flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-[#2F6B4F] font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>تأییدیه رسمی آتلیه {siteTitle}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#111110] text-white hover:bg-[#2A2A28] text-xs font-semibold cursor-pointer"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
};
