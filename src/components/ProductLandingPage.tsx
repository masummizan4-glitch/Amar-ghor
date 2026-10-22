import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  ShoppingBag,
  ShoppingCart,
  Zap,
  MessageCircle,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Star,
  Plus,
  Minus,
  ZoomIn,
  ExternalLink,
  ChevronRight,
  Heart,
  PhoneCall,
  Sparkles,
  Info
} from 'lucide-react';
import { Product, Language, SiteSettings, CustomerReview } from '../types';
import { BrandLogo } from './BrandLogo';
import {
  formatPrice,
  calculateDiscount,
  createWhatsAppProductUrl,
  toBnNumber,
  calculateItemPrice,
  formatWeightLabel,
  isWeightBasedProduct,
  extractProductPackWeight,
  getProductWeightOptions,
  getDefaultProductWeight,
  resolveImageUrl,
  getProductShareUrl,
  createSocialShareUrls
} from '../utils/formatters';
import { playWhatsAppPingSound, playAddToCartSound } from '../utils/sound';

interface ProductLandingPageProps {
  product: Product;
  allProducts: Product[];
  lang: Language;
  settings: SiteSettings;
  onAddToCart: (product: Product, quantity: number, selectedWeight: string) => void;
  onOrderNow: (product: Product, quantity: number, selectedWeight: string) => void;
  onBackToHome: () => void;
  onOpenCart: () => void;
  cartCount: number;
  reviews?: CustomerReview[];
  onAddReview?: (review: Omit<CustomerReview, 'id' | 'createdAt'>) => Promise<boolean>;
  onSelectProduct: (p: Product) => void;
}

export const ProductLandingPage: React.FC<ProductLandingPageProps> = ({
  product,
  allProducts,
  lang,
  settings,
  onAddToCart,
  onOrderNow,
  onBackToHome,
  onOpenCart,
  cartCount,
  reviews = [],
  onAddReview,
  onSelectProduct
}) => {
  const isWeightBased = isWeightBasedProduct(product);
  const detectedPack = extractProductPackWeight(product);
  const defaultWeight = getDefaultProductWeight(product);

  const [selectedWeight, setSelectedWeight] = useState(defaultWeight);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.images?.[0] || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'benefits' | 'storage' | 'shipping'>('desc');

  // Zoom magnifier states
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  // Mobile sticky CTA bar visibility on scroll
  const [showStickyBottom, setShowStickyBottom] = useState(false);
  const ctaSectionRef = useRef<HTMLDivElement>(null);

  // Review form states
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRating, setReviewerRating] = useState(5);
  const [reviewerComment, setReviewerComment] = useState('');
  const [reviewerDistrict, setReviewerDistrict] = useState('ঢাকা');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  // Sync selected image if product changes
  useEffect(() => {
    setSelectedImage(product.images?.[0] || '');
    setSelectedWeight(getDefaultProductWeight(product));
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product.id]);

  // Dynamic Browser Title, OpenGraph & Structured JSON-LD Data for SEO
  useEffect(() => {
    const brand = lang === 'bn' ? settings.brandNameBn : settings.brandNameEn;
    const prodName = lang === 'bn' ? product.nameBn : (product.nameEn || product.nameBn);
    const unitPrice = calculateItemPrice(product.price, selectedWeight, product.unitBn);
    const formattedPrice = formatPrice(unitPrice, lang);
    
    // 1. Update Title
    document.title = `${prodName} - ${formattedPrice} | ${brand}`;

    // 2. Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    const cleanDesc = (product.descriptionBn || product.descriptionEn || '').slice(0, 155);
    metaDesc.setAttribute('content', `${prodName} - মূল্য: ${formattedPrice}। ${cleanDesc}`);

    // 3. Update OG Meta Tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', `${prodName} - ${formattedPrice} | ${brand}`);
    
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', cleanDesc);

    const shareUrl = getProductShareUrl(product.id, settings.liveSiteUrl);
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', shareUrl);

    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', resolveImageUrl(product.images?.[0]));

    // 4. Schema.org Product JSON-LD Injection
    const scriptId = 'product-json-ld';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const schemaData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.nameBn,
      "alternateName": product.nameEn,
      "image": (product.images || []).map(resolveImageUrl),
      "description": product.descriptionBn,
      "sku": product.id,
      "brand": {
        "@type": "Brand",
        "name": settings.brandNameBn
      },
      "offers": {
        "@type": "Offer",
        "url": shareUrl,
        "priceCurrency": "BDT",
        "price": unitPrice,
        "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition",
        "seller": {
          "@type": "Organization",
          "name": settings.brandNameBn
        }
      }
    };
    scriptTag.text = JSON.stringify(schemaData);

    return () => {
      // Cleanup script on unmount
      const existing = document.getElementById(scriptId);
      if (existing) existing.remove();
    };
  }, [product, selectedWeight, lang, settings]);

  // Track scroll position for sticky bottom bar
  useEffect(() => {
    const handleScroll = () => {
      if (!ctaSectionRef.current) return;
      const rect = ctaSectionRef.current.getBoundingClientRect();
      // If the desktop CTA has scrolled off the viewport top, show sticky bottom bar
      if (rect.bottom < 100) {
        setShowStickyBottom(true);
      } else {
        setShowStickyBottom(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Weight options list with intelligent pack detection
  const weightOptionsList = useMemo(() => {
    return getProductWeightOptions(product);
  }, [product]);

  // Dynamic pricing
  const currentUnitPrice = calculateItemPrice(product.price, selectedWeight, product.unitBn);
  const currentPreviousPrice = calculateItemPrice(product.previousPrice, selectedWeight, product.unitBn);
  const discountPercent = calculateDiscount(currentUnitPrice, currentPreviousPrice);
  const totalAmount = currentUnitPrice * quantity;
  const savingsAmount = currentPreviousPrice > currentUnitPrice ? (currentPreviousPrice - currentUnitPrice) * quantity : 0;

  const gallery = product.images && product.images.length > 0 ? product.images : [selectedImage];
  const shareLinks = createSocialShareUrls(product, lang, settings.liveSiteUrl);

  // Zoom handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((touch.clientX - rect.left) / rect.width) * 100;
      const y = ((touch.clientY - rect.top) / rect.height) * 100;
      setZoomPos({
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      });
    }
  };

  // WhatsApp order URL
  const whatsappOrderUrl = createWhatsAppProductUrl(
    settings.whatsapp,
    lang === 'bn' ? `${product.nameBn} (${formatWeightLabel(selectedWeight, lang)})` : `${product.nameEn} (${selectedWeight})`,
    totalAmount,
    quantity
  );

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedWeight);
    playAddToCartSound();
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleOrderNow = () => {
    onOrderNow(product, quantity, selectedWeight);
  };

  const handleCopyLink = async () => {
    const url = getProductShareUrl(product.id, settings.liveSiteUrl);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: lang === 'bn' ? product.nameBn : product.nameEn,
          text: shareLinks.textMsg,
          url: shareLinks.shareUrl
        });
      } catch (err) {
        // User cancelled or not supported
      }
    } else {
      handleCopyLink();
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewerComment.trim()) return;

    if (onAddReview) {
      setSubmittingReview(true);
      const success = await onAddReview({
        name: reviewerName.trim(),
        rating: reviewerRating,
        comment: reviewerComment.trim(),
        district: reviewerDistrict,
        productName: lang === 'bn' ? product.nameBn : (product.nameEn || product.nameBn),
        verifiedPurchase: true
      });
      setSubmittingReview(false);
      if (success) {
        setReviewSuccessMsg(lang === 'bn' ? 'আপনার মূল্যবান রিভিউ সফলভাবে জমা হয়েছে!' : 'Your review has been submitted successfully!');
        setReviewerName('');
        setReviewerComment('');
        setTimeout(() => setReviewSuccessMsg(''), 4000);
      }
    }
  };

  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && (p.category === product.category || p.featured))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 sm:pb-16 text-gray-800">
      
      {/* 1. Landing Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E2D8] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Back to Store Button */}
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-[#133E2B] hover:text-[#2D6A4F] bg-white px-3 sm:px-4 py-2 rounded-xl border border-[#DDD5C7] shadow-xs transition-all hover:bg-[#F2EDE4] active:scale-95 shrink-0"
            title={lang === 'bn' ? 'দোকানে ফিরে যান' : 'Back to Store'}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">{lang === 'bn' ? 'সকল পণ্য' : 'All Products'}</span>
          </button>

          {/* Centered Brand Logo */}
          <button
            onClick={onBackToHome}
            className="text-center focus:outline-none shrink-0"
            aria-label="Amar Ghor Home"
          >
            <BrandLogo size="md" logoUrl={settings.logoUrl} mode={settings.logoDisplayMode} />
          </button>

          {/* Right Action: WhatsApp hotline & Cart */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href={`https://wa.me/88${settings.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playWhatsAppPingSound()}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#EAF7EE] text-[#133E2B] hover:bg-[#D5EEDB] rounded-xl border border-[#25D366]/30 text-xs font-bold transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>{settings.whatsapp}</span>
            </a>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 sm:p-2.5 bg-[#133E2B] hover:bg-[#1B4332] active:scale-95 text-white rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-[#2D6A4F]/30"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#E8C547]" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#D4AF37] text-[#133E2B] text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#FAF8F5] shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* 2. Breadcrumb bar */}
      <div className="bg-[#F2EDE4]/60 border-b border-[#E8E2D8] py-2.5 px-4 sm:px-6 lg:px-8 text-xs text-gray-600">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 flex-wrap">
          <button onClick={onBackToHome} className="hover:text-[#133E2B] transition-colors font-medium">
            {lang === 'bn' ? 'হোম' : 'Home'}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <button onClick={onBackToHome} className="hover:text-[#133E2B] transition-colors font-medium">
            {lang === 'bn' ? product.categoryBn : product.categoryEn}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[#133E2B] font-bold truncate max-w-xs sm:max-w-md">
            {lang === 'bn' ? product.nameBn : product.nameEn}
          </span>
        </div>
      </div>

      {/* 3. Main Product Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-sm p-4 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* LEFT: Image Gallery with Interactive Zoom (Col 1-6) */}
            <div className="lg:col-span-6 space-y-4">
              <div
                className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#DDD5C7] cursor-crosshair group shadow-inner"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onTouchMove={handleTouchMove}
                onTouchStart={() => setIsZoomed(true)}
                onTouchEnd={() => setIsZoomed(false)}
              >
                {/* Regular image */}
                <img
                  src={resolveImageUrl(selectedImage)}
                  alt={product.nameBn}
                  className={`w-full h-full object-cover transition-opacity duration-200 ${
                    isZoomed ? 'opacity-0' : 'opacity-100'
                  }`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80';
                  }}
                />

                {/* 2.5x Magnifier Lens */}
                {isZoomed && (
                  <div
                    className="absolute inset-0 bg-no-repeat pointer-events-none transition-all duration-75"
                    style={{
                      backgroundImage: `url(${resolveImageUrl(selectedImage)})`,
                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      backgroundSize: '250%',
                    }}
                  />
                )}

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                  {discountPercent > 0 && (
                    <span className="bg-[#D4AF37] text-[#133E2B] font-black text-xs px-3 py-1 rounded-lg shadow-sm">
                      {lang === 'bn' ? `${toBnNumber(discountPercent)}% ছাড়` : `${discountPercent}% OFF`}
                    </span>
                  )}
                  {product.inStock ? (
                    <span className="bg-[#133E2B]/90 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-0.5 rounded-lg border border-[#2D6A4F] shadow-xs">
                      {lang === 'bn' ? 'স্টকে আছে' : 'In Stock'}
                    </span>
                  ) : (
                    <span className="bg-red-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-lg shadow-xs">
                      {lang === 'bn' ? 'স্টক শেষ' : 'Out of Stock'}
                    </span>
                  )}
                </div>

                {/* Bottom Zoom hint badge */}
                <div
                  className={`absolute bottom-3 right-3 bg-black/70 backdrop-blur-xs text-white px-3 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-200 pointer-events-none z-10 ${
                    isZoomed ? 'opacity-0 scale-95' : 'opacity-90 group-hover:opacity-100'
                  }`}
                >
                  <ZoomIn className="w-3.5 h-3.5 text-[#E8C547]" />
                  <span>{lang === 'bn' ? 'জুম করতে মাউস রাখুন' : 'Hover to zoom'}</span>
                </div>

                {/* Magnifier Active Badge */}
                {isZoomed && (
                  <div className="absolute top-3 right-3 bg-[#133E2B]/90 text-[#E8C547] border border-[#2D6A4F] px-2.5 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1.5 pointer-events-none z-10 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#E8C547] animate-pulse" />
                    <span>{lang === 'bn' ? '২.৫x ম্যাগনিফায়ার' : '2.5x Zoom'}</span>
                  </div>
                )}
              </div>

              {/* Thumbnail Selector */}
              {gallery.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedImage(img);
                        setIsZoomed(false);
                      }}
                      className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        selectedImage === img
                          ? 'border-[#2D6A4F] ring-2 ring-[#2D6A4F]/20 scale-102'
                          : 'border-[#DDD5C7] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={resolveImageUrl(img)} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* 4 Trust Feature Icons */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E8E2D8] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#133E2B] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900 leading-tight">
                      {lang === 'bn' ? '১০০% খাঁটি পণ্য' : '100% Pure & Authentic'}
                    </h5>
                    <p className="text-[10px] text-gray-500">
                      {lang === 'bn' ? 'সম্পূর্ণ নির্ভেজাল সংগ্রহ' : 'Direct from nature'}
                    </p>
                  </div>
                </div>

                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E8E2D8] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900 leading-tight">
                      {lang === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery'}
                    </h5>
                    <p className="text-[10px] text-gray-500">
                      {lang === 'bn' ? 'সারা বাংলাদেশে দ্রুত ডেলিভারি' : 'All Bangladesh delivery'}
                    </p>
                  </div>
                </div>

                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E8E2D8] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4 text-blue-700" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900 leading-tight">
                      {lang === 'bn' ? '৭ দিনের রিপ্লেসমেন্ট' : '7 Days Replacement'}
                    </h5>
                    <p className="text-[10px] text-gray-500">
                      {lang === 'bn' ? 'সহজ পরিবর্তন সুবিধা' : 'Easy return guarantee'}
                    </p>
                  </div>
                </div>

                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E8E2D8] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                    <Headphones className="w-4 h-4 text-purple-700" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900 leading-tight">
                      {lang === 'bn' ? 'সহায়তা হটলাইন' : 'Customer Hotline'}
                    </h5>
                    <p className="text-[10px] text-gray-500">
                      {settings.phone || '01783084897'}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT: Product Buy Box & Details (Col 7-12) */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              
              {/* Product Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-[#EAF2EC] text-[#133E2B] px-3 py-1 rounded-full text-xs font-bold border border-[#2D6A4F]/20">
                    {lang === 'bn' ? product.categoryBn : product.categoryEn}
                  </span>
                  <span className="text-xs text-gray-500 bg-[#FAF8F5] px-2.5 py-1 rounded-full border border-[#DDD5C7]">
                    {lang === 'bn' ? product.unitBn : product.unit}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold ml-auto bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>4.9 / 5</span>
                    <span className="text-gray-400 font-normal">
                      ({lang === 'bn' ? '৪৮+ রিভিউ' : '48+ reviews'})
                    </span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#133E2B] tracking-tight leading-snug">
                  {lang === 'bn' ? product.nameBn : product.nameEn}
                </h1>
                
                {product.nameEn && (
                  <p className="text-sm text-gray-500 font-medium">
                    {product.nameEn}
                  </p>
                )}
              </div>

              {/* Price Banner */}
              <div className="bg-[#FAF8F5] rounded-3xl p-5 border-2 border-[#E8E2D8] flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-0.5">
                    {lang === 'bn' ? 'বিশেষ অফার মূল্য' : 'Special Offer Price'}
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-[#133E2B]">
                      {formatPrice(totalAmount, lang)}
                    </span>
                    {currentPreviousPrice > currentUnitPrice && (
                      <span className="text-base sm:text-lg text-gray-400 line-through">
                        {formatPrice(currentPreviousPrice * quantity, lang)}
                      </span>
                    )}
                  </div>
                </div>

                {savingsAmount > 0 && (
                  <div className="bg-[#E8C547]/20 border border-[#D4AF37] px-3.5 py-1.5 rounded-2xl text-right">
                    <span className="text-[10px] text-gray-600 block uppercase font-bold">
                      {lang === 'bn' ? 'আপনার সাশ্রয়' : 'You Save'}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-[#133E2B]">
                      {formatPrice(savingsAmount, lang)}
                    </span>
                  </div>
                )}
              </div>

              {/* Weight / Pack Variant Selector */}
              {isWeightBased && weightOptionsList.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-800">
                      {lang === 'bn' ? 'প্যাকেজিং বা সাইজ নির্বাচন করুন:' : 'Select Packaging / Weight:'}
                    </span>
                    <span className="text-gray-500 text-[11px]">
                      {formatWeightLabel(selectedWeight, lang)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {weightOptionsList.map((opt) => {
                      const isSelected = selectedWeight === opt;
                      const optPrice = calculateItemPrice(product.price, opt, product.unitBn);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedWeight(opt)}
                          className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#133E2B] bg-[#EAF2EC] text-[#133E2B] shadow-xs scale-102 ring-1 ring-[#133E2B]'
                              : 'border-[#DDD5C7] bg-[#FAF8F5] text-gray-700 hover:border-[#133E2B] hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{formatWeightLabel(opt, lang)}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#133E2B]" />}
                          </div>
                          <span className="text-xs font-black text-[#133E2B] mt-1">
                            {formatPrice(optPrice, lang)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-800 block">
                  {lang === 'bn' ? 'পরিমাণ (Quantity):' : 'Quantity:'}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border-2 border-[#DDD5C7] rounded-2xl bg-white p-1">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 rounded-xl hover:bg-[#FAF8F5] flex items-center justify-center text-gray-600 disabled:opacity-30 cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-black text-sm text-[#133E2B]">
                      {lang === 'bn' ? toBnNumber(quantity) : quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-10 h-10 rounded-xl hover:bg-[#FAF8F5] flex items-center justify-center text-gray-600 cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-gray-500">
                    <span>
                      {lang === 'bn' ? 'সর্বমোট প্রদেয়:' : 'Total Payable:'}{' '}
                    </span>
                    <span className="font-extrabold text-[#133E2B]">
                      {formatPrice(totalAmount, lang)}
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div ref={ctaSectionRef} className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Order Now (Direct Checkout) */}
                  <button
                    onClick={handleOrderNow}
                    disabled={!product.inStock}
                    className="w-full py-4 px-6 bg-[#133E2B] hover:bg-[#1B4332] active:scale-98 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-5 h-5 text-[#E8C547] fill-current" />
                    <span>{lang === 'bn' ? 'এখনই অর্ডার করুন' : 'Order Now'}</span>
                  </button>

                  {/* Add to Cart */}
                  <button
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    className="w-full py-4 px-6 bg-[#FAF8F5] hover:bg-[#EAF2EC] text-[#133E2B] border-2 border-[#133E2B] font-extrabold text-sm sm:text-base rounded-2xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    {addedToast ? (
                      <>
                        <Check className="w-5 h-5 text-emerald-600" />
                        <span className="text-emerald-700">
                          {lang === 'bn' ? 'কার্টে যুক্ত হয়েছে!' : 'Added to Cart!'}
                        </span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 text-[#133E2B]" />
                        <span>{lang === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart'}</span>
                      </>
                    )}
                  </button>

                </div>

                {/* Direct WhatsApp Order */}
                <a
                  href={whatsappOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => playWhatsAppPingSound()}
                  className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#1EBE5D] active:scale-98 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-xs"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>
                    {lang === 'bn' ? 'হোয়াটসঅ্যাপে সরাসরি অর্ডার করুন' : 'Order Directly on WhatsApp'}
                  </span>
                </a>
              </div>

              {/* 5. SHARE THIS PRODUCT LANDING PAGE SECTION */}
              <div className="bg-[#FAF8F5] rounded-3xl p-5 border border-[#DDD5C7] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#133E2B]" />
                    <span className="font-bold text-xs sm:text-sm text-gray-900">
                      {lang === 'bn' ? 'এই প্রোডাক্টের ল্যান্ডিং পেইজ শেয়ার করুন' : 'Share Product Landing Page'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {lang === 'bn' ? 'কপি বা সোশ্যাল শেয়ার' : 'Copy or Social Share'}
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {lang === 'bn'
                    ? 'যেকোনো প্ল্যাটফর্মে (ফেসবুক পোস্ট, মেসেঞ্জার, হোয়াটসঅ্যাপ) সরাসরি এই পেইজের লিংক শেয়ার করুন। গ্রাহক সরাসরি এখানে এসে অর্ডার করতে পারবেন।'
                    : 'Share this direct landing link anywhere. Customers will land directly on this product page to order.'}
                </p>

                {/* Share Link Row with Copy Button */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-[#DDD5C7] px-3 py-2 rounded-xl text-xs font-mono text-gray-600 truncate select-all">
                    {getProductShareUrl(product.id, settings.liveSiteUrl)}
                  </div>

                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      copiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#133E2B] text-white hover:bg-[#1B4332]'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#E8C547]" />
                        <span>{lang === 'bn' ? 'লিংক কপি' : 'Copy Link'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Social Share Buttons */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {/* WhatsApp */}
                  <a
                    href={shareLinks.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[120px] py-2 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>WhatsApp</span>
                  </a>

                  {/* Facebook */}
                  <a
                    href={shareLinks.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[120px] py-2 px-3 bg-[#1877F2] hover:bg-[#0C63D4] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Facebook</span>
                  </a>

                  {/* Native Device Share */}
                  <button
                    onClick={handleNativeShare}
                    className="py-2 px-3 bg-white hover:bg-gray-50 border border-[#DDD5C7] text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title={lang === 'bn' ? 'মোবাইলে শেয়ার করুন' : 'Share via device apps'}
                  >
                    <Share2 className="w-3.5 h-3.5 text-gray-600" />
                    <span>{lang === 'bn' ? 'অন্যান্য' : 'More'}</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* 6. Tabs Section: Description, Benefits, Storage, Shipping */}
          <div className="mt-12 sm:mt-16 pt-8 border-t border-[#E8E2D8]">
            
            {/* Tab Headers */}
            <div className="flex border-b border-[#E8E2D8] overflow-x-auto gap-2 sm:gap-4 no-scrollbar">
              <button
                onClick={() => setActiveTab('desc')}
                className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'desc'
                    ? 'border-[#133E2B] text-[#133E2B] bg-[#FAF8F5] rounded-t-xl'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {lang === 'bn' ? 'পণ্যের বিবরণ' : 'Product Description'}
              </button>

              <button
                onClick={() => setActiveTab('benefits')}
                className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'benefits'
                    ? 'border-[#133E2B] text-[#133E2B] bg-[#FAF8F5] rounded-t-xl'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {lang === 'bn' ? 'উপকারিতা ও বৈশিষ্ট্য' : 'Benefits & Features'}
              </button>

              <button
                onClick={() => setActiveTab('storage')}
                className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'storage'
                    ? 'border-[#133E2B] text-[#133E2B] bg-[#FAF8F5] rounded-t-xl'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {lang === 'bn' ? 'সংরক্ষণ পদ্ধতি' : 'Storage Instructions'}
              </button>

              <button
                onClick={() => setActiveTab('shipping')}
                className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'shipping'
                    ? 'border-[#133E2B] text-[#133E2B] bg-[#FAF8F5] rounded-t-xl'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {lang === 'bn' ? 'ডেলিভারি ও পেমেন্ট' : 'Delivery & Policy'}
              </button>
            </div>

            {/* Tab Contents */}
            <div className="py-6 sm:py-8 leading-relaxed text-gray-700 text-sm sm:text-base">
              
              {/* Description */}
              {activeTab === 'desc' && (
                <div className="space-y-4 max-w-4xl animate-in fade-in duration-200">
                  <p className="whitespace-pre-line text-gray-800">
                    {lang === 'bn' ? product.descriptionBn : (product.descriptionEn || product.descriptionBn)}
                  </p>
                  <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E2D8] mt-4 space-y-2">
                    <h4 className="font-bold text-[#133E2B] text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                      <span>{lang === 'bn' ? 'আমার ঘর অনলাইনের প্রতিশ্রুতি:' : 'Our Commitment:'}</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {lang === 'bn'
                        ? 'আমরা কোনো রাসায়নিক বা ক্ষতিকারক প্রিজারভেটিভ ব্যবহার করি না। প্রতিটি পণ্য সংগ্রহের উৎস থেকে আপনার খাবার টেবিল পর্যন্ত সর্বোচ্চ বিশুদ্ধতা বজায় রাখা হয়।'
                        : 'We never compromise on purity. No chemicals or artificial preservatives are ever used.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Benefits */}
              {activeTab === 'benefits' && (
                <div className="space-y-4 max-w-4xl animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D8] space-y-1">
                      <h4 className="font-bold text-[#133E2B] text-sm">
                        {lang === 'bn' ? '🌿 প্রাকৃতিক পুষ্টির উৎস' : '🌿 Natural Nutrition'}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {lang === 'bn'
                          ? 'ভিটামিন, খনিজ এবং রোগ প্রতিরোধ ক্ষমতা বৃদ্ধিকারী অ্যান্টিঅক্সিডেন্টে ভরপুর।'
                          : 'Rich in essential nutrients, vitamins, and immune-boosting antioxidants.'}
                      </p>
                    </div>

                    <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D8] space-y-1">
                      <h4 className="font-bold text-[#133E2B] text-sm">
                        {lang === 'bn' ? '🛡️ নির্ভেজাল মানের নিশ্চয়তা' : '🛡️ Authentic Quality'}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {lang === 'bn'
                          ? 'সরাসরি গ্রাম ও প্রাকৃতিক খামার থেকে সংগৃহীত, কোনো মধ্যস্বত্বভোগী বা ভেজাল নেই।'
                          : 'Collected directly from verified natural origins with zero adulteration.'}
                      </p>
                    </div>

                    <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D8] space-y-1">
                      <h4 className="font-bold text-[#133E2B] text-sm">
                        {lang === 'bn' ? '👨‍👩‍👧‍👦 পরিবারের সবার জন্য নিরাপদ' : '👨‍👩‍👧‍👦 Safe for Family'}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {lang === 'bn'
                          ? 'শিশু ও বয়োবৃদ্ধদের প্রতিদিনের পুষ্টি চাহিদার জন্য সম্পূর্ণ স্বাস্থ্যসম্মত।'
                          : 'Safe and wholesome for all ages from kids to elders.'}
                      </p>
                    </div>

                    <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D8] space-y-1">
                      <h4 className="font-bold text-[#133E2B] text-sm">
                        {lang === 'bn' ? '🍯 খাঁটি ঘ্রাণ ও আসল স্বাদ' : '🍯 Authentic Aroma & Taste'}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {lang === 'bn'
                          ? 'প্রাকৃতিক স্বাদ ও ঐতিহ্যবাহী প্রক্রিয়ায় প্রস্তুতকৃত খাঁটি পণ্যের তৃপ্তি।'
                          : 'Enjoy genuine natural aroma and rich authentic flavor in every bite.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Storage */}
              {activeTab === 'storage' && (
                <div className="space-y-4 max-w-4xl animate-in fade-in duration-200">
                  <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E2D8] space-y-3">
                    <h4 className="font-bold text-[#133E2B] text-sm sm:text-base flex items-center gap-2">
                      <Info className="w-4 h-4 text-[#2D6A4F]" />
                      <span>{lang === 'bn' ? 'সঠিক সংরক্ষণ নির্দেশিকা:' : 'Proper Storage Guidelines:'}</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      {product.storageBn || product.storageEn || (lang === 'bn' ? 'শুকনো ও শীতল জায়গায় ঢাকনা শক্ত করে রাখুন। সরাসরি সূর্যালোক ও আর্দ্রতা থেকে দূরে রাখুন।' : 'Store in a cool and dry place away from direct sunlight.')}
                    </p>
                  </div>
                </div>
              )}

              {/* Shipping */}
              {activeTab === 'shipping' && (
                <div className="space-y-4 max-w-4xl animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D8] space-y-1.5">
                      <h4 className="font-bold text-[#133E2B] text-sm">
                        {lang === 'bn' ? '🚚 ঢাকা সিটির ভেতরে ডেলিভারি' : 'Inside Dhaka Delivery'}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {lang === 'bn'
                          ? '২৪ থেকে ৪৮ ঘণ্টার মধ্যে ক্যাশ অন ডেলিভারিতে হোম ডেলিভারি পৌঁছে দেওয়া হয়।'
                          : 'Delivered to your doorstep within 24 to 48 hours.'}
                      </p>
                    </div>

                    <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D8] space-y-1.5">
                      <h4 className="font-bold text-[#133E2B] text-sm">
                        {lang === 'bn' ? '📦 সারা বাংলাদেশে হোম ডেলিভারি' : 'Outside Dhaka Delivery'}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {lang === 'bn'
                          ? 'রেডএক্স / স্টেডফাস্ট কুরিয়ারের মাধ্যমে ২ থেকে ৩ কার্যদিবসে ডেলিভারি সম্পন্ন হয়।'
                          : 'Delivered securely across all 64 districts in 2-3 working days.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs sm:text-sm text-emerald-900">
                    <strong>{lang === 'bn' ? 'পণ্য দেখে মূল্য পরিশোধের সুযোগ:' : 'Check Product Before Payment:'}</strong>{' '}
                    {lang === 'bn'
                      ? 'ডেলিভারি ম্যানের সামনে প্যাকেট খুলে পণ্য যাচাই করে সম্পূর্ণ সন্তুষ্ট হয়ে ক্যাশ অন ডেলিভারিতে মূল্য পরিশোধ করুন।'
                      : 'You can check your parcel in front of the delivery agent and pay with confidence.'}
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* 7. Reviews Section */}
          <div className="mt-12 pt-8 border-t border-[#E8E2D8]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#133E2B]">
                  {lang === 'bn' ? 'কাস্টমার রিভিউ ও রেটিং' : 'Customer Reviews & Ratings'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'bn' ? 'সরাসরি যাচাইকৃত গ্রাহকদের সন্তুষ্টির অভিজ্ঞতা' : 'Feedback from verified buyers'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <span className="font-black text-[#133E2B] text-base">4.9 / 5.0</span>
              </div>
            </div>

            {/* Write a review form */}
            {onAddReview && (
              <form onSubmit={handleReviewSubmit} className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E2D8] mb-8 space-y-3">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  {lang === 'bn' ? 'আপনার অভিজ্ঞতা ও রিভিউ জানান' : 'Write a Review'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder={lang === 'bn' ? 'আপনার নাম' : 'Your name'}
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="p-2.5 text-xs bg-white border border-[#DDD5C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#133E2B]"
                  />

                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'আপনার জেলা / এলাকা' : 'District'}
                    value={reviewerDistrict}
                    onChange={(e) => setReviewerDistrict(e.target.value)}
                    className="p-2.5 text-xs bg-white border border-[#DDD5C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#133E2B]"
                  />

                  <div className="flex items-center gap-2 bg-white border border-[#DDD5C7] rounded-xl px-3 py-2">
                    <span className="text-xs font-semibold text-gray-600">{lang === 'bn' ? 'রেটিং:' : 'Rating:'}</span>
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewerRating(star)}
                          className="p-0.5 hover:scale-110 transition-transform"
                        >
                          <Star className={`w-4 h-4 ${star <= reviewerRating ? 'fill-current text-amber-500' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <textarea
                  required
                  rows={2}
                  placeholder={lang === 'bn' ? 'পণ্যটি সম্পর্কে আপনার অনুভূতি বা অভিজ্ঞতা লিখুন...' : 'Write your review here...'}
                  value={reviewerComment}
                  onChange={(e) => setReviewerComment(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-[#DDD5C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#133E2B]"
                />

                <div className="flex items-center justify-between">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2.5 bg-[#133E2B] text-white text-xs font-bold rounded-xl hover:bg-[#1B4332] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {submittingReview ? (lang === 'bn' ? 'জমা হচ্ছে...' : 'Submitting...') : (lang === 'bn' ? 'রিভিউ সাবমিট করুন' : 'Submit Review')}
                  </button>

                  {reviewSuccessMsg && (
                    <span className="text-xs text-emerald-700 font-bold animate-in fade-in">
                      {reviewSuccessMsg}
                    </span>
                  )}
                </div>
              </form>
            )}

            {/* Reviews display list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(reviews.length > 0 ? reviews.slice(0, 4) : [
                {
                  id: 'rev-def-1',
                  customerName: 'মাসুদুর রহমান',
                  district: 'মিরপুর, ঢাকা',
                  rating: 5,
                  comment: 'মাশাআল্লাহ পণ্যের কোয়ালিটি সত্যিই অসাধারণ। প্যাকেজিং খুব ভালো ছিল এবং সময়মতো ডেলিভারি পেয়েছি।'
                },
                {
                  id: 'rev-def-2',
                  customerName: 'ডা. তানিয়া আফরোজ',
                  district: 'ধানমন্ডি, ঢাকা',
                  rating: 5,
                  comment: 'আমার ঘর Online এর সততা মুগ্ধ করার মতো। খাঁটি জিনিস সবসময় এদের কাছেই পাই।'
                }
              ]).map((rev: any, idx: number) => (
                <div key={rev.id || idx} className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D8] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-gray-900">{rev.name || rev.customerName}</h5>
                      <span className="text-[11px] text-gray-500">{rev.district || 'ঢাকা'}</span>
                    </div>
                    <div className="flex text-amber-500">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>

          </div>

          {/* 8. Related Products Showcase */}
          {relatedProducts.length > 0 && (
            <div className="mt-14 pt-8 border-t border-[#E8E2D8]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#133E2B]">
                    {lang === 'bn' ? 'সম্পর্কিত আরও আকর্ষণীয় পণ্য' : 'Related Products You May Like'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {lang === 'bn' ? 'একই সাথে অর্ডার করে ডেলিভারি চার্জ বাঁচান' : 'Combine orders to save on delivery'}
                  </p>
                </div>

                <button
                  onClick={onBackToHome}
                  className="text-xs font-bold text-[#133E2B] hover:text-[#2D6A4F] flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>{lang === 'bn' ? 'সব পণ্য দেখুন' : 'View all'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {relatedProducts.map((rel) => {
                  const relPrice = rel.price;
                  return (
                    <div
                      key={rel.id}
                      onClick={() => onSelectProduct(rel)}
                      className="group bg-[#FAF8F5] hover:bg-white rounded-2xl border border-[#E8E2D8] hover:border-[#133E2B] p-3 transition-all cursor-pointer flex flex-col justify-between card-hover-shadow"
                    >
                      <div className="aspect-square w-full rounded-xl overflow-hidden bg-gray-100 mb-2.5">
                        <img
                          src={resolveImageUrl(rel.images?.[0])}
                          alt={rel.nameBn}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-[#2D6A4F] font-bold block">
                          {lang === 'bn' ? rel.categoryBn : rel.categoryEn}
                        </span>
                        <h4 className="font-bold text-xs text-gray-900 line-clamp-1 group-hover:text-[#133E2B]">
                          {lang === 'bn' ? rel.nameBn : rel.nameEn}
                        </h4>
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="font-black text-xs text-[#133E2B]">
                            {formatPrice(relPrice, lang)}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {lang === 'bn' ? rel.unitBn : rel.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 9. Mobile Sticky Bottom Order & Share Bar */}
      {showStickyBottom && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-[#DDD5C7] p-3 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={resolveImageUrl(selectedImage)}
                alt={product.nameBn}
                className="w-10 h-10 rounded-xl object-cover border border-[#DDD5C7] shrink-0"
              />
              <div className="min-w-0">
                <h5 className="font-bold text-xs text-gray-900 truncate">
                  {lang === 'bn' ? product.nameBn : product.nameEn}
                </h5>
                <span className="text-sm font-black text-[#133E2B]">
                  {formatPrice(totalAmount, lang)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyLink}
                className="p-2.5 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-gray-700"
                title="লিংক কপি করুন"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={handleOrderNow}
                className="px-4 py-2.5 bg-[#133E2B] text-white text-xs font-bold rounded-xl shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4 text-[#E8C547] fill-current" />
                <span>{lang === 'bn' ? 'অর্ডার করুন' : 'Order'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
