import { BestSellerItem, TopWeeklyItem } from './types';

export const CATEGORY_CHIPS = [
  { id: 'all', label: 'همه نوع کالا' },
  { id: 'mobile', label: 'موبایل' },
  { id: 'toys', label: 'اسباب بازی' },
  { id: 'digital', label: 'کالای دیجیتال' },
  { id: 'gold', label: 'طلا و نقره' },
  { id: 'apparel', label: 'مد و پوشاک' },
  { id: 'home', label: 'خانه و آشپزخانه' },
  { id: 'grocery', label: 'کالای خوراکی و اساسی' },
  { id: 'stationery', label: 'کتاب، لوازم تحریر و هنر' },
  { id: 'petshop', label: 'پت شاپ' },
  { id: 'appliances', label: 'لوازم خانگی برقی' },
  { id: 'baby', label: 'مادر و کودک' },
  { id: 'health', label: 'سلامت و پزشکی' },
  { id: 'beauty', label: 'آرایشی و بهداشتی' },
  { id: 'sports', label: 'ورزش و سفر' },
  { id: 'tools', label: 'ابزار آلات و تجهیزات' },
  { id: 'vehicle', label: 'خودرو و موتورسیکلت' },
  { id: 'local', label: 'محصولات بومی و محلی' },
  { id: 'giftcard', label: 'کارت هدیه' }
];

export const DEFAULT_BEST_SELLER_ITEMS: BestSellerItem[] = [];

export const DEFAULT_TOP_WEEKLY_ITEMS: TopWeeklyItem[] = [];
