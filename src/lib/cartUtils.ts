import { CartItem, Product, DiscountCode } from './types';

export const SHIPPING_THRESHOLD = 1500000; // Free shipping for orders >= 1,500,000 Tomans
export const STANDARD_SHIPPING_FEE = 45000; // 45,000 Tomans flat rate for standard shipping

export interface CartCalculationResult {
  originalSubtotal: number;       // Sum of (original price + customFee) * quantity
  productDiscountTotal: number;   // Total savings from product discount prices
  subtotalAfterProductDiscount: number; // Sum of (effective product price + customFee) * quantity
  promoDiscount: number;          // Discount from coupon code
  shippingFee: number;            // Shipping fee (0 if free threshold reached)
  finalTotal: number;             // Amount to pay
  totalItemsCount: number;        // Sum of all item quantities
  hasOutOfStock: boolean;         // True if any item has 0 stock in catalog
  hasStockReduced: boolean;       // True if any item quantity exceeds available stock
}

/**
 * Calculates shipping fee based on current subtotal
 */
export function calculateShipping(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
}

/**
 * Validates a discount code against current cart subtotal and discounts list
 */
export function validatePromoCode(
  codeStr: string,
  subtotal: number,
  discounts: DiscountCode[]
): { valid: boolean; error?: string; discount?: DiscountCode; amount?: number } {
  const normalized = codeStr.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, error: 'لطفاً کد تخفیف را وارد نمایید.' };
  }

  const found = discounts.find(
    (d) => d.code.toUpperCase() === normalized && d.active !== false
  );

  if (!found) {
    return { valid: false, error: 'کد تخفیف وارد شده معتبر نیست یا غیرفعال شده است.' };
  }

  // Check expiration date
  const expiry = found.expiresAt || found.expiryDate;
  if (expiry) {
    const expDate = new Date(expiry).getTime();
    if (!isNaN(expDate) && expDate < Date.now()) {
      return { valid: false, error: 'مهلت استفاده از این کد تخفیف به پایان رسیده است.' };
    }
  }

  // Check usage limits
  const maxUses = found.maxUses ?? found.usageLimit;
  const usedCount = found.usedCount ?? found.usageCount ?? 0;
  if (maxUses !== undefined && maxUses > 0 && usedCount >= maxUses) {
    return { valid: false, error: 'سقف مجاز استفاده از این کد تخفیف به پایان رسیده است.' };
  }

  // Check minimum order amount
  if (found.minOrderAmount && subtotal < found.minOrderAmount) {
    return {
      valid: false,
      error: `حداقل مبلغ خرید برای اعمال این کد تخفیف ${found.minOrderAmount.toLocaleString('fa-IR')} تومان است.`
    };
  }

  // Calculate discount amount
  let discountAmount = 0;
  const isPercentage = found.type === 'percentage' || (found.percent && !found.amount);
  const rate = found.amount ?? found.percent ?? 0;

  if (isPercentage) {
    discountAmount = Math.round((subtotal * rate) / 100);
    if (found.maxDiscountAmount && discountAmount > found.maxDiscountAmount) {
      discountAmount = found.maxDiscountAmount;
    }
  } else {
    discountAmount = rate;
  }

  // Cannot discount more than subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  return {
    valid: true,
    discount: found,
    amount: discountAmount
  };
}

/**
 * Computes all financial totals with full accuracy and server/catalog alignment
 */
export function calculateCartTotals(
  cart: CartItem[],
  appliedPromo: DiscountCode | null,
  currentProducts: Product[]
): CartCalculationResult {
  let originalSubtotal = 0;
  let subtotalAfterProductDiscount = 0;
  let totalItemsCount = 0;
  let hasOutOfStock = false;
  let hasStockReduced = false;

  for (const item of cart) {
    const liveProd = currentProducts.find((p) => p.id === item.product.id) || item.product;
    const qty = Math.max(1, item.quantity);
    totalItemsCount += qty;

    const customFee = item.customization?.customFee || 0;
    const baseOrig = item.selectedVariant ? item.selectedVariant.price : (item.unitPrice || liveProd.price);
    const baseEffective = item.selectedVariant 
      ? (item.selectedVariant.discountPrice !== undefined && item.selectedVariant.discountPrice < item.selectedVariant.price ? item.selectedVariant.discountPrice : item.selectedVariant.price)
      : (liveProd.discountPrice !== undefined && liveProd.discountPrice < liveProd.price ? liveProd.discountPrice : (item.unitPrice || liveProd.price));

    const origUnitPrice = baseOrig + customFee;
    const effectiveUnitPrice = baseEffective + customFee;

    originalSubtotal += origUnitPrice * qty;
    subtotalAfterProductDiscount += effectiveUnitPrice * qty;

    const availableStock = item.selectedVariant ? item.selectedVariant.stock : liveProd.stock;
    if (availableStock === 0) {
      hasOutOfStock = true;
    } else if (qty > availableStock) {
      hasStockReduced = true;
    }
  }

  const productDiscountTotal = Math.max(0, originalSubtotal - subtotalAfterProductDiscount);

  let promoDiscount = 0;
  if (appliedPromo) {
    const promoValidation = validatePromoCode(appliedPromo.code, subtotalAfterProductDiscount, [appliedPromo]);
    if (promoValidation.valid && promoValidation.amount) {
      promoDiscount = promoValidation.amount;
    }
  }

  const payableSubtotal = Math.max(0, subtotalAfterProductDiscount - promoDiscount);
  const shippingFee = cart.length > 0 ? calculateShipping(payableSubtotal) : 0;
  const finalTotal = cart.length > 0 ? payableSubtotal + shippingFee : 0;

  return {
    originalSubtotal,
    productDiscountTotal,
    subtotalAfterProductDiscount,
    promoDiscount,
    shippingFee,
    finalTotal,
    totalItemsCount,
    hasOutOfStock,
    hasStockReduced
  };
}

/**
 * Merges guest cart with user cart, adhering to catalog stock limits and item options
 */
export function mergeGuestAndUserCart(
  guestCart: CartItem[],
  userCart: CartItem[],
  catalogProducts: Product[]
): CartItem[] {
  const merged: CartItem[] = [...userCart];

  for (const guestItem of guestCart) {
    const liveProduct = catalogProducts.find((p) => p.id === guestItem.product.id) || guestItem.product;
    const maxStock = liveProduct.stock ?? 99;

    const existingIndex = merged.findIndex(
      (ui) =>
        ui.product.id === guestItem.product.id &&
        ui.selectedColor === guestItem.selectedColor &&
        ui.selectedSize === guestItem.selectedSize &&
        JSON.stringify(ui.customization || {}) === JSON.stringify(guestItem.customization || {})
    );

    if (existingIndex > -1) {
      const currentQty = merged[existingIndex].quantity;
      const combinedQty = Math.min(maxStock, currentQty + guestItem.quantity);
      merged[existingIndex] = {
        ...merged[existingIndex],
        quantity: combinedQty,
        product: liveProduct
      };
    } else {
      merged.push({
        ...guestItem,
        quantity: Math.min(maxStock, guestItem.quantity),
        product: liveProduct
      });
    }
  }

  return merged;
}
