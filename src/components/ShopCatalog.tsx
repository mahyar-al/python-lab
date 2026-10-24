import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Product, Category, CategoryAttribute, ProductVariant, CartItem } from '../lib/types';
import { formatPrice, formatPersianNumber, toPersianDigits } from '../lib/currency';
import {
  Sparkles,
  ArrowUpRight,
  ShoppingBag,
  Check,
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  AlertCircle,
  Tag,
  ShieldCheck,
  Layers,
  ArrowUpDown,
  Filter,
  Heart,
  Eye,
  Grid,
  List,
  Plus,
  Minus,
  Trash2,
  RotateCcw,
  Clock,
  ArrowLeft
} from 'lucide-react';

interface ShopCatalogProps {
  products: Product[];
  categories: Category[];
  categoryAttributes?: CategoryAttribute[];
  initialCategoryId?: string;
  onSelectProduct: (product: Product) => void;
  onCustomizeProduct: (product: Product) => void;
  onAddToCart?: (
    product: Product,
    selectedColor: string,
    selectedSize: string,
    quantity: number,
    variant?: ProductVariant
  ) => void;
  cart?: CartItem[];
  onUpdateCartQuantity?: (cartItemId: string, newQty: number) => void;
  onRemoveCartItem?: (cartItemId: string) => void;
  onShowToast?: (
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    action?: { label: string; onClick: () => void }
  ) => void;
}

type SortOption = 'newest' | 'priceAsc' | 'priceDesc' | 'popular' | 'discount';

const RECENT_SEARCHES_KEY = 'morico_recent_searches_v2';
const WISHLIST_STORAGE_KEY = 'morico_wishlist_ids';
const ITEMS_PER_PAGE = 9;

export const ShopCatalog: React.FC<ShopCatalogProps> = ({
  products,
  categories,
  categoryAttributes = [],
  initialCategoryId = 'all',
  onSelectProduct,
  onCustomizeProduct,
  onAddToCart,
  cart = [],
  onUpdateCartQuantity,
  onRemoveCartItem,
  onShowToast
}) => {
  // ---------------------------------------------------------------------------
  // URL Query Helper
  // ---------------------------------------------------------------------------
  const getInitialUrlState = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return {
        cat: params.get('cat') || initialCategoryId,
        q: params.get('q') || '',
        sort: (params.get('sort') as SortOption) || 'newest',
        brands: params.get('brands') ? params.get('brands')!.split(',').filter(Boolean) : [],
        inStock: params.get('inStock') === 'true',
        discount: params.get('discount') === 'true',
        minPrice: params.get('minPrice') || '',
        maxPrice: params.get('maxPrice') || '',
        rating: params.get('rating') ? Number(params.get('rating')) : 0,
        warranty: params.get('warranty') || 'all',
        view: (params.get('view') === 'list' ? 'list' : 'grid') as 'grid' | 'list'
      };
    } catch {
      return {
        cat: initialCategoryId,
        q: '',
        sort: 'newest' as SortOption,
        brands: [] as string[],
        inStock: false,
        discount: false,
        minPrice: '',
        maxPrice: '',
        rating: 0,
        warranty: 'all',
        view: 'grid' as 'grid' | 'list'
      };
    }
  };

  const initialUrlState = useMemo(() => getInitialUrlState(), []);

  // ---------------------------------------------------------------------------
  // State Declarations
  // ---------------------------------------------------------------------------
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialUrlState.cat);
  const [searchQuery, setSearchQuery] = useState(initialUrlState.q);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(initialUrlState.q);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : ['هودی باکس', 'تیشرت ۳۲۰ گرم', 'چراغ خواب بتنی', 'کالکشن پاییز'];
    } catch {
      return [];
    }
  });

  const [sortBy, setSortBy] = useState<SortOption>(initialUrlState.sort);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialUrlState.view);
  const [inStockOnly, setInStockOnly] = useState(initialUrlState.inStock);
  const [discountOnly, setDiscountOnly] = useState(initialUrlState.discount);
  const [minRating, setMinRating] = useState<number>(initialUrlState.rating);
  const [selectedWarranty, setSelectedWarranty] = useState<string>(initialUrlState.warranty);

  // Multi-brand filter with search
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialUrlState.brands);
  const [brandSearchTerm, setBrandSearchTerm] = useState('');

  // Price range filter
  const [minPriceInput, setMinPriceInput] = useState<string>(initialUrlState.minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState<string>(initialUrlState.maxPrice);

  // Dynamic attributes
  const [selectedAttrFilters, setSelectedAttrFilters] = useState<Record<string, string>>({});

  // Mobile filters drawer
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Wishlist
  const [wishlist, setWishlist] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Quick View Modal
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewImageIndex, setQuickViewImageIndex] = useState(0);
  const [quickViewColor, setQuickViewColor] = useState<string>('');
  const [quickViewSize, setQuickViewSize] = useState<string>('');
  const [quickViewQuantity, setQuickViewQuantity] = useState(1);

  // Pagination / Load more
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Card feedback
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const quickViewModalRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Debounce search input
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 220);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Click outside to close search autocomplete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to header search & sort events
  useEffect(() => {
    const handleCustomSearch = (e: any) => {
      if (typeof e.detail === 'string') {
        setSearchQuery(e.detail);
        setDebouncedSearchQuery(e.detail);
      }
    };
    const handleCustomSort = (e: any) => {
      if (e.detail && (e.detail === 'popular' || e.detail === 'newest' || e.detail === 'priceAsc' || e.detail === 'priceDesc' || e.detail === 'discount')) {
        setSortBy(e.detail as SortOption);
      }
    };
    window.addEventListener('morico:search' as any, handleCustomSearch);
    window.addEventListener('morico:sort' as any, handleCustomSort);
    return () => {
      window.removeEventListener('morico:search' as any, handleCustomSearch);
      window.removeEventListener('morico:sort' as any, handleCustomSort);
    };
  }, []);

  // Sync URL query parameters
  useEffect(() => {
    try {
      const params = new URLSearchParams();
      if (selectedCategoryId !== 'all') params.set('cat', selectedCategoryId);
      if (debouncedSearchQuery.trim()) params.set('q', debouncedSearchQuery.trim());
      if (sortBy !== 'newest') params.set('sort', sortBy);
      if (selectedBrands.length > 0) params.set('brands', selectedBrands.join(','));
      if (inStockOnly) params.set('inStock', 'true');
      if (discountOnly) params.set('discount', 'true');
      if (minPriceInput) params.set('minPrice', minPriceInput);
      if (maxPriceInput) params.set('maxPrice', maxPriceInput);
      if (minRating > 0) params.set('rating', String(minRating));
      if (selectedWarranty !== 'all') params.set('warranty', selectedWarranty);
      if (viewMode === 'list') params.set('view', 'list');

      const newQuery = params.toString();
      const currentUrl = window.location.pathname + (newQuery ? `?${newQuery}` : '') + window.location.hash;
      window.history.replaceState(null, '', currentUrl);
    } catch {}
  }, [
    selectedCategoryId,
    debouncedSearchQuery,
    sortBy,
    selectedBrands,
    inStockOnly,
    discountOnly,
    minPriceInput,
    maxPriceInput,
    minRating,
    selectedWarranty,
    viewMode
  ]);

  // Reset pagination when primary filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [
    selectedCategoryId,
    debouncedSearchQuery,
    sortBy,
    selectedBrands,
    inStockOnly,
    discountOnly,
    minPriceInput,
    maxPriceInput,
    minRating,
    selectedWarranty,
    selectedAttrFilters
  ]);

  // Wishlist persistence
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      const isAdding = !next.has(productId);
      if (isAdding) {
        next.add(productId);
      } else {
        next.delete(productId);
      }
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {}

      if (onShowToast) {
        onShowToast(
          isAdding ? 'success' : 'info',
          isAdding ? 'محصول به علاقه‌مندی‌ها اضافه شد.' : 'محصول از علاقه‌مندی‌ها حذف شد.'
        );
      }
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // Available Brands and Categories Computation
  // ---------------------------------------------------------------------------
  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  const subcategories = useMemo(() => {
    if (selectedCategoryId === 'all') return [];
    return categories.filter((c) => c.parentId === selectedCategoryId && c.active !== false);
  }, [categories, selectedCategoryId]);

  // Unique brands across current catalog context
  const allBrandsInContext = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.status === 'active' && p.brand && p.brand.trim() !== '') {
        set.add(p.brand.trim());
      }
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered brand list according to brand search box
  const filteredBrandsList = useMemo(() => {
    if (!brandSearchTerm.trim()) return allBrandsInContext;
    const term = brandSearchTerm.toLowerCase().trim();
    return allBrandsInContext.filter((b) => b.toLowerCase().includes(term));
  }, [allBrandsInContext, brandSearchTerm]);

  // Available warranties
  const availableWarranties = useMemo(() => {
    const list = products
      .filter((p) => p.status === 'active' && p.warranty)
      .map((p) => p.warranty!.trim());
    return Array.from(new Set(list));
  }, [products]);

  // Clean attributes excluding duplicate brand/maker
  const relevantFilterableAttributes = useMemo(() => {
    return categoryAttributes.filter(
      (a) =>
        a.filterable &&
        (a.categoryId === 'all' || a.categoryId === selectedCategoryId) &&
        a.key.toLowerCase() !== 'brand' &&
        !a.name.includes('برند') &&
        !a.name.includes('سازنده')
    );
  }, [categoryAttributes, selectedCategoryId]);

  // Numerical price boundaries
  const parsedMinPrice = useMemo(() => {
    const num = parseInt(minPriceInput.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? undefined : num;
  }, [minPriceInput]);

  const parsedMaxPrice = useMemo(() => {
    const num = parseInt(maxPriceInput.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? undefined : num;
  }, [maxPriceInput]);

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategoryId !== 'all') count++;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (inStockOnly) count++;
    if (discountOnly) count++;
    if (parsedMinPrice !== undefined || parsedMaxPrice !== undefined) count++;
    if (minRating > 0) count++;
    if (selectedWarranty !== 'all') count++;
    count += Object.values(selectedAttrFilters).filter((v) => v && v !== 'all').length;
    return count;
  }, [
    selectedCategoryId,
    selectedBrands,
    inStockOnly,
    discountOnly,
    parsedMinPrice,
    parsedMaxPrice,
    minRating,
    selectedWarranty,
    selectedAttrFilters
  ]);

  // ---------------------------------------------------------------------------
  // Categories Tabs with Active Count & "به‌زودی" Status
  // ---------------------------------------------------------------------------
  const parentCategoriesMeta = useMemo(() => {
    return categories
      .filter((c) => !c.parentId && c.active !== false)
      .map((cat) => {
        const count = products.filter(
          (p) =>
            p.status === 'active' &&
            (p.categoryId === cat.id ||
              categories.find((child) => child.id === p.categoryId)?.parentId === cat.id)
        ).length;
        return { cat, count };
      });
  }, [categories, products]);

  // ---------------------------------------------------------------------------
  // Product Filtering Pipeline
  // ---------------------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Status check
      if (p.status === 'draft' || p.status === 'inactive' || p.status === 'archived') {
        return false;
      }

      // 2. Category matching (recursive descendant tree + related categories)
      if (selectedCategoryId !== 'all') {
        const targetCategoryIds = new Set<string>([selectedCategoryId]);
        const queue = [selectedCategoryId];
        while (queue.length > 0) {
          const currentId = queue.pop()!;
          for (const c of categories) {
            if (c.parentId === currentId && !targetCategoryIds.has(c.id)) {
              targetCategoryIds.add(c.id);
              queue.push(c.id);
            }
          }
        }

        const isDirectMatch = targetCategoryIds.has(p.categoryId);
        const isRelatedMatch = p.relatedCategoryIds?.some((id) => targetCategoryIds.has(id));
        if (!isDirectMatch && !isRelatedMatch) return false;
      }

      // 3. Search query
      if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = p.brand ? p.brand.toLowerCase().includes(q) : false;
        const matchesSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
        const matchesDesc = p.description ? p.description.toLowerCase().includes(q) : false;
        const matchesTags = p.tags ? p.tags.some((t) => t.toLowerCase().includes(q)) : false;
        if (!matchesName && !matchesBrand && !matchesSku && !matchesDesc && !matchesTags) return false;
      }

      // 4. In Stock
      if (inStockOnly && p.stock === 0) return false;

      // 5. Discount only
      const hasDiscount = p.discountPrice !== undefined && p.discountPrice < p.price;
      if (discountOnly && !hasDiscount) return false;

      // 6. Multi-Brand
      if (selectedBrands.length > 0 && (!p.brand || !selectedBrands.includes(p.brand))) {
        return false;
      }

      // 7. Price range
      const effectivePrice = hasDiscount ? p.discountPrice! : p.price;
      if (parsedMinPrice !== undefined && effectivePrice < parsedMinPrice) return false;
      if (parsedMaxPrice !== undefined && effectivePrice > parsedMaxPrice) return false;

      // 8. Rating
      const score = p.rating || (p.isBestSeller ? 4.9 : 4.8);
      if (minRating > 0 && score < minRating) return false;

      // 9. Warranty
      if (selectedWarranty !== 'all' && p.warranty !== selectedWarranty) return false;

      // 10. Dynamic Attributes
      for (const [attrKey, attrVal] of Object.entries(selectedAttrFilters)) {
        if (!attrVal || attrVal === 'all') continue;
        if (p.attributes?.[attrKey] !== attrVal) return false;
      }

      return true;
    });
  }, [
    products,
    selectedCategoryId,
    categories,
    debouncedSearchQuery,
    inStockOnly,
    discountOnly,
    selectedBrands,
    parsedMinPrice,
    parsedMaxPrice,
    minRating,
    selectedWarranty,
    selectedAttrFilters
  ]);

  // ---------------------------------------------------------------------------
  // Sorting Pipeline
  // ---------------------------------------------------------------------------
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'priceAsc') {
      return list.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    }
    if (sortBy === 'priceDesc') {
      return list.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    }
    if (sortBy === 'popular') {
      return list.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }
    if (sortBy === 'discount') {
      return list.sort((a, b) => {
        const discA = a.discountPrice ? a.price - a.discountPrice : 0;
        const discB = b.discountPrice ? b.price - b.discountPrice : 0;
        return discB - discA;
      });
    }
    // Default: newest
    return list.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [filteredProducts, sortBy]);

  // Paginated slice
  const paginatedProducts = useMemo(() => {
    return sortedProducts.slice(0, visibleCount);
  }, [sortedProducts, visibleCount]);

  const hasMore = visibleCount < sortedProducts.length;

  // ---------------------------------------------------------------------------
  // Live Autocomplete Suggestions
  // ---------------------------------------------------------------------------
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return { products: [], categories: [], brands: [] };
    const q = searchQuery.toLowerCase().trim();

    const matchedProducts = products
      .filter((p) => p.status === 'active' && p.name.toLowerCase().includes(q))
      .slice(0, 4);

    const matchedCategories = categories
      .filter((c) => c.active !== false && c.title.toLowerCase().includes(q))
      .slice(0, 3);

    const matchedBrands = allBrandsInContext
      .filter((b) => b.toLowerCase().includes(q))
      .slice(0, 3);

    return { products: matchedProducts, categories: matchedCategories, brands: matchedBrands };
  }, [searchQuery, products, categories, allBrandsInContext]);

  const handleSelectRecentSearch = (term: string) => {
    setSearchQuery(term);
    setIsSearchFocused(false);
  };

  const handleSaveSearchTerm = (term: string) => {
    if (!term.trim()) return;
    const clean = term.trim();
    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((item) => item !== clean)].slice(0, 6);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  };

  // ---------------------------------------------------------------------------
  // Cart Stepper & Quantity Helpers
  // ---------------------------------------------------------------------------
  const getProductCartQuantity = (productId: string): number => {
    const items = cart.filter((ci) => ci.product.id === productId);
    return items.reduce((sum, ci) => sum + ci.quantity, 0);
  };

  const getProductFirstCartItem = (productId: string): CartItem | undefined => {
    return cart.find((ci) => ci.product.id === productId);
  };

  const handleCardAddToCart = (product: Product) => {
    if (product.stock === 0) return;

    // If product requires customization or has multiple variants, open quick view
    if (
      product.customizable ||
      (product.variants && product.variants.length > 1) ||
      (product.sizes && product.sizes.length > 1) ||
      (product.colors && product.colors.length > 1)
    ) {
      handleOpenQuickView(product);
      return;
    }

    setLoadingProductId(product.id);
    setTimeout(() => {
      const firstVariant = product.variants?.[0];
      const color = product.colors?.[0]?.name || (firstVariant?.attributes?.color ?? 'استاندارد');
      const size = product.sizes?.[0] || 'تک‌سایز';

      if (onAddToCart) {
        onAddToCart(product, color, size, 1, firstVariant);
      }
      setLoadingProductId(null);
      setRecentlyAddedId(product.id);
      setTimeout(() => setRecentlyAddedId(null), 2000);
    }, 280);
  };

  const handleIncrementQuantity = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const cartItem = getProductFirstCartItem(productId);

    if (cartItem && onUpdateCartQuantity) {
      if (cartItem.quantity >= prod.stock) {
        if (onShowToast) onShowToast('warning', `حداکثر موجودی (${formatPersianNumber(prod.stock)} عدد) در سبد است.`);
        return;
      }
      onUpdateCartQuantity(cartItem.cartItemId, cartItem.quantity + 1);
    } else {
      handleCardAddToCart(prod);
    }
  };

  const handleDecrementQuantity = (productId: string) => {
    const cartItem = getProductFirstCartItem(productId);
    if (!cartItem) return;

    if (cartItem.quantity > 1 && onUpdateCartQuantity) {
      onUpdateCartQuantity(cartItem.cartItemId, cartItem.quantity - 1);
    } else if (onRemoveCartItem) {
      onRemoveCartItem(cartItem.cartItemId);
    }
  };

  // ---------------------------------------------------------------------------
  // Quick View Modal Handlers
  // ---------------------------------------------------------------------------
  const handleOpenQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setQuickViewImageIndex(0);
    setQuickViewColor(product.colors?.[0]?.name || 'استاندارد');
    setQuickViewSize(product.sizes?.[0] || 'تک‌سایز');
    setQuickViewQuantity(1);
  };

  const handleCloseQuickView = () => {
    setQuickViewProduct(null);
  };

  // ESC key listener for quick view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && quickViewProduct) {
        handleCloseQuickView();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickViewProduct]);

  // ---------------------------------------------------------------------------
  // Clear All Filters
  // ---------------------------------------------------------------------------
  const clearAllFilters = () => {
    setSelectedCategoryId('all');
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedBrands([]);
    setInStockOnly(false);
    setDiscountOnly(false);
    setMinPriceInput('');
    setMaxPriceInput('');
    setMinRating(0);
    setSelectedWarranty('all');
    setSelectedAttrFilters({});
    setSortBy('newest');
  };

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
      setIsLoadingMore(false);
    }, 300);
  };

  return (
    <section id="catalog-section" className="w-full py-8 sm:py-14 md:py-18 text-right bg-[#FAFAF8]" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 space-y-6">

        {/* ------------------------------------------------------------------- */}
        {/* 1. Category Banner (If active)                                      */}
        {/* ------------------------------------------------------------------- */}
        {activeCategory?.banner && (
          <div className="relative w-full h-40 sm:h-56 md:h-64 rounded-2xl sm:rounded-3xl overflow-hidden border border-[#BFDDF0] shadow-sm mb-2">
            <img
              src={activeCategory.banner}
              alt={activeCategory.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-5 sm:p-8 text-white">
              <span className="text-[11px] font-sans tracking-wider uppercase text-white/80">
                دسته‌بندی تخصصی آتلیه موریکو
              </span>
              <h1 className="text-xl sm:text-3xl font-bold mt-1 text-white">{activeCategory.title}</h1>
              {activeCategory.description && (
                <p className="text-xs sm:text-sm text-white/90 max-w-xl mt-1 line-clamp-2 leading-relaxed">
                  {activeCategory.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* 2. Catalog Header & Persistent Search                               */}
        {/* ------------------------------------------------------------------- */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-5 border-b border-[#BFDDF0]">
          <div className="space-y-1.5">
            <span className="font-sans text-xs font-semibold text-[#4A5560] block tracking-normal">
              MORICO ATELIER & STORE · 2026
            </span>
            {activeCategory && (
              <div className="flex items-center gap-1.5 text-xs text-[#4A5560] py-0.5 flex-wrap">
                <button
                  onClick={() => setSelectedCategoryId('all')}
                  className="hover:text-[#111110] transition-colors cursor-pointer"
                >
                  همه محصولات
                </button>
                {(() => {
                  const breadcrumbList: Category[] = [];
                  let cur: any = categories.find((c) => c.id === activeCategory.parentId);
                  const visited = new Set<string>();
                  while (cur && !visited.has(cur.id)) {
                    visited.add(cur.id);
                    breadcrumbList.unshift(cur);
                    cur = categories.find((parent) => parent.id === cur?.parentId);
                  }
                  return breadcrumbList.map((crumb) => (
                    <React.Fragment key={crumb.id}>
                      <span>›</span>
                      <button
                        onClick={() => setSelectedCategoryId(crumb.id)}
                        className="hover:text-[#111110] transition-colors cursor-pointer"
                      >
                        {crumb.title}
                      </button>
                    </React.Fragment>
                  ));
                })()}
                <span>›</span>
                <span className="font-bold text-[#111110]">{activeCategory.title}</span>
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl text-[#111110] font-bold">
              {activeCategory ? activeCategory.title : 'کاتالوگ جامع محصولات و کالکشن موریکو'}
            </h2>
            <p className="text-xs sm:text-sm text-[#4A5560] max-w-2xl leading-relaxed">
              {activeCategory?.description ||
                'مجموعه متنوع و جامع محصولات با ضمانت اصالت، تضمین کیفیت و ارسال سریع به سراسر کشور.'}
            </p>
          </div>

          {/* Search Bar with Live Autocomplete & Mobile Filter Button */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto relative" ref={searchContainerRef}>
            <div className="relative flex-1 lg:w-80">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveSearchTerm(searchQuery);
                    setIsSearchFocused(false);
                  }
                }}
                placeholder="جستجوی کالا، برند یا مشخصه..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#BFDDF0] text-xs bg-white text-[#111110] focus:border-[#111110] focus:ring-1 focus:ring-[#111110] outline-none shadow-2xs font-sans"
              />
              <Search className="w-4 h-4 text-[#4A5560] absolute left-3 top-3 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-8 top-3 text-[#4A5560] hover:text-[#111110] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Autocomplete Dropdown */}
              {isSearchFocused && (
                <div className="absolute top-full mt-2 right-0 left-0 sm:left-auto sm:w-96 bg-white rounded-2xl border border-[#BFDDF0] shadow-xl z-50 p-3.5 space-y-3.5 animate-in fade-in duration-150">
                  
                  {/* Matching Products */}
                  {searchSuggestions.products.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#4A5560] block">کالاهای مرتبط:</span>
                      <div className="space-y-1">
                        {searchSuggestions.products.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              onSelectProduct(p);
                              handleSaveSearchTerm(p.name);
                              setIsSearchFocused(false);
                            }}
                            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#E4F5FF]/40 cursor-pointer transition-colors"
                          >
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-9 h-9 rounded-lg object-cover border border-[#BFDDF0]"
                            />
                            <div className="flex-1 min-w-0 text-right">
                              <h4 className="text-xs font-bold text-[#111110] truncate">{p.name}</h4>
                              <span className="text-[10px] text-[#4A5560] font-persian-nums">
                                {formatPrice(p.discountPrice || p.price)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Categories & Brands */}
                  {(searchSuggestions.categories.length > 0 || searchSuggestions.brands.length > 0) && (
                    <div className="pt-2 border-t border-[#BFDDF0]/60 space-y-1.5">
                      <span className="text-[11px] font-bold text-[#4A5560] block">پیشنهاد دسته‌بندی و برند:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {searchSuggestions.categories.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSelectedCategoryId(c.id);
                              handleSaveSearchTerm(c.title);
                              setIsSearchFocused(false);
                            }}
                            className="text-[11px] bg-[#E4F5FF] text-[#111110] px-2.5 py-1 rounded-lg hover:bg-[#BFDDF0] font-medium"
                          >
                            دسته: {c.title}
                          </button>
                        ))}
                        {searchSuggestions.brands.map((b) => (
                          <button
                            key={b}
                            onClick={() => {
                              handleBrandToggle(b);
                              handleSaveSearchTerm(b);
                              setIsSearchFocused(false);
                            }}
                            className="text-[11px] bg-gray-100 text-[#111110] px-2.5 py-1 rounded-lg hover:bg-gray-200 font-medium"
                          >
                            برند: {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && !searchQuery.trim() && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#4A5560] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>جستجوهای اخیر:</span>
                        </span>
                        <button
                          onClick={handleClearRecentSearches}
                          className="text-[10px] text-[#A33A3A] hover:underline"
                        >
                          پاک کردن تاریخچه
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((term, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectRecentSearch(term)}
                            className="text-[11px] bg-gray-50 border border-[#BFDDF0] text-[#111110] hover:bg-[#E4F5FF] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No live results */}
                  {searchQuery.trim() &&
                    searchSuggestions.products.length === 0 &&
                    searchSuggestions.categories.length === 0 &&
                    searchSuggestions.brands.length === 0 && (
                      <div className="py-2 text-center text-xs text-[#4A5560] space-y-1">
                        <p>نتیجه‌ای برای «{searchQuery}» یافت نشد.</p>
                        <p className="text-[11px] text-gray-400">عبارات پیشنهادی: هودی، تیشرت باکس، لوستر، قاب</p>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Mobile Filter Trigger Button */}
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="lg:hidden px-3.5 py-2.5 rounded-xl border border-[#BFDDF0] bg-white text-xs font-semibold text-[#111110] flex items-center gap-2 shrink-0 shadow-2xs cursor-pointer min-h-[44px]"
            >
              <Filter className="w-4 h-4" />
              <span>فیلترها</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#111110] text-white text-[10px] font-bold flex items-center justify-center font-persian-nums">
                  {formatPersianNumber(activeFilterCount)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* 3. Category Horizontal Tabs                                         */}
        {/* ------------------------------------------------------------------- */}
        <div className="w-full overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="inline-flex items-center gap-1.5 p-1 bg-white border border-[#BFDDF0] rounded-2xl shadow-2xs min-w-max">
            {/* All Products Tab */}
            <button
              onClick={() => {
                setSelectedCategoryId('all');
                setSelectedBrands([]);
                setSelectedAttrFilters({});
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap min-h-[40px] cursor-pointer flex items-center gap-2 ${
                selectedCategoryId === 'all'
                  ? 'bg-[#111110] text-white shadow-xs'
                  : 'text-[#4A5560] hover:text-[#111110] hover:bg-gray-50'
              }`}
            >
              <span>همه محصولات</span>
              <span
                className={`text-[10px] font-persian-nums px-2 py-0.5 rounded-full font-bold ${
                  selectedCategoryId === 'all' ? 'bg-white/20 text-white' : 'bg-[#E4F5FF] text-[#111110]'
                }`}
              >
                {formatPersianNumber(products.filter((p) => p.status === 'active').length)}
              </span>
            </button>

            {/* Category Tabs: Shows count for non-empty; disabled "به‌زودی" for empty */}
            {parentCategoriesMeta.map(({ cat, count }) => {
              const isSelected = selectedCategoryId === cat.id;
              const isEmpty = count === 0;

              if (isEmpty) {
                return (
                  <button
                    key={cat.id}
                    disabled
                    className="px-3.5 py-2 text-xs font-medium rounded-xl text-gray-400 bg-gray-50/70 border border-gray-200/60 cursor-not-allowed whitespace-nowrap flex items-center gap-1.5 opacity-70"
                    title="این دسته‌بندی به‌زودی با محصولات جدید تکمیل خواهد شد"
                  >
                    <span>{cat.title}</span>
                    <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.2 rounded-full font-bold">
                      به‌زودی
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategoryId(cat.id);
                    setSelectedBrands([]);
                    setSelectedAttrFilters({});
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap min-h-[40px] cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#111110] text-white shadow-xs'
                      : 'text-[#4A5560] hover:text-[#111110] hover:bg-gray-50'
                  }`}
                >
                  <span>{cat.title}</span>
                  <span
                    className={`text-[10px] font-persian-nums px-2 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#E4F5FF] text-[#111110]'
                    }`}
                  >
                    {formatPersianNumber(count)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subcategories Chips */}
        {subcategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[#4A5560] font-medium shrink-0">زیردسته‌ها:</span>
            {subcategories.map((sub) => {
              const subCount = products.filter((p) => p.categoryId === sub.id && p.status === 'active').length;
              if (subCount === 0 && selectedCategoryId !== sub.id) return null;
              const isSelected = selectedCategoryId === sub.id;

              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedCategoryId(sub.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#111110] text-white border-[#111110]'
                      : 'bg-white border-[#BFDDF0] text-[#4A5560] hover:border-[#111110]'
                  }`}
                >
                  <span>{sub.title}</span>
                  <span className="font-persian-nums text-[10px] opacity-80">
                    ({formatPersianNumber(subCount)})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* 4. Active Filters Removable Chips Bar                               */}
        {/* ------------------------------------------------------------------- */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-white border border-[#BFDDF0] text-xs shadow-2xs">
            <span className="font-bold text-[#111110] flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>فیلترهای فعال ({formatPersianNumber(activeFilterCount)}):</span>
            </span>

            {/* Category chip */}
            {selectedCategoryId !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E4F5FF] text-[#111110] font-medium">
                <span>دسته‌بندی: {activeCategory?.title || selectedCategoryId}</span>
                <button onClick={() => setSelectedCategoryId('all')} className="hover:text-red-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Selected brands chips */}
            {selectedBrands.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E4F5FF] text-[#111110] font-medium"
              >
                <span>برند: {b}</span>
                <button onClick={() => handleBrandToggle(b)} className="hover:text-red-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* In Stock chip */}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E4F5FF] text-[#111110] font-medium">
                <span>فقط کالاهای موجود</span>
                <button onClick={() => setInStockOnly(false)} className="hover:text-red-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Discount chip */}
            {discountOnly && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E4F5FF] text-[#111110] font-medium">
                <span>فقط تخفیف‌دار</span>
                <button onClick={() => setDiscountOnly(false)} className="hover:text-red-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Price chip */}
            {(parsedMinPrice !== undefined || parsedMaxPrice !== undefined) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E4F5FF] text-[#111110] font-medium font-persian-nums">
                <span>
                  قیمت:{' '}
                  {parsedMinPrice ? `از ${formatPrice(parsedMinPrice)}` : ''}{' '}
                  {parsedMaxPrice ? `تا ${formatPrice(parsedMaxPrice)}` : ''}
                </span>
                <button
                  onClick={() => {
                    setMinPriceInput('');
                    setMaxPriceInput('');
                  }}
                  className="hover:text-red-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Rating chip */}
            {minRating > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E4F5FF] text-[#111110] font-medium font-persian-nums">
                <span>امتیاز {formatPersianNumber(minRating)}+</span>
                <button onClick={() => setMinRating(0)} className="hover:text-red-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Warranty chip */}
            {selectedWarranty !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E4F5FF] text-[#111110] font-medium">
                <span>گارانتی: {selectedWarranty}</span>
                <button onClick={() => setSelectedWarranty('all')} className="hover:text-red-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Clear All CTA */}
            <button
              onClick={clearAllFilters}
              className="mr-auto text-xs text-[#A33A3A] hover:underline font-bold cursor-pointer"
            >
              پاک کردن همه
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* 5. Main Content Grid (Sidebar Filters + Products Grid)              */}
        {/* ------------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">

          {/* DESKTOP FILTER SIDEBAR */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-24">
            <div className="bg-white rounded-3xl border border-[#BFDDF0] p-5 shadow-2xs space-y-5">
              
              {/* Header with Active Filters Count */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#BFDDF0]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#111110] flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#111110]" />
                    <span>فیلترهای کاتالوگ</span>
                  </span>
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#111110] text-white text-[10px] font-bold flex items-center justify-center font-persian-nums">
                      {formatPersianNumber(activeFilterCount)}
                    </span>
                  )}
                </div>

                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-[#A33A3A] hover:underline font-medium cursor-pointer"
                  >
                    پاک کردن همه
                  </button>
                )}
              </div>

              {/* In-Stock & Discount Toggles */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center justify-between p-3 rounded-2xl border border-[#BFDDF0] bg-gray-50/70 text-xs font-semibold cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="text-[#111110]">فقط کالاهای موجود در انبار</span>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded text-[#111110] w-4 h-4 cursor-pointer accent-[#111110]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl border border-[#BFDDF0] bg-gray-50/70 text-xs font-semibold cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="text-[#111110]">فقط کالاهای دارای تخفیف</span>
                  <input
                    type="checkbox"
                    checked={discountOnly}
                    onChange={(e) => setDiscountOnly(e.target.checked)}
                    className="rounded text-[#111110] w-4 h-4 cursor-pointer accent-[#111110]"
                  />
                </label>
              </div>

              {/* Price Range Filter (Dual Inputs) */}
              <div className="space-y-3 pt-2 border-t border-[#BFDDF0]/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#111110]">محدوده قیمت (تومان):</label>
                  {(parsedMinPrice !== undefined || parsedMaxPrice !== undefined) && (
                    <button
                      onClick={() => {
                        setMinPriceInput('');
                        setMaxPriceInput('');
                      }}
                      className="text-[10px] text-[#A33A3A] hover:underline cursor-pointer"
                    >
                      حذف
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#4A5560] block mb-1">از قیمت:</span>
                    <input
                      type="number"
                      placeholder="حداقل"
                      value={minPriceInput}
                      onChange={(e) => setMinPriceInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs bg-white text-[#111110] outline-none focus:border-[#111110] font-persian-nums"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#4A5560] block mb-1">تا قیمت:</span>
                    <input
                      type="number"
                      placeholder="حداکثر"
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs bg-white text-[#111110] outline-none focus:border-[#111110] font-persian-nums"
                    />
                  </div>
                </div>

                {/* Quick Price Range Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    onClick={() => {
                      setMinPriceInput('0');
                      setMaxPriceInput('500000');
                    }}
                    className="text-[10px] bg-gray-100 hover:bg-[#E4F5FF] text-[#111110] px-2 py-1 rounded-lg transition-colors font-persian-nums"
                  >
                    زیر ۵۰۰ هزار
                  </button>
                  <button
                    onClick={() => {
                      setMinPriceInput('500000');
                      setMaxPriceInput('1500000');
                    }}
                    className="text-[10px] bg-gray-100 hover:bg-[#E4F5FF] text-[#111110] px-2 py-1 rounded-lg transition-colors font-persian-nums"
                  >
                    ۵۰۰ تا ۱.۵ میلیون
                  </button>
                  <button
                    onClick={() => {
                      setMinPriceInput('1500000');
                      setMaxPriceInput('');
                    }}
                    className="text-[10px] bg-gray-100 hover:bg-[#E4F5FF] text-[#111110] px-2 py-1 rounded-lg transition-colors font-persian-nums"
                  >
                    بالای ۱.۵ میلیون
                  </button>
                </div>
              </div>

              {/* Unified Searchable Brand Filter (No duplicates) */}
              {allBrandsInContext.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-[#BFDDF0]/60">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#111110]">برند و سازنده:</label>
                    {selectedBrands.length > 0 && (
                      <button
                        onClick={() => setSelectedBrands([])}
                        className="text-[10px] text-[#A33A3A] hover:underline cursor-pointer"
                      >
                        حذف انتخاب ({formatPersianNumber(selectedBrands.length)})
                      </button>
                    )}
                  </div>

                  {/* Brand Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={brandSearchTerm}
                      onChange={(e) => setBrandSearchTerm(e.target.value)}
                      placeholder="جستجوی برند..."
                      className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-[#BFDDF0] text-xs bg-gray-50/60 focus:bg-white text-[#111110] outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-[#4A5560] absolute right-2.5 top-2.5" />
                  </div>

                  {/* Scrollable Brands Checkbox List */}
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 no-scrollbar text-xs">
                    {filteredBrandsList.map((brand) => {
                      const isChecked = selectedBrands.includes(brand);
                      const brandProductCount = products.filter(
                        (p) => p.status === 'active' && p.brand === brand
                      ).length;

                      return (
                        <label
                          key={brand}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleBrandToggle(brand)}
                              className="rounded text-[#111110] w-3.5 h-3.5 accent-[#111110] cursor-pointer"
                            />
                            <span className="text-[#111110] font-medium">{brand}</span>
                          </div>
                          <span className="text-[10px] text-[#4A5560] font-persian-nums">
                            {formatPersianNumber(brandProductCount)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Minimum Customer Rating Filter */}
              <div className="space-y-2 pt-2 border-t border-[#BFDDF0]/60">
                <label className="text-xs font-bold text-[#111110] block">حداقل امتیاز خریداران:</label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { label: 'همه امتیازها', val: 0 },
                    { label: '۴.۵ به بالا', val: 4.5 },
                    { label: '۴.۰ به بالا', val: 4.0 },
                    { label: '۳.۵ به بالا', val: 3.5 }
                  ].map((r) => (
                    <button
                      key={r.val}
                      onClick={() => setMinRating(r.val)}
                      className={`py-1.5 px-2 rounded-xl text-center font-medium transition-colors cursor-pointer text-[11px] ${
                        minRating === r.val
                          ? 'bg-[#111110] text-white'
                          : 'bg-gray-50 border border-[#BFDDF0] text-[#4A5560] hover:text-[#111110]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warranty Filter */}
              {availableWarranties.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#BFDDF0]/60">
                  <label className="text-xs font-bold text-[#111110] block">ضمانت و گارانتی کالا:</label>
                  <select
                    value={selectedWarranty}
                    onChange={(e) => setSelectedWarranty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs bg-white text-[#111110] outline-none focus:border-[#111110] cursor-pointer"
                  >
                    <option value="all">همه ضمانت‌ها</option>
                    {availableWarranties.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dynamic Category Attributes */}
              {relevantFilterableAttributes.map((attr) => {
                const uniqueValues = Array.from(
                  new Set(
                    filteredProducts
                      .map((p) => p.attributes?.[attr.key])
                      .filter((v): v is string => Boolean(v && typeof v === 'string'))
                  )
                );

                if (uniqueValues.length === 0 && (!attr.options || attr.options.length === 0)) return null;
                const optionsToDisplay = attr.options && attr.options.length > 0 ? attr.options : uniqueValues;

                return (
                  <div key={attr.id} className="space-y-2 pt-2 border-t border-[#BFDDF0]/60">
                    <label className="text-xs font-bold text-[#111110] block">
                      {attr.name} {attr.unit && <span className="text-gray-400 font-normal">({attr.unit})</span>}:
                    </label>
                    <select
                      value={selectedAttrFilters[attr.key] || 'all'}
                      onChange={(e) =>
                        setSelectedAttrFilters((prev) => ({
                          ...prev,
                          [attr.key]: e.target.value
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#BFDDF0] text-xs bg-white text-[#111110] outline-none focus:border-[#111110] cursor-pointer"
                    >
                      <option value="all">همه</option>
                      {optionsToDisplay.map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}

            </div>
          </aside>

          {/* PRODUCTS LISTING CONTAINER */}
          <div className="lg:col-span-9 space-y-5">
            
            {/* Top Toolbar: Result Count, Sort, Grid/List Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-[#BFDDF0] text-xs shadow-2xs">
              <span className="text-[#4A5560]">
                نمایش{' '}
                <span className="font-bold text-[#111110] font-persian-nums">
                  {formatPersianNumber(paginatedProducts.length)}
                </span>{' '}
                کالا از{' '}
                <span className="font-bold text-[#111110] font-persian-nums">
                  {formatPersianNumber(sortedProducts.length)}
                </span>{' '}
                محصول موجود
              </span>

              <div className="flex items-center gap-3 justify-between sm:justify-end">
                {/* Sort Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[#4A5560] hidden md:inline">مرتب‌سازی:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-3 py-1.5 rounded-xl border border-[#BFDDF0] text-xs bg-white text-[#111110] outline-none font-medium cursor-pointer"
                  >
                    <option value="newest">جدیدترین‌ها</option>
                    <option value="popular">پرفروش‌ترین‌ها</option>
                    <option value="priceAsc">ارزان‌ترین</option>
                    <option value="priceDesc">گران‌ترین</option>
                    <option value="discount">بیشترین تخفیف</option>
                  </select>
                </div>

                {/* Grid / List View Toggle */}
                <div className="flex items-center border border-[#BFDDF0] rounded-xl p-0.5 bg-gray-50">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'grid' ? 'bg-white shadow-2xs text-[#111110]' : 'text-gray-400 hover:text-gray-700'
                    }`}
                    title="نمایش کاشی‌کاری (گرید)"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'list' ? 'bg-white shadow-2xs text-[#111110]' : 'text-gray-400 hover:text-gray-700'
                    }`}
                    title="نمایش فهرستی (لیست)"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {sortedProducts.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white rounded-3xl border border-[#BFDDF0] shadow-2xs space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#E4F5FF] text-[#111110] flex items-center justify-center mx-auto shadow-sm">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#111110]">
                  کالایی با معیارهای انتخاب‌شده یافت نشد
                </h3>
                <p className="text-xs sm:text-sm text-[#4A5560] max-w-md mx-auto leading-relaxed">
                  می‌توانید فیلترهای انتخابی یا بازه قیمت را بازنشانی کرده و مجدداً فهرست کالاها را مشاهده کنید.
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <button
                    onClick={clearAllFilters}
                    className="px-5 py-2.5 rounded-xl bg-[#111110] text-white text-xs font-semibold hover:bg-[#2A2A28] transition-colors cursor-pointer"
                  >
                    حذف فیلترها و مشاهده همه کالاها
                  </button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              /* --------------------------------------------------------------- */
              /* 6. GRID VIEW PRODUCT CARDS (Fixed 4:5 image, no gap, wishlist)  */
              /* --------------------------------------------------------------- */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {paginatedProducts.map((product) => {
                  const isOutOfStock = product.stock === 0;
                  const isLowStock = product.stock > 0 && product.stock <= 3;
                  const hasDiscount =
                    product.discountPrice !== undefined && product.discountPrice < product.price;

                  const currentPrice = hasDiscount ? product.discountPrice! : product.price;
                  const originalPrice = hasDiscount ? product.price : undefined;
                  const discountPercent =
                    hasDiscount && originalPrice
                      ? Math.round(((originalPrice - product.discountPrice!) / originalPrice) * 100)
                      : 0;

                  const isWishlisted = wishlist.has(product.id);
                  const isRecentlyAdded = recentlyAddedId === product.id;
                  const isLoadingThis = loadingProductId === product.id;
                  const cartQty = getProductCartQuantity(product.id);
                  const catObj = categories.find((c) => c.id === product.categoryId);
                  const ratingScore = product.rating || (product.isBestSeller ? 4.9 : 4.8);
                  const reviewCount = product.ratingCount || (product.isBestSeller ? 24 : 14);

                  return (
                    <div
                      key={product.id}
                      className="group flex flex-col justify-between bg-white rounded-2xl sm:rounded-3xl border border-[#BFDDF0] p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(17,17,16,0.03)] hover:shadow-[0_12px_32px_rgba(17,17,16,0.08)] transition-all duration-300 relative"
                    >
                      {/* Top Action Bar & Image Frame (Fixed 4:5 aspect ratio) */}
                      <div className="relative w-full aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden bg-[#F0F5FA] mb-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          onClick={() => onSelectProduct(product)}
                          className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 cursor-pointer ${
                            isOutOfStock ? 'opacity-55 grayscale-[35%]' : ''
                          }`}
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/brand/morico-logo.jpg';
                          }}
                        />

                        {/* Top-Right: Discount Badge */}
                        {hasDiscount && (
                          <div className="absolute top-2.5 right-2.5 bg-[#111110] text-white rounded-lg px-2 py-1 text-[10px] font-bold shadow-sm font-persian-nums z-10">
                            ٪{formatPersianNumber(discountPercent)} تخفیف
                          </div>
                        )}

                        {/* Top-Left: Wishlist Heart Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product.id);
                          }}
                          className={`absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 z-10 shadow-xs cursor-pointer ${
                            isWishlisted
                              ? 'bg-red-50 text-red-500 scale-105 border border-red-200'
                              : 'bg-white/80 backdrop-blur-md text-[#4A5560] hover:text-[#111110] hover:bg-white border border-[#BFDDF0]/60'
                          }`}
                          title={isWishlisted ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
                        >
                          <Heart
                            className={`w-4 h-4 transition-transform ${isWishlisted ? 'fill-current scale-110' : ''}`}
                          />
                        </button>

                        {/* Center Hover Quick View Button */}
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                          <button
                            onClick={() => handleOpenQuickView(product)}
                            className="px-4 py-2 rounded-xl bg-white/95 text-[#111110] text-xs font-bold shadow-lg hover:bg-white flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>مشاهده سریع</span>
                          </button>
                        </div>
                      </div>

                      {/* Content Section (Under Image - clean brand text, 2-line title) */}
                      <div className="flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          
                          {/* Brand & Category row */}
                          <div className="flex items-center justify-between text-[11px] text-[#4A5560]">
                            <span className="font-semibold text-[#111110] truncate max-w-[130px]">
                              {product.brand || 'MORICO'}
                            </span>
                            <span className="text-[10px] text-gray-400 truncate max-w-[100px]">
                              {catObj?.title || 'کالکشن اختصاصی'}
                            </span>
                          </div>

                          {/* Product Title Clamped to 2 lines */}
                          <h3
                            onClick={() => onSelectProduct(product)}
                            className="text-sm font-bold text-[#111110] hover:text-[#2A2A28] cursor-pointer line-clamp-2 leading-snug min-h-[40px]"
                            title={product.name}
                          >
                            {product.name}
                          </h3>

                          {/* Rating & Stock Status Row */}
                          <div className="flex items-center justify-between text-[11px]">
                            {/* Rating */}
                            <div className="flex items-center gap-1 text-[#4A5560]">
                              <span className="font-bold text-[#111110] font-persian-nums">
                                امتیاز {formatPersianNumber(ratingScore)}
                              </span>
                              <span className="text-[10px] text-[#4A5560] font-persian-nums">
                                ({formatPersianNumber(reviewCount)})
                              </span>
                            </div>

                            {/* Stock status */}
                            {isOutOfStock ? (
                              <span className="text-[10px] font-bold text-[#A33A3A] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#A33A3A]" />
                                <span>ناموجود</span>
                              </span>
                            ) : isLowStock ? (
                              <span className="text-[10px] font-bold text-[#9A6B1F] flex items-center gap-1 font-persian-nums">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#9A6B1F]" />
                                <span>تنها {formatPersianNumber(product.stock)} عدد</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-[#2F6B4F] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B4F]" />
                                <span>موجود</span>
                              </span>
                            )}
                          </div>

                          {/* Max 2 Clean Tags */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            {product.attributes?.material ? (
                              <span className="text-[10px] bg-[#E4F5FF]/60 border border-[#BFDDF0] text-[#111110] px-2 py-0.5 rounded-md truncate max-w-[130px]">
                                {String(product.attributes.material)}
                              </span>
                            ) : (
                              <span className="text-[10px] bg-gray-50 border border-gray-200 text-[#4A5560] px-2 py-0.5 rounded-md">
                                ۱۰۰٪ ارگانیک
                              </span>
                            )}

                            {product.customizable && (
                              <span className="text-[10px] bg-[#111110] text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-[#E4F5FF]" />
                                <span>سفارشی</span>
                              </span>
                            )}
                          </div>

                        </div>

                        {/* Price & Add to Cart Container */}
                        <div className="pt-3 border-t border-[#BFDDF0]/60 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm sm:text-base font-bold text-[#111110] font-persian-nums">
                                {formatPrice(currentPrice)}
                              </div>
                              {hasDiscount && (
                                <div className="text-xs text-[#4A5560] line-through font-persian-nums">
                                  {formatPrice(originalPrice)}
                                </div>
                              )}
                            </div>

                            {/* Color swatches previews */}
                            {product.colors && product.colors.length > 0 && (
                              <div className="flex items-center gap-1">
                                {product.colors.slice(0, 3).map((col) => (
                                  <span
                                    key={col.name}
                                    className="w-3.5 h-3.5 rounded-full border border-black/20"
                                    style={{ backgroundColor: col.hex }}
                                    title={col.name}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Primary Action: Quantity Stepper if in cart, or Add Button */}
                          {cartQty > 0 ? (
                            <div className="w-full flex items-center justify-between bg-[#E4F5FF]/60 border border-[#BFDDF0] rounded-xl px-2 py-1 min-h-[42px]">
                              <button
                                onClick={() => handleIncrementQuantity(product.id)}
                                className="w-8 h-8 rounded-lg bg-white border border-[#BFDDF0] flex items-center justify-center text-[#111110] hover:bg-white/90 active:scale-95 cursor-pointer shadow-xs"
                                title="افزایش تعداد"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>

                              <div className="text-xs font-bold text-[#111110] font-persian-nums flex items-center gap-1">
                                <span>{formatPersianNumber(cartQty)}</span>
                                <span className="text-[10px] text-[#4A5560] font-normal">در سبد</span>
                              </div>

                              <button
                                onClick={() => handleDecrementQuantity(product.id)}
                                className="w-8 h-8 rounded-lg bg-white border border-[#BFDDF0] flex items-center justify-center text-[#111110] hover:bg-white/90 active:scale-95 cursor-pointer shadow-xs"
                                title="کاهش تعداد"
                              >
                                {cartQty === 1 ? (
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                ) : (
                                  <Minus className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <button
                              disabled={isOutOfStock || isLoadingThis}
                              onClick={() => handleCardAddToCart(product)}
                              className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 min-h-[42px] cursor-pointer shadow-xs active:scale-[0.98] ${
                                isOutOfStock
                                  ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                                  : isRecentlyAdded
                                  ? 'bg-[#2F6B4F] text-white border border-[#2F6B4F]'
                                  : 'bg-[#111110] text-white hover:bg-[#2A2A28]'
                              }`}
                            >
                              {isLoadingThis ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : isRecentlyAdded ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span>به سبد اضافه شد</span>
                                </>
                              ) : isOutOfStock ? (
                                <span>اتمام موجودی در انبار</span>
                              ) : (
                                <>
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>افزودن به سبد خرید</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Secondary Quick Buttons */}
                          <div className={`grid gap-2 ${product.customizable ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            <button
                              onClick={() => onSelectProduct(product)}
                              className="w-full py-1.5 px-2.5 rounded-xl border border-[#BFDDF0] bg-white text-[#111110] hover:bg-[#E4F5FF]/40 text-xs font-medium transition-colors flex items-center justify-center gap-1 min-h-[34px] cursor-pointer"
                            >
                              <span>مشخصات کالا</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>

                            {product.customizable && (
                              <button
                                onClick={() => onCustomizeProduct(product)}
                                className="w-full py-1.5 px-2.5 rounded-xl border border-[#111110] bg-[#E4F5FF] text-[#111110] hover:bg-[#111110] hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1 min-h-[34px] cursor-pointer group/btn"
                              >
                                <Sparkles className="w-3 h-3 text-[#111110] group-hover/btn:text-white" />
                                <span>طراحی آنلاین</span>
                              </button>
                            )}
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* --------------------------------------------------------------- */
              /* 7. LIST VIEW PRODUCT CARDS                                      */
              /* --------------------------------------------------------------- */
              <div className="space-y-4">
                {paginatedProducts.map((product) => {
                  const isOutOfStock = product.stock === 0;
                  const isLowStock = product.stock > 0 && product.stock <= 3;
                  const hasDiscount =
                    product.discountPrice !== undefined && product.discountPrice < product.price;

                  const currentPrice = hasDiscount ? product.discountPrice! : product.price;
                  const originalPrice = hasDiscount ? product.price : undefined;
                  const discountPercent =
                    hasDiscount && originalPrice
                      ? Math.round(((originalPrice - product.discountPrice!) / originalPrice) * 100)
                      : 0;

                  const isWishlisted = wishlist.has(product.id);
                  const cartQty = getProductCartQuantity(product.id);
                  const catObj = categories.find((c) => c.id === product.categoryId);
                  const ratingScore = product.rating || (product.isBestSeller ? 4.9 : 4.8);
                  const reviewCount = product.ratingCount || (product.isBestSeller ? 24 : 14);

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-[#BFDDF0] p-4 shadow-2xs hover:shadow-md transition-shadow flex flex-col md:flex-row gap-5 items-center"
                    >
                      {/* Image Frame */}
                      <div className="relative w-full md:w-44 aspect-[4/5] rounded-xl overflow-hidden bg-[#F0F5FA] shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          onClick={() => onSelectProduct(product)}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        />
                        {hasDiscount && (
                          <div className="absolute top-2 right-2 bg-[#111110] text-white rounded-md px-1.5 py-0.5 text-[9px] font-bold font-persian-nums">
                            ٪{formatPersianNumber(discountPercent)}
                          </div>
                        )}
                        <button
                          onClick={() => toggleWishlist(product.id)}
                          className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-[#4A5560]"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                      </div>

                      {/* Content Middle */}
                      <div className="flex-1 min-w-0 space-y-2 text-right">
                        <div className="flex items-center gap-2 text-xs text-[#4A5560]">
                          <span className="font-bold text-[#111110]">{product.brand || 'MORICO'}</span>
                          <span>·</span>
                          <span>{catObj?.title}</span>
                        </div>
                        <h3
                          onClick={() => onSelectProduct(product)}
                          className="text-base font-bold text-[#111110] hover:underline cursor-pointer"
                        >
                          {product.name}
                        </h3>
                        <p className="text-xs text-[#4A5560] line-clamp-2 leading-relaxed">
                          {product.description || 'محصول انحصاری آتلیه موریکو با بالاترین کیفیت پارچه و دوخت ارگانیک.'}
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1 text-[#4A5560]">
                            <span className="font-bold text-[#111110] font-persian-nums">امتیاز {formatPersianNumber(ratingScore)}</span>
                            <span className="text-[10px] text-[#4A5560] font-persian-nums">({formatPersianNumber(reviewCount)} نظر)</span>
                          </div>
                          {isOutOfStock ? (
                            <span className="text-red-600 font-bold text-[11px]">ناموجود</span>
                          ) : isLowStock ? (
                            <span className="text-amber-600 font-bold text-[11px] font-persian-nums">
                              تنها {formatPersianNumber(product.stock)} عدد در انبار
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium text-[11px]">موجود در انبار</span>
                          )}
                        </div>
                      </div>

                      {/* Pricing & CTA Left Column */}
                      <div className="w-full md:w-52 shrink-0 md:border-r md:border-[#BFDDF0] md:pr-5 flex flex-col justify-between gap-3">
                        <div>
                          <div className="text-lg font-bold text-[#111110] font-persian-nums">
                            {formatPrice(currentPrice)}
                          </div>
                          {hasDiscount && (
                            <div className="text-xs text-[#4A5560] line-through font-persian-nums">
                              {formatPrice(originalPrice)}
                            </div>
                          )}
                        </div>

                        {cartQty > 0 ? (
                          <div className="w-full flex items-center justify-between bg-[#E4F5FF] border border-[#BFDDF0] rounded-xl px-2 py-1">
                            <button
                              onClick={() => handleIncrementQuantity(product.id)}
                              className="w-7 h-7 rounded-lg bg-white flex items-center justify-center"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold font-persian-nums">{formatPersianNumber(cartQty)}</span>
                            <button
                              onClick={() => handleDecrementQuantity(product.id)}
                              className="w-7 h-7 rounded-lg bg-white flex items-center justify-center"
                            >
                              {cartQty === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={isOutOfStock}
                            onClick={() => handleCardAddToCart(product)}
                            className="w-full py-2.5 px-3 rounded-xl bg-[#111110] hover:bg-[#2A2A28] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-200 disabled:text-gray-400"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>افزودن به سبد</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenQuickView(product)}
                          className="w-full py-1.5 px-3 rounded-xl border border-[#BFDDF0] bg-white text-[#111110] hover:bg-[#E4F5FF] text-xs font-medium cursor-pointer"
                        >
                          مشاهده سریع
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* --------------------------------------------------------------- */}
            {/* 8. Pagination / "نمایش کالاهای بیشتر" CTA                        */}
            {/* --------------------------------------------------------------- */}
            {hasMore && (
              <div className="text-center pt-6 space-y-3">
                <div className="w-48 h-1.5 bg-gray-200 rounded-full mx-auto overflow-hidden">
                  <div
                    className="h-full bg-[#111110] rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (visibleCount / sortedProducts.length) * 100)}%`
                    }}
                  />
                </div>
                <button
                  disabled={isLoadingMore}
                  onClick={handleLoadMore}
                  className="px-8 py-3 rounded-2xl bg-white border border-[#111110] text-[#111110] hover:bg-[#111110] hover:text-white text-xs font-bold transition-all shadow-xs cursor-pointer min-h-[46px] inline-flex items-center gap-2"
                >
                  {isLoadingMore ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>نمایش کالاهای بیشتر</span>
                      <span className="font-persian-nums text-[11px] opacity-80">
                        ({formatPersianNumber(sortedProducts.length - visibleCount)} کالا باقی‌مانده)
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 9. QUICK VIEW MODAL (Focus Trap, ESC to close, Variants & Stepper)  */}
      {/* ------------------------------------------------------------------- */}
      {quickViewProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={handleCloseQuickView}
        >
          <div
            ref={quickViewModalRef}
            className="bg-white rounded-3xl border border-[#BFDDF0] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl space-y-6 relative text-right"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseQuickView}
              className="absolute top-5 left-5 w-8 h-8 rounded-full border border-[#BFDDF0] flex items-center justify-center text-[#111110] hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Gallery Column */}
              <div className="space-y-3">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#F0F5FA] border border-[#BFDDF0]">
                  <img
                    src={
                      quickViewProduct.images && quickViewProduct.images[quickViewImageIndex]
                        ? quickViewProduct.images[quickViewImageIndex]
                        : quickViewProduct.image
                    }
                    alt={quickViewProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Thumbnails */}
                {quickViewProduct.images && quickViewProduct.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {quickViewProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuickViewImageIndex(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          quickViewImageIndex === idx ? 'border-[#111110]' : 'border-transparent opacity-60'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Details Column */}
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-[#4A5560] block">
                    {quickViewProduct.brand || 'MORICO ATELIER'}
                  </span>
                  <h3 className="text-lg font-bold text-[#111110] mt-1">{quickViewProduct.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#4A5560] mt-1 font-persian-nums">
                    <span className="font-bold text-[#111110]">امتیاز {formatPersianNumber(quickViewProduct.rating || 4.8)}</span>
                    <span className="text-gray-400">({formatPersianNumber(quickViewProduct.ratingCount || 18)} نظر خریداران)</span>
                  </div>
                </div>

                {/* Price */}
                <div className="pt-2 border-t border-[#BFDDF0]/60">
                  <div className="text-xl font-bold text-[#111110] font-persian-nums">
                    {formatPrice(quickViewProduct.discountPrice || quickViewProduct.price)}
                  </div>
                  {quickViewProduct.discountPrice && (
                    <div className="text-xs text-[#4A5560] line-through font-persian-nums">
                      {formatPrice(quickViewProduct.price)}
                    </div>
                  )}
                </div>

                {/* Short description */}
                <p className="text-xs text-[#4A5560] leading-relaxed line-clamp-3">
                  {quickViewProduct.description ||
                    'محصول طراحی‌شده در آتلیه موریکو با استفاده از الیاف خالص پنبه ارگانیک و بالاترین درجه تراکم بافت.'}
                </p>

                {/* Color Selector */}
                {quickViewProduct.colors && quickViewProduct.colors.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-[#111110] block">
                      رنگ انتخابی: <span className="font-normal text-gray-500">{quickViewColor}</span>
                    </span>
                    <div className="flex gap-2">
                      {quickViewProduct.colors.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => setQuickViewColor(c.name)}
                          className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                            quickViewColor === c.name ? 'border-[#111110] scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Selector */}
                {quickViewProduct.sizes && quickViewProduct.sizes.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-[#111110] block">
                      سایز: <span className="font-normal text-gray-500">{quickViewSize}</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {quickViewProduct.sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setQuickViewSize(s)}
                          className={`px-3 py-1 text-xs rounded-lg border cursor-pointer font-medium transition-colors ${
                            quickViewSize === s
                              ? 'bg-[#111110] text-white border-[#111110]'
                              : 'bg-white border-[#BFDDF0] text-[#4A5560]'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity & CTA */}
                <div className="pt-2 border-t border-[#BFDDF0]/60 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-[#BFDDF0] rounded-xl p-1 bg-gray-50">
                      <button
                        onClick={() => setQuickViewQuantity((q) => Math.min(quickViewProduct.stock, q + 1))}
                        className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold font-persian-nums">
                        {formatPersianNumber(quickViewQuantity)}
                      </span>
                      <button
                        onClick={() => setQuickViewQuantity((q) => Math.max(1, q - 1))}
                        className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-xs"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      disabled={quickViewProduct.stock === 0}
                      onClick={() => {
                        if (onAddToCart) {
                          onAddToCart(
                            quickViewProduct,
                            quickViewColor,
                            quickViewSize,
                            quickViewQuantity,
                            quickViewProduct.variants?.[0]
                          );
                        }
                        handleCloseQuickView();
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#111110] text-white hover:bg-[#2A2A28] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:bg-gray-200"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>افزودن به سبد خرید</span>
                    </button>
                  </div>

                  {/* Full details link */}
                  <button
                    onClick={() => {
                      onSelectProduct(quickViewProduct);
                      handleCloseQuickView();
                    }}
                    className="w-full py-2 text-center text-xs font-bold text-[#111110] hover:underline cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>مشاهده صفحه و مشخصات کامل کالا</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 10. MOBILE FILTERS BOTTOM SHEET                                     */}
      {/* ------------------------------------------------------------------- */}
      {isMobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsMobileFiltersOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl border-t border-[#BFDDF0] w-full max-h-[85vh] overflow-y-auto p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#BFDDF0]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#111110]">فیلترهای کاتالوگ</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#111110] text-white text-[10px] font-bold flex items-center justify-center font-persian-nums">
                    {formatPersianNumber(activeFilterCount)}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-1.5 rounded-lg border border-[#BFDDF0] text-[#111110] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* In-Stock & Discount */}
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl border border-[#BFDDF0] bg-gray-50 text-xs font-semibold cursor-pointer">
                <span>فقط کالاهای موجود در انبار</span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-[#111110] w-4 h-4 cursor-pointer accent-[#111110]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-[#BFDDF0] bg-gray-50 text-xs font-semibold cursor-pointer">
                <span>فقط کالاهای دارای تخفیف</span>
                <input
                  type="checkbox"
                  checked={discountOnly}
                  onChange={(e) => setDiscountOnly(e.target.checked)}
                  className="rounded text-[#111110] w-4 h-4 cursor-pointer accent-[#111110]"
                />
              </label>
            </div>

            {/* Price Range */}
            <div className="space-y-2 p-3 rounded-xl border border-[#BFDDF0] bg-white">
              <label className="text-xs font-bold text-[#111110] block">محدوده قیمت (تومان):</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="number"
                  placeholder="حداقل قیمت"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-[#BFDDF0] text-xs bg-white text-[#111110] outline-none font-persian-nums"
                />
                <input
                  type="number"
                  placeholder="حداکثر قیمت"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-[#BFDDF0] text-xs bg-white text-[#111110] outline-none font-persian-nums"
                />
              </div>
            </div>

            {/* Brands Multi-Select */}
            {allBrandsInContext.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#111110] block">برندهای سازنده:</label>
                <div className="max-h-36 overflow-y-auto space-y-1 border border-[#BFDDF0] rounded-xl p-2 no-scrollbar text-xs">
                  {allBrandsInContext.map((b) => (
                    <label key={b} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(b)}
                        onChange={() => handleBrandToggle(b)}
                        className="rounded accent-[#111110]"
                      />
                      <span>{b}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Sticky Action Footer */}
            <div className="sticky bottom-0 pt-3 pb-1 bg-white border-t border-[#BFDDF0] flex items-center justify-between gap-3">
              <button
                onClick={clearAllFilters}
                className="px-4 py-3 rounded-xl border border-[#BFDDF0] text-xs font-medium text-[#A33A3A] cursor-pointer"
              >
                پاک کردن
              </button>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 py-3 px-6 rounded-xl bg-[#111110] text-white text-xs font-bold cursor-pointer shadow-md"
              >
                اعمال فیلترها ({formatPersianNumber(sortedProducts.length)} کالا)
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
