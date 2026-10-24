import React, { useState, useEffect, useMemo } from 'react';
import { Product, Category, CategoryAttribute, ProductVariant } from '../lib/types';
import { formatPrice, formatPersianNumber } from '../lib/currency';
import {
  X,
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  AlertTriangle,
  Info,
  ChevronLeft,
  Tag,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  categories?: Category[];
  categoryAttributes?: CategoryAttribute[];
  allProducts?: Product[];
  onClose: () => void;
  onAddToCart: (
    product: Product,
    selectedColor: string,
    selectedSize: string,
    quantity: number,
    variant?: ProductVariant
  ) => void;
  onCustomize: (product: Product) => void;
  onSelectRelatedProduct?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  categories = [],
  categoryAttributes = [],
  allProducts = [],
  onClose,
  onAddToCart,
  onCustomize,
  onSelectRelatedProduct
}) => {
  // Selected Variant (if product has variants)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(() => {
    return product?.variants && product.variants.length > 0 ? product.variants[0] : null;
  });

  // Selected Color & Size (if applicable)
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    return product?.colors?.[0]?.name || (selectedVariant?.attributes?.color ?? 'استاندارد');
  });

  const [selectedSize, setSelectedSize] = useState<string>(() => {
    return product?.sizes?.[0] || 'تک‌سایز';
  });

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product?.image || '');

  // Sync state when product prop changes
  useEffect(() => {
    if (product) {
      const firstVar = product.variants && product.variants.length > 0 ? product.variants[0] : null;
      setSelectedVariant(firstVar);
      setSelectedColor(product.colors?.[0]?.name || (firstVar?.attributes?.color ?? 'استاندارد'));
      setSelectedSize(product.sizes?.[0] || 'تک‌سایز');
      setQuantity(1);
      setActiveImage(product.image);
    }
  }, [product]);

  // When variant changes, update active price and max stock
  const effectivePrice = useMemo(() => {
    if (!product) return 0;
    if (selectedVariant) {
      return selectedVariant.discountPrice !== undefined && selectedVariant.discountPrice < selectedVariant.price
        ? selectedVariant.discountPrice
        : selectedVariant.price;
    }
    return product.discountPrice !== undefined && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;
  }, [product, selectedVariant]);

  const originalPrice = useMemo(() => {
    if (!product) return undefined;
    if (selectedVariant) {
      return selectedVariant.discountPrice !== undefined && selectedVariant.discountPrice < selectedVariant.price
        ? selectedVariant.price
        : undefined;
    }
    return product.discountPrice !== undefined && product.discountPrice < product.price
      ? product.price
      : undefined;
  }, [product, selectedVariant]);

  // Related products in same category
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter((p) => p.id !== product.id && p.categoryId === product.categoryId && p.status === 'active')
      .slice(0, 3);
  }, [allProducts, product]);

  // Unified specifications list (2 columns: key and value)
  const specificationsList = useMemo(() => {
    if (!product) return [];
    if (product.specifications && Array.isArray(product.specifications) && product.specifications.length > 0) {
      return product.specifications.filter((s) => s.key && s.key.trim() && s.value && s.value.trim());
    }
    // Fallback: convert attributes or brand/warranty
    const list: Array<{ key: string; value: string }> = [];
    if (product.brand) list.push({ key: 'برند و سازنده', value: product.brand });
    if (product.warranty) list.push({ key: 'گارانتی و ضمانت', value: product.warranty });
    if (product.weight) list.push({ key: 'وزن محصول', value: String(product.weight) });

    if (product.attributes && Object.keys(product.attributes).length > 0) {
      Object.entries(product.attributes).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          const attrDef = categoryAttributes.find((a) => a.key === key);
          const label = attrDef?.name || key;
          const unit = attrDef?.unit ? ` (${attrDef.unit})` : '';
          list.push({
            key: `${label}${unit}`,
            value: typeof val === 'boolean' ? (val ? 'دارد' : 'ندارد') : String(val)
          });
        }
      });
    }

    if (product.shippingInfo) list.push({ key: 'اطلاعات ارسال', value: product.shippingInfo });
    return list;
  }, [product, categoryAttributes]);

  if (!product) return null;

  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = currentStock === 0;
  const isLowStock = currentStock > 0 && currentStock <= 5;

  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const categoryObj = categories.find((c) => c.id === product.categoryId);

  const handleVariantSelect = (v: ProductVariant) => {
    setSelectedVariant(v);
    if (v.attributes?.color) {
      setSelectedColor(v.attributes.color);
    }
    if (v.image) {
      setActiveImage(v.image);
    }
    setQuantity(1);
  };

  const handleAddToCartClick = () => {
    if (isOutOfStock) return;
    onAddToCart(product, selectedColor, selectedSize, quantity, selectedVariant || undefined);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="bg-white border border-[#BFDDF0] rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto text-right p-5 sm:p-8 shadow-2xl relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl border border-[#BFDDF0] hover:bg-gray-100 text-[#111110] transition-colors cursor-pointer"
          aria-label="بستن پنجره"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Breadcrumb & Brand */}
        <div className="flex items-center gap-2 text-xs text-[#4A5560] pt-1">
          <span>{categoryObj?.title || 'کاتالوگ'}</span>
          <span>/</span>
          {product.brand && (
            <>
              <span className="font-bold text-[#111110]">{product.brand}</span>
              <span>/</span>
            </>
          )}
          <span className="text-gray-400 truncate max-w-[200px]">{product.name}</span>
        </div>

        {/* Main Grid: Gallery on right (RTL), Product Info on left */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Gallery Column (md: 6 cols) */}
          <div className="md:col-span-6 space-y-3">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-[#BFDDF0] bg-gray-50 relative shadow-xs">
              <img
                src={activeImage}
                alt={product.name}
                className={`w-full h-full object-cover transition-all ${
                  isOutOfStock ? 'opacity-60 grayscale-[30%]' : ''
                }`}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/brand/morico-logo.jpg';
                }}
              />

              {/* Status Badges */}
              <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                {isOutOfStock && (
                  <div className="bg-[#A33A3A] text-white px-3 py-1 rounded-lg text-xs font-bold shadow-md">
                    اتمام موجودی در انبار
                  </div>
                )}
                {product.brand && (
                  <div className="bg-white/95 backdrop-blur-xs text-[#111110] px-2.5 py-1 rounded-lg text-xs font-bold border border-[#BFDDF0] shadow-xs">
                    {product.brand}
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail switcher */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border transition-all cursor-pointer shrink-0 ${
                      activeImage === img
                        ? 'border-[#111110] ring-2 ring-[#111110] scale-95'
                        : 'border-[#BFDDF0] hover:border-[#111110]'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details & Action Column (md: 6 cols) */}
          <div className="md:col-span-6 space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-[#4A5560]">
                  {selectedVariant?.sku || product.sku || product.slug || 'ORIGINAL PIECE'}
                </span>
                {product.isBestSeller && (
                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                    پرفروش‌ترین
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[#111110] mt-1 leading-snug">
                {product.name}
              </h2>

              {/* Pricing */}
              <div className="flex items-baseline gap-3 mt-2.5">
                <span className="text-2xl font-bold text-[#111110] font-persian-nums">
                  {formatPrice(effectivePrice)}
                </span>
                {originalPrice && (
                  <span className="text-sm text-[#4A5560] line-through font-persian-nums">
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>

              {/* Stock status indicator */}
              <div className="mt-2">
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#A33A3A]/10 text-[#A33A3A] text-xs font-bold border border-[#A33A3A]/20">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>در حال حاضر در انبار ناموجود است</span>
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#9A6B1F]/10 text-[#9A6B1F] text-xs font-medium border border-[#9A6B1F]/20 font-persian-nums">
                    <span>تنها {formatPersianNumber(currentStock)} عدد در انبار باقی‌مانده است</span>
                  </span>
                ) : (
                  <span className="text-xs text-[#2F6B4F] font-semibold flex items-center gap-1 font-persian-nums">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>موجود در انبار ({formatPersianNumber(currentStock)} عدد آماده تحویل)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Product Description */}
            {product.description && (
              <p className="text-xs sm:text-sm text-[#4A5560] leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Variants Selector (if product has variants) */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#BFDDF0]">
                <label className="text-xs font-bold text-[#111110] block">
                  انتخاب مدل / تنوع کالا:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const vOutOfStock = v.stock === 0;

                    return (
                      <button
                        key={v.id}
                        disabled={vOutOfStock}
                        onClick={() => handleVariantSelect(v)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex flex-col items-start gap-0.5 ${
                          isSelected
                            ? 'border-[#111110] bg-[#111110] text-white shadow-xs'
                            : vOutOfStock
                            ? 'opacity-40 border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'border-[#BFDDF0] bg-white text-[#111110] hover:border-[#111110]'
                        }`}
                      >
                        <span className="font-bold">{v.title}</span>
                        <span className={`text-[10px] font-persian-nums ${isSelected ? 'text-white/80' : 'text-[#4A5560]'}`}>
                          {formatPrice(v.discountPrice || v.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Colors (if present and not covered by variant) */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#111110] block">
                  رنگ: <span className="font-normal text-[#4A5560]">{selectedColor}</span>
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        setSelectedColor(c.name);
                        if (c.image) setActiveImage(c.image);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedColor === c.name
                          ? 'border-[#111110] bg-[#111110] text-white shadow-xs'
                          : 'border-[#BFDDF0] bg-white text-[#111110] hover:border-[#111110]'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes (if product has sizes) */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#111110] block">انتخاب سایز:</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`w-11 h-11 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedSize === s
                          ? 'border-[#111110] bg-[#111110] text-white shadow-xs'
                          : 'border-[#BFDDF0] bg-white text-[#111110] hover:border-[#111110]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-[#111110] block">تعداد سفارش:</label>
              <div className="inline-flex items-center border border-[#BFDDF0] rounded-xl overflow-hidden bg-white shadow-2xs">
                <button
                  disabled={isOutOfStock || quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-sm font-bold text-[#111110] hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  -
                </button>
                <span className="px-5 py-1.5 text-xs font-bold text-[#111110] font-persian-nums">
                  {formatPersianNumber(quantity)}
                </span>
                <button
                  disabled={isOutOfStock || quantity >= currentStock}
                  onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                  className="px-3 py-1.5 text-sm font-bold text-[#111110] hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-3 border-t border-[#BFDDF0]">
              <button
                disabled={isOutOfStock}
                onClick={handleAddToCartClick}
                className={`w-full py-3.5 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all ${
                  isOutOfStock
                    ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#111110] text-white hover:bg-[#2A2A28] active:scale-[0.98] cursor-pointer'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isOutOfStock ? 'اتمام موجودی در انبار' : 'افزودن به سبد خرید'}</span>
              </button>

              {/* Online Print Customization button - ONLY shown if product.customizable is true */}
              {product.customizable && (
                <button
                  onClick={() => {
                    onClose();
                    onCustomize(product);
                  }}
                  className="w-full py-3.5 px-6 rounded-xl border border-purple-600 bg-purple-50 text-purple-900 hover:bg-purple-600 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>طراحی آنلاین و درج مونوگرام یا طرح روی این کالا</span>
                </button>
              )}
            </div>

          </div>

        </div>

        {/* جدول ۲ ستونه مشخصات کالا */}
        <div className="pt-6 border-t border-[#BFDDF0] space-y-3">
          <h3 className="text-sm font-bold text-[#111110] flex items-center gap-2">
            <Info className="w-4 h-4 text-[#111110]" />
            <span>مشخصات کالا</span>
          </h3>

          {specificationsList.length > 0 ? (
            <div className="border border-[#BFDDF0] rounded-2xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-gray-100/90 border-b border-[#BFDDF0] text-[#111110]">
                    <th className="p-3 w-1/3 sm:w-1/4 font-bold border-l border-[#BFDDF0]/60">عنوان مشخصه</th>
                    <th className="p-3 w-2/3 sm:w-3/4 font-bold">شرح و مقدار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#BFDDF0]/60">
                  {specificationsList.map((spec, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? 'bg-gray-50/60' : 'bg-white'}
                    >
                      <td className="p-3 font-semibold text-[#4A5560] border-l border-[#BFDDF0]/60 align-top">
                        {spec.key}
                      </td>
                      <td className="p-3 text-[#111110] font-medium leading-relaxed align-top">
                        {spec.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 rounded-2xl border border-dashed border-[#BFDDF0] text-center text-xs text-[#4A5560] bg-gray-50/40">
              مشخصات فنی برای این کالا ثبت نشده است.
            </div>
          )}
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="pt-6 border-t border-[#BFDDF0] space-y-3">
            <h3 className="text-sm font-bold text-[#111110]">کالاهای مرتبط و پیشنهادی</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectRelatedProduct?.(rel)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#BFDDF0] bg-gray-50/50 hover:bg-white hover:border-[#111110] transition-all cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-[#BFDDF0] bg-white shrink-0">
                    <img src={rel.image} alt={rel.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#111110] block truncate">{rel.name}</span>
                    <span className="text-xs font-bold text-[#111110] font-persian-nums mt-0.5 block">
                      {formatPrice(rel.discountPrice || rel.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
