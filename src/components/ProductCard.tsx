import React, { useState } from 'react';
import { ShoppingCart, Eye, Zap, MessageCircle, Plus, Minus, PackageCheck, Share2, Check } from 'lucide-react';
import { Product, Language } from '../types';
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
  getProductShareUrl
} from '../utils/formatters';
import { playWhatsAppPingSound } from '../utils/sound';

interface ProductCardProps {
  product: Product;
  lang: Language;
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number, selectedWeight?: string) => void;
  onOrderNow: (product: Product, quantity?: number, selectedWeight?: string) => void;
  whatsappPhone: string;
  showStockBadge?: boolean;
  showWhatsAppBtn?: boolean;
  onOpenLanding?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  lang,
  onViewDetails,
  onAddToCart,
  onOrderNow,
  whatsappPhone,
  showStockBadge = true,
  showWhatsAppBtn = true,
  onOpenLanding
}) => {
  const isWeightBased = isWeightBasedProduct(product);
  const detectedPack = extractProductPackWeight(product);
  const weightOptions = getProductWeightOptions(product);
  const defaultCardWeight = getDefaultProductWeight(product);

  const [selectedWeight, setSelectedWeight] = useState(defaultCardWeight);
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);

  const handleCopyShareLink = async () => {
    const url = getProductShareUrl(product.id);
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const cardUnitPrice = calculateItemPrice(product.price, selectedWeight, product.unitBn);
  const cardPreviousPrice = calculateItemPrice(product.previousPrice, selectedWeight, product.unitBn);
  const discountPercent = calculateDiscount(cardUnitPrice, cardPreviousPrice);
  const primaryImage = resolveImageUrl(product.images?.[0]);

  const whatsappUrl = createWhatsAppProductUrl(
    whatsappPhone,
    lang === 'bn' ? `${product.nameBn} (${formatWeightLabel(selectedWeight, lang)})` : `${product.nameEn} (${selectedWeight})`,
    cardUnitPrice * quantity,
    quantity
  );

  const handleCardClick = () => {
    if (onOpenLanding) {
      onOpenLanding(product);
    } else {
      onViewDetails(product);
    }
  };

  const isHalfKgActive = selectedWeight.toLowerCase().includes('500') || 
                         selectedWeight.includes('আধা') || 
                         selectedWeight.includes('হাফ') || 
                         selectedWeight.includes('০.৫');

  return (
    <div className="group bg-white rounded-2xl border border-[#E8E2D8] overflow-hidden flex flex-col justify-between card-hover-shadow relative transition-all duration-300">
      
      {/* Top Media & Discount Badge */}
      <div className="relative aspect-square w-full bg-[#F4EFE6] overflow-hidden cursor-pointer" onClick={handleCardClick}>
        <img
          src={primaryImage}
          alt={product.nameBn}
          className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-500 ease-out"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Quick Share / Copy Landing Link Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopyShareLink();
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md shadow-xs transition-all cursor-pointer z-10 ${
            copied
              ? 'bg-emerald-600 text-white scale-105'
              : 'bg-white/90 text-gray-700 hover:text-[#133E2B] hover:bg-white hover:scale-105'
          }`}
          title={copied ? (lang === 'bn' ? 'লিংক কপি হয়েছে!' : 'Link copied!') : (lang === 'bn' ? 'ল্যান্ডিং পেইজ লিংক কপি করুন' : 'Copy Landing Link')}
          aria-label="Share product"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5" />}
        </button>

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-2.5 left-2.5 bg-[#D4AF37] text-[#133E2B] font-extrabold text-[11px] sm:text-xs px-2.5 py-1 rounded-md shadow-xs">
            {lang === 'bn' ? `${toBnNumber(discountPercent)}% ছাড়` : `${discountPercent}% OFF`}
          </div>
        )}

        {/* Stock status indicator */}
        {showStockBadge && !product.inStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-white font-bold text-xs sm:text-sm px-3 py-1 bg-red-600 rounded">
              {lang === 'bn' ? 'স্টক শেষ' : 'Out of Stock'}
            </span>
          </div>
        )}

        {/* Multi-image gallery badge */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-2.5 left-2.5 bg-black/65 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none shadow-xs">
            <span>📷</span>
            <span>{toBnNumber(product.images.length)}টি ছবি</span>
          </div>
        )}

        {/* Quick View Button overlay on desktop */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          className="absolute bottom-2.5 right-2.5 p-2 bg-white/90 backdrop-blur-sm text-[#133E2B] rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer"
          title={lang === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}
          aria-label="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Product Content Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Subtle Category & Unit Line */}
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-gray-500 mb-1">
            <span className="font-medium text-[#2D6A4F]">
              {lang === 'bn' ? product.categoryBn : product.categoryEn}
            </span>
            <span className="bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E8E2D8] text-[10px] text-gray-600">
              {lang === 'bn' ? product.unitBn : product.unit}
            </span>
          </div>

          {/* Product Names */}
          <h3
            onClick={handleCardClick}
            className="font-bold text-base sm:text-lg text-[#133E2B] hover:text-[#2D6A4F] cursor-pointer line-clamp-1 transition-colors"
          >
            {product.nameBn}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-1 font-normal">
            {product.nameEn}
          </p>

          {/* Quick Weight Selector for weight-based products */}
          {isWeightBased && weightOptions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              {weightOptions.map((opt) => {
                const isSelected = selectedWeight === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWeight(opt);
                    }}
                    className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#133E2B] text-[#E8C547] border-[#133E2B] shadow-xs scale-102 ring-1 ring-[#D4AF37]'
                        : 'bg-[#FAF8F5] text-gray-700 border-[#DDD5C7] hover:border-[#2D6A4F] hover:bg-white'
                    }`}
                  >
                    {formatWeightLabel(opt, lang)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Pricing Row */}
          <div className="flex items-baseline justify-between mt-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-extrabold text-[#133E2B]">
                {formatPrice(cardUnitPrice, lang)}
              </span>
              {cardPreviousPrice > cardUnitPrice && (
                <span className="text-xs sm:text-sm text-gray-400 line-through">
                  {formatPrice(cardPreviousPrice, lang)}
                </span>
              )}
            </div>
            {isWeightBased && (
              <span className="text-[11px] font-bold text-[#2D6A4F] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E8E2D8]">
                {formatWeightLabel(selectedWeight, lang)}
              </span>
            )}
          </div>
        </div>

        {/* Quantity Stepper & Action Buttons Grid */}
        <div className="space-y-2.5 pt-2 border-t border-[#F2EDE4]">
          {/* Quantity Stepper on Card */}
          <div className="flex items-center justify-between bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-[#E8E2D8]">
            <span className="text-[11px] font-bold text-gray-600">
              {lang === 'bn' ? 'পরিমাণ:' : 'Quantity:'}
            </span>
            <div className="flex items-center border border-[#DDD5C7] rounded-lg bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity((q) => Math.max(1, q - 1));
                }}
                disabled={quantity <= 1}
                className="px-2 py-1 text-gray-600 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                title={lang === 'bn' ? 'পরিমাণ কমান' : 'Decrease quantity'}
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-2 font-bold text-xs text-[#133E2B] min-w-7 text-center">
                {toBnNumber(quantity)}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity((q) => q + 1);
                }}
                className="px-2 py-1 text-gray-600 hover:text-black hover:bg-gray-100 cursor-pointer transition-colors"
                title={lang === 'bn' ? 'পরিমাণ বাড়ান' : 'Increase quantity'}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Row 1: Order Now & Add to Cart */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onOrderNow(product, quantity, selectedWeight)}
              disabled={!product.inStock}
              className="w-full py-2 px-2 bg-[#133E2B] hover:bg-[#1B4332] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-[#E8C547] fill-current" />
              <span>{lang === 'bn' ? 'অর্ডার করুন' : 'Order Now'}</span>
            </button>

            <button
              onClick={() => onAddToCart(product, quantity, selectedWeight)}
              disabled={!product.inStock}
              className="w-full py-2 px-2 bg-[#FAF8F5] hover:bg-[#EBE5DA] active:scale-95 text-[#133E2B] border border-[#DDD5C7] font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>{lang === 'bn' ? 'কার্টে যোগ' : 'Add Cart'}</span>
            </button>
          </div>

          {/* Row 2: WhatsApp direct order button */}
          {showWhatsAppBtn && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playWhatsAppPingSound()}
              className="w-full py-1.5 px-2 bg-[#E7F6ED] hover:bg-[#D5EFE0] active:scale-98 text-[#1B4332] font-semibold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 border border-[#BDE5CB]"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপে অর্ডার' : 'Order via WhatsApp'}</span>
            </a>
          )}
        </div>

      </div>

    </div>
  );
};
