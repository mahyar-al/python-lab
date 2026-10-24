import {
  Category,
  Product,
  SiteContent,
  DiscountCode,
  BannerAd,
  CategoryAttribute,
  BestSellerItem,
  TopWeeklyItem
} from './types';
import {
  DEFAULT_BEST_SELLER_ITEMS,
  DEFAULT_TOP_WEEKLY_ITEMS
} from './specialSectionsData';

export const DEFAULT_CATEGORIES: Category[] = [];

export const DEFAULT_CATEGORY_ATTRIBUTES: CategoryAttribute[] = [];

export const DEFAULT_DISCOUNTS: DiscountCode[] = [
  {
    id: 'disc-morico2026',
    code: 'MORICO2026',
    type: 'percentage',
    amount: 15,
    percent: 15,
    description: 'تخفیف ویژه ۱۵٪ روی کالکشن ۲۰۲۶',
    minOrderAmount: 500000,
    maxDiscountAmount: 250000,
    active: true,
    usedCount: 0,
    usageLimit: 100
  },
  {
    id: 'disc-welcome10',
    code: 'WELCOME10',
    type: 'percentage',
    amount: 10,
    percent: 10,
    description: 'تخفیف خرید اول ۱۰٪',
    minOrderAmount: 300000,
    maxDiscountAmount: 150000,
    active: true,
    usedCount: 0,
    usageLimit: 500
  },
  {
    id: 'disc-atelier50',
    code: 'ATELIER50',
    type: 'fixed',
    amount: 50000,
    description: '۵۰ هزار تومان هدیه خرید روی سفارشات بالای ۴۰۰ هزار تومان',
    minOrderAmount: 400000,
    active: true,
    usedCount: 0,
    usageLimit: 200
  }
];

export const DEFAULT_PRODUCTS: Product[] = [];

export const DEFAULT_SITE_CONTENT: SiteContent = {
  branding: {
    logoUrl: '/brand/morico-logo.jpg',
    siteTitle: 'MORICO STYLE',
    siteSubtitle: 'فروشگاه موریکو',
    primaryColor: '#111110',
    accentColor: '#FFFFFF'
  },

  hero: {
    badge: 'فروشگاه اینترنتی موریکو',
    title: 'فروشگاه اینترنتی موریکو؛ خرید آنلاین کالاهای متنوع و باکیفیت',
    description: 'مرجع خرید آنلاین انواع کالای دیجیتال، دکوراسیون و نور، پوشاک، لوازم تحریر و محصولات سفارشی با تضمین اصالت و ارسال سریع به سراسر کشور.',
    ctaPrimary: 'مشاهده کل کاتالوگ فروشگاه',
    ctaSecondary: 'استودیو طراحی آنلاین',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&auto=format&fit=crop&q=80',
    floatingTagTitle: 'تنوع گسترده دسته‌بندی‌ها',
    floatingTagSubtitle: 'کالای دیجیتال، دکوراسیون، پوشاک و محصولات سفارشی',
    features: [
      { title: 'تضمین اصالت تمام کالاها' },
      { title: 'ارسال سریع به سراسر کشور' },
      { title: '۷ روز مهلت تست و مرجوعی' }
    ]
  },
  sections: {
    showHero: true,
    showQuickCategories: true,
    showBanners: true,
    showProcess: true,
    showCatalog: false,
    showBestSellers: true,
    showTopWeekly: true,
    showCraftsmanship: true,
    showFaq: true,
    sectionOrder: ['hero', 'quick_categories', 'banners', 'bestsellers', 'top_weekly', 'process', 'craftsmanship', 'faq']
  },
  bestSellers: DEFAULT_BEST_SELLER_ITEMS,
  topWeekly: DEFAULT_TOP_WEEKLY_ITEMS,
  craftsmanship: {
    badge: 'درباره فروشگاه موریکو',
    title: 'اصالت کیفیت، تنوع محصولات و خرید مطمئن',
    description: 'فروشگاه موریکو یک فروشگاه اینترنتی جامع است که با هدف عرضه کالاهای منتخب، کاربردی و اصیل در دسته‌بندی‌های گوناگون فعالیت می‌کند. تمامی محصولات پس از تایید کیفی به کاتالوگ اضافه شده و با گارانتی و ضمانت بازگشت ارسال می‌گردند.',
    features: [
      { title: 'بررسی دقیق مشخصات فنی', subtitle: 'تطابق کامل کالای تحویلی با مشخصات ثبت‌شده' },
      { title: 'پشتیبانی دائمی سفارشات', subtitle: 'همراهی با مشتری از لحظه ثبت سفارش تا تحویل' },
      { title: 'بسته‌بندی ایمن و ضربه‌گیر', subtitle: 'ارسال تخصصی متناسب با حساسیت کالا' }
    ],
    image: '/brand/morico-logo.jpg'
  },
  faq: [
    {
      id: 'faq-1',
      q: 'آیا تمام کالاهای دیجیتال و دکوراسیون دارای گارانتی هستند؟',
      a: 'بله، کلیه کالاهای دیجیتال دارای گارانتی رسمی معتبر شرکتی (۱۸ الی ۲۴ ماه) و ۷ روز مهلت تست اصالت هستند. همچنین اقلام دکوراسیون و شکستنی با بسته‌بندی ویژه و ضمانت سلامت هنگام تحویل ارسال می‌شوند.'
    },
    {
      id: 'faq-2',
      q: 'محصولات سفارشی و قابلیت طراحی آنلاین چگونه انجام می‌شود؟',
      a: 'در محصولاتی که قابلیت سفارشی‌سازی دارند، دکمه «طراحی آنلاین» فعال است. شما می‌توانید مونوگرام، لوگو، تایپوگرافی یا تصاویر دلخواهتان را با ابزار استودیو روی محصول چیدمان کنید و مستقیماً سفارش دهید.'
    },
    {
      id: 'faq-3',
      q: 'مدت زمان آماده‌سازی و ارسال سفارشات چقدر است؟',
      a: 'کالاهای موجود در انبار ظرف ۲۴ ساعت کاری بسته‌بندی و تحویل پست پیشتاز یا تیپاکس می‌شوند. سفارش‌های سفارشی چاپ نیز ظرف ۳ روز کاری تولید و ارسال می‌گردند.'
    },
    {
      id: 'faq-4',
      q: 'شرایط مرجوعی کالا چیست؟',
      a: 'در صورت هرگونه مغایرت با اطلاعات درج‌شده در سایت، نقص فنی یا آسیب‌دیدگی در حین ارسال، کالا تا ۷ روز پس از تحویل بدون قید و شرط تعویض یا مبلغ آن عودت داده می‌شود.'
    }
  ],
  howItWorks: {
    step1Title: 'انتخاب کالا از دسته‌بندی‌های متنوع',
    step1Desc: 'از بین کالاهای دیجیتال، دکوراسیون خانه، پوشاک یا لوازم تحریر، محصول دلخواهتان را بیابید.',
    step2Title: 'بررسی مشخصات فنی و تنوع',
    step2Desc: 'رنگ، مدل، ظرفیت، گارانتی یا مشخصات فنی اختصاصی هر کالا را انتخاب کنید.',
    step3Title: 'پرداخت امن و تحویل فوری درب منزل',
    step3Desc: 'سفارش شما با بسته‌بندی اختصاصی و بیمه باربری به سراسر کشور ارسال خواهد شد.'
  },
  footer: {
    phone: '۰۲۱-۲۲۰۸۹۴۱۰',
    address: 'تهران، خیابان فرشته (شهید فیاضی)، خیابان مریم غربی، پلاک ۲۴، استودیو و فروشگاه مرکزی MORICO',
    email: 'support@moricostyle.com',
    instagram: '@moricostyle',
    telegram: 't.me/moricostyle',
    workingHours: 'شنبه تا پنج‌شنبه: ۱۰:۰۰ الی ۲۰:۰۰',
    enamadActive: true,
    aboutText: 'فروشگاه چندمنظوره MORICO؛ ارائه‌دهنده منتخبی از برترین کالاهای دیجیتال، دکوراسیون مینیمال، پوشاک ارگانیک و محصولات سفارشی با تضمین اصالت و سلامت.',
    copyrightText: 'تمامی حقوق مادی و معنوی برای فروشگاه اینترنتی MORICO STYLE محفوظ است.'
  },
  announcementBar: {
    enabled: true,
    text: 'فروشگاه چندمنظوره MORICO فعال شد — ارسال رایگان سفارشات اول با کد WELCOME10',
    discountCode: 'WELCOME10',
    supportPhone: '۰۲۱-۲۲۰۸۹۴۱۰',
    bgColor: '#111110',
    textColor: '#FFFFFF'
  },
  navLinks: [
    { id: 'nav-1', label: 'صفحه اصلی', href: 'home', active: true, sortOrder: 1 },
    { id: 'nav-2', label: 'کاتالوگ و محصولات', href: 'catalog', active: true, sortOrder: 2 },
    { id: 'nav-3', label: 'طراحی آنلاین و سفارشی', href: 'customizer', active: true, highlight: false, sortOrder: 3 },
    { id: 'nav-4', label: 'درباره ما و اصالت کالا', href: 'story', active: true, sortOrder: 4 },
    { id: 'nav-5', label: 'رهگیری سفارشات', href: 'track', active: true, sortOrder: 5 }
  ],
  policyPages: {
    about: 'فروشگاه اینترنتی و آتلیه طراحی MORICO با هدف ارائه کالاهای باکیفیت، بدون واسطه و اصیل در دسته‌بندی‌های دیجیتال، لوازم خانه، پوشاک و محصولات چاپی سفارشی راه‌اندازی شده است.',
    terms: '۱. ثبت سفارش در MORICO به منزله پذیرش کامل قوانین و رویه‌های فروشگاه است.\n۲. کلیه سفارشات با ضمانت تطابق فیزیکی و اصالت کالا ارسال می‌شوند.\n۳. سفارش‌های چاپی و سفارشی پس از تایید مشتری و شروع چاپ امکان لغو ندارند.',
    privacy: 'فروشگاه موریکو به حریم خصوصی تمامی همراهان خود احترام کامل می‌گذارد. شماره‌های تماس و نشانی‌های پستی ثبت‌شده صرفاً برای تحویل مرسولات استفاده شده و محرمانه باقی می‌مانند.',
    returns: 'تمامی اقلام دارای ۷ روز مهلت تست فنی یا سلامت فیزیکی هستند. در صورت وجود هرگونه مغایرت یا نقص، سفارش بدون هزینه تعویض یا مسترد می‌گردد.',
    shipping: 'ارسال با پست پیشتاز بیمه‌شده ظرف ۲ الی ۴ روز کاری به سراسر کشور.\nامکان تحویل اکسپرس در همان روز برای شهر تهران.',
    contact: 'نشانی مرکزی:\nتهران، خیابان فرشته (شهید فیاضی)، خیابان مریم غربی، پلاک ۲۴، مرکز خدمات MORICO\nتلفن تماس: ۰۲۱-۲۲۰۸۹۴۱۰\nپاسخگویی: ۱۰:۰۰ الی ۲۰:۰۰'
  },
  status: 'published',
  publishedAt: '2026-01-01T00:00:00Z'
};

// Unified Storage Keys for seamless sync across Storefront and Admin Panel
export const STORAGE_KEYS = {
  CATEGORIES: 'morico_categories_unified',
  CATEGORY_ATTRIBUTES: 'morico_category_attributes_unified',
  PRODUCTS: 'morico_products_unified',
  SITE_CONTENT: 'morico_site_content_unified',
  ORDERS: 'morico_orders_unified',
  DISCOUNTS: 'morico_discounts_unified',
  BANNERS: 'morico_banners_unified',
  USERS: 'morico_users_unified',
  BEST_SELLERS: 'morico_bestsellers_unified',
  TOP_WEEKLY: 'morico_top_weekly_unified'
};

// Broadcast event to notify all tabs/components to refresh their store state
export function broadcastStoreUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('morico_store_sync'));
  }
}

export const api = {
  async getBootstrap(): Promise<{
    siteContent: SiteContent;
    categories: Category[];
    categoryAttributes?: CategoryAttribute[];
    products: Product[];
    banners: BannerAd[];
    discounts: DiscountCode[];
    bestSellers?: BestSellerItem[];
    topWeekly?: TopWeeklyItem[];
  } | null> {
    try {
      const res = await fetch('/api/bootstrap');
      if (res.ok) {
        const data = await res.json();
        if (data.siteContent) localStorage.setItem(STORAGE_KEYS.SITE_CONTENT, JSON.stringify(data.siteContent));
        if (data.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
        if (data.categoryAttributes) localStorage.setItem(STORAGE_KEYS.CATEGORY_ATTRIBUTES, JSON.stringify(data.categoryAttributes));
        if (data.products) localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
        if (data.banners) localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(data.banners));
        if (data.bestSellers) localStorage.setItem(STORAGE_KEYS.BEST_SELLERS, JSON.stringify(data.bestSellers));
        if (data.topWeekly) localStorage.setItem(STORAGE_KEYS.TOP_WEEKLY, JSON.stringify(data.topWeekly));
        return data;
      }
    } catch (_) {}
    return null;
  },

  async getBestSellers(): Promise<BestSellerItem[]> {
    try {
      const res = await fetch('/api/bestsellers');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(STORAGE_KEYS.BEST_SELLERS, JSON.stringify(data));
        return data;
      }
    } catch (_) {}
    const saved = localStorage.getItem(STORAGE_KEYS.BEST_SELLERS);
    return saved ? JSON.parse(saved) : DEFAULT_BEST_SELLER_ITEMS;
  },

  async saveBestSellers(items: BestSellerItem[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.BEST_SELLERS, JSON.stringify(items));
    broadcastStoreUpdate();
    try {
      const token = localStorage.getItem('morico_admin_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/bestsellers', {
        method: 'PUT',
        headers,
        body: JSON.stringify(items)
      });
    } catch (_) {}
  },

  async getTopWeekly(): Promise<TopWeeklyItem[]> {
    try {
      const res = await fetch('/api/top-weekly');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(STORAGE_KEYS.TOP_WEEKLY, JSON.stringify(data));
        return data;
      }
    } catch (_) {}
    const saved = localStorage.getItem(STORAGE_KEYS.TOP_WEEKLY);
    return saved ? JSON.parse(saved) : DEFAULT_TOP_WEEKLY_ITEMS;
  },

  async saveTopWeekly(items: TopWeeklyItem[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.TOP_WEEKLY, JSON.stringify(items));
    broadcastStoreUpdate();
    try {
      const token = localStorage.getItem('morico_admin_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/top-weekly', {
        method: 'PUT',
        headers,
        body: JSON.stringify(items)
      });
    } catch (_) {}
  },

  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data));
        return data;
      }
    } catch (_) {}
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  },

  async getCategoryAttributes(categoryId?: string): Promise<CategoryAttribute[]> {
    try {
      const url = categoryId ? `/api/category-attributes?categoryId=${encodeURIComponent(categoryId)}` : '/api/category-attributes';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (_) {}
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORY_ATTRIBUTES);
    const all = saved ? JSON.parse(saved) : DEFAULT_CATEGORY_ATTRIBUTES;
    if (categoryId) {
      return all.filter((a: CategoryAttribute) => a.categoryId === 'all' || a.categoryId === categoryId);
    }
    return all;
  },

  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data));
        return data;
      }
    } catch (_) {}
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  },

  async getBanners(): Promise<BannerAd[]> {
    try {
      const res = await fetch('/api/banners');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(data));
        return data;
      }
    } catch (_) {}
    const saved = localStorage.getItem(STORAGE_KEYS.BANNERS);
    return saved ? JSON.parse(saved) : [];
  },

  async getContent(): Promise<SiteContent> {
    try {
      const res = await fetch('/api/content');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(STORAGE_KEYS.SITE_CONTENT, JSON.stringify(data));
        return data;
      }
    } catch (_) {}
    const saved = localStorage.getItem(STORAGE_KEYS.SITE_CONTENT);
    return saved ? JSON.parse(saved) : DEFAULT_SITE_CONTENT;
  },

  async updateContent(newContent: SiteContent): Promise<SiteContent> {
    localStorage.setItem(STORAGE_KEYS.SITE_CONTENT, JSON.stringify(newContent));
    broadcastStoreUpdate();
    try {
      const token = localStorage.getItem('morico_admin_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/content', {
        method: 'PUT',
        headers,
        body: JSON.stringify(newContent)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}
    return newContent;
  },

  async saveProducts(products: Product[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    broadcastStoreUpdate();
  },

  async saveCategories(categories: Category[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    broadcastStoreUpdate();
  }
};
