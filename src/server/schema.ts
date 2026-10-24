import { sanitizeText, cleanPhoneNumber } from './security';

// ============================================================================
// MASS ASSIGNMENT & SCHEMA VALIDATION (OWASP ASVS V5.1, V13.2)
// ============================================================================

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

// Strict state machine transitions for orders
const ORDER_STATE_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'RETURNED'],
  DELIVERED: [], // Terminal state
  CANCELLED: [], // Terminal state
  RETURNED: []   // Terminal state
};

export function isValidOrderStatus(status: string): status is OrderStatus {
  return [
    'PENDING_PAYMENT',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED'
  ].includes(status);
}

export function isValidOrderStatusTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = ORDER_STATE_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(targetStatus));
}

/**
 * Validates and extracts only allowlisted fields for Order creation.
 * Defends against Mass Assignment (CWE-915).
 */
export function sanitizeOrderInput(body: any): {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  province: string;
  city: string;
  postalCode: string;
  customerNotes?: string;
  paymentMethod: 'gateway' | 'card';
  promoCode?: string;
  items: Array<{
    productId: string;
    selectedColor?: string;
    selectedSize?: string;
    quantity: number;
    customization?: {
      customFee?: number;
      elements?: any[];
      mockupView?: string;
    };
  }>;
} | { error: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'داده‌های سفارش نامعتبر است.' };
  }

  const customerName = sanitizeText(body.customerName, 80);
  if (!customerName || customerName.length < 2) {
    return { error: 'نام و نام خانوادگی خریدار باید حداقل ۲ کاراکتر باشد.' };
  }

  const customerPhone = cleanPhoneNumber(body.customerPhone);
  if (!customerPhone || customerPhone.length < 10 || customerPhone.length > 14) {
    return { error: 'شماره تلفن همراه واردشده نامعتبر است.' };
  }

  const customerAddress = sanitizeText(body.customerAddress || body.address, 300);
  if (!customerAddress || customerAddress.length < 5) {
    return { error: 'نشانی پستی باید حداقل ۵ کاراکتر باشد.' };
  }

  const province = sanitizeText(body.province || body.customerProvince || 'تهران', 50);
  const city = sanitizeText(body.city || body.customerCity || 'تهران', 50);
  const postalCode = cleanPhoneNumber(body.postalCode || body.customerPostal || '');

  const customerEmail = body.customerEmail ? sanitizeText(body.customerEmail, 80) : undefined;
  const customerNotes = body.customerNotes ? sanitizeText(body.customerNotes, 300) : undefined;
  const promoCode = body.promoCode || body.appliedCode ? String(body.promoCode || body.appliedCode).trim().toUpperCase() : undefined;

  const paymentMethod =
    body.paymentMethod === 'gateway' ||
    (typeof body.paymentMethod === 'string' && body.paymentMethod.includes('درگاه'))
      ? 'gateway'
      : 'card';

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { error: 'سبد خرید نمی‌تواند خالی باشد.' };
  }

  if (body.items.length > 50) {
    return { error: 'تعداد اقلام سفارش بیش از حد مجاز (حداکثر ۵۰ قلم) است.' };
  }

  const validatedItems: any[] = [];
  for (const it of body.items) {
    if (!it || typeof it !== 'object') {
      return { error: 'آیتم نامعتبر در سبد خرید.' };
    }
    const productId = sanitizeText(it.productId || it.product?.id || '', 50);
    if (!productId) {
      return { error: 'شناسه محصول الزامی است.' };
    }
    const quantity = Math.floor(Number(it.quantity) || 1);
    if (quantity < 1 || quantity > 20) {
      return { error: 'تعداد هر محصول باید بین ۱ تا ۲۰ عدد باشد.' };
    }

    const selectedColor = it.selectedColor ? sanitizeText(it.selectedColor, 40) : undefined;
    const selectedSize = it.selectedSize ? sanitizeText(it.selectedSize, 30) : undefined;

    let customization: any = undefined;
    if (it.customization && typeof it.customization === 'object') {
      const rawFee = Number(it.customization.customFee) || 0;
      customization = {
        customFee: Math.max(0, Math.min(500000, rawFee)),
        elements: Array.isArray(it.customization.elements) ? it.customization.elements.slice(0, 20) : [],
        mockupView: sanitizeText(it.customization.mockupView || '', 30)
      };
    }

    validatedItems.push({
      productId,
      quantity,
      selectedColor,
      selectedSize,
      customization
    });
  }

  return {
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    province,
    city,
    postalCode,
    customerNotes,
    paymentMethod,
    promoCode,
    items: validatedItems
  };
}

/**
 * Whitelist extraction for Category updates.
 */
export function sanitizeCategoryInput(body: any, isNew = false): {
  title?: string;
  slug?: string;
  parentId?: string | null;
  icon?: string;
  image?: string;
  description?: string;
  sortOrder?: number;
  active?: boolean;
} | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'داده‌های دسته‌بندی نامعتبر است.' };

  const res: any = {};

  if (body.title !== undefined || isNew) {
    const title = sanitizeText(body.title, 60);
    if (!title) return { error: 'عنوان دسته‌بندی الزامی است.' };
    res.title = title;
  }

  if (body.slug !== undefined) {
    res.slug = sanitizeText(body.slug, 60) || undefined;
  }

  if (body.parentId !== undefined) {
    res.parentId = body.parentId ? sanitizeText(body.parentId, 60) : null;
  }

  if (body.icon !== undefined) res.icon = sanitizeText(body.icon, 50);
  if (body.image !== undefined) res.image = sanitizeText(body.image, 300);
  if (body.description !== undefined) res.description = sanitizeText(body.description, 300);
  if (body.sortOrder !== undefined) res.sortOrder = Number(body.sortOrder) || 0;
  if (body.active !== undefined) res.active = Boolean(body.active);

  return res;
}

/**
 * Whitelist extraction for Product updates.
 */
export function sanitizeProductInput(body: any, isNew = false): {
  name?: string;
  slug?: string;
  price?: number;
  discountPrice?: number;
  categoryId?: string;
  image?: string;
  images?: string[];
  description?: string;
  stock?: number;
  status?: 'active' | 'out_of_stock' | 'archived';
  isCustomizable?: boolean;
  colors?: any[];
  sizes?: any[];
  attributes?: any[];
} | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'داده‌های محصول نامعتبر است.' };

  const res: any = {};

  if (body.name !== undefined || isNew) {
    const name = sanitizeText(body.name, 100);
    if (!name) return { error: 'نام محصول الزامی است.' };
    res.name = name;
  }

  if (body.price !== undefined || isNew) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0 || price > 500000000) {
      return { error: 'قیمت محصول باید یک عدد معتبر باشد.' };
    }
    res.price = price;
  }

  if (body.discountPrice !== undefined) {
    const disc = Number(body.discountPrice);
    res.discountPrice = Number.isFinite(disc) && disc >= 0 ? disc : undefined;
  }

  if (body.categoryId !== undefined || isNew) {
    res.categoryId = sanitizeText(body.categoryId, 60);
  }

  if (body.image !== undefined) res.image = sanitizeText(body.image, 500);
  if (Array.isArray(body.images)) {
    res.images = body.images.slice(0, 10).map((u: any) => sanitizeText(u, 500));
  }

  if (body.description !== undefined) res.description = sanitizeText(body.description, 1000);

  if (body.stock !== undefined) {
    const stock = Number(body.stock);
    res.stock = Number.isFinite(stock) && stock >= 0 ? Math.floor(stock) : 0;
  }

  if (body.status !== undefined) {
    const validStatuses = ['active', 'out_of_stock', 'archived'];
    res.status = validStatuses.includes(body.status) ? body.status : 'active';
  }

  if (body.isCustomizable !== undefined) res.isCustomizable = Boolean(body.isCustomizable);
  if (Array.isArray(body.colors)) res.colors = body.colors.slice(0, 15);
  if (Array.isArray(body.sizes)) res.sizes = body.sizes.slice(0, 15);
  if (Array.isArray(body.attributes)) res.attributes = body.attributes.slice(0, 20);

  return res;
}
