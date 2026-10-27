/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Product, CartItem, Language, SiteSettings, Order, CustomerReview, ScreenshotReview } from './types';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryBar } from './components/CategoryBar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { ProductLandingPage } from './components/ProductLandingPage';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { HomeDecorSection } from './components/HomeDecorSection';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { ReviewsSection } from './components/ReviewsSection';
import { ScreenshotReviewsSlider } from './components/ScreenshotReviewsSlider';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { PWAFloatingBanner } from './components/PWAInstallButton';
import { AdminDashboard } from './components/AdminDashboard';
import { ShieldCheck, Truck, RefreshCw, Sparkles, Filter, Search, ArrowRight, X, Star, ShoppingBag } from 'lucide-react';
import { showNativeAdminNotification, playOrderSound, triggerHapticFeedback } from './utils/notificationSound';
import { isWeightBasedProduct, matchProductSearch, getDefaultProductWeight, formatPrice, toBnNumber, calculateItemPrice } from './utils/formatters';
import { INITIAL_PRODUCTS } from './data/defaultProducts';
import { INITIAL_REVIEWS, INITIAL_SCREENSHOT_REVIEWS } from './data/defaultReviews';
import { 
  loadProductsFromCloud, 
  loadSettingsFromCloud, 
  loadReviewsFromCloud, 
  saveReviewToCloud, 
  loadScreenshotReviewsFromCloud,
  saveScreenshotReviewsToCloud,
  listenToCloudOrders
} from './lib/clientFirebase';

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brandNameBn: 'আমার ঘর Online',
  brandNameEn: 'Amar Ghor Online',
  taglineBn: 'আপন ঘরের মতো নিরাপদ',
  taglineEn: 'Trusted Products for Your Home',
  phone: '01742749028',
  whatsapp: '01742749028',
  email: 'amarghoronline.bd@gmail.com',
  addressBn: 'মিরপুর, ঢাকা - ১২১৬, বাংলাদেশ',
  addressEn: 'Mirpur, Dhaka - 1216, Bangladesh',
  announcementBn: 'আপন ঘরের মতো নিরাপদ | বিশ্বস্ত উৎস থেকে সংগৃহীত খাঁটি খাবার ও নান্দনিক হোম ডেকোর',
  announcementEn: 'Trusted Products for Your Home | 100% Authentic Food & Aesthetic Home Decor',
  deliveryPricingType: 'weight_based',
  deliveryHalfKgRate: 120,
  deliveryBase1KgRate: 140,
  deliveryExtraPerKgRate: 20,
  deliveryInsideDhaka: 70,
  deliveryOutsideDhaka: 130,
  paymentMethods: {
    cod: true,
    bkash: true,
    nagad: true,
    bkashNumber: '01742749028 (Personal/Send Money)',
    nagadNumber: '01742749028 (Personal/Send Money)'
  },
  features: {
    showAnnouncement: true,
    showLanguageSwitcher: true,
    showFontSwitcher: true,
    showSearchBar: true,
    showHeroSection: true,
    showCategoryBar: true,
    showHomeDecorSection: true,
    showTrustBanner: true,
    showReviewsSection: true,
    showScreenshotReviews: true,
    showAboutSection: true,
    showContactSection: true,
    showFloatingWhatsApp: true,
    showProductWhatsAppBtn: true,
    showStockBadge: true,
    showCheckoutEmailField: true,
    enableOrderNotes: true
  },
  heroBadgeBn: 'আমার ঘর Online · বিশ্বস্ততার প্রতীক',
  heroBadgeEn: 'Amar Ghor Online · Symbol of Trust',
  heroHeadlineBn: 'আপন ঘরের মতো নিরাপদ',
  heroHeadlineEn: 'Safe & Pure Like Your Own Home',
  heroSubheadlineBn: '“বিশ্বস্ত উৎস থেকে বাছাইকৃত খাঁটি খাবার ও ঘরের সৌন্দর্য বাড়ানোর পণ্য—সবকিছু এক ঠিকানায়।”',
  heroSubheadlineEn: '“Authentic Food & Beautiful Home Decor, All in One Place.”',
  trustCard1TitleBn: 'আপন ঘরের মতো নিরাপদ',
  trustCard1TitleEn: 'Safe Like Your Own Home',
  trustCard1DescBn: 'পরিবারের প্রতিটি সদস্যের স্বাস্থ্যের কথা মাথায় রেখে বাছাইকৃত শতভাগ খাঁটি খাদ্য সম্ভার।',
  trustCard1DescEn: 'Carefully chosen 100% natural foods keeping your family health & peace of mind at core.',
  trustCard2TitleBn: 'সারাদেশে বিশ্বস্ত ডেলিভারি',
  trustCard2TitleEn: 'Reliable Countrywide Delivery',
  trustCard2DescBn: '',
  trustCard2DescEn: '',
  trustCard3TitleBn: 'ক্যাশ অন ডেলিভারি সুবিধা',
  trustCard3TitleEn: 'Cash on Delivery Available',
  trustCard3DescBn: 'পণ্য ডেলিভারিম্যানের কাছ থেকে হাতেনাতে দেখে বুঝে নিয়ে মূল্য পরিশোধ করুন।',
  trustCard3DescEn: 'Inspect your order on arrival and pay conveniently upon receiving.',
  aboutBn: 'আমার ঘর Online-এ আপনাকে স্বাগতম। আমাদের লক্ষ্য হলো আপনার ঘরের জন্য বাছাইকৃত খাবার ও সৌন্দর্যবর্ধক পণ্য একটি সহজ, সুন্দর ও নির্ভরযোগ্য অনলাইন অভিজ্ঞতার মাধ্যমে পৌঁছে দেওয়ার ব্যবস্থা করা। পণ্যের সঠিক তথ্য, স্বচ্ছ মূল্য এবং আন্তরিক গ্রাহকসেবাকে আমরা গুরুত্ব দিই।',
  aboutEn: 'Welcome to Amar Ghor Online. We bring together carefully selected food products and home decor items in one convenient online destination. Our goal is to provide a smooth shopping experience with transparent pricing, clear product information, and helpful customer service.',
  businessHoursBn: 'প্রতিদিন সকাল ৯:০০ টা থেকে রাত ১০:০০ টা পর্যন্ত',
  businessHoursEn: 'Everyday 9:00 AM to 10:00 PM',
  privacyPolicyBn: 'আমরা আপনার ব্যক্তিগত তথ্যের সর্বোচ্চ সুরক্ষা নিশ্চিত করি। আপনার নাম, ঠিকানা ও ফোন নম্বর কেবল অর্ডার সরবরাহ এবং সেবা প্রদানের উদ্দেশ্যে ব্যবহৃত হয়।',
  termsBn: 'পণ্য গ্রহণের সময় অনুগ্রহ করে ডেলিভারি ম্যানের উপস্থিতিতে পণ্য দেখে নিন। কোনো ত্রুটি পরিলক্ষিত হলে সাথে সাথেই আমাদের জানান।',
  returnPolicyBn: 'পণ্য ভাঙা বা গুণগত মান যাচাইয়ে কোনো ঘাটতি পাওয়া গেলে ৭ দিনের মধ্যে সহজে রিটার্ন বা রিফান্ডের নিশ্চয়তা রয়েছে।',
  bengaliFont: 'hind',
  logoUrl: 'https://res.cloudinary.com/hcmtg1sc/image/upload/v1791986421/1000738843.png',
  logoDisplayMode: 'icon_and_text',
  enableFakeDetection: true,
  blockBlacklistedDirectly: false,
  minAddressLength: 8,
  maxOrdersPerPhoneDay: 4
};

export default function App() {
  // Settings & Locale
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [lang, setLang] = useState<Language>('bn'); // Bengali default as requested
  const [activeTab, setActiveTab] = useState<string>('home'); // home, shop, food, decor, about, contact
  const [currentFont, setCurrentFont] = useState<'hind' | 'noto' | 'anek' | 'tiro'>(() => {
    return (localStorage.getItem('amarghor_font') as any) || 'hind';
  });

  // Apply Bengali font to html document
  useEffect(() => {
    const fontToUse = settings.bengaliFont || currentFont || 'hind';
    document.documentElement.setAttribute('data-bn-font', fontToUse);
  }, [settings.bengaliFont, currentFont]);

  // Sync browser tab favicon dynamically
  useEffect(() => {
    const faviconUrl = settings.logoUrl || '/favicon.png';
    const link = document.getElementById('app-favicon') as HTMLLinkElement | null;
    if (link) {
      link.href = faviconUrl;
    }
  }, [settings.logoUrl]);

  const handleFontChange = (font: 'hind' | 'noto' | 'anek' | 'tiro') => {
    setCurrentFont(font);
    localStorage.setItem('amarghor_font', font);
    document.documentElement.setAttribute('data-bn-font', font);
    setSettings((prev) => ({ ...prev, bengaliFont: font }));
  };

  // Products & Categories
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart State (Persisted in localStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('amarghor_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI Modals & Drawers
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [landingProduct, setLandingProduct] = useState<Product | null>(null);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);

  // Reviews & Screenshot Reviews State
  const [reviews, setReviews] = useState<CustomerReview[]>(INITIAL_REVIEWS);
  const [screenshotReviews, setScreenshotReviews] = useState<ScreenshotReview[]>(INITIAL_SCREENSHOT_REVIEWS);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('amarghor_cart', JSON.stringify(cart));
  }, [cart]);

  // Fetch Products, Settings, Reviews from API or Cloud Firestore
  const loadData = async () => {
    try {
      let fetchedProds: Product[] | null = null;
      let fetchedSett: Partial<SiteSettings> | null = null;
      let fetchedRevs: CustomerReview[] | null = null;
      let fetchedScreenshots: ScreenshotReview[] | null = null;

      // 1. Attempt Node / Express backend API
      try {
        const [prodRes, settRes, revRes, ssRes] = await Promise.all([
          fetch('/api/products').catch(() => null),
          fetch('/api/settings').catch(() => null),
          fetch('/api/reviews').catch(() => null),
          fetch('/api/screenshot-reviews').catch(() => null)
        ]);

        if (prodRes && prodRes.ok) {
          const contentType = prodRes.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const prodData = await prodRes.json();
            if (Array.isArray(prodData) && prodData.length > 0) {
              fetchedProds = prodData;
            }
          }
        }

        if (settRes && settRes.ok) {
          const contentType = settRes.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const settData = await settRes.json();
            if (settData && typeof settData === 'object') {
              fetchedSett = settData;
            }
          }
        }

        if (revRes && revRes.ok) {
          const contentType = revRes.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const revData = await revRes.json();
            if (Array.isArray(revData) && revData.length > 0) {
              fetchedRevs = revData;
            }
          }
        }

        if (ssRes && ssRes.ok) {
          const contentType = ssRes.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const ssData = await ssRes.json();
            if (Array.isArray(ssData) && ssData.length > 0) {
              fetchedScreenshots = ssData;
            }
          }
        }
      } catch (e) {
        console.warn('[App] Express API unreachable, checking cloud/static:', e);
      }

      // 2. Cloud Firestore fallbacks (Netlify / Static mode)
      if (!fetchedProds || fetchedProds.length === 0) {
        const cloudProds = await loadProductsFromCloud().catch(() => null);
        if (cloudProds && cloudProds.length > 0) {
          fetchedProds = cloudProds;
        }
      }

      if (!fetchedSett) {
        const cloudSett = await loadSettingsFromCloud().catch(() => null);
        if (cloudSett) {
          fetchedSett = cloudSett;
        }
      }

      if (!fetchedRevs || fetchedRevs.length === 0) {
        const cloudRevs = await loadReviewsFromCloud().catch(() => null);
        if (cloudRevs && cloudRevs.length > 0) {
          fetchedRevs = cloudRevs;
        }
      }

      if (!fetchedScreenshots || fetchedScreenshots.length === 0) {
        const cloudSS = await loadScreenshotReviewsFromCloud().catch(() => null);
        if (cloudSS && cloudSS.length > 0) {
          fetchedScreenshots = cloudSS;
        }
      }

      // 3. Apply state
      if (fetchedProds && fetchedProds.length > 0) {
        setProducts(fetchedProds);
      } else {
        setProducts(INITIAL_PRODUCTS);
      }

      if (fetchedSett) {
        setSettings((prev) => ({ ...prev, ...fetchedSett }));
      }

      if (fetchedRevs && fetchedRevs.length > 0) {
        setReviews(fetchedRevs);
      }

      if (fetchedScreenshots && fetchedScreenshots.length > 0) {
        setScreenshotReviews(fetchedScreenshots);
      }
    } catch (err) {
      console.warn('loadData fallback error:', err);
      setProducts(INITIAL_PRODUCTS);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Background Admin Order Monitor (Alerts Admin with chime and popup even when dashboard modal is closed)
  useEffect(() => {
    let isMounted = true;
    let lastKnownOrdersCount = 0;
    const knownIds = new Set<string>();

    // 1. Live Firestore WebSocket Listener in App
    const unsubCloud = listenToCloudOrders((cloudOrders, isInitial) => {
      const adminToken = localStorage.getItem('amarghor_admin_token');
      const notifEnabled = localStorage.getItem('amarghor_admin_notifications_enabled') !== 'false';
      if (!adminToken || !notifEnabled || !cloudOrders) return;

      if (!isInitial && knownIds.size > 0) {
        const freshOnes = cloudOrders.filter(
          (o) => !knownIds.has(o.orderId) && !knownIds.has(o.orderNumber)
        );
        if (freshOnes.length > 0) {
          const latest = freshOnes[0];
          playOrderSound();
          triggerHapticFeedback();
          showNativeAdminNotification(
            '🛒 নতুন কাস্টমার অর্ডার এসেছে!',
            `অর্ডার #${latest.orderNumber || ''} | মোট: ৳${latest.total ?? (latest as any).totalPayable ?? latest.subtotal ?? ''} (${latest.customer?.name || ''})`
          );
        }
      }
      cloudOrders.forEach((o: any) => {
        if (o.orderId) knownIds.add(o.orderId);
        if (o.orderNumber) knownIds.add(o.orderNumber);
      });
    });

    const checkAdminOrders = async () => {
      try {
        const adminToken = localStorage.getItem('amarghor_admin_token');
        const notifEnabled = localStorage.getItem('amarghor_admin_notifications_enabled') !== 'false';
        if (!adminToken || !notifEnabled) return;

        const res = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!res.ok) return;
        const orders = await res.json();
        if (Array.isArray(orders)) {
          if (lastKnownOrdersCount > 0 && orders.length > lastKnownOrdersCount) {
            const freshOnes = orders.filter((o: any) => !knownIds.has(o.orderId) && !knownIds.has(o.orderNumber));
            if (freshOnes.length > 0) {
              const latest = freshOnes[0];
              playOrderSound();
              triggerHapticFeedback();
              showNativeAdminNotification(
                '🛒 নতুন কাস্টমার অর্ডার এসেছে!',
                `অর্ডার #${latest.orderNumber || ''} | মোট: ৳${latest.total || latest.totalPayable || latest.payableTotal || latest.subtotal || ''} (${latest.customer?.name || ''})`
              );
            }
          }
          lastKnownOrdersCount = orders.length;
          orders.forEach((o: any) => {
            if (o.orderId) knownIds.add(o.orderId);
            if (o.orderNumber) knownIds.add(o.orderNumber);
          });
        }
      } catch {
        // Silent catch for background check
      }
    };

    // First check after 2 seconds, then every 10 seconds
    const initialTimer = setTimeout(checkAdminOrders, 2000);
    const interval = setInterval(() => {
      if (isMounted) checkAdminOrders();
    }, 10000);

    return () => {
      isMounted = false;
      unsubCloud();
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  // Handler for adding a new customer review
  const handleAddReview = async (newRev: Omit<CustomerReview, 'id' | 'createdAt'>): Promise<boolean> => {
    const reviewObj: CustomerReview = {
      ...newRev,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Try server API
      let saved = false;
      try {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRev)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.review) {
            setReviews((prev) => [data.review, ...prev]);
            saved = true;
          }
        }
      } catch {
        // API offline
      }

      // 2. Cloud Firestore fallback in background
      if (!saved) {
        saveReviewToCloud(reviewObj).catch(() => {});
        setReviews((prev) => [reviewObj, ...prev]);
      }
      return true;
    } catch (e) {
      console.error('Failed to add review:', e);
      return false;
    }
  };

  const handleCloseAdmin = () => {
    setAdminOpen(false);
    // Clear secret admin identifiers from address bar if present
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    if (hash.includes('admin') || search.includes('admin') || path.includes('secret-admin')) {
      window.history.replaceState(null, '', path.includes('secret-admin') ? '/' : window.location.pathname);
    }
  };

  useEffect(() => {
    loadData();

    // Secure URL route checker for Admin Panel
    const handleUrlRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();

      // 1. Explicitly BLOCK public guessable paths like /admin or #admin
      if (path === '/admin' || path === '/admin/' || hash === '#admin') {
        window.history.replaceState(null, '', window.location.pathname.replace(/\/admin\/?$/i, '') || '/');
        return;
      }

      // 2. Secret link triggers (strictly requires secret token/query/hash)
      if (
        hash === '#amarghor-secret-admin-992' ||
        hash === '#secret-admin-access-992' ||
        search.includes('secret_admin=amarghor992') ||
        search.includes('panel=secret_admin_992') ||
        path === '/secret-admin-access-992'
      ) {
        setAdminOpen(true);
        return;
      }

      // 3. Dynamic Product Landing Page route: /product/:id or /p/:id or ?product=:id or #product-:id
      let urlProductId = '';
      const prodPathMatch = window.location.pathname.match(/^\/(?:product|p)\/([^/?#]+)/i);
      if (prodPathMatch && prodPathMatch[1]) {
        urlProductId = decodeURIComponent(prodPathMatch[1]);
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('product')) {
          urlProductId = searchParams.get('product') || '';
        } else if (hash.startsWith('#product-')) {
          urlProductId = hash.replace('#product-', '');
        }
      }

      if (urlProductId) {
        setPendingProductId(urlProductId);
      } else {
        setPendingProductId(null);
        setLandingProduct(null);
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    window.addEventListener('hashchange', handleUrlRoute);

    // Secret shortcut for owner: Ctrl+Shift+A (or Cmd+Shift+A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handleUrlRoute);
      window.removeEventListener('hashchange', handleUrlRoute);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Resolve product landing page from pending product ID once products are loaded
  useEffect(() => {
    if (pendingProductId && products.length > 0) {
      const found = products.find((p) => p.id === pendingProductId);
      if (found) {
        setLandingProduct(found);
      }
    }
  }, [pendingProductId, products]);

  const handleOpenProductLanding = (product: Product) => {
    setLandingProduct(product);
    setSelectedProduct(null);
    window.history.pushState(null, '', `/product/${product.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromLanding = () => {
    setLandingProduct(null);
    window.history.pushState(null, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart Actions
  const handleAddToCart = (product: Product, quantity = 1, selectedWeight = '') => {
    const defaultWeight = getDefaultProductWeight(product);
    const weightToUse = selectedWeight || defaultWeight;

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        if (updated[existingIndex].selectedWeight === weightToUse) {
          updated[existingIndex].quantity += quantity;
        } else {
          updated[existingIndex].selectedWeight = weightToUse;
          updated[existingIndex].quantity = quantity;
        }
        return updated;
      }
      return [...prev, { product, quantity, selectedWeight: weightToUse }];
    });
  };

  const handleOrderNow = (product: Product, quantity = 1, selectedWeight = '') => {
    const defaultWeight = getDefaultProductWeight(product);
    const weightToUse = selectedWeight || defaultWeight;

    setCart((prev) => {
      const filtered = prev.filter((item) => item.product.id !== product.id);
      return [...filtered, { product, quantity, selectedWeight: weightToUse }];
    });
    setCheckoutOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number, selectedWeight?: string) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              ...(selectedWeight ? { selectedWeight } : {})
            }
          : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const isSearching = searchQuery.trim().length > 0;

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = matchProductSearch(p, searchQuery);
      if (!matchesSearch) return false;

      // When searching, display all matching products regardless of active category filter
      // If not searching, filter by category
      if (isSearching) {
        return true;
      }
      return selectedCategory === 'all' || p.category === selectedCategory;
    });
  }, [products, searchQuery, selectedCategory, isSearching]);

  // For the Home page catalog: if user is searching, include all matching items (both food and decor)
  const displayedHomeProducts = useMemo(() => {
    if (isSearching) {
      return filteredProducts;
    }
    return filteredProducts.filter((p) => p.category !== 'home_decor');
  }, [filteredProducts, isSearching]);

  const decorProducts = useMemo(() => {
    return products.filter((p) => p.category === 'home_decor');
  }, [products]);

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const itemPrice = calculateItemPrice(item.product.price, item.selectedWeight, item.product.unitBn);
      return acc + (itemPrice * item.quantity);
    }, 0);
  }, [cart]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col selection:bg-[#2D6A4F] selection:text-white">
      {landingProduct ? (
        <ProductLandingPage
          product={landingProduct}
          allProducts={products}
          lang={lang}
          settings={settings}
          onAddToCart={handleAddToCart}
          onOrderNow={handleOrderNow}
          onBackToHome={handleBackFromLanding}
          onOpenCart={() => setCartOpen(true)}
          cartCount={totalCartItems}
          reviews={reviews}
          onAddReview={handleAddReview}
          onSelectProduct={handleOpenProductLanding}
        />
      ) : (
        <>
          {/* 1. Header Navigation */}
          <Header
            lang={lang}
            onLanguageChange={setLang}
            cartCount={totalCartItems}
            onOpenCart={() => setCartOpen(true)}
            onOpenAdmin={() => setAdminOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            settings={settings}
            currentFont={currentFont}
            onFontChange={handleFontChange}
            products={products}
            onSelectProduct={handleOpenProductLanding}
          />

          {/* 2. Main Body Content Based on Active Tab */}
          <main className="flex-1">
        {/* TAB: HOME */}
        {activeTab === 'home' && (
          <>
            {/* Hero Section */}
            {settings.features?.showHeroSection !== false && (
              <Hero
                lang={lang}
                settings={settings}
                onExploreFood={() => {
                  setActiveTab('food');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onExploreDecor={() => {
                  setActiveTab('decor');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {/* Visual Category Bar */}
            {settings.features?.showCategoryBar !== false && (
              <CategoryBar
                lang={lang}
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  if (cat === 'home_decor') {
                    setActiveTab('decor');
                  } else if (cat !== 'all') {
                    const el = document.getElementById('catalog-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              />
            )}

            {/* Authentic Food Products Catalog */}
            <section id="catalog-section" className="py-12 md:py-16 bg-[#FAF8F5]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E8E2D8] pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F] uppercase tracking-wider mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>{lang === 'bn' ? 'শতভাগ বিশুদ্ধ ও প্রাকৃতিক' : '100% Pure & Natural'}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#133E2B]">
                      {isSearching
                        ? lang === 'bn'
                          ? `অনুসন্ধানের ফলাফল: "${searchQuery}"`
                          : `Search Results: "${searchQuery}"`
                        : lang === 'bn'
                        ? 'খাঁটি খাবারের সম্ভার'
                        : 'Authentic Food Collection'}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {isSearching
                        ? lang === 'bn'
                          ? `আপনার অনুসন্ধানের সাথে মিলে যাওয়া ${displayedHomeProducts.length}টি পণ্য নিচে প্রদর্শিত হলো`
                          : `Found ${displayedHomeProducts.length} products matching your query`
                        : lang === 'bn'
                        ? 'প্রাকৃতিক চাকের মধু, গাওয়া ঘি, কোল্ডপ্রেস তেল, নাটস ও খেজুর'
                        : 'Natural Honey, Pure Ghee, Cold-Pressed Oils, Nuts & Premium Dates'}
                    </p>
                  </div>

                  {/* Catalog On-page Search Input */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-full sm:w-64 lg:w-72">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'নাম বা উপাদান দিয়ে খুঁজুন...' : 'Search in catalog...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-[#DDD5C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] shadow-xs transition-all"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-sm font-bold w-4 h-4 flex items-center justify-center"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 font-semibold whitespace-nowrap hidden sm:inline">
                      {lang === 'bn' ? `${displayedHomeProducts.length}টি পণ্য` : `${displayedHomeProducts.length} items`}
                    </span>
                  </div>
                </div>

                {/* Active Search Banner with Quick Clear */}
                {isSearching && (
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#EAF2EC] border border-[#B7D5C4] rounded-2xl p-3.5 sm:p-4 text-[#133E2B]">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold">
                        {lang === 'bn'
                          ? `"${searchQuery}" এর জন্য ${displayedHomeProducts.length}টি পণ্য পাওয়া গেছে`
                          : `Found ${displayedHomeProducts.length} products for "${searchQuery}"`}
                      </span>
                    </div>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs font-bold text-[#2D6A4F] hover:text-[#133E2B] flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#B7D5C4] shadow-xs transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'সার্চ ফিল্টার মুছুন' : 'Clear Search'}</span>
                    </button>
                  </div>
                )}

                {/* Grid */}
                {loadingProducts ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="h-80 bg-white rounded-2xl border border-gray-200" />
                    ))}
                  </div>
                ) : displayedHomeProducts.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#E8E2D8] max-w-md mx-auto space-y-4 shadow-xs">
                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                      <Search className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-base sm:text-lg">
                      {lang === 'bn'
                        ? isSearching
                          ? `"${searchQuery}" নামে কোনো পণ্য পাওয়া যায়নি`
                          : 'কোনো পণ্য খুঁজে পাওয়া যায়নি'
                        : `No products found${isSearching ? ` for "${searchQuery}"` : ''}`}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {lang === 'bn'
                        ? 'বানান সঠিক আছে কি না পরীক্ষা করুন অথবা নিচের জনপ্রিয় পণ্যগুলো দেখতে ট্যাপ করুন:'
                        : 'Try searching with another keyword or pick from popular items below:'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 justify-center pt-1">
                      {['মধু', 'ঘি', 'সরিষার তেল', 'হানি নাটস', 'খেজুর', 'আমসত্ত্ব'].map((term) => (
                        <button
                          key={term}
                          onClick={() => setSearchQuery(term)}
                          className="px-2.5 py-1 bg-[#FAF8F5] hover:bg-[#EAF2EC] text-[#133E2B] text-xs font-semibold rounded-lg border border-[#DDD5C7] transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                        }}
                        className="px-5 py-2.5 bg-[#133E2B] hover:bg-[#1B4332] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                      >
                        {lang === 'bn' ? 'সব পণ্য একসাথে দেখুন' : 'Show All Products'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                    {displayedHomeProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        lang={lang}
                        onViewDetails={handleOpenProductLanding}
                        onOpenLanding={handleOpenProductLanding}
                        onAddToCart={handleAddToCart}
                        onOrderNow={handleOrderNow}
                        whatsappPhone={settings.whatsapp}
                        showStockBadge={settings.features?.showStockBadge !== false}
                        showWhatsAppBtn={settings.features?.showProductWhatsAppBtn !== false}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Home Decor Showcase Teaser */}
            {settings.features?.showHomeDecorSection !== false && (
              <HomeDecorSection
                products={products}
                lang={lang}
                onViewDetails={handleOpenProductLanding}
                onAddToCart={handleAddToCart}
                onOrderNow={handleOrderNow}
                whatsappPhone={settings.whatsapp}
              />
            )}

            {/* Trust Banner Bar */}
            {settings.features?.showTrustBanner !== false && (
              <section className="py-12 bg-white border-y border-[#E8E2D8]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8]">
                      <div className="p-3 bg-[#133E2B] text-[#E8C547] rounded-xl shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-[#133E2B]">
                          {lang === 'bn' 
                            ? (settings.trustCard1TitleBn || 'আপন ঘরের মতো নিরাপদ')
                            : (settings.trustCard1TitleEn || 'Safe Like Your Own Home')}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {lang === 'bn'
                            ? (settings.trustCard1DescBn || 'পরিবারের প্রতিটি সদস্যের স্বাস্থ্যের কথা মাথায় রেখে বাছাইকৃত শতভাগ খাঁটি খাদ্য সম্ভার।')
                            : (settings.trustCard1DescEn || 'Carefully chosen 100% natural foods keeping your family health & peace of mind at core.')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8]">
                      <div className="p-3 bg-[#133E2B] text-[#E8C547] rounded-xl shrink-0">
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-[#133E2B]">
                          {lang === 'bn'
                            ? (settings.trustCard2TitleBn || 'সারাদেশে বিশ্বস্ত ডেলিভারি')
                            : (settings.trustCard2TitleEn || 'Reliable Countrywide Delivery')}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {settings.trustCard2DescBn ? (
                            lang === 'bn' ? settings.trustCard2DescBn : (settings.trustCard2DescEn || settings.trustCard2DescBn)
                          ) : (
                            settings.deliveryPricingType === 'flat_zone'
                              ? (lang === 'bn'
                                  ? `ঢাকায় মাত্র ৳${settings.deliveryInsideDhaka} এবং ঢাকার বাইরে ৳${settings.deliveryOutsideDhaka} ডেলিভারি চার্জে দ্রুত সরবরাহ।`
                                  : `Prompt doorstep delivery inside Dhaka (৳${settings.deliveryInsideDhaka}) and outside Dhaka (৳${settings.deliveryOutsideDhaka}).`)
                              : (lang === 'bn'
                                  ? `সারা বাংলাদেশে ১ কেজি পর্যন্ত মাত্র ৳${settings.deliveryBase1KgRate || 140} (হাফ কেজি ৳${settings.deliveryHalfKgRate || 120}, অতিরিক্ত প্রতি কেজিতে +৳${settings.deliveryExtraPerKgRate || 20}) কুরিয়ারে দ্রুত সরবরাহ।`
                                  : `Nationwide courier: ৳${settings.deliveryBase1KgRate || 140} up to 1 kg (৳${settings.deliveryHalfKgRate || 120} for 500g, +৳${settings.deliveryExtraPerKgRate || 20}/extra kg).`)
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8]">
                      <div className="p-3 bg-[#133E2B] text-[#E8C547] rounded-xl shrink-0">
                        <RefreshCw className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-[#133E2B]">
                          {lang === 'bn'
                            ? (settings.trustCard3TitleBn || 'ক্যাশ অন ডেলিভারি সুবিধা')
                            : (settings.trustCard3TitleEn || 'Cash on Delivery Available')}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {lang === 'bn'
                            ? (settings.trustCard3DescBn || 'পণ্য ডেলিভারিম্যানের কাছ থেকে হাতেনাতে দেখে বুঝে নিয়ে মূল্য পরিশোধ করুন।')
                            : (settings.trustCard3DescEn || 'Inspect your order on arrival and pay conveniently upon receiving.')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Social Proof Screenshot Reviews Slider */}
            {settings.features?.showScreenshotReviews !== false && screenshotReviews.length > 0 && (
              <ScreenshotReviewsSlider
                lang={lang}
                reviews={screenshotReviews}
              />
            )}

            {/* Customer Reviews & Feedback Section */}
            {settings.features?.showReviewsSection !== false && (
              <ReviewsSection
                lang={lang}
                reviews={reviews}
                onAddReview={handleAddReview}
                products={products}
              />
            )}

            {/* About Us Narrative Snippet */}
            {settings.features?.showAboutSection !== false && (
              <AboutSection lang={lang} settings={settings} />
            )}

            {/* Contact Section */}
            {settings.features?.showContactSection !== false && (
              <ContactSection lang={lang} settings={settings} />
            )}
          </>
        )}

        {/* TAB: SHOP (ALL PRODUCTS) */}
        {activeTab === 'shop' && (
          <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="border-b border-[#E8E2D8] pb-4">
              <h1 className="text-3xl font-extrabold text-[#133E2B]">
                {lang === 'bn' ? 'সকল পণ্য' : 'All Products Catalog'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {lang === 'bn'
                  ? 'খাঁটি খাদ্য ও গৃহসজ্জা সামগ্রীর সমন্বিত তালিকা'
                  : 'Complete catalog of authentic food items and home decor accessories'}
              </p>
            </div>

            <CategoryBar
              lang={lang}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#E8E2D8] max-w-md mx-auto space-y-4 shadow-xs">
                <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-gray-800 text-base sm:text-lg">
                  {lang === 'bn'
                    ? isSearching
                      ? `"${searchQuery}" নামে কোনো পণ্য পাওয়া যায়নি`
                      : 'কোনো পণ্য পাওয়া যায়নি'
                    : `No products found${isSearching ? ` for "${searchQuery}"` : ''}`}
                </h3>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-5 py-2.5 bg-[#133E2B] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {lang === 'bn' ? 'সব পণ্য একসাথে দেখুন' : 'Show All Products'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    lang={lang}
                    onViewDetails={handleOpenProductLanding}
                    onOpenLanding={handleOpenProductLanding}
                    onAddToCart={handleAddToCart}
                    onOrderNow={handleOrderNow}
                    whatsappPhone={settings.whatsapp}
                    showStockBadge={settings.features?.showStockBadge !== false}
                    showWhatsAppBtn={settings.features?.showProductWhatsAppBtn !== false}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: AUTHENTIC FOOD ONLY */}
        {activeTab === 'food' && (
          <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="border-b border-[#E8E2D8] pb-4">
              <h1 className="text-3xl font-extrabold text-[#133E2B]">
                {lang === 'bn' ? 'খাঁটি খাবার সম্ভার' : 'Authentic Food Products'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {lang === 'bn'
                  ? 'প্রাকৃতিক চাক ভাঙ্গা মধু, গাওয়া ঘি, কোল্ডপ্রেস সরিষার তেল, নারিকেল তেল, সুক্কারি ও আজওয়া খেজুর'
                  : 'Honey, Pure Ghee, Cold-Pressed Mustard & Coconut Oils, Dates, and Seed Mixes'}
              </p>
            </div>

            {(() => {
              const items = products.filter(
                (p) => p.category !== 'home_decor' && matchProductSearch(p, searchQuery)
              );
              if (items.length === 0) {
                return (
                  <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#E8E2D8] max-w-md mx-auto space-y-4 shadow-xs">
                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                      <Search className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-base sm:text-lg">
                      {lang === 'bn'
                        ? `"${searchQuery}" নামে কোনো খাবার পণ্য পাওয়া যায়নি`
                        : `No food products found for "${searchQuery}"`}
                    </h3>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-5 py-2.5 bg-[#133E2B] text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      {lang === 'bn' ? 'সব খাবার পণ্য দেখুন' : 'Show All Food Items'}
                    </button>
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      lang={lang}
                      onViewDetails={handleOpenProductLanding}
                      onOpenLanding={handleOpenProductLanding}
                      onAddToCart={handleAddToCart}
                      onOrderNow={handleOrderNow}
                      whatsappPhone={settings.whatsapp}
                      showStockBadge={settings.features?.showStockBadge !== false}
                      showWhatsAppBtn={settings.features?.showProductWhatsAppBtn !== false}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB: HOME DECOR */}
        {activeTab === 'decor' && (
          <div className="py-6">
            <HomeDecorSection
              products={
                isSearching
                  ? products.filter(
                      (p) => p.category === 'home_decor' && matchProductSearch(p, searchQuery)
                    )
                  : products
              }
              lang={lang}
              onViewDetails={setSelectedProduct}
              onAddToCart={handleAddToCart}
              onOrderNow={handleOrderNow}
              whatsappPhone={settings.whatsapp}
            />
          </div>
        )}

        {/* TAB: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="py-6 space-y-6">
            <ScreenshotReviewsSlider
              lang={lang}
              reviews={screenshotReviews}
            />
            <ReviewsSection
              lang={lang}
              reviews={reviews}
              onAddReview={handleAddReview}
              products={products}
            />
          </div>
        )}

        {/* TAB: ABOUT US */}
        {activeTab === 'about' && (
          <div className="py-6">
            <AboutSection lang={lang} settings={settings} />
          </div>
        )}

        {/* TAB: CONTACT */}
        {activeTab === 'contact' && (
          <div className="py-6">
            <ContactSection lang={lang} settings={settings} />
          </div>
        )}
      </main>
        </>
      )}

      {/* 3. Footer */}
      <Footer
        lang={lang}
        settings={settings}
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      {/* 4. Floating WhatsApp & Call Helper */}
      {settings.features?.showFloatingWhatsApp !== false && (
        <FloatingWhatsApp
          phone={settings.whatsapp}
          lang={lang}
          hasBottomBar={totalCartItems > 0 && !cartOpen && !checkoutOpen}
        />
      )}

      {/* 4a. PWA Home Screen Install Banner (Unobtrusive) */}
      <PWAFloatingBanner lang={lang} />

      {/* 4b. Sticky Mobile Floating Cart Bar (Ensures Cart is always 1-tap accessible on phones) */}
      {totalCartItems > 0 && !cartOpen && !checkoutOpen && (
        <div className="sm:hidden fixed bottom-3 left-3 right-3 z-30 animate-in slide-in-from-bottom-3 duration-200">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-[#133E2B] text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between border border-[#E8C547]/40 active:scale-[0.98] transition-transform"
            aria-label="Open Cart"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-[#E8C547] shadow-inner">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 bg-[#E8C547] text-[#133E2B] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#133E2B] shadow-xs">
                  {lang === 'bn' ? toBnNumber(totalCartItems) : totalCartItems}
                </span>
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
                  {lang === 'bn' ? 'আপনার কার্ট' : 'Your Cart'}
                </p>
                <p className="text-sm font-black text-white">
                  {formatPrice(cartSubtotal, lang)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-[#E8C547] text-[#133E2B] font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs">
              <span>{lang === 'bn' ? 'অর্ডার করুন' : 'Checkout'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* 5. Product Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          lang={lang}
          onAddToCart={handleAddToCart}
          onOrderNow={handleOrderNow}
          allProducts={products}
          onSelectProduct={handleOpenProductLanding}
          onOpenLanding={handleOpenProductLanding}
          whatsappPhone={settings.whatsapp}
          showWhatsAppBtn={settings.features?.showProductWhatsAppBtn !== false}
        />
      )}

      {/* 6. Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={() => setCheckoutOpen(true)}
        lang={lang}
        settings={settings}
      />

      {/* 7. Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cart}
        onOrderSuccess={(order) => {
          handleClearCart();
        }}
        lang={lang}
        settings={settings}
        onUpdateQuantity={handleUpdateQuantity}
      />

      {/* 8. Admin Control Dashboard */}
      {adminOpen && (
        <AdminDashboard
          isOpen={adminOpen}
          onClose={handleCloseAdmin}
          products={products}
          onRefreshProducts={loadData}
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
          reviews={reviews}
          onRefreshReviews={loadData}
          screenshotReviews={screenshotReviews}
          onRefreshScreenshotReviews={loadData}
        />
      )}
    </div>
  );
}
