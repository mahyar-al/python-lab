export type ProductStatus = 'active' | 'inactive' | 'draft' | 'out_of_stock' | 'archived';

export interface ProductColor {
  name: string;
  hex: string;
  image?: string;
}

export interface PrintableArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProductView {
  id: string;
  name: string;
  title: string;
  image: string;
  printableArea?: PrintableArea;
}

export type AttributeType =
  | 'text'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'color'
  | 'boolean';

export interface CategoryAttribute {
  id: string;
  categoryId: string; // 'all' for global or category id
  name: string;
  key: string;
  type: AttributeType;
  options?: string[]; // predefined options for select / multiselect
  unit?: string; // e.g. "گیگابایت", "ساعت", "سانتی‌متر", "گرم"
  filterable: boolean; // whether to show in category page filters
  showInProductPage: boolean; // whether to display in technical specifications
  required?: boolean;
  sortOrder?: number;
}

export interface ProductVariant {
  id: string;
  title: string; // e.g. "مشکی / ۲۵۶ گیگابایت" or "سایز L / کرم"
  sku?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  attributes: Record<string, string>; // e.g. { color: 'مشکی', storage: '256GB' }
  image?: string;
}

export interface ProductSpecification {
  id?: string;
  key: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  discountPrice?: number;
  categoryId: string;
  relatedCategoryIds?: string[];
  image: string;
  images?: string[];
  videoUrl?: string;
  brand?: string;
  sku?: string;
  barcode?: string;
  stock: number;
  status: ProductStatus;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isOnSale?: boolean;
  weight?: string | number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  warranty?: string;
  shippingInfo?: string;
  returnPolicy?: string;
  tags?: string[];
  attributes?: Record<string, any>;
  specifications?: ProductSpecification[];
  variants?: ProductVariant[];
  colors?: ProductColor[];
  sizes?: string[];
  customizable?: boolean;
  views?: ProductView[];
  details?: string[] | any;
  material?: string;
  fit?: string;
  rating?: number;
  ratingCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  title: string;
  slug: string;
  parentId?: string | null;
  description?: string;
  image?: string;
  banner?: string;
  sortOrder?: number;
  active?: boolean;
  showInMainMenu?: boolean;
  showInHome?: boolean;
  showInFooter?: boolean;
  productCount?: number;
  icon?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export type GarmentViewId = 'front' | 'back' | 'left' | 'right';

export interface CustomLayer {
  id: string;
  type: 'text' | 'image' | 'monogram';
  content: string; // for image: dataUrl or pngUrl
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  scale?: number;
  rotation?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fill?: string;
  letterSpacing?: number;
  flipped?: boolean;
  width?: number;
  height?: number;
  originalImage?: string;
  hasBgRemoved?: boolean;
}

export interface ViewCustomization {
  viewId: GarmentViewId;
  viewTitle: string;
  garmentImage?: string;
  printableArea?: PrintableArea;
  layers: CustomLayer[];
  designImageUrl?: string;
  previewMockupUrl?: string;
}

export interface CustomizationData {
  side?: GarmentViewId | 'front' | 'back';
  views?: {
    front?: ViewCustomization;
    back?: ViewCustomization;
    left?: ViewCustomization;
    right?: ViewCustomization;
  };
  layers?: CustomLayer[];
  customFee?: number;
  designImageUrl?: string;
  previewMockupUrl?: string;
  viewName?: string;
  position?: { x: number; y: number };
  scale?: number;
  rotation?: number;
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  selectedColor?: string;
  selectedSize?: string;
  selectedVariantId?: string;
  selectedVariant?: ProductVariant;
  selectedAttributes?: Record<string, string>;
  quantity: number;
  unitPrice?: number;
  customization?: CustomizationData;
}

export type OrderStatus =
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'CANCELED'
  | 'REFUNDED'
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderPaymentInfo {
  gateway?: string;
  refId?: string;
  cardPan?: string;
  paidAt?: string;
  [key: string]: any;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  customerNotes?: string;
  postalCode?: string;
  customerPostal?: string;
  city?: string;
  customerCity?: string;
  province?: string;
  customerProvince?: string;
  items: CartItem[];
  totalAmount: number;
  total?: number;
  subtotal?: number;
  discountAmount?: number;
  discount?: number;
  promoCode?: string;
  shippingFee?: number;
  shipping?: number;
  status: OrderStatus;
  paymentStatus?: string;
  paymentInfo?: OrderPaymentInfo;
  trackingCode: string;
  paymentMethod?: string;
  customization?: CustomizationData;
}

export interface DiscountCode {
  id: string;
  code: string;
  type?: 'percentage' | 'fixed';
  amount?: number;
  percent?: number;
  description?: string;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  expiresAt?: string;
  expiryDate?: string;
  usageLimit?: number;
  maxUses?: number;
  usageCount?: number;
  usedCount?: number;
  active: boolean;
}

export interface BannerAd {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  imageUrl: string;
  image?: string;
  linkUrl?: string;
  linkText?: string;
  buttonText?: string;
  backgroundColor?: string;
  bgGradient?: string;
  discount?: string;
  promoCode?: string;
  placement?: 'hero' | 'middle_banner' | 'top_bar' | 'footer_popup';
  sortOrder?: number;
  active: boolean;
  priority?: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'user' | 'staff';
  lastLogin?: string;
  loginCount?: number;
  joinDate?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'user' | 'staff';
  token?: string;
}

export interface PaymentGatewayStatus {
  gatewayName: string;
  configured: boolean;
  mode: 'sandbox' | 'production';
  merchantId?: string;
  disabledReason?: string;
}

export interface FaqItem {
  id: string;
  q: string;
  a: string;
}

export interface NavLinkItem {
  id: string;
  label: string;
  href: string;
  active: boolean;
  sortOrder?: number;
  highlight?: boolean;
}

export interface CategoryQuickIcon {
  id: string;
  title: string;
  badge?: string;
  icon: string; // e.g. 'ShoppingCart', 'Coins', 'Shirt', 'Laptop', 'Percent', 'CreditCard', 'Sparkles', 'MoreHorizontal', etc.
  customText?: string; // e.g. 'MS' or 'DS'
  bgColor: string; // e.g. '#E03E2D', '#005953', '#111110', etc.
  textColor?: string;
  badgeBgColor?: string;
  linkType: 'category' | 'page' | 'action' | 'more';
  linkTarget: string; // category id, page name, or 'more'
  active: boolean;
  sortOrder: number;
}

export interface HeroSlideProduct {
  name: string;
  image: string;
  badge?: string;
}

export interface HeroSlideItem {
  id: string;
  badge?: string;
  badgeIcon?: 'sparkles' | 'flame' | 'tag';
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  posterUrl?: string; // Uploaded full hero poster banner
  targetCategory?: string;
  targetAction?: 'catalog' | 'customizer' | 'bestsellers' | 'top_weekly';
  bgColor: string;
  accentColor: string;
  podiumColor?: string;
  podiumHighlight?: string;
  glowColor?: string;
  active?: boolean;
  sortOrder?: number;
  products?: {
    center: HeroSlideProduct;
    left: HeroSlideProduct;
    right: HeroSlideProduct;
    accent?: {
      name: string;
      image: string;
    };
  };
}

export interface BestSellerItem {
  id: string;
  rank7d: number;
  rank30d: number;
  name: string;
  category: string;
  image: string;
  price: number;
  discountPrice?: number;
  rating?: number;
  reviewsCount?: number;
  tag?: string;
  salesCount7d?: number;
  salesCount30d?: number;
}

export interface TopWeeklyItem {
  id: string;
  rankThisWeek: number;
  rankLastWeek: number;
  name: string;
  category: string;
  image: string;
  price: number;
  discountPrice?: number;
  rating: number;
  satisfactionPercent: number;
  reviewsCount: number;
  tag: string;
  awardTitle?: string;
}

export interface SiteContent {
  branding?: {
    logoUrl?: string;
    siteTitle?: string;
    siteSubtitle?: string;
    primaryColor?: string;
    accentColor?: string;
  };
  hero?: {
    badge?: string;
    title?: string;
    description?: string;
    ctaPrimary?: string;
    ctaSecondary?: string;
    imageUrl?: string;
    floatingTagTitle?: string;
    floatingTagSubtitle?: string;
    floatingTagCtaText?: string;
    showFloatingTag?: boolean;
    showShowcaseCard?: boolean;
    showTrustBar?: boolean;
    features?: { title: string; subtitle?: string }[];
  };
  heroSlides?: HeroSlideItem[];
  categoryQuickIcons?: CategoryQuickIcon[];
  bestSellers?: BestSellerItem[];
  topWeekly?: TopWeeklyItem[];
  sections?: {
    showHero?: boolean;
    showQuickCategories?: boolean;
    showBanners?: boolean;
    showProcess?: boolean;
    showCatalog?: boolean;
    showBestSellers?: boolean;
    showTopWeekly?: boolean;
    showCraftsmanship?: boolean;
    showFaq?: boolean;
    sectionOrder?: ('hero' | 'quick_categories' | 'banners' | 'bestsellers' | 'top_weekly' | 'process' | 'catalog' | 'craftsmanship' | 'faq')[];
  };
  craftsmanship: {
    badge: string;
    title: string;
    description: string;
    features: { title: string; subtitle: string }[];
    image: string;
  };
  faq: FaqItem[];
  howItWorks: {
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
  };
  footer: {
    phone: string;
    address: string;
    email: string;
    instagram: string;
    telegram: string;
    workingHours: string;
    enamadActive: boolean;
    aboutText?: string;
    copyrightText?: string;
  };
  announcementBar?: {
    enabled: boolean;
    text: string;
    discountCode?: string;
    supportPhone?: string;
    link?: string;
    bgColor?: string;
    textColor?: string;
  };
  navLinks?: NavLinkItem[];
  policyPages?: {
    terms?: string;
    privacy?: string;
    returns?: string;
    contact?: string;
    about?: string;
    shipping?: string;
    [key: string]: any;
  };
  status?: 'published' | 'draft';
  publishedAt?: string;
  draftUpdatedAt?: string;
}

export type StaticPageId =
  | 'about'
  | 'terms'
  | 'privacy'
  | 'return-policy'
  | 'shipping'
  | 'contact'
  | 'size-guide';
