import React, { useState } from 'react';
import { X, ShoppingCart, Zap, MessageCircle, ShieldCheck, Truck, Plus, Minus, Check, ZoomIn, Scale } from 'lucide-react';
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
  getDefaultProductWeight
} from '../utils/formatters';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  lang: Language;
  onAddToCart: (product: Product, quantity: number, selectedWeight: string) => void;
  onOrderNow: (product: Product, quantity: number, selectedWeight: string) => void;
  allProducts: Product[];
  onSelectProduct: (p: Product) => void;
  whatsappPhone: string;
  showWhatsAppBtn?: boolean;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  lang,
  onAddToCart,
  onOrderNow,
  allProducts,
  onSelectProduct,
  whatsappPhone,
  showWhatsAppBtn = true
}) => {
  if (!product) return null;

  const isWeightBased = isWeightBasedProduct(product);
  const detectedPack = extractProductPackWeight(product);
  const defaultWeight = getDefaultProductWeight(product);
  const [selectedWeight, setSelectedWeight] = useState(defaultWeight);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.images?.[0] || '');
  const [addedToast, setAddedToast] = useState(false);

  // Hover-to-zoom state
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  // Weight-based dynamic pricing
  const currentUnitPrice = calculateItemPrice(product.price, selectedWeight, product.unitBn);
  const currentPreviousPrice = calculateItemPrice(product.previousPrice, selectedWeight, product.unitBn);
  const discountPercent = calculateDiscount(currentUnitPrice, currentPreviousPrice);
  const gallery = product.images && product.images.length > 0 ? product.images : [selectedImage];

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

  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && (p.category === product.category || p.featured))
    .slice(0, 3);

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedWeight);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const handleOrderNow = () => {
    onOrderNow(product, quantity, selectedWeight);
    onClose();
  };

  const whatsappUrl = createWhatsAppProductUrl(
    whatsappPhone,
    lang === 'bn' ? `${product.nameBn} (${formatWeightLabel(selectedWeight, lang)})` : `${product.nameEn} (${selectedWeight})`,
    currentUnitPrice,
    quantity
  );

  const halfOption = product.weightOptions?.find(w => 
    w.toLowerCase().includes('500') || w.includes('হাফ') || w.includes('আধা') || w.includes('০.৫')
  ) || (isWeightBased ? '500g' : undefined);

  const oneKgOption = product.weightOptions?.find(w => 
    w.toLowerCase().includes('1kg') || w.includes('১ কেজি')
  ) || (isWeightBased ? '1kg' : undefined);

  const isCurrentHalfKg = selectedWeight.toLowerCase().includes('500') || 
                          selectedWeight.includes('আধা') || 
                          selectedWeight.includes('হাফ') ||
                          selectedWeight.includes('০.৫');

  const isCurrentQuarterKg = selectedWeight.toLowerCase().includes('250') || 
                            selectedWeight.includes('পোয়া') || 
                            selectedWeight.includes('পোয়া') ||
                            selectedWeight.includes('০.২৫');

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    } else if (quantity === 1 && isWeightBased) {
      // If currently 1kg, step down to half option if available
      if (!isCurrentHalfKg && !isCurrentQuarterKg && !detectedPack) {
        setSelectedWeight(halfOption || '500g');
      }
    }
  };

  const handleIncreaseQuantity = () => {
    if (isWeightBased && !detectedPack) {
      if (isCurrentQuarterKg) {
        setSelectedWeight(halfOption || '500g');
      } else if (isCurrentHalfKg && quantity === 1) {
        setSelectedWeight(oneKgOption || '1kg');
      } else {
        setQuantity(quantity + 1);
      }
    } else {
      setQuantity(quantity + 1);
    }
  };

  const isDecreaseDisabled = Boolean(quantity <= 1 && (!isWeightBased || !!detectedPack || isCurrentHalfKg || isCurrentQuarterKg));

  // Weight options list with intelligent pack detection
  const weightOptionsList = React.useMemo(() => {
    return getProductWeightOptions(product);
  }, [product]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      
      {/* Container Card */}
      <div className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#DDD5C7] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/80 hover:bg-white text-gray-700 hover:text-black rounded-full shadow-md transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Body */}
        <div className="p-5 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Left: Gallery & Large Image with Hover-To-Zoom */}
            <div className="space-y-4">
              <div
                className="relative aspect-square rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#E8E2D8] shadow-xs group cursor-crosshair select-none"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
                onTouchStart={() => setIsZoomed(true)}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => setIsZoomed(false)}
              >
                <img
                  src={selectedImage || product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'}
                  alt={product.nameBn}
                  className="w-full h-full object-cover will-change-transform pointer-events-none"
                  style={{
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transform: isZoomed ? 'scale(2.3)' : 'scale(1)',
                    transition: isZoomed ? 'transform 0.08s ease-out' : 'transform 0.25s ease-in-out',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80';
                  }}
                />

                {/* Discount Badge */}
                {discountPercent > 0 && (
                  <div className="absolute top-3 left-3 bg-[#D4AF37] text-[#133E2B] font-extrabold text-xs px-2.5 py-1 rounded-md shadow-xs pointer-events-none z-10">
                    {lang === 'bn' ? `${toBnNumber(discountPercent)}% ছাড়` : `${discountPercent}% OFF`}
                  </div>
                )}

                {/* Hover to Zoom prompt badge */}
                <div
                  className={`absolute bottom-3 right-3 bg-black/65 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all duration-200 pointer-events-none z-10 ${
                    isZoomed ? 'opacity-0 scale-95' : 'opacity-85 group-hover:opacity-100 group-hover:bg-black/80 shadow-xs'
                  }`}
                >
                  <ZoomIn className="w-3.5 h-3.5 text-[#E8C547]" />
                  <span>{lang === 'bn' ? 'জুম করতে মাউস রাখুন' : 'Hover to zoom'}</span>
                </div>

                {/* Active Zooming badge when hovering */}
                {isZoomed && (
                  <div className="absolute top-3 right-3 bg-[#133E2B]/90 backdrop-blur-xs text-[#E8C547] border border-[#2D6A4F] px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 pointer-events-none z-10 shadow-xs animate-in fade-in duration-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E8C547] animate-pulse" />
                    <span>{lang === 'bn' ? '২.৩x ম্যাগনিফায়ার' : '2.3x Zoom'}</span>
                  </div>
                )}
              </div>

              {/* Thumbnails if multiple images exist */}
              {gallery.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedImage(img);
                        setIsZoomed(false);
                      }}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        selectedImage === img ? 'border-[#2D6A4F] shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust notices */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8E2D8] space-y-2 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                  <span>{lang === 'bn' ? 'সরাসরি বিশ্বস্ত উৎস থেকে সংগৃহীত নির্ভেজাল পণ্য' : 'Direct authentic collection from reliable source'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                  <span>{lang === 'bn' ? 'ক্যাশ অন ডেলিভারি ও দ্রুত হোম ডেলিভারি' : 'Cash on delivery with secure home delivery'}</span>
                </div>
              </div>
            </div>

            {/* Right: Product Info & Actions */}
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#2D6A4F] font-semibold mb-1">
                  <span>{lang === 'bn' ? product.categoryBn : product.categoryEn}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-500 font-normal">{lang === 'bn' ? product.unitBn : product.unit}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#133E2B] leading-tight">
                  {lang === 'bn' ? product.nameBn : product.nameEn}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {lang === 'bn' ? product.nameEn : product.nameBn}
                </p>
              </div>

              {/* Price Row */}
              <div className="p-4 bg-[#F7F5EE] rounded-2xl border border-[#E8E2D8] flex items-baseline justify-between">
                <div>
                  <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                    {lang === 'bn' ? 'বর্তমান মূল্য' : 'Current Price'}
                  </div>
                  <div className="flex items-baseline gap-2.5 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#133E2B]">
                      {formatPrice(currentUnitPrice * quantity, lang)}
                    </span>
                    {currentPreviousPrice > currentUnitPrice && (
                      <span className="text-sm sm:text-base text-gray-400 line-through">
                        {formatPrice(currentPreviousPrice * quantity, lang)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[#133E2B] bg-white px-2.5 py-1 rounded-md border border-[#E8E2D8] font-bold">
                    {formatWeightLabel(selectedWeight, lang)}
                  </span>
                </div>
              </div>

              {/* Proportional Pricing Banner if packaging net weight is detected */}
              {detectedPack && (
                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3 flex items-start gap-2.5">
                  <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0 mt-0.5">
                    <Scale className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="text-xs text-gray-800 leading-relaxed">
                    <div className="font-bold text-[#133E2B] mb-0.5">
                      {lang === 'bn' ? 'ওজন অনুপাতে স্বয়ংক্রিয় মূল্য নির্ধারণ' : 'Proportional Pack Pricing'}
                    </div>
                    <div>
                      {lang === 'bn' ? (
                        <>
                          এই পণ্যটি <span className="font-bold text-emerald-900">{toBnNumber(detectedPack.grams)} গ্রাম</span> কৌটায় সরবরাহ করা হয়। প্রতি কেজি {formatPrice(product.price, 'bn')} রেটের ভিত্তিতে {toBnNumber(detectedPack.grams)} গ্রামের দাম সমানুপাতিকভাবে <span className="font-extrabold text-[#133E2B] bg-white px-1.5 py-0.5 rounded border border-emerald-300">{formatPrice(calculateItemPrice(product.price, `${detectedPack.grams}g`, product.unitBn), 'bn')}</span> নির্ধারণ করা হয়েছে।
                        </>
                      ) : (
                        <>
                          Net packaging weight is <span className="font-bold">{detectedPack.grams}g</span>. At {formatPrice(product.price, 'en')}/kg, the proportional price is <span className="font-bold">{formatPrice(calculateItemPrice(product.price, `${detectedPack.grams}g`, product.unitBn), 'en')}</span>.
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Weight Options if available */}
              {weightOptionsList && weightOptionsList.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {lang === 'bn' ? 'প্যাকেজের আকার / সাইজ:' : 'Packaging / Size:'}
                    </label>
                    <span className="text-[11px] text-[#2D6A4F] font-semibold">
                      {detectedPack
                        ? (lang === 'bn' ? `কৌটার ওজন: ${toBnNumber(detectedPack.grams)} গ্রাম` : `Jar weight: ${detectedPack.grams}g`)
                        : (lang === 'bn' ? 'আধা কেজি নিলে রেট অর্ধেক হবে' : 'Half kg adjusts price to 50%')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {weightOptionsList.map((weight) => {
                      const optionPrice = calculateItemPrice(product.price, weight, product.unitBn);
                      const isSelected = selectedWeight === weight;

                      return (
                        <button
                          key={weight}
                          type="button"
                          onClick={() => {
                            setSelectedWeight(weight);
                            setQuantity(1);
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-[#133E2B] text-white border-[#133E2B] shadow-sm scale-102 ring-2 ring-[#2D6A4F]/20'
                              : 'bg-white text-gray-800 border-[#DDD5C7] hover:border-[#2D6A4F] hover:bg-[#FAF8F5]'
                          }`}
                        >
                          <span>{formatWeightLabel(weight, lang)}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${
                              isSelected
                                ? 'bg-[#2D6A4F] text-[#E8C547]'
                                : 'bg-[#F2EDE4] text-[#133E2B]'
                            }`}
                          >
                            {formatPrice(optionPrice, lang)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Stepper */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  {lang === 'bn' ? 'পরিমাণ:' : 'Quantity:'}
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center border border-[#DDD5C7] bg-white rounded-xl shadow-xs">
                    <button
                      type="button"
                      onClick={handleDecreaseQuantity}
                      disabled={isDecreaseDisabled}
                      className="p-2.5 text-gray-600 hover:text-[#133E2B] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      aria-label="Decrease quantity"
                      title={lang === 'bn' ? 'পরিমাণ কমান' : 'Decrease quantity'}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="min-w-24 px-2 text-center font-bold text-xs sm:text-sm text-[#133E2B]">
                      {detectedPack && selectedWeight === `${detectedPack.grams}g`
                        ? (lang === 'bn' ? `${toBnNumber(quantity)}টি কৌটা` : `${quantity} jar(s)`)
                        : isCurrentHalfKg && quantity === 1
                          ? (lang === 'bn' ? '০.৫০ কেজি' : '0.50 kg')
                          : isCurrentQuarterKg && quantity === 1
                            ? (lang === 'bn' ? '০.২৫ কেজি' : '0.25 kg')
                            : isWeightBased
                              ? (lang === 'bn' ? `${toBnNumber(quantity)} কেজি` : `${quantity} kg`)
                              : (lang === 'bn' ? `${toBnNumber(quantity)}টি` : `${quantity} pcs`)}
                    </span>
                    <button
                      type="button"
                      onClick={handleIncreaseQuantity}
                      className="p-2.5 text-gray-600 hover:text-[#133E2B] cursor-pointer"
                      aria-label="Increase quantity"
                      title={lang === 'bn' ? 'পরিমাণ বাড়ান' : 'Increase quantity'}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-700 font-bold bg-[#FAF8F5] px-3 py-2 rounded-xl border border-[#E8E2D8] flex items-center gap-1.5 shadow-xs">
                    <span className="text-gray-500 font-normal">{lang === 'bn' ? 'মোট মূল্য:' : 'Total:'}</span>
                    <span className="text-base font-extrabold text-[#133E2B]">
                      {formatPrice(currentUnitPrice * quantity, lang)}
                    </span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleOrderNow}
                    disabled={!product.inStock}
                    className="py-3 px-4 bg-[#133E2B] hover:bg-[#1B4332] active:scale-95 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-[#E8C547] fill-current" />
                    <span>{lang === 'bn' ? 'এখনই অর্ডার করুন' : 'Order Now'}</span>
                  </button>

                  <button
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    className="py-3 px-4 bg-[#FAF8F5] hover:bg-[#EBE5DA] active:scale-95 text-[#133E2B] border-2 border-[#133E2B]/20 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                  >
                    {addedToast ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">{lang === 'bn' ? 'যোগ হয়েছে!' : 'Added!'}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 text-[#2D6A4F]" />
                        <span>{lang === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* WhatsApp Order Button */}
                {showWhatsAppBtn && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপে সরাসরি অর্ডার করুন' : 'Order Directly on WhatsApp'}</span>
                  </a>
                )}
              </div>

              {/* Description */}
              <div className="border-t border-[#E8E2D8] pt-4 space-y-3">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  {lang === 'bn' ? 'পণ্যের বিবরণ' : 'Product Description'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  {lang === 'bn' ? product.descriptionBn : product.descriptionEn}
                </p>

                {/* Storage Instructions */}
                {(product.storageBn || product.storageEn) && (
                  <div className="bg-[#FAF8F5] p-3 rounded-lg border border-[#E8E2D8] text-xs">
                    <span className="font-bold text-[#133E2B] block mb-0.5">
                      {lang === 'bn' ? 'সংরক্ষণ পদ্ধতি:' : 'Storage Instructions:'}
                    </span>
                    <span className="text-gray-600">
                      {lang === 'bn' ? product.storageBn : product.storageEn}
                    </span>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Related Products Showcase */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-[#E8E2D8] mt-10 pt-6">
              <h3 className="text-base font-bold text-[#133E2B] mb-4">
                {lang === 'bn' ? 'আরও সম্পর্কিত পণ্য' : 'Related Products'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedProducts.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => {
                      onSelectProduct(rel);
                      setSelectedImage(rel.images[0]);
                      setQuantity(1);
                    }}
                    className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8] flex items-center gap-3 cursor-pointer hover:border-[#2D6A4F] hover:bg-white transition-all"
                  >
                    <img
                      src={rel.images[0]}
                      alt={rel.nameBn}
                      className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0"
                    />
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-gray-900 truncate">
                        {lang === 'bn' ? rel.nameBn : rel.nameEn}
                      </h4>
                      <p className="text-xs font-extrabold text-[#133E2B] mt-0.5">
                        {formatPrice(rel.price, lang)}
                      </p>
                      <span className="text-[10px] text-gray-500">
                        {lang === 'bn' ? rel.unitBn : rel.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
