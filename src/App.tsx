import React, { useState, useEffect } from 'react';
import { useAppStore } from './lib/store';
import { Product, ProductVariant, Order, StaticPageId, User } from './lib/types';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { StoreBanners } from './components/StoreBanners';
import { HowOnlineDesignWorks } from './components/HowOnlineDesignWorks';
import { ShopCatalog } from './components/ShopCatalog';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CustomizerStudio } from './components/CustomizerStudio';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTracking } from './components/OrderTracking';
import { AdminPanel } from './components/AdminPanel';
import { StoryAndFaq } from './components/StoryAndFaq';
import { StaticPageModal } from './components/StaticPageModal';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { StoreToast, ToastMessage } from './components/StoreToast';
import { BestSellersSection } from './components/BestSellersSection';
import { TopWeeklySection } from './components/TopWeeklySection';
import { QuickCategoriesBar } from './components/QuickCategoriesBar';

export default function App() {
  const store = useAppStore();

  const [activeSection, setActiveSection] = useState<'home' | 'catalog' | 'customizer' | 'story' | 'track' | 'bestsellers' | 'top_weekly'>('home');

  const [isAdminView, setIsAdminView] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname === '/admin' || window.location.hash === '#admin';
    }
    return false;
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customizerProduct, setCustomizerProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeStaticPage, setActiveStaticPage] = useState<StaticPageId | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Authentication State for storefront
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('morico_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    action?: { label: string; onClick: () => void }
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message, action }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // URL / Route synchronization for /admin
  useEffect(() => {
    const handlePopState = () => {
      const isAtAdmin = window.location.pathname === '/admin' || window.location.hash === '#admin';
      setIsAdminView(isAtAdmin);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Update URL, meta robots, and title when isAdminView or activeSection or siteTitle changes
  useEffect(() => {
    let robotsMeta = document.querySelector('meta[name="robots"]');
    const brandTitle = store.siteContent?.branding?.siteTitle || 'MORICO STYLE';

    if (isAdminView) {
      if (window.location.pathname !== '/admin' && window.location.hash !== '#admin') {
        window.history.pushState(null, '', '/admin');
      }
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
      document.title = `${brandTitle} | پنل مدیریت آتلیه`;
    } else {
      if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
        window.history.pushState(null, '', '/');
      }
      if (robotsMeta) {
        robotsMeta.remove();
      }
      // Re-apply storefront title
      switch (activeSection) {
        case 'home':
          document.title = `${brandTitle} | فروشگاه اینترنتی چندمنظوره`;
          break;
        case 'catalog':
          document.title = `${brandTitle} | کاتالوگ محصولات و دسته‌بندی‌ها`;
          break;
        case 'customizer':
          document.title = `${brandTitle} | استودیو طراحی آنلاین و سفارشی`;
          break;
        case 'story':
          document.title = `${brandTitle} | درباره ما و اصالت کالا`;
          break;
        case 'track':
          document.title = `${brandTitle} | رهگیری سفارش`;
          break;
        case 'bestsellers':
          document.title = `${brandTitle} | پرفروش‌ترین‌ها`;
          break;
        case 'top_weekly':
          document.title = `${brandTitle} | برترین‌های هفته`;
          break;
        default:
          document.title = `${brandTitle} | فروشگاه اینترنتی`;
      }
    }
  }, [isAdminView, activeSection, store.siteContent]);

  // Brand color theme synchronization
  useEffect(() => {
    const primary = store.siteContent?.branding?.primaryColor;
    const accent = store.siteContent?.branding?.accentColor;
    if (primary) {
      document.documentElement.style.setProperty('--brand-primary', primary);
    }
    if (accent) {
      document.documentElement.style.setProperty('--brand-accent', accent);
    }
  }, [store.siteContent]);

  const handleNavigate = (sectionId: string) => {
    setIsAdminView(false);
    if (
      sectionId === 'catalog' ||
      sectionId === 'home' ||
      sectionId === 'customizer' ||
      sectionId === 'story' ||
      sectionId === 'track' ||
      sectionId === 'bestsellers' ||
      sectionId === 'top_weekly'
    ) {
      if (sectionId === 'home') {
        setSelectedCategoryFilter('all');
      }
      setActiveSection(sectionId as any);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };



  const handleNavigateToCategory = (catId: string) => {
    setIsAdminView(false);
    setSelectedCategoryFilter(catId);
    setActiveSection('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCustomizer = (product?: Product) => {
    if (product) {
      setCustomizerProduct(product);
    }
    setIsAdminView(false);
    setActiveSection('customizer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToCheckout = (discount: number, promo: string) => {
    setDiscountAmount(discount);
    setAppliedPromoCode(promo);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (newOrder: Order) => {
    store.addOrder(newOrder);
    showToast('success', `سفارش شما با شماره ${newOrder.orderNumber} با موفقیت ثبت شد.`);
  };

  const handleAddToCart = (
    prod: Product,
    color?: string,
    size?: string,
    qty: number = 1,
    variant?: ProductVariant
  ) => {
    const res = store.addToCart({
      cartItemId: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      product: prod,
      selectedColor: color || undefined,
      selectedSize: size || undefined,
      selectedVariantId: variant?.id,
      selectedVariant: variant,
      unitPrice: variant ? (variant.discountPrice ?? variant.price) : undefined,
      quantity: qty
    });

    if (res.success) {
      showToast('success', res.message, {
        label: 'مشاهده سبد',
        onClick: () => setIsCartOpen(true)
      });
    } else {
      showToast('warning', res.message);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('morico_session_user', JSON.stringify(user));
    } catch {}

    store.syncUserCartOnLogin(user);
    showToast('success', `${user.name} عزیز، خوش آمدید.`);

    // If the logged in user is admin, open /admin
    if (user.role === 'admin') {
      setIsAdminView(true);
      window.history.pushState(null, '', '/admin');
    } else {
      setIsAdminView(false);
    }
  };

  const handleLogout = async () => {
    const userToken = currentUser?.token || localStorage.getItem('morico_admin_token');
    if (userToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`
          }
        });
      } catch (_) {}
    }
    setCurrentUser(null);
    setIsAdminView(false);
    try {
      localStorage.removeItem('morico_session_user');
      localStorage.removeItem('morico_admin_token');
    } catch {}
    store.syncUserCartOnLogout();
    showToast('info', 'از حساب کاربری با موفقیت خارج شدید و نشست شما باطل شد.');

    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      window.history.pushState(null, '', '/');
    }
  };

  const handleToggleAdmin = () => {
    if (currentUser?.role === 'admin') {
      setIsAdminView((prev) => !prev);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const totalCartCount = store.cart.reduce((sum, item) => sum + item.quantity, 0);

  // Dynamic Homepage Section Renderer (Order and Visibility configured in Admin)
  const renderHomeSections = () => {
    const sections = store.siteContent?.sections || {
      showHero: true,
      showQuickCategories: true,
      showBanners: true,
      showProcess: true,
      showCatalog: false,
      showCraftsmanship: true,
      showFaq: true,
      sectionOrder: ['hero', 'quick_categories', 'banners', 'process', 'craftsmanship', 'faq']
    };

    const rawOrder = (sections.sectionOrder && sections.sectionOrder.length > 0)
      ? sections.sectionOrder
      : ['hero', 'quick_categories', 'banners', 'process', 'craftsmanship', 'faq'];

    // Filter out catalog from home page per user request (catalog is available on dedicated catalog tab)
    const order: string[] = rawOrder.filter((k) => k !== 'catalog');
    if (sections.showQuickCategories !== false && !order.includes('quick_categories')) {
      const heroIdx = order.indexOf('hero');
      if (heroIdx !== -1) {
        order.splice(heroIdx + 1, 0, 'quick_categories');
      } else {
        order.unshift('quick_categories');
      }
    }

    let hasRenderedStoryAndFaq = false;

    return (
      <>
        {order.map((sectionKey) => {
          switch (sectionKey) {
            case 'hero':
              if (sections.showHero === false) return null;
              return (
                <Hero
                  key="hero"
                  heroContent={store.siteContent.hero}
                  branding={store.siteContent.branding}
                  slides={store.siteContent?.heroSlides}
                  onOpenCustomizer={() => handleOpenCustomizer()}
                  onExploreCatalog={() => {
                    setActiveSection('catalog');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onNavigate={handleNavigate}
                  onSelectCategory={handleNavigateToCategory}
                />
              );

            case 'quick_categories':
              if (sections.showQuickCategories === false) return null;
              return (
                <QuickCategoriesBar
                  key="quick_categories"
                  items={store.siteContent?.categoryQuickIcons}
                  categories={store.categories}
                  onSelectCategory={handleNavigateToCategory}
                  onNavigate={handleNavigate}
                  onOpenCustomizer={() => handleOpenCustomizer()}
                />
              );

            case 'banners':
              if (sections.showBanners === false) return null;
              return (
                <StoreBanners
                  key="banners"
                  banners={store.banners}
                  onNavigate={handleNavigate}
                  onOpenCustomizer={() => handleOpenCustomizer()}
                />
              );

            case 'process':
              if (sections.showProcess === false) return null;
              return (
                <HowOnlineDesignWorks
                  key="process"
                  content={store.siteContent.howItWorks}
                  onOpenCustomizer={() => handleOpenCustomizer()}
                />
              );

            case 'catalog':
              // Removed from home page per user request
              return null;

            case 'bestsellers':
              if (sections.showBestSellers === false) return null;
              return (
                <BestSellersSection
                  key="bestsellers"
                  isStandalonePage={false}
                  items={store.bestSellers}
                  categories={store.categories}
                  onBackToHome={() => handleNavigate('home')}
                  onSelectProduct={(p) => setSelectedProduct(p)}
                  onAddToCart={(p) => handleAddToCart(p)}
                  onShowToast={showToast}
                />
              );

            case 'top_weekly':
              if (sections.showTopWeekly === false) return null;
              return (
                <TopWeeklySection
                  key="top_weekly"
                  isStandalonePage={false}
                  items={store.topWeekly}
                  categories={store.categories}
                  onBackToHome={() => handleNavigate('home')}
                  onSelectProduct={(p) => setSelectedProduct(p)}
                  onAddToCart={(p) => handleAddToCart(p)}
                  onShowToast={showToast}
                />
              );

            case 'craftsmanship':
            case 'faq':
              // Rendered cleanly by StoryAndFaq (prevent duplicate render)
              if (hasRenderedStoryAndFaq) return null;
              if (sections.showCraftsmanship === false && sections.showFaq === false) return null;
              hasRenderedStoryAndFaq = true;
              return (
                <StoryAndFaq
                  key="craftsmanship-and-faq"
                  craftsmanship={store.siteContent.craftsmanship}
                  faqList={store.siteContent.faq}
                />
              );

            default:
              return null;
          }
        })}
      </>
    );
  };

  // If in admin view (route: /admin), render the full-screen Admin Console
  if (isAdminView) {
    return (
      <AdminPanel
        onBackToSite={() => {
          store.refreshAll();
          setIsAdminView(false);
          window.history.pushState(null, '', '/');
        }}
        onSyncPublicStore={() => {
          store.refreshAll();
        }}
      />
    );
  }

  // Otherwise, render Public Storefront
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#FFFFFF] text-[#111110] flex flex-col font-sans selection:bg-[#111110] selection:text-white transition-colors duration-200">
      
      {/* Dynamic Header with Live Brand Settings & Announcement */}

      <Header
        cartCount={totalCartCount}
        categories={store.categories}
        activeSection={activeSection}
        selectedCategoryId={selectedCategoryFilter}
        currentUser={currentUser}
        isAdmin={isAdminView}
        siteContent={store.siteContent}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCustomizer={() => handleOpenCustomizer()}
        onNavigate={handleNavigate}
        onSelectCategory={handleNavigateToCategory}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onToggleAdmin={handleToggleAdmin}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {activeSection === 'customizer' ? (
          /* Online Design Customizer Studio */
          <CustomizerStudio
            products={store.products}
            initialProduct={customizerProduct}
            onAddToCart={(item) => {
              const res = store.addToCart(item);
              if (res.success) {
                showToast('success', res.message, {
                  label: 'مشاهده سبد',
                  onClick: () => setIsCartOpen(true)
                });
              } else {
                showToast('warning', res.message);
              }
              setIsCartOpen(true);
            }}
            onBackToShop={() => setActiveSection('catalog')}
          />
        ) : activeSection === 'track' ? (
          /* Order Tracking Page */
          <OrderTracking orders={store.orders} />
        ) : activeSection === 'story' ? (
          /* Craft & Story Page */
          <StoryAndFaq
            craftsmanship={store.siteContent.craftsmanship}
            faqList={store.siteContent.faq}
          />
        ) : activeSection === 'catalog' ? (
          /* Full Catalog Page */
          <ShopCatalog
            products={store.products}
            categories={store.categories}
            categoryAttributes={store.categoryAttributes}
            initialCategoryId={selectedCategoryFilter}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onCustomizeProduct={(p) => handleOpenCustomizer(p)}
            onAddToCart={handleAddToCart}
          />
        ) : activeSection === 'bestsellers' ? (
          /* Dedicated Standalone Best Sellers Page */
          <BestSellersSection
            isStandalonePage={true}
            items={store.bestSellers}
            categories={store.categories}
            onBackToHome={() => handleNavigate('home')}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onAddToCart={(p) => handleAddToCart(p)}
            onShowToast={showToast}
          />
        ) : activeSection === 'top_weekly' ? (
          /* Dedicated Standalone Top of the Week Page */
          <TopWeeklySection
            isStandalonePage={true}
            items={store.topWeekly}
            categories={store.categories}
            onBackToHome={() => handleNavigate('home')}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onAddToCart={(p) => handleAddToCart(p)}
            onShowToast={showToast}
          />
        ) : (
          /* Dynamic Homepage Sections configured by Admin */
          renderHomeSections()
        )}


      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          categories={store.categories}
          categoryAttributes={store.categoryAttributes}
          allProducts={store.products}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(prod, color, size, qty, variant) => {
            handleAddToCart(prod, color, size, qty, variant);
            setSelectedProduct(null);
          }}
          onCustomize={(prod) => {
            setSelectedProduct(null);
            handleOpenCustomizer(prod);
          }}
          onSelectRelatedProduct={(prod) => setSelectedProduct(prod)}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={store.cart}
        products={store.products}
        onUpdateQuantity={store.updateCartQuantity}
        onRemoveItem={store.removeFromCart}
        onClearCart={store.clearCart}
        onUndoRemove={store.undoRemoveItem}
        onProceedToCheckout={handleProceedToCheckout}
        discounts={store.discounts}
        onSelectProductDetails={(prod) => {
          setSelectedProduct(prod);
          setIsCartOpen(false);
        }}
        onShowToast={showToast}
      />

      {/* Multi-Step Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={store.cart}
        products={store.products}
        discountAmount={discountAmount}
        appliedCode={appliedPromoCode}
        currentUser={currentUser}
        onOrderSuccess={handleOrderSuccess}
        onNavigateToTracking={() => {
          setActiveSection('track');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Auth Modal (Login & Registration) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Static Legal & Policy Pages Modal */}
      <StaticPageModal
        pageId={activeStaticPage}
        onClose={() => setActiveStaticPage(null)}
        footerContent={store.siteContent.footer}
        policyPages={store.siteContent.policyPages}
        branding={store.siteContent.branding}
      />

      {/* Dynamic Luxury Footer */}
      <Footer
        footerContent={store.siteContent.footer}
        branding={store.siteContent.branding}
        onNavigate={handleNavigate}
        onOpenCustomizer={() => handleOpenCustomizer()}
        onOpenStaticPage={(pageId) => setActiveStaticPage(pageId)}
      />

      {/* Storefront Global Toast Feedback */}
      <StoreToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
