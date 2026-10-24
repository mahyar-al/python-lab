import { useState, useEffect, useCallback } from 'react';
import { Product, CartItem, Order, DiscountCode, Category, CategoryAttribute, SiteContent, User, BannerAd, BestSellerItem, TopWeeklyItem } from './types';
import {
  api,
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORY_ATTRIBUTES,
  DEFAULT_PRODUCTS,
  DEFAULT_SITE_CONTENT,
  DEFAULT_DISCOUNTS,
  STORAGE_KEYS,
  broadcastStoreUpdate
} from './api';
import {
  DEFAULT_BEST_SELLER_ITEMS,
  DEFAULT_TOP_WEEKLY_ITEMS
} from './specialSectionsData';
import { mergeGuestAndUserCart } from './cartUtils';

export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_DISCOUNTS: DiscountCode[] = DEFAULT_DISCOUNTS;

export interface AddToCartResult {
  success: boolean;
  message: string;
  item?: CartItem;
}

export function useAppStore() {
  const readProducts = (): Product[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
    } catch {
      return DEFAULT_PRODUCTS;
    }
  };

  const readCategories = (): Category[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  };

  const readCategoryAttributes = (): CategoryAttribute[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORY_ATTRIBUTES);
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORY_ATTRIBUTES;
    } catch {
      return DEFAULT_CATEGORY_ATTRIBUTES;
    }
  };

  const readSiteContent = (): SiteContent => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SITE_CONTENT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed?.hero?.title?.includes('پنبه ارگانیک') ||
          parsed?.branding?.siteSubtitle?.includes('مینیمال') ||
          parsed?.branding?.siteSubtitle?.includes('مد و لباس') ||
          parsed?.hero?.badge === '73042423'
        ) {
          localStorage.setItem(STORAGE_KEYS.SITE_CONTENT, JSON.stringify(DEFAULT_SITE_CONTENT));
          return DEFAULT_SITE_CONTENT;
        }
        return parsed;
      }
      return DEFAULT_SITE_CONTENT;
    } catch {
      return DEFAULT_SITE_CONTENT;
    }
  };

  const readBanners = (): BannerAd[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BANNERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const readOrders = (): Order[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  };

  const readDiscounts = (): DiscountCode[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DISCOUNTS);
      return saved ? JSON.parse(saved) : DEFAULT_DISCOUNTS;
    } catch {
      return DEFAULT_DISCOUNTS;
    }
  };

  const readBestSellers = (): BestSellerItem[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BEST_SELLERS);
      return saved ? JSON.parse(saved) : DEFAULT_BEST_SELLER_ITEMS;
    } catch {
      return DEFAULT_BEST_SELLER_ITEMS;
    }
  };

  const readTopWeekly = (): TopWeeklyItem[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TOP_WEEKLY);
      return saved ? JSON.parse(saved) : DEFAULT_TOP_WEEKLY_ITEMS;
    } catch {
      return DEFAULT_TOP_WEEKLY_ITEMS;
    }
  };

  const readInitialCart = (): CartItem[] => {
    try {
      const sessionStr = localStorage.getItem('morico_session_user');
      const currentUser = sessionStr ? JSON.parse(sessionStr) : null;
      const key = currentUser?.id ? `morico_cart_user_${currentUser.id}` : 'morico_cart_v2';
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const [categories, setCategories] = useState<Category[]>(readCategories);
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>(readCategoryAttributes);
  const [products, setProducts] = useState<Product[]>(readProducts);
  const [siteContent, setSiteContent] = useState<SiteContent>(readSiteContent);
  const [banners, setBanners] = useState<BannerAd[]>(readBanners);
  const [bestSellers, setBestSellers] = useState<BestSellerItem[]>(readBestSellers);
  const [topWeekly, setTopWeekly] = useState<TopWeeklyItem[]>(readTopWeekly);
  const [orders, setOrders] = useState<Order[]>(readOrders);
  const [cart, setCart] = useState<CartItem[]>(readInitialCart);
  const [discounts, setDiscounts] = useState<DiscountCode[]>(readDiscounts);

  // Undo removal support
  const [recentlyRemoved, setRecentlyRemoved] = useState<{
    item: CartItem;
    index: number;
    timestamp: number;
  } | null>(null);

  // Synchronize all state from real server API and local storage
  const refreshAll = useCallback(async () => {
    // 1. Immediately read cached values to avoid flickering
    setCategories(readCategories());
    setCategoryAttributes(readCategoryAttributes());
    const freshProducts = readProducts();
    setProducts(freshProducts);
    setSiteContent(readSiteContent());
    setBanners(readBanners());
    setBestSellers(readBestSellers());
    setTopWeekly(readTopWeekly());
    setOrders(readOrders());
    setDiscounts(readDiscounts());

    // 2. Fetch fresh live data from the server
    try {
      const bootstrap = await api.getBootstrap();
      if (bootstrap) {
        if (bootstrap.categories && Array.isArray(bootstrap.categories)) {
          setCategories(bootstrap.categories);
          try {
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(bootstrap.categories));
          } catch {}
        }
        if (bootstrap.categoryAttributes) setCategoryAttributes(bootstrap.categoryAttributes);
        if (bootstrap.products && Array.isArray(bootstrap.products)) {
          setProducts(bootstrap.products);
          try {
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(bootstrap.products));
          } catch {}
        }
        if (bootstrap.siteContent) setSiteContent(bootstrap.siteContent);
        if (bootstrap.banners) setBanners(bootstrap.banners);
        if (bootstrap.bestSellers && Array.isArray(bootstrap.bestSellers)) setBestSellers(bootstrap.bestSellers);
        if (bootstrap.topWeekly && Array.isArray(bootstrap.topWeekly)) setTopWeekly(bootstrap.topWeekly);
        if (bootstrap.discounts) setDiscounts(bootstrap.discounts);
      } else {
        // Fallback individual requests
        const [liveCats, liveAttrs, liveProds, liveContent, liveBanners] = await Promise.all([
          api.getCategories().catch(() => null),
          api.getCategoryAttributes().catch(() => null),
          api.getProducts().catch(() => null),
          api.getContent().catch(() => null),
          api.getBanners().catch(() => null)
        ]);
        if (liveCats && Array.isArray(liveCats)) {
          setCategories(liveCats);
          try {
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(liveCats));
          } catch {}
        }
        if (liveAttrs) setCategoryAttributes(liveAttrs);
        if (liveProds) setProducts(liveProds);
        if (liveContent) setSiteContent(liveContent);
        if (liveBanners) setBanners(liveBanners);
      }
    } catch (err) {
      console.warn('Network sync error:', err);
    }

    // 3. Synchronize cart against fresh stock & prices
    setCart((prevCart) => {
      let changed = false;
      const updated = prevCart.map((item) => {
        const liveProd = freshProducts.find((p) => p.id === item.product.id);
        if (liveProd) {
          if (
            liveProd.price !== item.product.price ||
            liveProd.discountPrice !== item.product.discountPrice ||
            liveProd.stock !== item.product.stock ||
            liveProd.name !== item.product.name
          ) {
            changed = true;
            return {
              ...item,
              product: liveProd,
              quantity: Math.min(item.quantity, Math.max(1, liveProd.stock || 1))
            };
          }
        }
        return item;
      });
      return changed ? updated : prevCart;
    });
  }, []);

  // Live listener for sync events across Admin Panel and Storefront
  useEffect(() => {
    refreshAll();

    const handleSync = () => {
      refreshAll();
    };

    window.addEventListener('morico_store_sync', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('morico_store_sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [refreshAll]);

  // Persist cart to active storage key
  useEffect(() => {
    try {
      const sessionStr = localStorage.getItem('morico_session_user');
      const currentUser = sessionStr ? JSON.parse(sessionStr) : null;
      const key = currentUser?.id ? `morico_cart_user_${currentUser.id}` : 'morico_cart_v2';
      localStorage.setItem(key, JSON.stringify(cart));
      if (!currentUser?.id) {
        localStorage.setItem('morico_cart_v2', JSON.stringify(cart));
      }
    } catch {}
  }, [cart]);

  // User login cart synchronization
  const syncUserCartOnLogin = useCallback((user: User) => {
    try {
      const guestRaw = localStorage.getItem('morico_cart_v2');
      const guestCart: CartItem[] = guestRaw ? JSON.parse(guestRaw) : [];
      const userKey = `morico_cart_user_${user.id}`;
      const userRaw = localStorage.getItem(userKey);
      const userSavedCart: CartItem[] = userRaw ? JSON.parse(userRaw) : [];

      const currentProducts = readProducts();
      const merged = mergeGuestAndUserCart(guestCart, userSavedCart, currentProducts);

      localStorage.setItem(userKey, JSON.stringify(merged));
      setCart(merged);
    } catch (e) {
      console.warn('Error merging carts on login', e);
    }
  }, []);

  // User logout cart synchronization
  const syncUserCartOnLogout = useCallback(() => {
    try {
      const guestRaw = localStorage.getItem('morico_cart_v2');
      const guestCart: CartItem[] = guestRaw ? JSON.parse(guestRaw) : [];
      setCart(guestCart);
    } catch {}
  }, []);

  const updateSiteContent = async (newContent: SiteContent) => {
    setSiteContent(newContent);
    await api.updateContent(newContent);
  };

  /**
   * Add to Cart with inventory validation
   */
  const addToCart = (item: CartItem): AddToCartResult => {
    const liveProd = products.find((p) => p.id === item.product.id) || item.product;
    const availableStock = item.selectedVariant && item.selectedVariant.stock !== undefined
      ? item.selectedVariant.stock
      : (liveProd.stock ?? 0);

    if (availableStock <= 0) {
      return {
        success: false,
        message: 'متأسفانه این محصول یا تنوع انتخابی در حال حاضر در انبار ناموجود است.'
      };
    }

    let finalMessage = 'محصول با موفقیت به سبد خرید افزوده شد.';

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (ci) =>
          ci.product.id === item.product.id &&
          (ci.selectedVariantId || '') === (item.selectedVariantId || '') &&
          (ci.selectedColor || '') === (item.selectedColor || '') &&
          (ci.selectedSize || '') === (item.selectedSize || '') &&
          JSON.stringify(ci.customization || {}) === JSON.stringify(item.customization || {})
      );

      if (existingIndex > -1) {
        const copy = [...prev];
        const currentQty = copy[existingIndex].quantity;
        const requestedQty = currentQty + item.quantity;

        if (requestedQty > availableStock) {
          copy[existingIndex].quantity = availableStock;
          finalMessage = `تعداد در سبد خرید به حداکثر موجودی انبار (${availableStock} عدد) تنظیم شد.`;
        } else {
          copy[existingIndex].quantity = requestedQty;
          finalMessage = `تعداد محصول در سبد خرید به ${requestedQty} عدد افزایش یافت.`;
        }
        return copy;
      }

      const safeQty = Math.min(item.quantity, availableStock);
      if (safeQty < item.quantity) {
        finalMessage = `تعداد درخواستی بیشتر از موجودی بود؛ ${safeQty} عدد به سبد افزوده شد.`;
      }

      return [
        ...prev,
        {
          ...item,
          quantity: safeQty,
          product: liveProd
        }
      ];
    });

    return {
      success: true,
      message: finalMessage,
      item
    };
  };

  const removeFromCart = (cartItemId: string): CartItem | null => {
    let removed: CartItem | null = null;
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.cartItemId === cartItemId);
      if (idx > -1) {
        removed = prev[idx];
        setRecentlyRemoved({
          item: prev[idx],
          index: idx,
          timestamp: Date.now()
        });
        return prev.filter((i) => i.cartItemId !== cartItemId);
      }
      return prev;
    });
    return removed;
  };

  const undoRemoveItem = (): boolean => {
    if (!recentlyRemoved) return false;
    setCart((prev) => {
      const copy = [...prev];
      const targetIndex = Math.min(recentlyRemoved.index, copy.length);
      copy.splice(targetIndex, 0, recentlyRemoved.item);
      return copy;
    });
    setRecentlyRemoved(null);
    return true;
  };

  const updateCartQuantity = (cartItemId: string, newQty: number): { success: boolean; message?: string } => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return { success: true, message: 'آیتم از سبد خرید حذف شد.' };
    }

    let msg = 'تعداد محصول بروزرسانی شد.';
    let success = true;

    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          const liveProd = products.find((p) => p.id === item.product.id) || item.product;
          const maxAllowed = liveProd.stock ?? 99;
          const safeQty = Math.min(newQty, Math.max(1, maxAllowed));
          if (newQty > maxAllowed) {
            msg = `حداکثر موجودی انبار (${maxAllowed} عدد) تنظیم شد.`;
          }
          return {
            ...item,
            quantity: safeQty
          };
        }
        return item;
      })
    );

    return { success, message: msg };
  };

  const clearCart = () => {
    setCart([]);
    try {
      const sessionStr = localStorage.getItem('morico_session_user');
      const currentUser = sessionStr ? JSON.parse(sessionStr) : null;
      const key = currentUser?.id ? `morico_cart_user_${currentUser.id}` : 'morico_cart_v2';
      localStorage.removeItem(key);
      localStorage.removeItem('morico_cart_v2');
    } catch {}
  };

  const addOrder = async (order: Order) => {
    // 1. Locally decrement stock immediately
    const updatedProducts = products.map((p) => {
      const orderedItem = order.items.find((item) => item.product.id === p.id);
      if (orderedItem) {
        return {
          ...p,
          stock: Math.max(0, (p.stock || 0) - orderedItem.quantity)
        };
      }
      return p;
    });
    setProducts(updatedProducts);
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
    } catch {}

    // 2. Save order locally
    const updatedOrders = [order, ...orders];
    setOrders(updatedOrders);
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));
    } catch {}

    // 3. Clear cart
    clearCart();

    // 4. Send real API request to server for persistent storage
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
    } catch (err) {
      console.warn('Order sync to server failed, stored in client fallback:', err);
    }

    // 5. Broadcast live sync to all browser windows & admin panel
    broadcastStoreUpdate();
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    const updated = orders.map((o) => (o.id === orderId || o.orderNumber === orderId ? { ...o, status } : o));
    setOrders(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      broadcastStoreUpdate();
    } catch {}
  };

  const updateProduct = (updated: Product) => {
    const newProds = products.map((p) => (p.id === updated.id ? updated : p));
    setProducts(newProds);
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProds));
      broadcastStoreUpdate();
    } catch {}
  };

  const addProduct = (newProd: Product) => {
    const newProds = [newProd, ...products];
    setProducts(newProds);
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProds));
      broadcastStoreUpdate();
    } catch {}
  };

  const deleteProduct = (prodId: string) => {
    const newProds = products.filter((p) => p.id !== prodId);
    setProducts(newProds);
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProds));
      broadcastStoreUpdate();
    } catch {}
  };

  return {
    categories,
    categoryAttributes,
    setCategoryAttributes,
    products,
    siteContent,
    banners,
    bestSellers,
    setBestSellers,
    topWeekly,
    setTopWeekly,
    orders,
    cart,
    discounts,
    recentlyRemoved,
    refreshAll,
    updateSiteContent,
    addToCart,
    removeFromCart,
    undoRemoveItem,
    updateCartQuantity,
    clearCart,
    addOrder,
    updateOrderStatus,
    updateProduct,
    addProduct,
    deleteProduct,
    setDiscounts,
    syncUserCartOnLogin,
    syncUserCartOnLogout
  };
}
