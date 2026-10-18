import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ShoppingBag, Search, Phone, Menu, X, ShieldCheck, HeartHandshake, Lock, Type, ArrowRight, Sparkles } from 'lucide-react';
import { Language, SiteSettings, Product } from '../types';
import { BrandLogo } from './BrandLogo';
import { formatPrice, toBnNumber, matchProductSearch } from '../utils/formatters';

interface HeaderProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  settings: SiteSettings;
  currentFont: 'hind' | 'noto' | 'anek' | 'tiro';
  onFontChange: (font: 'hind' | 'noto' | 'anek' | 'tiro') => void;
  products?: Product[];
  onSelectProduct?: (p: Product) => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onLanguageChange,
  cartCount,
  onOpenCart,
  onOpenAdmin,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  settings,
  currentFont,
  onFontChange,
  products = [],
  onSelectProduct
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const quickSearches = ['মধু', 'ঘি', 'সরিষার তেল', 'হানি নাটস', 'খেজুর', 'নারিকেল তেল', 'আমসত্ত্ব', 'হোম ডেকোর'];

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return (products || []).filter((p) => matchProductSearch(p, searchQuery));
  }, [products, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(event.target as Node)) {
        setDesktopSearchOpen(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        // keep mobile search open if user clicks inside
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProductClick = (product: Product) => {
    setDesktopSearchOpen(false);
    setSearchOpen(false);
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      onTabChange('home');
      setTimeout(() => {
        document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleViewAllResults = () => {
    setDesktopSearchOpen(false);
    setSearchOpen(false);
    onTabChange('home');
    setTimeout(() => {
      const el = document.getElementById('catalog-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const navLinks = [
    { id: 'home', labelBn: 'হোম', labelEn: 'Home' },
    { id: 'shop', labelBn: 'সকল পণ্য', labelEn: 'Shop All' },
    { id: 'food', labelBn: 'খাঁটি খাবার', labelEn: 'Authentic Food' },
    { id: 'decor', labelBn: 'হোম ডেকোর', labelEn: 'Home Decor' },
    { id: 'about', labelBn: 'আমাদের সম্পর্কে', labelEn: 'About Us' },
    { id: 'contact', labelBn: 'যোগাযোগ', labelEn: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E2D8] shadow-xs">
      {/* 1. Announcement Bar */}
      {settings.features?.showAnnouncement !== false && (
        <div className="bg-[#133E2B] text-emerald-50 text-xs py-1.5 px-4 font-medium transition-colors">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 truncate">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8C547] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E8C547]"></span>
              </span>
              <span className="truncate">
                {lang === 'bn' ? settings.announcementBn : settings.announcementEn}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs shrink-0">
              <a
                href={`tel:+88${settings.phone}`}
                className="flex items-center gap-1.5 hover:text-[#E8C547] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#E8C547]" />
                <span>{settings.phone}</span>
              </a>
              <span className="text-emerald-500">|</span>
              <a
                href={`https://wa.me/88${settings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#E8C547] transition-colors font-medium flex items-center gap-1"
              >
                <span className="text-[#25D366]">WhatsApp:</span> {settings.whatsapp}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo */}
          <button
            onClick={() => onTabChange('home')}
            className="text-left focus:outline-none"
            aria-label="Amar Ghor Home"
          >
            <BrandLogo size="md" logoUrl={settings.logoUrl} mode={settings.logoDisplayMode} />
          </button>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onTabChange(link.id)}
                  className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    isActive
                      ? 'text-[#133E2B] bg-[#E8EFE9] shadow-xs'
                      : 'text-gray-700 hover:text-[#133E2B] hover:bg-[#F2EDE4]'
                  }`}
                >
                  {lang === 'bn' ? link.labelBn : link.labelEn}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons: Search, Language Switcher, Cart, Admin */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Input on Desktop with Live Results Dropdown */}
            {settings.features?.showSearchBar !== false && (
              <div className="hidden md:flex relative items-center" ref={desktopSearchRef}>
                <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'পণ্য খুঁজুন (মধু, ঘি, তেল...)' : 'Search products...'}
                  value={searchQuery}
                  onFocus={() => setDesktopSearchOpen(true)}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                    setDesktopSearchOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleViewAllResults();
                    }
                  }}
                  className="w-48 lg:w-64 pl-9 pr-7 py-2 text-xs bg-white border border-[#DDD5C7] rounded-full focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent transition-all shadow-xs"
                />
                {searchQuery ? (
                  <button
                    onClick={() => {
                      onSearchChange('');
                    }}
                    className="absolute right-2.5 text-xs text-gray-400 hover:text-gray-700 w-4 h-4 flex items-center justify-center font-bold"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                ) : null}

                {/* Desktop Live Results Popover */}
                {desktopSearchOpen && (searchQuery.trim().length > 0 || quickSearches.length > 0) && (
                  <div className="absolute right-0 top-full mt-2 w-80 lg:w-[420px] bg-white rounded-2xl shadow-2xl border border-[#E8E2D8] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3 bg-[#FAF8F5] border-b border-[#E8E2D8] flex items-center justify-between text-xs text-gray-600 font-semibold">
                      <span>
                        {searchQuery.trim()
                          ? lang === 'bn'
                            ? `"${searchQuery}" এর জন্য ${searchResults.length}টি ফলাফল`
                            : `Found ${searchResults.length} results for "${searchQuery}"`
                          : lang === 'bn'
                          ? 'জনপ্রিয় সার্চসমূহ'
                          : 'Popular Searches'}
                      </span>
                      {searchResults.length > 0 && searchQuery.trim() && (
                        <button
                          onClick={handleViewAllResults}
                          className="text-[#2D6A4F] hover:underline flex items-center gap-1 font-bold text-[11px]"
                        >
                          <span>{lang === 'bn' ? 'সব দেখুন' : 'View all'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Quick suggestion tags if query is empty or 0 results */}
                    {(!searchQuery.trim() || searchResults.length === 0) && (
                      <div className="p-3.5 bg-white border-b border-[#E8E2D8]/60 space-y-2">
                        <p className="text-[11px] font-semibold text-gray-500">
                          {lang === 'bn' ? 'ক্লিক করে সরাসরি খুঁজুন:' : 'Click to quickly search:'}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {quickSearches.map((term) => (
                            <button
                              key={term}
                              type="button"
                              onClick={() => {
                                onSearchChange(term);
                                setDesktopSearchOpen(true);
                              }}
                              className="text-xs px-2.5 py-1 bg-[#FAF8F5] hover:bg-[#EAF2EC] text-[#133E2B] rounded-lg border border-[#E8E2D8] font-medium transition-colors"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search Results List */}
                    {searchQuery.trim() && (
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                        {searchResults.length === 0 ? (
                          <div className="p-6 text-center space-y-2">
                            <Search className="w-8 h-8 text-gray-300 mx-auto" />
                            <p className="text-xs font-bold text-gray-700">
                              {lang === 'bn' ? 'কোনো পণ্য খুঁজে পাওয়া যায়নি' : 'No products found'}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {lang === 'bn'
                                ? 'দয়া করে সঠিক বানানে লিখুন বা উপরের কিওয়ার্ডগুলো থেকে বাছাই করুন।'
                                : 'Please check spelling or choose from above keywords.'}
                            </p>
                          </div>
                        ) : (
                          searchResults.slice(0, 6).map((product) => (
                            <div
                              key={product.id}
                              onClick={() => handleProductClick(product)}
                              className="p-3 hover:bg-[#FAF8F5] transition-colors flex items-center gap-3 cursor-pointer group"
                            >
                              <img
                                src={product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                                alt={product.nameBn}
                                className="w-12 h-12 object-cover rounded-xl border border-gray-100 shrink-0 group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-[#2D6A4F] transition-colors">
                                  {lang === 'bn' ? product.nameBn : product.nameEn}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-[#133E2B] bg-[#EAF2EC] px-1.5 py-0.5 rounded font-medium truncate">
                                    {lang === 'bn' ? product.categoryBn : product.category}
                                  </span>
                                  <span className="text-xs font-extrabold text-[#133E2B]">
                                    {formatPrice(product.price, lang)}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    /{lang === 'bn' ? product.unitBn || 'কেজি' : product.unit || 'kg'}
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-[#2D6A4F] bg-[#EAF2EC] group-hover:bg-[#133E2B] group-hover:text-white px-2.5 py-1 rounded-lg transition-colors shrink-0">
                                {lang === 'bn' ? 'দেখুন' : 'View'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {searchResults.length > 0 && searchQuery.trim() && (
                      <div className="p-2.5 bg-[#FAF8F5] border-t border-[#E8E2D8] text-center">
                        <button
                          type="button"
                          onClick={handleViewAllResults}
                          className="w-full py-2 bg-[#133E2B] hover:bg-[#1B4332] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                        >
                          {lang === 'bn'
                            ? `সব ${searchResults.length}টি পণ্য ক্যাটাগলগে দেখুন`
                            : `View all ${searchResults.length} products in catalog`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mobile Search Toggle */}
            {settings.features?.showSearchBar !== false && (
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-[#133E2B] rounded-lg"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Bengali Font Switcher Button */}
            {settings.features?.showFontSwitcher !== false && (
              <div className="relative">
                <button
                  onClick={() => setFontMenuOpen(!fontMenuOpen)}
                  className="p-1.5 sm:px-2 sm:py-1 text-xs font-bold rounded-lg border border-[#DDD5C7] bg-[#EBE5DA] hover:bg-[#DDD5C7] text-gray-800 flex items-center gap-1 transition-all"
                  title="বাংলা ফন্ট পরিবর্তন করুন"
                >
                  <Type className="w-3.5 h-3.5 text-[#133E2B]" />
                  <span className="hidden sm:inline text-[11px]">
                    {currentFont === 'noto' ? 'নোটো সান্স' : currentFont === 'anek' ? 'অনেকা বাংলা' : currentFont === 'tiro' ? 'তিরো বাংলা' : 'হিন্দ শিলিগুড়ি'}
                  </span>
                </button>

                {fontMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#DDD5C7] p-1.5 z-50 text-xs animate-in fade-in duration-150">
                    <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-100 mb-1">
                      বাংলা ফন্ট নির্বাচন করুন
                    </div>
                    {[
                      { id: 'hind', name: 'হিন্দ শিলিগুড়ি', sub: 'Hind Siliguri (ডিফল্ট)' },
                      { id: 'noto', name: 'নোটো সান্স বেঙ্গলি', sub: 'Noto Sans Bengali' },
                      { id: 'anek', name: 'অনেকা বাংলা', sub: 'Anek Bangla (মডার্ন)' },
                      { id: 'tiro', name: 'তিরো বাংলা', sub: 'Tiro Bangla (ঐতিহ্যবাহী)' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          onFontChange(f.id as any);
                          setFontMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex flex-col ${
                          currentFont === f.id
                            ? 'bg-[#133E2B] text-white font-bold'
                            : 'text-gray-800 hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <span className="text-xs">{f.name}</span>
                        <span className={`text-[10px] ${currentFont === f.id ? 'text-emerald-200' : 'text-gray-400'}`}>
                          {f.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Language Switcher */}
            {settings.features?.showLanguageSwitcher !== false && (
              <div className="flex items-center p-0.5 bg-[#EBE5DA] rounded-lg border border-[#DDD5C7]">
                <button
                  onClick={() => onLanguageChange('bn')}
                  className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
                    lang === 'bn'
                      ? 'bg-[#133E2B] text-white shadow-xs'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                  title="বাংলা নির্বাচন করুন"
                >
                  বাংলা
                </button>
                <button
                  onClick={() => onLanguageChange('en')}
                  className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
                    lang === 'en'
                      ? 'bg-[#133E2B] text-white shadow-xs'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                  title="Switch to English"
                >
                  ENG
                </button>
              </div>
            )}

            {/* Cart Trigger Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 bg-[#133E2B] text-white rounded-xl hover:bg-[#1B4332] active:scale-95 transition-all shadow-xs flex items-center justify-center"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#E8C547]" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#D4AF37] text-[#133E2B] text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#FAF8F5] shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Entry Button */}
            <button
              onClick={onOpenAdmin}
              className="p-2 sm:px-2.5 sm:py-1.5 text-gray-600 hover:text-[#133E2B] hover:bg-[#F2EDE4] rounded-lg transition-colors flex items-center gap-1 text-xs font-bold border border-transparent hover:border-[#DDD5C7]"
              title={lang === 'bn' ? 'অ্যাডমিন প্যানেল (Admin Login)' : 'Admin Panel'}
              aria-label="Admin Dashboard"
            >
              <Lock className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span className="hidden xl:inline text-[11px]">{lang === 'bn' ? 'অ্যাডমিন' : 'Admin'}</span>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-[#133E2B] rounded-lg"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Field dropdown */}
        {searchOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-[#E8E2D8]/80 animate-in slide-in-from-top-2 duration-150" ref={mobileSearchRef}>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'পণ্য খুঁজুন (মধু, ঘি, তেল...)' : 'Search products...'}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleViewAllResults();
                  }
                }}
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-white border border-[#DDD5C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] shadow-xs"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 text-sm font-bold w-5 h-5 flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>

            {/* Mobile Quick Tags */}
            <div className="flex flex-wrap gap-1.5 pt-2.5 pb-1">
              {quickSearches.slice(0, 6).map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onSearchChange(term)}
                  className="text-xs px-2.5 py-1 bg-white hover:bg-[#EAF2EC] text-[#133E2B] rounded-lg border border-[#DDD5C7] font-medium transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>

            {/* Mobile Live Results List */}
            {searchQuery.trim() && (
              <div className="mt-2.5 bg-white rounded-2xl border border-[#E8E2D8] overflow-hidden shadow-lg divide-y divide-gray-100">
                <div className="p-2.5 bg-[#FAF8F5] flex items-center justify-between text-xs text-gray-600 font-semibold">
                  <span>
                    {lang === 'bn'
                      ? `"${searchQuery}" এর জন্য ${searchResults.length}টি পণ্য`
                      : `${searchResults.length} results for "${searchQuery}"`}
                  </span>
                  {searchResults.length > 0 && (
                    <button
                      onClick={handleViewAllResults}
                      className="text-[#2D6A4F] font-bold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>{lang === 'bn' ? 'ক্যাটালগে দেখুন' : 'View in catalog'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center space-y-1">
                      <p className="text-xs font-bold text-gray-700">
                        {lang === 'bn' ? 'কোনো পণ্য খুঁজে পাওয়া যায়নি' : 'No products found'}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {lang === 'bn' ? 'উপরের ট্যাগগুলো ট্যাপ করে সহজে খুঁজুন।' : 'Try tapping one of the tags above.'}
                      </p>
                    </div>
                  ) : (
                    searchResults.slice(0, 5).map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className="p-2.5 hover:bg-[#FAF8F5] transition-colors flex items-center gap-3 cursor-pointer"
                      >
                        <img
                          src={product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                          alt={product.nameBn}
                          className="w-11 h-11 object-cover rounded-xl border border-gray-100 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate">
                            {lang === 'bn' ? product.nameBn : product.nameEn}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-[#133E2B] bg-[#EAF2EC] px-1.5 py-0.5 rounded font-medium truncate">
                              {lang === 'bn' ? product.categoryBn : product.category}
                            </span>
                            <span className="text-xs font-bold text-[#133E2B]">
                              {formatPrice(product.price, lang)}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              /{lang === 'bn' ? product.unitBn || 'কেজি' : product.unit || 'kg'}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#2D6A4F] bg-[#EAF2EC] px-2 py-1 rounded-lg shrink-0">
                          {lang === 'bn' ? 'দেখুন' : 'View'}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="p-2 bg-[#FAF8F5] border-t border-[#E8E2D8] text-center">
                    <button
                      type="button"
                      onClick={handleViewAllResults}
                      className="w-full py-2 bg-[#133E2B] text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      {lang === 'bn'
                        ? `সব ${searchResults.length}টি পণ্য দেখুন`
                        : `Show all ${searchResults.length} products`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E8E2D8] bg-[#FAF8F5] px-4 pt-3 pb-6 space-y-1 shadow-lg animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  onTabChange(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-between ${
                  isActive
                    ? 'bg-[#133E2B] text-white shadow-xs'
                    : 'text-gray-800 hover:bg-[#F2EDE4]'
                }`}
              >
                <span>{lang === 'bn' ? link.labelBn : link.labelEn}</span>
                {isActive && <span className="w-2 h-2 rounded-full bg-[#E8C547]" />}
              </button>
            );
          })}

          {/* Mobile Bengali Font Selector */}
          <div className="pt-3 border-t border-[#E8E2D8] mt-3">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>বাংলা ফন্ট সিলেক্ট করুন:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { id: 'hind', name: 'হিন্দ শিলিগুড়ি' },
                { id: 'noto', name: 'নোটো সান্স' },
                { id: 'anek', name: 'অনেকা বাংলা' },
                { id: 'tiro', name: 'তিরো বাংলা' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => onFontChange(f.id as any)}
                  className={`py-1.5 px-2 rounded-lg border text-left transition-colors font-medium ${
                    currentFont === f.id
                      ? 'bg-[#133E2B] text-white border-[#133E2B]'
                      : 'bg-white text-gray-700 border-[#DDD5C7]'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E8E2D8] mt-4 space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
              <span>{lang === 'bn' ? '১০০% খাঁটি ও বিশ্বস্ত উৎস' : '100% Pure & Authentic Source'}</span>
            </div>
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-[#2D6A4F]" />
              <span>{lang === 'bn' ? 'সারাদেশে ক্যাশ অন ডেলিভারি' : 'Cash on Delivery Across Bangladesh'}</span>
            </div>
            <div className="pt-2 flex justify-between items-center text-xs font-semibold">
              <a href={`tel:+88${settings.phone}`} className="text-[#133E2B] flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {settings.phone}
              </a>
              <a
                href={`https://wa.me/88${settings.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 font-bold"
              >
                WhatsApp Order
              </a>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="w-full py-2.5 px-3 bg-[#FAF8F5] hover:bg-[#E8EFE9] text-[#133E2B] font-bold text-xs rounded-xl border border-[#DDD5C7] flex items-center justify-center gap-2 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>{lang === 'bn' ? 'অ্যাডমিন প্যানেল (Admin Login)' : 'Admin Dashboard'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
