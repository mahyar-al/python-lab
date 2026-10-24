import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from '../lib/types';
import {
  adminApi,
  getAdminToken,
  setAdminToken,
  clearAdminToken,
  onAdminAuthError,
  getLastSeenOrderNumber,
  setLastSeenOrderNumber
} from '../lib/adminApi';
import { formatPersianNumber } from '../lib/currency';
import { AdminLogin } from './admin/AdminLogin';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminProducts } from './admin/AdminProducts';
import { AdminCategories } from './admin/AdminCategories';
import { AdminOrders } from './admin/AdminOrders';
import { AdminDiscounts } from './admin/AdminDiscounts';
import { AdminBanners } from './admin/AdminBanners';
import { AdminBestSellers } from './admin/AdminBestSellers';
import { AdminTopWeekly } from './admin/AdminTopWeekly';
import { AdminCustomers } from './admin/AdminCustomers';
import { AdminUsers } from './admin/AdminUsers';
import { AdminSiteContent } from './admin/AdminSiteContent';
import { AdminQuickCategories } from './admin/AdminQuickCategories';
import { AdminSettings } from './admin/AdminSettings';
import { AdminGlobalSearch } from './admin/AdminGlobalSearch';
import { OrderDetailModal } from './admin/OrderDetailModal';
import { PrintModal } from './admin/PrintTemplates';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  Grid,
  Percent,
  Image,
  Users,
  ShieldCheck,
  FileText,
  Settings,
  Search,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Bell,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
  ChevronDown,
  Sparkles,
  Flame,
  Award
} from 'lucide-react';

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AdminPanelProps {
  onBackToSite?: () => void;
  initialTab?: string;
  onSyncPublicStore?: () => void;
  // Optional initial props if passed from parent
  products?: Product[];
  orders?: Order[];
  discounts?: DiscountCode[];
  siteContent?: SiteContent;
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus) => void;
  onUpdateProduct?: (product: Product) => void;
  onAddProduct?: (product: Product) => void;
  onDeleteProduct?: (id: string) => void;
  onAddDiscount?: (discount: DiscountCode) => void;
  onDeleteDiscount?: (code: string) => void;
  onUpdateSiteContent?: (content: SiteContent) => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onBackToSite,
  initialTab = 'dashboard',
  onSyncPublicStore
}) => {
  // 1. Authentication State
  const [token, setToken] = useState<string | null>(() => getAdminToken());
  const [authErrorMessage, setAuthErrorMessage] = useState<string>('');

  // 2. Navigation
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Ensure dark mode class is never applied to the document
  useEffect(() => {
    try {
      localStorage.removeItem('morico_admin_dark_mode');
      document.documentElement.classList.remove('dark');
    } catch {}
  }, []);

  // 3. Search & Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [printType, setPrintType] = useState<'a4' | 'shipping_label'>('a4');

  // 4. Toast Notifications
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // 5. Data State (Loaded from adminApi)
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [banners, setBanners] = useState<BannerAd[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSellerItem[]>([]);
  const [topWeekly, setTopWeekly] = useState<TopWeeklyItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<PaymentGatewayStatus>({
    gatewayName: 'زرین‌پال (ZarinPal IPG)',
    configured: true,
    mode: 'production',
    merchantId: '7a2633f7-23ed-43ef-a1b1-82e24be0933e'
  });

  // 6. Polling & New Orders Notification
  const [unreadNewOrdersCount, setUnreadNewOrdersCount] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.14); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);



  // Keyboard shortcut Cmd/Ctrl + K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for 401 unauthorized errors from any adminApi call
  useEffect(() => {
    const unsubscribe = onAdminAuthError((msg) => {
      clearAdminToken();
      setToken(null);
      setAuthErrorMessage(msg || 'نشست کاری شما منقضی شده است. لطفاً مجدداً وارد شوید.');
    });
    return unsubscribe;
  }, []);

  // Load all initial data once token is available
  const loadAllData = useCallback(async (isRefreshAction = false) => {
    if (!token) return;
    if (isRefreshAction) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [
        fetchedCategories,
        fetchedCategoryAttributes,
        fetchedProducts,
        fetchedOrders,
        fetchedDiscounts,
        fetchedBanners,
        fetchedBestSellers,
        fetchedTopWeekly,
        fetchedUsers,
        fetchedContent,
        fetchedGateway
      ] = await Promise.all([
        adminApi.getCategories().catch(() => []),
        adminApi.getCategoryAttributes().catch(() => []),
        adminApi.getProducts().catch(() => []),
        adminApi.getOrders().catch(() => []),
        adminApi.getDiscounts().catch(() => []),
        adminApi.getBanners().catch(() => []),
        adminApi.getBestSellers().catch(() => []),
        adminApi.getTopWeekly().catch(() => []),
        adminApi.getUsers().catch(() => []),
        adminApi.getSiteContent().catch(() => null),
        adminApi.getPaymentGatewayStatus().catch(() => ({
          gatewayName: 'زرین‌پال',
          configured: true,
          mode: 'production' as const
        }))
      ]);

      setCategories(fetchedCategories);
      setCategoryAttributes(fetchedCategoryAttributes);
      setProducts(fetchedProducts);
      setOrders(fetchedOrders);
      setDiscounts(fetchedDiscounts);
      setBanners(fetchedBanners);
      setBestSellers(fetchedBestSellers);
      setTopWeekly(fetchedTopWeekly);
      setUsers(fetchedUsers);
      if (fetchedContent) setSiteContent(fetchedContent);
      setGatewayStatus(fetchedGateway);

      // Check last seen order for notification
      if (fetchedOrders.length > 0) {
        const newest = fetchedOrders[0].orderNumber || fetchedOrders[0].id;
        const lastSeen = getLastSeenOrderNumber();
        if (lastSeen && lastSeen !== newest) {
          setUnreadNewOrdersCount((prev) => prev + 1);
        }
      }

      if (isRefreshAction) {
        addToast('اطلاعات با موفقیت بروزرسانی شد', 'info');
      }
    } catch (err: any) {
      addToast(err?.message || 'خطا در بارگذاری اطلاعات پنل مدیریت', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, addToast]);

  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token, loadAllData]);

  // Polling for new orders every 30 seconds
  useEffect(() => {
    if (!token) return;

    const intervalId = setInterval(async () => {
      try {
        const latestOrders = await adminApi.getOrders();
        if (latestOrders && latestOrders.length > 0) {
          const newestOrder = latestOrders[0];
          const newestOrderNum = newestOrder.orderNumber || newestOrder.id;
          const lastSeen = getLastSeenOrderNumber();

          if (lastSeen && lastSeen !== newestOrderNum) {
            setLastSeenOrderNumber(newestOrderNum);
            setUnreadNewOrdersCount((prev) => prev + 1);
            playChime();
            addToast(`سفارش جدید دریافت شد: ${newestOrderNum} به مبلغ ${newestOrder.total.toLocaleString('fa-IR')} تومان`, 'success');
          }
          setOrders(latestOrders);
        }
      } catch {
        // Silently ignore background polling failure
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [token, playChime, addToast]);

  // When admin views orders, clear unread badge and store last seen order
  useEffect(() => {
    if (activeTab === 'orders' && orders.length > 0) {
      setUnreadNewOrdersCount(0);
      const newestOrderNum = orders[0].orderNumber || orders[0].id;
      setLastSeenOrderNumber(newestOrderNum);
    }
  }, [activeTab, orders]);

  // Handlers for Products
  const handleCreateProduct = async (prodData: Omit<Product, 'id'>) => {
    try {
      const created = await adminApi.createProduct(prodData);
      setProducts((prev) => [created, ...prev]);
      addToast('محصول جدید با موفقیت اضافه شد', 'success');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در ایجاد محصول', 'error');
      throw err;
    }
  };

  const handleUpdateProduct = async (id: string, prodData: Partial<Product>) => {
    try {
      const updated = await adminApi.updateProduct(id, prodData);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      addToast('اطلاعات محصول با موفقیت بروزرسانی شد', 'success');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در ویرایش محصول', 'error');
      throw err;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await adminApi.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      addToast('محصول از کاتالوگ حذف شد', 'info');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در حذف محصول', 'error');
      throw err;
    }
  };

  // Handlers for Categories
  const handleCreateCategory = async (catData: Omit<Category, 'id' | 'productCount'>) => {
    try {
      const created = await adminApi.createCategory(catData);
      setCategories((prev) => [...prev, created]);
      addToast(`دسته‌بندی «${created.title}» با موفقیت افزوده شد`, 'success');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در ثبت دسته‌بندی', 'error');
      throw err;
    }
  };

  const handleUpdateCategory = async (id: string, catData: Partial<Category>) => {
    try {
      const updated = await adminApi.updateCategory(id, catData);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      addToast('دسته‌بندی با موفقیت بروزرسانی شد', 'success');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در بروزرسانی دسته‌بندی', 'error');
      throw err;
    }
  };

  const handleDeleteCategory = async (id: string, reassignTo?: string) => {
    try {
      await adminApi.deleteCategory(id, reassignTo);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (reassignTo) {
        setProducts((prev) => prev.map((p) => (p.categoryId === id ? { ...p, categoryId: reassignTo } : p)));
      }
      addToast(reassignTo ? 'دسته‌بندی حذف و محصولات با موفقیت منتقل شدند' : 'دسته‌بندی با موفقیت حذف گردید', 'info');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در حذف دسته‌بندی', 'error');
      throw err;
    }
  };

  // Handlers for Category Attributes
  const handleCreateAttribute = async (attrData: Omit<CategoryAttribute, 'id'>) => {
    try {
      const created = await adminApi.createCategoryAttribute(attrData);
      setCategoryAttributes((prev) => [...prev, created]);
      addToast(`ویژگی «${created.name}» با موفقیت افزوده شد`, 'success');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در تعریف ویژگی جدید', 'error');
      throw err;
    }
  };

  const handleUpdateAttribute = async (id: string, attrData: Partial<CategoryAttribute>) => {
    try {
      const updated = await adminApi.updateCategoryAttribute(id, attrData);
      setCategoryAttributes((prev) => prev.map((a) => (a.id === id ? updated : a)));
      addToast('ویژگی با موفقیت بروزرسانی شد', 'success');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در بروزرسانی ویژگی', 'error');
      throw err;
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    try {
      await adminApi.deleteCategoryAttribute(id);
      setCategoryAttributes((prev) => prev.filter((a) => a.id !== id));
      addToast('ویژگی با موفقیت حذف شد', 'info');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در حذف ویژگی', 'error');
      throw err;
    }
  };

  // Handlers for Orders
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const updated = await adminApi.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (inspectingOrder && inspectingOrder.id === orderId) {
        setInspectingOrder(updated);
      }
      addToast(`وضعیت سفارش به «${status}» تغییر یافت`, 'success');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در تغییر وضعیت سفارش', 'error');
      throw err;
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await adminApi.deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (inspectingOrder && inspectingOrder.id === orderId) {
        setInspectingOrder(null);
      }
      addToast('سفارش با موفقیت حذف گردید', 'info');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در حذف سفارش', 'error');
      throw err;
    }
  };

  // Handlers for Discounts
  const handleCreateDiscount = async (discData: Omit<DiscountCode, 'id'>) => {
    try {
      const created = await adminApi.createDiscount(discData);
      setDiscounts((prev) => [created, ...prev]);
      addToast(`کد تخفیف ${created.code} با موفقیت تعریف شد`, 'success');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در ثبت کد تخفیف', 'error');
      throw err;
    }
  };

  const handleUpdateDiscount = async (id: string, discData: Partial<DiscountCode>) => {
    try {
      const updated = await adminApi.updateDiscount(id, discData);
      setDiscounts((prev) => prev.map((d) => (d.id === id || d.code === id ? updated : d)));
      addToast('کد تخفیف بروزرسانی شد', 'success');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در بروزرسانی کد تخفیف', 'error');
      throw err;
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    try {
      await adminApi.deleteDiscount(id);
      setDiscounts((prev) => prev.filter((d) => d.id !== id && d.code !== id));
      addToast('کد تخفیف حذف شد', 'info');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در حذف کد تخفیف', 'error');
      throw err;
    }
  };

  // Handlers for Banners
  const handleCreateBanner = async (bannerData: Omit<BannerAd, 'id'>) => {
    try {
      const created = await adminApi.createBanner(bannerData);
      setBanners((prev) => [...prev, created]);
      addToast('کمپین/بنر تبلیغاتی جدید ثبت شد', 'success');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در ثبت بنر', 'error');
      throw err;
    }
  };

  const handleUpdateBanner = async (id: string, bannerData: Partial<BannerAd>) => {
    try {
      const updated = await adminApi.updateBanner(id, bannerData);
      setBanners((prev) => prev.map((b) => (b.id === id ? updated : b)));
      addToast('بنر با موفقیت بروزرسانی شد', 'success');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در بروزرسانی بنر', 'error');
      throw err;
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      await adminApi.deleteBanner(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      addToast('بنر حذف شد', 'info');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در حذف بنر', 'error');
      throw err;
    }
  };

  // Handlers for Best Sellers and Top Weekly
  const handleSaveBestSellers = async (items: BestSellerItem[]) => {
    try {
      const saved = await adminApi.saveBestSellers(items);
      setBestSellers(saved);
      addToast('لیست کالاهای پرفروش با موفقیت ذخیره شد', 'success');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در ذخیره‌سازی پرفروش‌ترین‌ها', 'error');
      throw err;
    }
  };

  const handleSaveTopWeekly = async (items: TopWeeklyItem[]) => {
    try {
      const saved = await adminApi.saveTopWeekly(items);
      setTopWeekly(saved);
      addToast('لیست برترین‌های هفته با موفقیت ذخیره شد', 'success');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در ذخیره‌سازی برترین‌های هفته', 'error');
      throw err;
    }
  };

  // Handlers for Admin Users
  const handleCreateUser = async (userData: {
    name: string;
    email: string;
    password?: string;
    phone: string;
    role: 'admin' | 'user' | 'staff';
  }) => {
    try {
      const created = await adminApi.createUser(userData);
      setUsers((prev) => [...prev, created]);
      addToast(`کاربر «${created.name}» با موفقیت افزوده شد`, 'success');
    } catch (err: any) {
      addToast(err.message || 'خطا در افزودن مدیر/کاربر', 'error');
      throw err;
    }
  };

  const handleUpdateUserRole = async (id: string, role: 'admin' | 'user' | 'staff') => {
    try {
      const updated = await adminApi.updateUserRole(id, role);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      addToast('سطح دسترسی کاربر تغییر یافت', 'success');
    } catch (err: any) {
      addToast(err.message || 'خطا در تغییر دسترسی', 'error');
      throw err;
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await adminApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      addToast('کاربر از سیستم حذف گردید', 'info');
    } catch (err: any) {
      addToast(err.message || 'خطا در حذف کاربر', 'error');
      throw err;
    }
  };

  // Handlers for Site Content
  const handleUpdateSiteContent = async (contentData: SiteContent) => {
    try {
      const updated = await adminApi.updateSiteContent(contentData);
      setSiteContent(updated);
      addToast('محتوای سایت با موفقیت در پایگاه داده ذخیره شد', 'success');
      onSyncPublicStore?.();
    } catch (err: any) {
      addToast(err.message || 'خطا در ذخیره‌سازی محتوا', 'error');
      throw err;
    }
  };

  // Logout Handler with Server-Side Token Invalidation
  const handleLogout = async () => {
    try {
      await adminApi.logout();
    } catch (_) {}
    clearAdminToken();
    setToken(null);
    setAuthErrorMessage('');
    addToast('با موفقیت از پنل مدیریت خارج شدید و نشست کاری باطل گردید', 'info');
    if (onBackToSite) {
      onBackToSite();
    }
  };

  // 7. If Not Logged In, Render Admin Login View
  if (!token) {
    return (
      <AdminLogin
        onLoginSuccess={(newToken) => {
          setAdminToken(newToken);
          setToken(newToken);
          setAuthErrorMessage('');
          addToast('ورود با موفقیت انجام شد. خوش‌آمدید.', 'success');
        }}
        initialMessage={authErrorMessage}
        onBackToSite={() => {
          if (onBackToSite) onBackToSite();
          else window.location.href = '/';
        }}
      />
    );
  }

  // Navigation Items Config
  const NAV_ITEMS = [
    { id: 'dashboard', label: 'پیشخوان و آمار', icon: LayoutDashboard },
    { id: 'orders', label: 'سفارشات', icon: ShoppingBag, badge: unreadNewOrdersCount > 0 ? unreadNewOrdersCount : undefined },
    { id: 'products', label: 'محصولات و انبار', icon: Package },
    { id: 'categories', label: 'دسته‌بندی‌های چندگانه', icon: FolderTree },
    { id: 'quick_categories', label: 'دسته‌بندی‌های صفحه اصلی (ردیف گرد)', icon: Grid },
    { id: 'bestsellers', label: 'پرفروش‌ترین‌ها', icon: Flame },
    { id: 'top_weekly', label: 'برترین‌های هفته', icon: Award },
    { id: 'hero_slider', label: 'اسلایدر صفحه اول و استیج ۳D', icon: Sparkles },
    { id: 'banners', label: 'بنرها و کمپین‌های میانی', icon: Image },
    { id: 'discounts', label: 'کدهای تخفیف', icon: Percent },
    { id: 'customers', label: 'مشتریان و خریداران', icon: Users },
    { id: 'users', label: 'مدیران و دسترسی‌ها', icon: ShieldCheck },
    { id: 'content', label: 'محتوای سایت و صفحات', icon: FileText },
    { id: 'settings', label: 'تنظیمات و درگاه پرداخت', icon: Settings }
  ];

  const activeNavItem = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];

  return (
    <div
      className="min-h-screen text-right flex bg-[#E4F5FF] text-[#111110] font-sans selection:bg-[#111110] selection:text-white"
      dir="rtl"
    >
      {/* Toast Notification Container */}
      <div className="fixed top-5 left-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border text-xs shadow-lg transition-all animate-in fade-in slide-in-from-top-4 duration-200 ${
              toast.type === 'success'
                ? 'bg-[#2F6B4F] text-white border-[#2F6B4F]/40'
                : toast.type === 'error'
                ? 'bg-[#A33A3A] text-white border-[#A33A3A]/40'
                : 'bg-white text-[#111110] border-[#BFDDF0]'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
              <span className="font-medium leading-relaxed">{toast.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="p-1 hover:opacity-70 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Global Search Modal (Cmd/Ctrl + K) */}
      <AdminGlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        orders={orders}
        categories={categories}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsSearchOpen(false);
        }}
        onSelectProduct={(p) => {
          setActiveTab('products');
          setIsSearchOpen(false);
        }}
        onSelectOrder={(o) => {
          setInspectingOrder(o);
          setIsSearchOpen(false);
        }}
      />

      {/* Order Inspector Modal (Reusable across tabs) */}
      {inspectingOrder && (
        <OrderDetailModal
          order={inspectingOrder}
          onClose={() => setInspectingOrder(null)}
          onUpdateStatus={handleUpdateOrderStatus}
          onDeleteOrder={handleDeleteOrder}
          onPrintA4Sheet={(ord) => {
            setPrintOrder(ord);
            setPrintType('a4');
          }}
          onPrintShippingLabel={(ord) => {
            setPrintOrder(ord);
            setPrintType('shipping_label');
          }}
        />
      )}

      {/* Print Modal for A4 Invoice or Thermal Shipping Label */}
      {printOrder && (
        <PrintModal
          order={printOrder}
          mode={printType === 'a4' ? 'sheet' : 'label'}
          onClose={() => setPrintOrder(null)}
        />
      )}

      {/* DESKTOP SIDEBAR (Collapsible: 260px or 80px) */}
      <aside
        className={`hidden md:flex flex-col border-l transition-all duration-300 z-30 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        } bg-white border-[#BFDDF0] sticky top-0 h-screen shadow-sm`}
      >
        {/* Brand Header & Toggle */}
        <div className="p-4 border-b border-[#BFDDF0] flex items-center justify-between gap-2 h-20">
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#BFDDF0] shadow-sm bg-[#E4F5FF] shrink-0">
                <img
                  src="/brand/morico-logo.jpg"
                  alt="MORICO"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="truncate">
                <span className="font-bold text-sm tracking-tight block text-[#111110]">
                  MORICO STYLE
                </span>
                <span className="text-[10px] text-[#4A5560] block font-serif uppercase tracking-widest">
                  ATELIER ADMIN · 2026
                </span>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 mx-auto rounded-full overflow-hidden border border-[#BFDDF0] shadow-sm bg-[#E4F5FF] shrink-0">
              <img
                src="/brand/morico-logo.jpg"
                alt="MORICO"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <button
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="p-1.5 rounded-lg text-[#4A5560] hover:bg-[#D3ECFA]/40 transition-colors"
            title={isSidebarCollapsed ? 'گسترش منو' : 'جمع‌کردن منو'}
          >
            {isSidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all relative ${
                  isActive
                    ? 'bg-[#111110] text-white shadow-sm'
                    : 'text-[#4A5560] hover:bg-[#D3ECFA]/50 hover:text-[#111110]'
                }`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : ''}`} />
                {!isSidebarCollapsed && (
                  <span className="truncate flex-1 text-right">{item.label}</span>
                )}
                {item.badge !== undefined && (
                  <span
                    className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive
                        ? 'bg-white text-[#111110]'
                        : 'bg-[#A33A3A] text-white'
                    } ${isSidebarCollapsed ? 'absolute top-1 right-1' : ''}`}
                  >
                    {formatPersianNumber(item.badge)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions in Sidebar */}
        <div className="p-3 border-t border-[#BFDDF0] space-y-1">
          {/* Quick Search Trigger Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors bg-[#E4F5FF]/60 text-[#4A5560] hover:text-[#111110] hover:bg-[#D3ECFA]/50"
            title="جستجوی سریع (Ctrl+K)"
          >
            <Search className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && (
              <div className="flex-1 flex items-center justify-between text-[11px]">
                <span>جستجوی سریع...</span>
                <kbd className="px-1.5 py-0.5 rounded bg-black/5 text-[9px] font-mono">⌘K</kbd>
              </div>
            )}
          </button>

          {/* View Public Site */}
          <button
            onClick={() => {
              if (onBackToSite) onBackToSite();
              else {
                window.history.pushState(null, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#4A5560] hover:bg-[#D3ECFA]/40 transition-colors"
            title="مشاهده فروشگاه عمومی"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">مشاهده سایت</span>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#A33A3A] hover:bg-[#A33A3A]/10 transition-colors"
            title="خروج از حساب مدیریت"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">خروج از حساب</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER (For full navigation on small screens) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs h-full flex flex-col p-4 shadow-2xl z-10 bg-white text-[#111110]">
            <div className="flex items-center justify-between pb-4 border-b border-[#BFDDF0]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-[#BFDDF0] bg-[#E4F5FF]">
                  <img src="/brand/morico-logo.jpg" alt="MORICO" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="font-bold text-sm block">MORICO STYLE</span>
                  <span className="text-[10px] text-[#4A5560]">پنل مدیریت آتلیه</span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#D3ECFA]/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#111110] text-white shadow-sm'
                        : 'text-[#4A5560] hover:bg-[#D3ECFA]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#A33A3A] text-white">
                        {formatPersianNumber(item.badge)}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-[#BFDDF0] space-y-2">
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  if (onBackToSite) onBackToSite();
                  else window.location.href = '/';
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs border border-[#BFDDF0] text-[#111110] hover:bg-[#D3ECFA]/30"
              >
                <ExternalLink className="w-4 h-4" />
                <span>مشاهده فروشگاه عمومی</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs bg-[#A33A3A]/10 text-[#A33A3A]"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج از حساب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TOP BAR */}
        <header className="h-20 border-b border-[#BFDDF0] sticky top-0 z-20 flex items-center justify-between px-4 sm:px-8 bg-white/95 backdrop-blur-md">
          {/* Mobile Menu Button & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl text-[#4A5560] hover:bg-[#D3ECFA]/40 transition-colors"
              aria-label="منوی مدیریت"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#111110] leading-snug">
                {activeNavItem.label}
              </h1>
              <span className="hidden sm:block text-[11px] text-[#4A5560]">
                سیستم مدیریت یکپارچه فروشگاه چنددسته‌ای MORICO STYLE
              </span>
            </div>
          </div>

          {/* Top Bar Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-colors bg-[#E4F5FF]/50 border-[#BFDDF0] text-[#4A5560] hover:border-[#111110] hover:text-[#111110]"
              title="جستجوی سریع محصولات و سفارشات (Cmd+K)"
            >
              <Search className="w-4 h-4" />
              <span className="hidden lg:inline">جستجوی سریع...</span>
              <kbd className="hidden lg:inline px-1 py-0.2 rounded bg-black/5 text-[9px] font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Refresh Data Button */}
            <button
              onClick={() => loadAllData(true)}
              disabled={isRefreshing}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs border border-[#BFDDF0] bg-white text-[#4A5560] hover:bg-[#D3ECFA]/30 transition-colors flex items-center gap-1.5"
              title="بروزرسانی اطلاعات از سرور"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">بروزرسانی</span>
            </button>

            {/* View Site Link */}
            <button
              onClick={() => {
                if (onBackToSite) onBackToSite();
                else {
                  window.history.pushState(null, '', '/');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-[#111110] text-[#111110] hover:bg-[#111110] hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>مشاهده سایت</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium bg-[#A33A3A]/10 text-[#A33A3A] hover:bg-[#A33A3A] hover:text-white transition-colors flex items-center gap-1.5"
              title="خروج از حساب"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </header>

        {/* BODY TAB CONTENT */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          {isLoading ? (
            /* Loading Skeleton */
            <div className="space-y-6 animate-pulse">
              <div className="h-28 rounded-2xl bg-white border border-[#BFDDF0]/60" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 rounded-2xl bg-white border border-[#BFDDF0]/60" />
                ))}
              </div>
              <div className="h-96 rounded-2xl bg-white border border-[#BFDDF0]/60" />
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <AdminDashboard
                  products={products}
                  orders={orders}
                  discounts={discounts}
                  categories={categories}
                  users={users}
                  gatewayStatus={gatewayStatus}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onSelectOrder={(ord) => setInspectingOrder(ord)}
                />
              )}

              {activeTab === 'orders' && (
                <AdminOrders
                  orders={orders}
                  onUpdateStatus={handleUpdateOrderStatus}
                  onDeleteOrder={handleDeleteOrder}
                />
              )}

              {activeTab === 'products' && (
                <AdminProducts
                  products={products}
                  categories={categories}
                  categoryAttributes={categoryAttributes}
                  onCreateProduct={handleCreateProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                />
              )}

              {activeTab === 'categories' && (
                <AdminCategories
                  categories={categories}
                  products={products}
                  categoryAttributes={categoryAttributes}
                  onCreateCategory={handleCreateCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onCreateAttribute={handleCreateAttribute}
                  onUpdateAttribute={handleUpdateAttribute}
                  onDeleteAttribute={handleDeleteAttribute}
                  onFilterProductsByCategory={(catId) => {
                    setActiveTab('products');
                  }}
                  onNavigateQuickCategories={() => setActiveTab('quick_categories')}
                />
              )}

              {activeTab === 'quick_categories' && (
                <AdminQuickCategories
                  categories={categories}
                  siteContent={siteContent || ({} as any)}
                  onUpdateContent={handleUpdateSiteContent}
                  onSyncPublicStore={onSyncPublicStore}
                />
              )}

              {activeTab === 'bestsellers' && (
                <AdminBestSellers
                  items={bestSellers}
                  products={products}
                  categories={categories}
                  onSave={handleSaveBestSellers}
                  onSyncPublicStore={onSyncPublicStore}
                />
              )}

              {activeTab === 'top_weekly' && (
                <AdminTopWeekly
                  items={topWeekly}
                  products={products}
                  categories={categories}
                  onSave={handleSaveTopWeekly}
                  onSyncPublicStore={onSyncPublicStore}
                />
              )}

              {activeTab === 'discounts' && (
                <AdminDiscounts
                  discounts={discounts}
                  onCreateDiscount={handleCreateDiscount}
                  onUpdateDiscount={handleUpdateDiscount}
                  onDeleteDiscount={handleDeleteDiscount}
                />
              )}

              {(activeTab === 'banners' || activeTab === 'hero_slider') && (
                <AdminBanners
                  initialTab={activeTab === 'hero_slider' ? 'hero_slides' : 'banners'}
                  banners={banners}
                  products={products}
                  categories={categories}
                  siteContent={siteContent}
                  onUpdateSiteContent={handleUpdateSiteContent}
                  onCreateBanner={handleCreateBanner}
                  onUpdateBanner={handleUpdateBanner}
                  onDeleteBanner={handleDeleteBanner}
                  onSyncPublicStore={onSyncPublicStore}
                />
              )}

              {activeTab === 'customers' && (
                <AdminCustomers
                  orders={orders}
                  users={users}
                  onSelectOrder={(ord) => setInspectingOrder(ord)}
                />
              )}

              {activeTab === 'users' && (
                <AdminUsers
                  users={users}
                  currentUserId="usr-admin-01"
                  onCreateUser={handleCreateUser}
                  onUpdateRole={handleUpdateUserRole}
                  onDeleteUser={handleDeleteUser}
                />
              )}

              {activeTab === 'content' && (
                <AdminSiteContent
                  siteContent={siteContent || ({} as any)}
                  onUpdateContent={handleUpdateSiteContent}
                />
              )}

              {activeTab === 'settings' && (
                <AdminSettings
                  gatewayStatus={gatewayStatus}
                />
              )}
            </>
          )}
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#BFDDF0] bg-white/95 backdrop-blur-lg flex items-center justify-around p-2 shadow-lg">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-colors ${
              activeTab === 'dashboard' ? 'text-[#111110] font-bold' : 'text-[#4A5560]'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>پیشخوان</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium relative transition-colors ${
              activeTab === 'orders' ? 'text-[#111110] font-bold' : 'text-[#4A5560]'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>سفارشات</span>
            {unreadNewOrdersCount > 0 && (
              <span className="absolute top-1 right-2 px-1 py-0.2 bg-[#A33A3A] text-white text-[9px] font-bold rounded-full">
                {formatPersianNumber(unreadNewOrdersCount)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-colors ${
              activeTab === 'products' ? 'text-[#111110] font-bold' : 'text-[#4A5560]'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>محصولات</span>
          </button>

          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium text-[#4A5560]"
          >
            <Menu className="w-5 h-5" />
            <span>بخش‌های دیگر</span>
          </button>
        </div>
      </div>
    </div>
  );
};
