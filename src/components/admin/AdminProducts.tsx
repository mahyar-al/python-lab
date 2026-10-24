import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Product,
  Category,
  CategoryAttribute,
  ProductStatus,
  ProductVariant,
  ProductColor,
  ProductView,
  GarmentViewId,
  PrintableArea
} from '../../lib/types';
import { formatPrice, formatPersianNumber, toPersianDigits, toAsciiDigits } from '../../lib/currency';
import { ImageUploader } from './ImageUploader';
import { PrintableAreaEditor } from './PrintableAreaEditor';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Copy,
  Trash2,
  Edit2,
  Archive,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  Layers,
  ArrowUp,
  ArrowDown,
  Tag,
  CheckSquare,
  Square,
  Eye,
  Percent,
  Upload,
  CheckCircle2,
  Sliders,
  Package,
  ShieldCheck,
  Truck,
  Video,
  ListPlus
} from 'lucide-react';

interface AdminProductsProps {
  products: Product[];
  categories: Category[];
  categoryAttributes?: CategoryAttribute[];
  onCreateProduct: (prod: Omit<Product, 'id'>) => Promise<void>;
  onUpdateProduct: (id: string, prod: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  dark?: boolean;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({
  products,
  categories,
  categoryAttributes = [],
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct
}) => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priceAsc' | 'priceDesc' | 'stock'>('date');

  // Multi-select for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Inline editing state: { [prodId]: { price: string; stock: string } }
  const [inlineEdits, setInlineEdits] = useState<{ [id: string]: { price: string; stock: string } }>({});
  const [savingInlineId, setSavingInlineId] = useState<string | null>(null);

  // Modal / Drawer: create or edit product
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'attributes' | 'images' | 'customizer'>('basic');

  // Delete Confirmation Dialog state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Bulk Discount Modal
  const [isBulkDiscountModalOpen, setIsBulkDiscountModalOpen] = useState(false);
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState('10');

  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formRelatedCategories, setFormRelatedCategories] = useState<string[]>([]);
  const [formBrand, setFormBrand] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('0');
  const [formDiscountPrice, setFormDiscountPrice] = useState('');
  const [formStock, setFormStock] = useState('10');
  const [formStatus, setFormStatus] = useState<ProductStatus>('active');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsNewArrival, setFormIsNewArrival] = useState(false);
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);
  const [formWeight, setFormWeight] = useState('');
  const [formWarranty, setFormWarranty] = useState('');
  const [formShippingInfo, setFormShippingInfo] = useState('');
  const [formReturnPolicy, setFormReturnPolicy] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);

  // Dynamic Category Attributes values: { [key]: value }
  const [formDynamicAttributes, setFormDynamicAttributes] = useState<Record<string, any>>({});

  // 2-Column Product Specifications Table state
  const [formSpecifications, setFormSpecifications] = useState<
    Array<{ id: string; key: string; value: string }>
  >([]);

  const handleAddSpecRow = () => {
    setFormSpecifications((prev) => [
      ...prev,
      { id: `spec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, key: '', value: '' }
    ]);
  };

  const handleUpdateSpecRow = (id: string, field: 'key' | 'value', text: string) => {
    setFormSpecifications((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: text } : row))
    );
  };

  const handleRemoveSpecRow = (id: string) => {
    setFormSpecifications((prev) => prev.filter((row) => row.id !== id));
  };

  const handleMoveSpecRow = (index: number, direction: 'up' | 'down') => {
    setFormSpecifications((prev) => {
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  // Variants management
  const [hasVariants, setHasVariants] = useState(false);
  const [variantsList, setVariantsList] = useState<ProductVariant[]>([]);
  const [newVariantTitle, setNewVariantTitle] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');
  const [newVariantStock, setNewVariantStock] = useState('10');
  const [newVariantSku, setNewVariantSku] = useState('');

  // Customizable (Print Studio) state
  const [formCustomizable, setFormCustomizable] = useState(false);
  const [formViews, setFormViews] = useState<ProductView[]>([]);
  const [activeDirectionKey, setActiveDirectionKey] = useState<GarmentViewId>('front');

  const FOUR_DIRECTIONS: {
    key: GarmentViewId;
    defaultTitle: string;
    defaultMockup: string;
    defaultArea: PrintableArea;
  }[] = [
    {
      key: 'front',
      defaultTitle: 'نمای روبرو (Front)',
      defaultMockup: '/mockups/tee-front.svg',
      defaultArea: { x: 28, y: 22, width: 44, height: 48 }
    },
    {
      key: 'back',
      defaultTitle: 'نمای پشت (Back)',
      defaultMockup: '/mockups/tee-back.svg',
      defaultArea: { x: 26, y: 20, width: 48, height: 50 }
    },
    {
      key: 'left',
      defaultTitle: 'نمای بغل چپ (Left)',
      defaultMockup: '/mockups/tee-left.svg',
      defaultArea: { x: 38, y: 25, width: 24, height: 35 }
    },
    {
      key: 'right',
      defaultTitle: 'نمای بغل راست (Right)',
      defaultMockup: '/mockups/tee-right.svg',
      defaultArea: { x: 38, y: 25, width: 24, height: 35 }
    }
  ];

  // Get active attributes applicable for current selected category
  const relevantAttributes = categoryAttributes.filter(
    (attr) => attr.categoryId === 'all' || attr.categoryId === formCategory
  );

  // Prevent background scrolling and jumping when modal is open
  useEffect(() => {
    if (isFormOpen || productToDelete) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isFormOpen, productToDelete]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSlug('');
    setFormCategory(categories[0]?.id || '');
    setFormRelatedCategories([]);
    setFormBrand('');
    setFormSku(`SKU-${Date.now().toString().slice(-6)}`);
    setFormDescription('');
    setFormPrice('1500000');
    setFormDiscountPrice('');
    setFormStock('10');
    setFormStatus('active');
    setFormIsFeatured(false);
    setFormIsNewArrival(true);
    setFormIsBestSeller(false);
    setFormWeight('');
    setFormWarranty('۱۸ ماه گارانتی معتبر شرکتی');
    setFormShippingInfo('ارسال سریع ظرف ۲۴ الی ۴۸ ساعت کاری');
    setFormReturnPolicy('۷ روز ضمانت تعویض یا بازگشت کالا');
    setFormVideoUrl('');
    setFormImages([]);
    setFormDynamicAttributes({});
    setFormSpecifications([
      { id: 'spec-1', key: 'برند و سازنده', value: '' },
      { id: 'spec-2', key: 'گارانتی و ضمانت', value: '۱۸ ماه گارانتی معتبر شرکتی' },
      { id: 'spec-3', key: 'اقلام همراه', value: '' }
    ]);
    setHasVariants(false);
    setVariantsList([]);
    setFormCustomizable(false);
    setFormViews([]);
    setActiveFormTab('basic');
    setIsFormOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormSlug(prod.slug || '');
    setFormCategory(prod.categoryId);
    setFormRelatedCategories(prod.relatedCategoryIds || []);
    setFormBrand(prod.brand || '');
    setFormSku(prod.sku || '');
    setFormDescription(prod.description || '');
    setFormPrice(prod.price ? prod.price.toString() : '0');
    setFormDiscountPrice(prod.discountPrice ? prod.discountPrice.toString() : '');
    setFormStock(prod.stock ? prod.stock.toString() : '0');
    setFormStatus(prod.status || 'active');
    setFormIsFeatured(Boolean(prod.isFeatured));
    setFormIsNewArrival(Boolean(prod.isNewArrival));
    setFormIsBestSeller(Boolean(prod.isBestSeller));
    setFormWeight(prod.weight ? prod.weight.toString() : '');
    setFormWarranty(prod.warranty || '');
    setFormShippingInfo(prod.shippingInfo || '');
    setFormReturnPolicy(prod.returnPolicy || '');
    setFormVideoUrl(prod.videoUrl || '');
    setFormImages(prod.images && prod.images.length > 0 ? prod.images : [prod.image]);
    setFormDynamicAttributes(prod.attributes || {});
    
    // Initialize 2-column specifications table
    if (prod.specifications && Array.isArray(prod.specifications) && prod.specifications.length > 0) {
      setFormSpecifications(
        prod.specifications.map((s, idx) => ({
          id: s.id || `spec-${idx}-${Date.now()}`,
          key: s.key || '',
          value: s.value || ''
        }))
      );
    } else if (prod.attributes && Object.keys(prod.attributes).length > 0) {
      setFormSpecifications(
        Object.entries(prod.attributes).map(([k, v], idx) => ({
          id: `spec-${idx}-${Date.now()}`,
          key: k,
          value: typeof v === 'boolean' ? (v ? 'دارد' : 'ندارد') : String(v)
        }))
      );
    } else {
      const initialRows: Array<{ id: string; key: string; value: string }> = [];
      if (prod.brand) initialRows.push({ id: 'spec-brand', key: 'برند و سازنده', value: prod.brand });
      if (prod.warranty) initialRows.push({ id: 'spec-warranty', key: 'گارانتی و ضمانت', value: prod.warranty });
      if (prod.weight) initialRows.push({ id: 'spec-weight', key: 'وزن محصول', value: String(prod.weight) });
      if (prod.shippingInfo) initialRows.push({ id: 'spec-shipping', key: 'اطلاعات ارسال', value: prod.shippingInfo });
      setFormSpecifications(initialRows);
    }
    setHasVariants(Boolean(prod.variants && prod.variants.length > 0));
    setVariantsList(prod.variants || []);
    setFormCustomizable(Boolean(prod.customizable));
    setFormViews(
      prod.views && prod.views.length > 0
        ? prod.views
        : [
            {
              id: 'view-front',
              name: 'front',
              title: 'نمای روبرو (Front)',
              image: prod.image,
              printableArea: { x: 28, y: 22, width: 44, height: 48 }
            }
          ]
    );
    setActiveFormTab('basic');
    setIsFormOpen(true);
  };

  const handleDuplicate = async (prod: Product) => {
    const duplicated: Omit<Product, 'id'> = {
      ...prod,
      name: `${prod.name} (نسخه کپی)`,
      slug: `${prod.slug || 'prod'}-copy-${Date.now().toString().slice(-4)}`,
      stock: 5,
      status: 'draft'
    };
    await onCreateProduct(duplicated);
  };

  const handleAddVariant = () => {
    if (!newVariantTitle.trim()) return;
    const priceVal = Number(toAsciiDigits(newVariantPrice)) || Number(toAsciiDigits(formPrice)) || 0;
    const stockVal = Number(toAsciiDigits(newVariantStock)) || 1;

    const newVar: ProductVariant = {
      id: `var-${Date.now()}`,
      title: newVariantTitle.trim(),
      sku: newVariantSku.trim() || `${formSku}-${variantsList.length + 1}`,
      price: priceVal,
      stock: stockVal,
      attributes: { title: newVariantTitle.trim() }
    };

    setVariantsList((prev) => [...prev, newVar]);
    setNewVariantTitle('');
    setNewVariantPrice('');
    setNewVariantSku('');
  };

  const handleRemoveVariant = (variantId: string) => {
    setVariantsList((prev) => prev.filter((v) => v.id !== variantId));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const priceNum = Number(toAsciiDigits(formPrice)) || 0;
    const discountNum = formDiscountPrice ? Number(toAsciiDigits(formDiscountPrice)) : undefined;
    const stockNum = Math.max(0, Number(toAsciiDigits(formStock)) || 0);

    const cleanSpecifications = formSpecifications
      .filter((r) => r.key.trim() || r.value.trim())
      .map((r) => ({ key: r.key.trim(), value: r.value.trim() }));

    const syncedAttributes: Record<string, any> = { ...formDynamicAttributes };
    cleanSpecifications.forEach((s) => {
      if (s.key) syncedAttributes[s.key] = s.value;
    });

    const payload: Omit<Product, 'id'> = {
      name: formName.trim(),
      slug: formSlug.trim() || undefined,
      categoryId: formCategory || categories[0]?.id || 'general',
      relatedCategoryIds: formRelatedCategories.length > 0 ? formRelatedCategories : undefined,
      brand: formBrand.trim() || undefined,
      sku: formSku.trim() || undefined,
      description: formDescription.trim(),
      price: priceNum,
      discountPrice: discountNum,
      stock: stockNum,
      status: formStatus,
      isFeatured: formIsFeatured,
      isNewArrival: formIsNewArrival,
      isBestSeller: formIsBestSeller,
      weight: formWeight.trim() || undefined,
      warranty: formWarranty.trim() || undefined,
      shippingInfo: formShippingInfo.trim() || undefined,
      returnPolicy: formReturnPolicy.trim() || undefined,
      videoUrl: formVideoUrl.trim() || undefined,
      image: formImages[0] || '/brand/morico-logo.jpg',
      images: formImages.length > 0 ? formImages : ['/brand/morico-logo.jpg'],
      specifications: cleanSpecifications,
      attributes: syncedAttributes,
      variants: hasVariants ? variantsList : undefined,
      customizable: formCustomizable,
      views: formCustomizable ? formViews.filter((v) => v.image && v.image.trim() !== '') : undefined,
      details: editingProduct?.details || [
        'تضمین اصالت کالا و انطباق با مشخصات فنی',
        'بسته‌بندی ایمن و ارسال به سراسر کشور',
        'پشتیبانی و خدمات پس از فروش رسمی'
      ]
    };

    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, payload);
    } else {
      await onCreateProduct(payload);
    }
    setIsFormOpen(false);
  };

  // Quick inline edit save
  const handleSaveInline = async (prod: Product) => {
    const edit = inlineEdits[prod.id];
    if (!edit) return;
    setSavingInlineId(prod.id);
    const newPrice = Number(toAsciiDigits(edit.price)) || prod.price;
    const newStock = Math.max(0, Number(toAsciiDigits(edit.stock)) || 0);

    await onUpdateProduct(prod.id, { price: newPrice, stock: newStock });
    setSavingInlineId(null);
    setInlineEdits((prev) => {
      const copy = { ...prev };
      delete copy[prod.id];
      return copy;
    });
  };

  // Filter & Search Logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.slug && p.slug.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' ||
      p.categoryId === selectedCategory ||
      (p.relatedCategoryIds && p.relatedCategoryIds.includes(selectedCategory));
    const matchesStatus = selectedStatus === 'all' || (p.status || 'active') === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort
  filteredProducts.sort((a, b) => {
    if (sortBy === 'priceAsc') return a.price - b.price;
    if (sortBy === 'priceDesc') return b.price - a.price;
    if (sortBy === 'stock') return a.stock - b.stock;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return (
    <div className="space-y-5 text-right">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#BFDDF0]">
        <div>
          <h2 className="text-xl font-bold text-[#111110] flex items-center gap-2">
            <Package className="w-5 h-5 text-[#111110]" />
            <span>مدیریت محصولات، انبار و مشخصات کالا</span>
          </h2>
          <span className="text-xs text-[#4A5560] mt-1 block">
            پشتیبانی از انواع کالاهای دیجیتال، دکوراسیون، پوشاک و محصولات سفارشی
          </span>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-[#111110] text-[#FFFFFF] text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن محصول جدید</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#BFDDF0] p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          
          <div className="sm:col-span-4 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder=""
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#BFDDF0] text-xs focus:border-[#111110] outline-none text-[#111110]"
            />
            <Search className="w-4 h-4 text-[#4A5560] absolute left-2.5 top-2.5" />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs bg-white text-[#111110] outline-none"
            >
              <option value="all">همه دسته‌بندی‌ها</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? '↳ ' : ''}{c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs bg-white text-[#111110] outline-none"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">منتشرشده و فعال</option>
              <option value="draft">پیش‌نویس</option>
              <option value="out_of_stock">ناموجود</option>
              <option value="inactive">غیرفعال</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs bg-white text-[#111110] outline-none"
            >
              <option value="date">مرتب‌سازی: جدیدترین</option>
              <option value="priceAsc">قیمت: کم به زیاد</option>
              <option value="priceDesc">قیمت: زیاد به کم</option>
              <option value="stock">موجودی انبار</option>
            </select>
          </div>

        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-[#BFDDF0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-50 border-b border-[#BFDDF0] text-[#4A5560]">
              <tr>
                <th className="p-3 w-16">تصویر</th>
                <th className="p-3">نام و مشخصات کالا</th>
                <th className="p-3">دسته‌بندی</th>
                <th className="p-3">قیمت (تومان)</th>
                <th className="p-3">موجودی</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#BFDDF0]/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#4A5560]">
                    محصولی با مشخصات مورد نظر یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const cat = categories.find((c) => c.id === prod.categoryId);
                  const isOutOfStock = prod.stock === 0;

                  return (
                    <tr key={prod.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#BFDDF0] bg-gray-50">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/brand/morico-logo.jpg';
                            }}
                          />
                        </div>
                      </td>

                      <td className="p-3 max-w-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            {prod.brand && (
                              <span className="text-[10px] bg-gray-100 text-[#4A5560] px-1.5 py-0.5 rounded">
                                {prod.brand}
                              </span>
                            )}
                            {prod.customizable && (
                              <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> سفارشی
                              </span>
                            )}
                            {prod.variants && prod.variants.length > 0 && (
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                {formatPersianNumber(prod.variants.length)} تنوع
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-[#111110] block line-clamp-1">{prod.name}</span>
                          <span className="text-[10px] text-[#4A5560] font-mono block">
                            {prod.sku || prod.slug || '-'}
                          </span>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-1 rounded-md bg-[#E4F5FF] text-[#111110] text-[11px] font-medium">
                          {cat?.title || prod.categoryId}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-[#111110] font-persian-nums">
                          {formatPrice(prod.discountPrice || prod.price)}
                        </div>
                        {prod.discountPrice && (
                          <div className="text-[10px] text-[#4A5560] line-through font-persian-nums">
                            {formatPrice(prod.price)}
                          </div>
                        )}
                      </td>

                      <td className="p-3 font-persian-nums">
                        {isOutOfStock ? (
                          <span className="text-[11px] text-[#A33A3A] font-bold">اتمام موجودی</span>
                        ) : (
                          <span className="text-[11px] text-[#111110]">
                            {formatPersianNumber(prod.stock)} عدد
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            prod.status === 'active'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : prod.status === 'draft'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {prod.status === 'active'
                            ? 'منتشرشده'
                            : prod.status === 'draft'
                            ? 'پیش‌نویس'
                            : prod.status === 'out_of_stock'
                            ? 'ناموجود'
                            : 'غیرفعال'}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 rounded-lg border border-[#BFDDF0] text-[#111110] hover:bg-gray-100 cursor-pointer"
                            title="ویرایش کامل محصول"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(prod)}
                            className="p-1.5 rounded-lg border border-[#BFDDF0] text-[#111110] hover:bg-gray-100 cursor-pointer"
                            title="تکثیر / کپی محصول"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(prod)}
                            className="p-1.5 rounded-lg border border-[#A33A3A]/30 text-[#A33A3A] hover:bg-[#A33A3A]/10 cursor-pointer"
                            title="حذف محصول"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: COMPREHENSIVE PRODUCT FORM                         */}
      {/* ========================================================= */}
      {isFormOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-hidden">
          <div className="bg-white rounded-2xl border border-[#BFDDF0] max-w-4xl w-full h-[90vh] max-h-[90vh] shadow-2xl relative text-right flex flex-col overflow-hidden">
            
            {/* Modal Non-scrolling Top Header */}
            <div className="shrink-0 px-6 py-4 border-b border-[#BFDDF0] flex items-center justify-between bg-white">
              <h3 className="text-base sm:text-lg font-bold text-[#111110]">
                {editingProduct ? `ویرایش کالا: ${editingProduct.name}` : 'تعریف کالای جدید در فروشگاه'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-xl border border-[#BFDDF0] hover:bg-gray-100 text-[#111110] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Non-scrolling Sub-Tabs Navigation */}
            <div className="shrink-0 px-6 py-2.5 border-b border-[#BFDDF0] flex items-center gap-2 overflow-x-auto bg-[#F8FBFE]">
              <button
                type="button"
                onClick={() => setActiveFormTab('basic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  activeFormTab === 'basic' ? 'bg-[#111110] text-white shadow-xs' : 'text-[#4A5560] hover:bg-gray-200'
                }`}
              >
                اطلاعات پایه و قیمت
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('attributes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                  activeFormTab === 'attributes' ? 'bg-[#111110] text-white shadow-xs' : 'text-[#4A5560] hover:bg-gray-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>مشخصات کالا ({formatPersianNumber(formSpecifications.length)})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('images')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                  activeFormTab === 'images' ? 'bg-[#111110] text-white shadow-xs' : 'text-[#4A5560] hover:bg-gray-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>تصاویر و ویدیو ({formatPersianNumber(formImages.length)})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('customizer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                  activeFormTab === 'customizer' ? 'bg-[#111110] text-white shadow-xs' : 'text-[#4A5560] hover:bg-gray-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>استودیو چاپ آنلاین</span>
                {formCustomizable && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                )}
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar">
                
                {/* TAB 1: BASIC INFO */}
                {activeFormTab === 'basic' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="text-xs font-bold text-[#111110] block mb-1">
                        نام کامل محصول
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => {
                          setFormName(e.target.value);
                          if (!editingProduct) {
                            setFormSlug(
                              e.target.value
                                .trim()
                                .toLowerCase()
                                .replace(/[^a-zA-Z0-9آ-ی\s-]/g, '')
                                .replace(/\s+/g, '-')
                            );
                          }
                        }}
                        placeholder=""
                        className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs focus:border-[#111110] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-[#111110] block mb-1">
                          دسته‌بندی اصلی
                        </label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs bg-white text-[#111110] focus:border-[#111110] outline-none"
                        >
                          {categories.map((c) => {
                            const path: string[] = [];
                            let curr: any = c;
                            const visited = new Set<string>();
                            while (curr && !visited.has(curr.id)) {
                              visited.add(curr.id);
                              path.unshift(curr.title);
                              curr = categories.find((parent) => parent.id === curr?.parentId);
                            }
                            return (
                              <option key={c.id} value={c.id}>
                                {path.join(' › ')}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#111110] block mb-1">برند / شرکت سازنده</label>
                        <input
                          type="text"
                          value={formBrand}
                          onChange={(e) => setFormBrand(e.target.value)}
                          placeholder=""
                          className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs focus:border-[#111110] outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#111110] block mb-1">کد کالا / شناسه SKU</label>
                        <input
                          type="text"
                          value={formSku}
                          onChange={(e) => setFormSku(e.target.value)}
                          placeholder=""
                          className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs font-mono focus:border-[#111110] outline-none"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Secondary / Related Categories */}
                    <div className="p-3 rounded-xl border border-[#BFDDF0] bg-gray-50/50 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#111110]">دسته‌بندی‌های مکمل و مرتبط (اختیاری):</span>
                        <span className="text-[10px] text-[#4A5560]">
                          محصول علاوه بر دسته اصلی در این دسته‌ها نیز نمایش داده می‌شود
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                        {categories
                          .filter((c) => c.id !== formCategory)
                          .map((c) => {
                            const isSelected = formRelatedCategories.includes(c.id);
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setFormRelatedCategories((prev) =>
                                    isSelected ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                                  );
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border flex items-center gap-1 ${
                                  isSelected
                                    ? 'bg-[#111110] text-white border-[#111110]'
                                    : 'bg-white text-[#4A5560] border-gray-200 hover:border-[#111110]'
                                }`}
                              >
                                <span>{c.parentId ? '↳ ' : ''}{c.title}</span>
                                {isSelected && <span className="text-[10px]">✓</span>}
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-[#111110] block mb-1">
                          قیمت پایه (تومان) <span className="text-[#A33A3A]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value)}
                          placeholder=""
                          className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs font-persian-nums focus:border-[#111110] outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#111110] block mb-1">
                          قیمت با تخفیف ویژه (اختیاری)
                        </label>
                        <input
                          type="text"
                          value={formDiscountPrice}
                          onChange={(e) => setFormDiscountPrice(e.target.value)}
                          placeholder=""
                          className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs font-persian-nums focus:border-[#111110] outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#111110] block mb-1">
                          موجودی انبار (تعداد) <span className="text-[#A33A3A]">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={formStock}
                          onChange={(e) => setFormStock(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs font-persian-nums focus:border-[#111110] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#111110] block mb-1">توضیحات جامع محصول</label>
                      <textarea
                        rows={3}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder=""
                        className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs focus:border-[#111110] outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#BFDDF0]/60">
                      <label className="flex items-center gap-2 p-2 rounded-xl border border-[#BFDDF0] text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsFeatured}
                          onChange={(e) => setFormIsFeatured(e.target.checked)}
                          className="rounded text-[#111110]"
                        />
                        <span>محصول ویژه</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl border border-[#BFDDF0] text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsNewArrival}
                          onChange={(e) => setFormIsNewArrival(e.target.checked)}
                          className="rounded text-[#111110]"
                        />
                        <span>محصول جدید</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl border border-[#BFDDF0] text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsBestSeller}
                          onChange={(e) => setFormIsBestSeller(e.target.checked)}
                          className="rounded text-[#111110]"
                        />
                        <span>پرفروش‌ترین</span>
                      </label>

                      <div className="flex items-center gap-1.5 p-1 rounded-xl border border-[#BFDDF0] bg-white">
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as ProductStatus)}
                          className="w-full text-xs bg-transparent outline-none font-medium"
                        >
                          <option value="active">منتشرشده</option>
                          <option value="draft">پیش‌نویس</option>
                          <option value="out_of_stock">ناموجود</option>
                          <option value="inactive">غیرفعال</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: SPECIFICATIONS (2-COLUMN TABLE) */}
                {activeFormTab === 'attributes' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#E4F5FF]/60 rounded-xl border border-[#BFDDF0]">
                      <div>
                        <h4 className="text-xs font-bold text-[#111110]">
                          جدول مشخصات فنی کالا (۲ ستونه)
                        </h4>
                        <p className="text-[11px] text-[#4A5560] mt-0.5">
                          در این بخش می‌توانید مشخصات کالا (عنوان و شرح) را اضافه کنید.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSpecRow}
                        className="px-3.5 py-2 rounded-xl bg-[#111110] text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>افزودن ردیف جدید</span>
                      </button>
                    </div>

                    {formSpecifications.length === 0 ? (
                      <div className="py-10 text-center text-xs text-[#4A5560] border-2 border-dashed border-[#BFDDF0] rounded-2xl space-y-3 bg-gray-50/50">
                        <p>هنوز مشخصه‌ای برای این کالا تعریف نشده است.</p>
                        <button
                          type="button"
                          onClick={handleAddSpecRow}
                          className="px-4 py-2 rounded-xl bg-white border border-[#BFDDF0] text-[#111110] text-xs font-semibold hover:bg-gray-100 cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>افزودن اولین ردیف مشخصه</span>
                        </button>
                      </div>
                    ) : (
                      <div className="border border-[#BFDDF0] rounded-2xl overflow-hidden bg-white shadow-2xs">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-gray-100 border-b border-[#BFDDF0] text-[#111110]">
                            <tr>
                              <th className="p-3 w-10 text-center font-bold text-[#4A5560]">ردیف</th>
                              <th className="p-3 w-5/12 font-bold">عنوان مشخصه</th>
                              <th className="p-3 w-5/12 font-bold">شرح و مقدار</th>
                              <th className="p-3 w-24 text-center font-bold">عملیات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#BFDDF0]/60">
                            {formSpecifications.map((row, idx) => (
                              <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                                <td className="p-3 text-center text-[11px] font-mono text-[#4A5560] font-persian-nums">
                                  {formatPersianNumber(idx + 1)}
                                </td>
                                <td className="p-2.5">
                                  <input
                                    type="text"
                                    value={row.key}
                                    onChange={(e) => handleUpdateSpecRow(row.id, 'key', e.target.value)}
                                    placeholder=""
                                    className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs focus:border-[#111110] outline-none bg-white font-medium"
                                  />
                                </td>
                                <td className="p-2.5">
                                  <input
                                    type="text"
                                    value={row.value}
                                    onChange={(e) => handleUpdateSpecRow(row.id, 'value', e.target.value)}
                                    placeholder=""
                                    className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs focus:border-[#111110] outline-none bg-white"
                                  />
                                </td>
                                <td className="p-2.5 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => handleMoveSpecRow(idx, 'up')}
                                      className="p-1.5 rounded-lg border border-[#BFDDF0] text-[#4A5560] hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                      title="انتقال به بالا"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === formSpecifications.length - 1}
                                      onClick={() => handleMoveSpecRow(idx, 'down')}
                                      className="p-1.5 rounded-lg border border-[#BFDDF0] text-[#4A5560] hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                      title="انتقال به پایین"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSpecRow(row.id)}
                                      className="p-1.5 rounded-lg border border-[#A33A3A]/30 text-[#A33A3A] hover:bg-[#A33A3A]/10 cursor-pointer"
                                      title="حذف ردیف"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-3 bg-gray-50 border-t border-[#BFDDF0] flex items-center justify-between text-xs">
                          <span className="text-[#4A5560] font-persian-nums">
                            تعداد ردیف‌های مشخصات: {formatPersianNumber(formSpecifications.length)}
                          </span>
                          <button
                            type="button"
                            onClick={handleAddSpecRow}
                            className="px-3 py-1.5 rounded-xl border border-[#BFDDF0] bg-white text-[#111110] hover:bg-gray-100 font-semibold cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>افزودن ردیف دیگر</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: IMAGES & MEDIA */}
                {activeFormTab === 'images' && (
                  <div className="space-y-4 animate-in fade-in">
                    <ImageUploader
                      label="تصویر اصلی کالا (شاخص کاتالوگ)"
                      currentImage={formImages[0] || ''}
                      onChange={(url) => {
                        setFormImages((prev) => {
                          const copy = [...prev];
                          copy[0] = url;
                          return copy;
                        });
                      }}
                    />

                    {/* Additional Images */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#111110] block">
                        تصاویر گالری محصول (زوایای مختلف یا محیط کاربری)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map((idx) => (
                          <div key={idx} className="space-y-1">
                            <ImageUploader
                              label={`تصویر ${formatPersianNumber(idx + 1)}`}
                              currentImage={formImages[idx] || ''}
                              onChange={(url) => {
                                setFormImages((prev) => {
                                  const copy = [...prev];
                                  copy[idx] = url;
                                  return copy;
                                });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#111110] block mb-1">
                        لینک ویدیو معرفی کالا (آپارات، یوتیوب یا MP4)
                      </label>
                      <input
                        type="url"
                        value={formVideoUrl}
                        onChange={(e) => setFormVideoUrl(e.target.value)}
                        placeholder=""
                        className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs font-mono outline-none"
                        dir="ltr"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 4: CUSTOMIZER & PRINT STUDIO (OPTIONAL) */}
                {activeFormTab === 'customizer' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-purple-950 block">
                          قابلیت چاپ آنلاین و درج طرح سفارشی
                        </span>
                        <span className="text-[11px] text-purple-800">
                          برای کالاهایی که مشتری می‌تواند روی آنها طرح یا مونوگرام چاپ کند (مانند هودی، تیشرت یا قاب).
                        </span>
                      </div>

                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer bg-white px-3 py-2 rounded-xl border border-purple-200 shadow-xs">
                        <input
                          type="checkbox"
                          checked={formCustomizable}
                          onChange={(e) => setFormCustomizable(e.target.checked)}
                          className="rounded text-purple-600 w-4 h-4"
                        />
                        <span>فعال‌سازی استودیو چاپ</span>
                      </label>
                    </div>

                    {formCustomizable && (
                      <div className="space-y-4 p-4 rounded-2xl border border-[#BFDDF0] bg-white">
                        <div className="flex items-center gap-2 border-b border-[#BFDDF0] pb-2.5 overflow-x-auto">
                          {FOUR_DIRECTIONS.map((dir) => (
                            <button
                              key={dir.key}
                              type="button"
                              onClick={() => setActiveDirectionKey(dir.key)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                                activeDirectionKey === dir.key ? 'bg-[#111110] text-white shadow-xs' : 'bg-gray-100 text-[#4A5560] hover:bg-gray-200'
                              }`}
                            >
                              {dir.defaultTitle}
                            </button>
                          ))}
                        </div>

                        {/* Direction editor */}
                        {(() => {
                          const activeDirConf = FOUR_DIRECTIONS.find((d) => d.key === activeDirectionKey)!;
                          const currentView = formViews.find((v) => v.name === activeDirectionKey);

                          return (
                            <div className="space-y-4">
                              <ImageUploader
                                label={`ماک‌آپ خام جهت ${activeDirConf.defaultTitle}`}
                                currentImage={currentView?.image || activeDirConf.defaultMockup}
                                onChange={(url) => {
                                  setFormViews((prev) => {
                                    const idx = prev.findIndex((v) => v.name === activeDirectionKey);
                                    if (idx >= 0) {
                                      const copy = [...prev];
                                      copy[idx] = { ...copy[idx], image: url };
                                      return copy;
                                    } else {
                                      return [
                                        ...prev,
                                        {
                                          id: `view-${activeDirectionKey}`,
                                          name: activeDirectionKey,
                                          title: activeDirConf.defaultTitle,
                                          image: url,
                                          printableArea: activeDirConf.defaultArea
                                        }
                                      ];
                                    }
                                  });
                                }}
                              />

                              <PrintableAreaEditor
                                imageUrl={currentView?.image || activeDirConf.defaultMockup}
                                area={currentView?.printableArea || activeDirConf.defaultArea}
                                onChange={(newArea) => {
                                  setFormViews((prev) => {
                                    const idx = prev.findIndex((v) => v.name === activeDirectionKey);
                                    if (idx >= 0) {
                                      const copy = [...prev];
                                      copy[idx] = { ...copy[idx], printableArea: newArea };
                                      return copy;
                                    } else {
                                      return [
                                        ...prev,
                                        {
                                          id: `view-${activeDirectionKey}`,
                                          name: activeDirectionKey,
                                          title: activeDirConf.defaultTitle,
                                          image: activeDirConf.defaultMockup,
                                          printableArea: newArea
                                        }
                                      ];
                                    }
                                  });
                                }}
                              />
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Bottom Actions (Pinned Footer) */}
              <div className="shrink-0 px-6 py-3.5 flex items-center justify-between border-t border-[#BFDDF0] bg-white">
                <div className="flex items-center gap-1.5 text-xs text-[#4A5560]">
                  <span>دسته‌بندی انتخابی:</span>
                  <span className="font-bold text-[#111110]">
                    {categories.find((c) => c.id === formCategory)?.title || 'عمومی'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#BFDDF0] text-xs hover:bg-gray-100 cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#111110] text-white text-xs font-semibold hover:bg-black cursor-pointer shadow-sm"
                  >
                    {editingProduct ? 'ذخیره تغییرات محصول' : 'ثبت و انتشار محصول'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE PRODUCT CONFIRMATION                        */}
      {/* ========================================================= */}
      {productToDelete && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-hidden">
          <div className="bg-white rounded-2xl border border-[#BFDDF0] max-w-md w-full p-5 sm:p-6 shadow-2xl relative text-right space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#A33A3A]/10 text-[#A33A3A] shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111110]">
                  حذف محصول «{productToDelete.name}»
                </h3>
                <p className="text-xs text-[#4A5560] mt-1 leading-relaxed">
                  آیا از حذف دائمی این محصول از کاتالوگ فروشگاه اطمینان دارید؟ این عمل غیرقابل بازگشت است.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#BFDDF0]">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#BFDDF0] text-xs hover:bg-gray-100 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#A33A3A] text-white text-xs font-semibold hover:bg-red-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تایید و حذف کالا</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
