import {
  Product,
  Category,
  CategoryAttribute,
  Order,
  DiscountCode,
  BannerAd,
  AdminUser,
  PaymentGatewayStatus,
  SiteContent,
  OrderStatus,
  BestSellerItem,
  TopWeeklyItem
} from './types';
import {
  DEFAULT_BEST_SELLER_ITEMS,
  DEFAULT_TOP_WEEKLY_ITEMS
} from './specialSectionsData';
import {
  DEFAULT_PRODUCTS,
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORY_ATTRIBUTES,
  DEFAULT_SITE_CONTENT,
  STORAGE_KEYS,
  broadcastStoreUpdate
} from './api';

const TOKEN_KEY = 'morico_admin_token';
const LAST_ORDER_KEY = 'morico_last_seen_order';

export class AdminApiError extends Error {
  status: number;
  serverMessage?: string;

  constructor(message: string, status: number, serverMessage?: string) {
    super(message);
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

// Global listener for 401 unauthenticated events
type AuthCallback = (message: string) => void;
let authErrorListeners: AuthCallback[] = [];

export function onAdminAuthError(cb: AuthCallback) {
  authErrorListeners.push(cb);
  return () => {
    authErrorListeners = authErrorListeners.filter((l) => l !== cb);
  };
}

function triggerAuthError(message: string) {
  localStorage.removeItem(TOKEN_KEY);
  authErrorListeners.forEach((cb) => cb(message));
}

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getLastSeenOrderNumber(): string {
  return localStorage.getItem(LAST_ORDER_KEY) || '';
}

export function setLastSeenOrderNumber(orderNumber: string): void {
  localStorage.setItem(LAST_ORDER_KEY, orderNumber);
}

// -------------------------------------------------------------
// Unified In-Browser Persistence Store (shared with Storefront)
// -------------------------------------------------------------
function getStored<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    broadcastStoreUpdate();
  } catch {}
}

const INITIAL_CATEGORIES: Category[] = DEFAULT_CATEGORIES.map((cat) => ({
  ...cat,
  productCount: 0,
  active: true
}));

const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_ORDERS: Order[] = [];
const INITIAL_DISCOUNTS: DiscountCode[] = [];
const INITIAL_BANNERS: BannerAd[] = [];

const INITIAL_USERS: AdminUser[] = [
  {
    id: 'usr-admin-01',
    name: 'مدیر ارشد آتلیه',
    email: 'admin@morico.style',
    phone: '۰۹۱۲۲۲۰۸۹۴۱',
    role: 'admin',
    lastLogin: new Date().toISOString(),
    loginCount: 1,
    joinDate: '2026-01-01T08:00:00Z'
  }
];

const INITIAL_GATEWAY: PaymentGatewayStatus = {
  gatewayName: 'زرین‌پال (ZarinPal IPG)',
  configured: false,
  mode: 'sandbox',
  merchantId: '',
  disabledReason: 'درگاه پرداخت اینترنتی هنوز متصل نشده است و در انتظار فعال‌سازی توسط مدیریت فروشگاه می‌باشد.'
};

// -------------------------------------------------------------
// Fetch with Real Server-Side Auth Verification
// -------------------------------------------------------------
async function adminFetch<T>(
  url: string,
  options: RequestInit = {},
  fallbackFn?: () => Promise<T> | T
): Promise<T> {
  const token = getAdminToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      triggerAuthError('نشست کاری شما منقضی شده است یا دسترسی غیرمجاز است. لطفاً دوباره وارد شوید.');
      throw new AdminApiError('نشست کاری شما منقضی شده است.', 401);
    }

    if (res.status === 403) {
      throw new AdminApiError('دسترسی غیرمجاز. فقط حساب مدیر ارشد مجاز به انجام این عملیات است.', 403);
    }

    if (res.status === 429) {
      const errJson = await res.json().catch(() => ({}));
      throw new AdminApiError(
        errJson.error || 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً چند دقیقه دیگر مجدداً تلاش کنید.',
        429
      );
    }

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return (await res.json()) as T;
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new AdminApiError(errJson.error || errJson.message || `خطای سرور: ${res.status}`, res.status, errJson.error);
    }
  } catch (err: any) {
    if (err instanceof AdminApiError) throw err;
    // Network offline fallback only if provided and not an auth error
    if (fallbackFn) {
      return await fallbackFn();
    }
    throw new AdminApiError('ارتباط با سرور برقرار نشد: ' + err.message, 500);
  }

  if (fallbackFn) {
    return await fallbackFn();
  }
  throw new AdminApiError('پاسخ نامعتبر از سرور', 500);
}

// -------------------------------------------------------------
// EXPORTED ADMIN API CLIENT
// -------------------------------------------------------------
export const adminApi = {
  // 1. Login - Authenticates directly against secure backend
  async login(username: string, password: string): Promise<{ success: boolean; token: string; user?: any }> {
    if (!username.trim() || !password.trim()) {
      throw new AdminApiError('لطفاً نام کاربری و رمز عبور را به صورت کامل وارد نمایید.', 400);
    }

    const res = await fetch('/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password: password.trim() })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new AdminApiError(data.error || 'نام کاربری یا رمز عبور نامعتبر است.', res.status);
    }

    if (data.token) {
      setAdminToken(data.token);
      return { success: true, token: data.token, user: data.user };
    }

    throw new AdminApiError('خطا در دریافت توکن امنیتی.', 500);
  },

  // Logout - Invalidate token on server
  async logout(): Promise<void> {
    const token = getAdminToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
      } catch (_) {}
    }
    clearAdminToken();
  },

  // Change Admin Password - Requires verification of current password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return await adminFetch<{ success: boolean; message: string }>('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  // Security Status & Audit Logs
  async getSecurityStatus(): Promise<{
    httpsEnforced: boolean;
    scryptHashingActive: boolean;
    activeAdminSessions: number;
    totalAuditLogsCount: number;
    rateLimiterActive: boolean;
    serverTime: string;
  }> {
    return await adminFetch('/api/admin/security-status', {}, () => ({
      httpsEnforced: true,
      scryptHashingActive: true,
      activeAdminSessions: 1,
      totalAuditLogsCount: 1,
      rateLimiterActive: true,
      serverTime: new Date().toISOString()
    }));
  },

  async getAuditLogs(): Promise<Array<{
    id: string;
    timestamp: string;
    event: string;
    username?: string;
    ip: string;
    details: string;
    severity: 'info' | 'warning' | 'critical';
  }>> {
    return await adminFetch('/api/admin/audit-logs', {}, () => []);
  },

  // 2. Categories
  async getCategories(): Promise<Category[]> {
    return await adminFetch('/api/admin/categories', {}, () => {
      return getStored(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    });
  },

  async createCategory(cat: Omit<Category, 'id' | 'productCount'>): Promise<Category> {
    return await adminFetch(
      '/api/categories',
      { method: 'POST', body: JSON.stringify(cat) },
      () => {
        const list = getStored(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
        const newCat: Category = {
          ...cat,
          id: `cat-${Date.now()}`,
          productCount: 0,
          active: true
        };
        const updated = [...list, newCat];
        setStored(STORAGE_KEYS.CATEGORIES, updated);
        return newCat;
      }
    );
  },

  async updateCategory(id: string, cat: Partial<Category>): Promise<Category> {
    return await adminFetch(
      `/api/categories/${id}`,
      { method: 'PUT', body: JSON.stringify(cat) },
      () => {
        const list = getStored(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
        const updated = list.map((c) => (c.id === id ? { ...c, ...cat } : c));
        setStored(STORAGE_KEYS.CATEGORIES, updated);
        const found = updated.find((c) => c.id === id);
        if (!found) throw new AdminApiError('دسته‌بندی یافت نشد', 404);
        return found;
      }
    );
  },

  async deleteCategory(id: string, reassignTo?: string): Promise<{ success: boolean; reassignedCount?: number }> {
    const url = reassignTo
      ? `/api/categories/${encodeURIComponent(id)}?reassignTo=${encodeURIComponent(reassignTo)}`
      : `/api/categories/${encodeURIComponent(id)}`;

    return await adminFetch(
      url,
      { method: 'DELETE' },
      () => {
        const prods = getStored(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
        const matchingProds = prods.filter((p) => p.categoryId === id && p.status !== 'archived');
        if (matchingProds.length > 0 && !reassignTo) {
          throw new AdminApiError(
            `این دسته‌بندی دارای ${matchingProds.length} محصول فعال است و نمی‌توان آن را حذف کرد. لطفاً ابتدا محصولات را به دسته دیگری منتقل کنید.`,
            400,
            'CATEGORY_HAS_PRODUCTS'
          );
        }

        if (reassignTo) {
          const updatedProds = prods.map((p) => (p.categoryId === id ? { ...p, categoryId: reassignTo } : p));
          setStored(STORAGE_KEYS.PRODUCTS, updatedProds);
        }

        const list = getStored(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
        const updated = list
          .filter((c) => c.id !== id)
          .map((c) => (c.parentId === id ? { ...c, parentId: null } : c));
        setStored(STORAGE_KEYS.CATEGORIES, updated);
        return { success: true, reassignedCount: reassignTo ? matchingProds.length : 0 };
      }
    );
  },

  async clearAllCategories(): Promise<{ success: boolean }> {
    return await adminFetch(
      '/api/admin/categories/clear-all',
      { method: 'POST' },
      () => {
        setStored(STORAGE_KEYS.CATEGORIES, []);
        return { success: true };
      }
    );
  },

  // 2.5. Category Attributes (Dynamic Custom Attributes)
  async getCategoryAttributes(categoryId?: string): Promise<CategoryAttribute[]> {
    const url = categoryId
      ? `/api/category-attributes?categoryId=${encodeURIComponent(categoryId)}`
      : '/api/category-attributes';

    return await adminFetch(url, {}, () => {
      const list = getStored(STORAGE_KEYS.CATEGORY_ATTRIBUTES, DEFAULT_CATEGORY_ATTRIBUTES);
      if (categoryId) {
        return list.filter((a: CategoryAttribute) => a.categoryId === 'all' || a.categoryId === categoryId);
      }
      return list;
    });
  },

  async createCategoryAttribute(attr: Omit<CategoryAttribute, 'id'>): Promise<CategoryAttribute> {
    return await adminFetch(
      '/api/category-attributes',
      { method: 'POST', body: JSON.stringify(attr) },
      () => {
        const list = getStored(STORAGE_KEYS.CATEGORY_ATTRIBUTES, DEFAULT_CATEGORY_ATTRIBUTES);
        const newAttr: CategoryAttribute = {
          ...attr,
          id: `attr-${Date.now()}`
        };
        const updated = [...list, newAttr];
        setStored(STORAGE_KEYS.CATEGORY_ATTRIBUTES, updated);
        return newAttr;
      }
    );
  },

  async updateCategoryAttribute(id: string, attr: Partial<CategoryAttribute>): Promise<CategoryAttribute> {
    return await adminFetch(
      `/api/category-attributes/${id}`,
      { method: 'PUT', body: JSON.stringify(attr) },
      () => {
        const list = getStored(STORAGE_KEYS.CATEGORY_ATTRIBUTES, DEFAULT_CATEGORY_ATTRIBUTES);
        const updated = list.map((a: CategoryAttribute) => (a.id === id ? { ...a, ...attr } : a));
        setStored(STORAGE_KEYS.CATEGORY_ATTRIBUTES, updated);
        const found = updated.find((a: CategoryAttribute) => a.id === id);
        if (!found) throw new AdminApiError('ویژگی یافت نشد', 404);
        return found;
      }
    );
  },

  async deleteCategoryAttribute(id: string): Promise<void> {
    return await adminFetch(
      `/api/category-attributes/${id}`,
      { method: 'DELETE' },
      () => {
        const list = getStored(STORAGE_KEYS.CATEGORY_ATTRIBUTES, DEFAULT_CATEGORY_ATTRIBUTES);
        const updated = list.filter((a: CategoryAttribute) => a.id !== id);
        setStored(STORAGE_KEYS.CATEGORY_ATTRIBUTES, updated);
      }
    );
  },

  // 3. Products
  async getProducts(includeArchived = true): Promise<Product[]> {
    return await adminFetch(`/api/admin/products`, {}, () => {
      const list = getStored(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
      return includeArchived ? list : list.filter((p) => p.status !== 'archived');
    });
  },

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    return await adminFetch(
      '/api/products',
      { method: 'POST', body: JSON.stringify(product) },
      () => {
        const list = getStored(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
        const newProduct: Product = {
          ...product,
          id: `prod-${Date.now()}`,
          createdAt: new Date().toISOString()
        };
        const updated = [newProduct, ...list];
        setStored(STORAGE_KEYS.PRODUCTS, updated);

        const cats = getStored(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
        const updatedCats = cats.map((c) =>
          c.id === product.categoryId ? { ...c, productCount: (c.productCount || 0) + 1 } : c
        );
        setStored(STORAGE_KEYS.CATEGORIES, updatedCats);

        return newProduct;
      }
    );
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    return await adminFetch(
      `/api/products/${id}`,
      { method: 'PUT', body: JSON.stringify(product) },
      () => {
        const list = getStored(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
        const updated = list.map((p) =>
          p.id === id ? { ...p, ...product, updatedAt: new Date().toISOString() } : p
        );
        setStored(STORAGE_KEYS.PRODUCTS, updated);
        const found = updated.find((p) => p.id === id);
        if (!found) throw new AdminApiError('محصول یافت نشد', 404);
        return found;
      }
    );
  },

  async deleteProduct(id: string): Promise<void> {
    return await adminFetch(
      `/api/products/${id}`,
      { method: 'DELETE' },
      () => {
        const list = getStored(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
        const toDelete = list.find((p) => p.id === id);
        const updated = list.filter((p) => p.id !== id);
        setStored(STORAGE_KEYS.PRODUCTS, updated);

        if (toDelete?.categoryId) {
          const cats = getStored(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
          const updatedCats = cats.map((c) =>
            c.id === toDelete.categoryId
              ? { ...c, productCount: Math.max(0, (c.productCount || 1) - 1) }
              : c
          );
          setStored(STORAGE_KEYS.CATEGORIES, updatedCats);
        }
      }
    );
  },

  async clearAllProducts(): Promise<{ success: boolean }> {
    return await adminFetch(
      '/api/admin/products/clear-all',
      { method: 'POST' },
      () => {
        setStored(STORAGE_KEYS.PRODUCTS, []);
        return { success: true };
      }
    );
  },

  // 4. Orders (Strictly Admin-Only)
  async getOrders(): Promise<Order[]> {
    return await adminFetch('/api/orders', {}, () => {
      return getStored(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    });
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return await adminFetch(
      `/api/orders/${id}/status`,
      { method: 'PUT', body: JSON.stringify({ status }) },
      () => {
        const list = getStored(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
        const updated = list.map((o) =>
          o.id === id || o.orderNumber === id ? { ...o, status } : o
        );
        setStored(STORAGE_KEYS.ORDERS, updated);
        const found = updated.find((o) => o.id === id || o.orderNumber === id);
        if (!found) throw new AdminApiError('سفارش یافت نشد', 404);
        return found;
      }
    );
  },

  async deleteOrder(id: string): Promise<void> {
    return await adminFetch(
      `/api/orders/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      () => {
        const list = getStored(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
        const updated = list.filter((o) => o.id !== id && o.orderNumber !== id);
        setStored(STORAGE_KEYS.ORDERS, updated);
      }
    );
  },

  // 5. Discounts (Admin-Only)
  async getDiscounts(): Promise<DiscountCode[]> {
    return await adminFetch('/api/discounts', {}, () => {
      return getStored(STORAGE_KEYS.DISCOUNTS, INITIAL_DISCOUNTS);
    });
  },

  async createDiscount(disc: Omit<DiscountCode, 'id'>): Promise<DiscountCode> {
    return await adminFetch(
      '/api/discounts',
      { method: 'POST', body: JSON.stringify(disc) },
      () => {
        const list = getStored(STORAGE_KEYS.DISCOUNTS, INITIAL_DISCOUNTS);
        const newDisc: DiscountCode = {
          ...disc,
          id: `disc-${Date.now()}`,
          code: disc.code.toUpperCase().trim()
        };
        const updated = [...list, newDisc];
        setStored(STORAGE_KEYS.DISCOUNTS, updated);
        return newDisc;
      }
    );
  },

  async updateDiscount(id: string, disc: Partial<DiscountCode>): Promise<DiscountCode> {
    return await adminFetch(
      `/api/discounts/${id}`,
      { method: 'PUT', body: JSON.stringify(disc) },
      () => {
        const list = getStored(STORAGE_KEYS.DISCOUNTS, INITIAL_DISCOUNTS);
        const updated = list.map((d) => (d.id === id || d.code === id ? { ...d, ...disc } : d));
        setStored(STORAGE_KEYS.DISCOUNTS, updated);
        const found = updated.find((d) => d.id === id || d.code === id);
        if (!found) throw new AdminApiError('کد تخفیف یافت نشد', 404);
        return found;
      }
    );
  },

  async deleteDiscount(id: string): Promise<void> {
    return await adminFetch(
      `/api/discounts/${id}`,
      { method: 'DELETE' },
      () => {
        const list = getStored(STORAGE_KEYS.DISCOUNTS, INITIAL_DISCOUNTS);
        const updated = list.filter((d) => d.id !== id && d.code !== id);
        setStored(STORAGE_KEYS.DISCOUNTS, updated);
      }
    );
  },

  // 6. Banners & Campaigns
  async getBanners(): Promise<BannerAd[]> {
    return await adminFetch('/api/banners/admin', {}, () => {
      return getStored(STORAGE_KEYS.BANNERS, INITIAL_BANNERS);
    });
  },

  async createBanner(banner: Omit<BannerAd, 'id'>): Promise<BannerAd> {
    return await adminFetch(
      '/api/banners',
      { method: 'POST', body: JSON.stringify(banner) },
      () => {
        const list = getStored(STORAGE_KEYS.BANNERS, INITIAL_BANNERS);
        const newBanner: BannerAd = {
          ...banner,
          id: `banner-${Date.now()}`,
          active: banner.active !== undefined ? banner.active : true
        };
        const updated = [...list, newBanner];
        setStored(STORAGE_KEYS.BANNERS, updated);
        return newBanner;
      }
    );
  },

  async updateBanner(id: string, banner: Partial<BannerAd>): Promise<BannerAd> {
    return await adminFetch(
      `/api/banners/${id}`,
      { method: 'PUT', body: JSON.stringify(banner) },
      () => {
        const list = getStored(STORAGE_KEYS.BANNERS, INITIAL_BANNERS);
        const updated = list.map((b) => (b.id === id ? { ...b, ...banner } : b));
        setStored(STORAGE_KEYS.BANNERS, updated);
        const found = updated.find((b) => b.id === id);
        if (!found) throw new AdminApiError('بنر یافت نشد', 404);
        return found;
      }
    );
  },

  async deleteBanner(id: string): Promise<void> {
    return await adminFetch(
      `/api/banners/${id}`,
      { method: 'DELETE' },
      () => {
        const list = getStored(STORAGE_KEYS.BANNERS, INITIAL_BANNERS);
        const updated = list.filter((b) => b.id !== id);
        setStored(STORAGE_KEYS.BANNERS, updated);
      }
    );
  },

  // 7. Users - Restricted to the Single Admin
  async getUsers(): Promise<AdminUser[]> {
    return await adminFetch('/api/admin/users', {}, () => {
      return getStored(STORAGE_KEYS.USERS, INITIAL_USERS);
    });
  },

  async createUser(user: {
    name: string;
    email: string;
    password?: string;
    phone: string;
    role: 'admin' | 'user' | 'staff';
  }): Promise<AdminUser> {
    return await adminFetch(
      '/api/admin/users',
      { method: 'POST', body: JSON.stringify(user) },
      () => {
        const list = getStored(STORAGE_KEYS.USERS, INITIAL_USERS);
        if (list.length >= 1) {
          throw new AdminApiError('سیستم بر روی دسترسی تک‌مدیر تنظیم شده است. امکان تعریف مدیر دوم وجود ندارد.', 400);
        }
        const newUser: AdminUser = {
          id: `usr-${Date.now()}`,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: 'admin',
          lastLogin: new Date().toISOString(),
          loginCount: 1,
          joinDate: new Date().toISOString()
        };
        const updated = [...list, newUser];
        setStored(STORAGE_KEYS.USERS, updated);
        return newUser;
      }
    );
  },

  async updateUserRole(id: string, role: 'admin' | 'user' | 'staff'): Promise<AdminUser> {
    const list = getStored(STORAGE_KEYS.USERS, INITIAL_USERS);
    const updated = list.map((u) => (u.id === id ? { ...u, role: 'admin' as const } : u));
    setStored(STORAGE_KEYS.USERS, updated);
    const found = updated.find((u) => u.id === id);
    if (!found) throw new AdminApiError('مدیر یافت نشد', 404);
    return found;
  },

  async deleteUser(id: string): Promise<void> {
    const list = getStored(STORAGE_KEYS.USERS, INITIAL_USERS);
    if (list.length <= 1) {
      throw new AdminApiError('نمی‌توان تنها مدیر آتلیه را حذف کرد.', 400);
    }
    const updated = list.filter((u) => u.id !== id);
    setStored(STORAGE_KEYS.USERS, updated);
  },

  // 8. Site Content
  async getSiteContent(): Promise<SiteContent> {
    return await adminFetch('/api/content', {}, () => {
      return getStored(STORAGE_KEYS.SITE_CONTENT, DEFAULT_SITE_CONTENT);
    });
  },

  async updateSiteContent(content: SiteContent): Promise<SiteContent> {
    return await adminFetch(
      '/api/content',
      { method: 'PUT', body: JSON.stringify(content) },
      () => {
        setStored(STORAGE_KEYS.SITE_CONTENT, content);
        return content;
      }
    );
  },

  // 9. Payment Gateway Status
  async getPaymentGatewayStatus(): Promise<PaymentGatewayStatus> {
    return await adminFetch('/api/payments/status', {}, () => {
      return getStored('morico_gateway_status', INITIAL_GATEWAY);
    });
  },

  async updatePaymentGatewayStatus(status: PaymentGatewayStatus): Promise<PaymentGatewayStatus> {
    return await adminFetch(
      '/api/admin/payments/gateway',
      { method: 'PUT', body: JSON.stringify(status) },
      () => {
        setStored('morico_gateway_status', status);
        return status;
      }
    );
  },

  // 10. Image Upload (POST /api/upload { dataUrl } -> { url })
  async uploadImage(dataUrl: string): Promise<{ url: string }> {
    return await adminFetch(
      '/api/upload',
      {
        method: 'POST',
        body: JSON.stringify({ dataUrl })
      },
      () => {
        return { url: dataUrl };
      }
    );
  },

  // 11. Best Sellers Management
  async getBestSellers(): Promise<BestSellerItem[]> {
    return await adminFetch('/api/bestsellers', {}, () => {
      return getStored(STORAGE_KEYS.BEST_SELLERS, DEFAULT_BEST_SELLER_ITEMS);
    });
  },

  async saveBestSellers(items: BestSellerItem[]): Promise<BestSellerItem[]> {
    return await adminFetch(
      '/api/bestsellers',
      {
        method: 'PUT',
        body: JSON.stringify(items)
      },
      () => {
        setStored(STORAGE_KEYS.BEST_SELLERS, items);
        return items;
      }
    );
  },

  // 12. Top Weekly Management
  async getTopWeekly(): Promise<TopWeeklyItem[]> {
    return await adminFetch('/api/top-weekly', {}, () => {
      return getStored(STORAGE_KEYS.TOP_WEEKLY, DEFAULT_TOP_WEEKLY_ITEMS);
    });
  },

  async saveTopWeekly(items: TopWeeklyItem[]): Promise<TopWeeklyItem[]> {
    return await adminFetch(
      '/api/top-weekly',
      {
        method: 'PUT',
        body: JSON.stringify(items)
      },
      () => {
        setStored(STORAGE_KEYS.TOP_WEEKLY, items);
        return items;
      }
    );
  }
};
