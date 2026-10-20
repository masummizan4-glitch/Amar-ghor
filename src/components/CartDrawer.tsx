import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, MessageCircle, Truck, Scale } from 'lucide-react';
import { CartItem, Language, SiteSettings } from '../types';
import { formatPrice, createWhatsAppCartUrl, toBnNumber, calculateItemPrice, formatWeightLabel, isWeightBasedProduct, extractProductPackWeight } from '../utils/formatters';
import { calculateDeliveryCharge } from '../utils/delivery';
import { playWhatsAppPingSound } from '../utils/sound';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, selectedWeight?: string) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
  lang: Language;
  settings: SiteSettings;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  lang,
  settings
}) => {
  if (!isOpen) return null;

  const getItemUnitPrice = (item: CartItem) => calculateItemPrice(item.product.price, item.selectedWeight, item.product.unitBn);
  const subtotal = items.reduce((acc, item) => acc + getItemUnitPrice(item) * item.quantity, 0);
  const deliveryInfo = calculateDeliveryCharge(items, '', settings);

  const whatsappCartUrl = createWhatsAppCartUrl(
    settings.whatsapp,
    items.map((i) => ({
      nameBn: `${i.product.nameBn} (${formatWeightLabel(i.selectedWeight, lang)})`,
      quantity: i.quantity,
      price: getItemUnitPrice(i)
    })),
    subtotal
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8E2D8] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#133E2B] text-white flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#E8C547]" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#133E2B]">
                {lang === 'bn' ? 'শপিং ব্যাগ' : 'Shopping Cart'}
              </h2>
              <p className="text-[11px] text-gray-500">
                {lang === 'bn'
                  ? `${toBnNumber(items.length)} টি পণ্য যোগ করা হয়েছে`
                  : `${items.length} items added`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-[#F2EDE4] space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-gray-400">
              <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#E8E2D8] flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-bold text-base text-gray-700">
                {lang === 'bn' ? 'আপনার কার্ট খালি' : 'Your cart is empty'}
              </h3>
              <p className="text-xs text-gray-500 max-w-xs">
                {lang === 'bn'
                  ? 'খাঁটি প্রাকৃতিক খাবার ও সুন্দর গৃহসজ্জা সামগ্রী থেকে পছন্দসই পণ্য যোগ করুন।'
                  : 'Add your favorite authentic food and home decor items to get started.'}
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 bg-[#133E2B] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#1B4332]"
              >
                {lang === 'bn' ? 'পণ্য কেনাকাটা শুরু করুন' : 'Start Shopping'}
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="pt-3 first:pt-0 flex gap-3.5 items-center">
                {/* Thumbnail */}
                <img
                  src={item.product.images?.[0]}
                  alt={item.product.nameBn}
                  className="w-16 h-16 rounded-xl object-cover border border-[#E8E2D8] shrink-0 bg-gray-50"
                />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                    {lang === 'bn' ? item.product.nameBn : item.product.nameEn}
                  </h4>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    <span className="font-semibold text-gray-700">{formatWeightLabel(item.selectedWeight, lang)}</span> · <span className="text-[#133E2B] font-bold">{formatPrice(getItemUnitPrice(item), lang)}</span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 mt-2">
                    {(() => {
                      const isWeight = isWeightBasedProduct(item.product);
                      const detectedPack = extractProductPackWeight(item.product);
                      const isHalf = item.selectedWeight.toLowerCase().includes('500') ||
                                     item.selectedWeight.includes('আধা') ||
                                     item.selectedWeight.includes('হাফ') ||
                                     item.selectedWeight.includes('০.৫');

                      const handleStepDown = () => {
                        if (item.quantity > 1) {
                          onUpdateQuantity(item.product.id, item.quantity - 1, item.selectedWeight);
                        } else {
                          onRemoveItem(item.product.id);
                        }
                      };

                      const handleStepUp = () => {
                        onUpdateQuantity(item.product.id, item.quantity + 1, item.selectedWeight);
                      };

                      return (
                        <div className="inline-flex items-center border border-[#DDD5C7] rounded-lg bg-white">
                          <button
                            type="button"
                            onClick={handleStepDown}
                            className="p-1 text-gray-600 hover:text-black cursor-pointer"
                            aria-label="Decrease"
                            title={lang === 'bn' ? 'পরিমাণ কমান' : 'Decrease quantity'}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="min-w-16 px-1 text-center font-bold text-xs text-[#133E2B]">
                            {detectedPack && item.selectedWeight.includes(String(detectedPack.grams))
                              ? (lang === 'bn' ? `${toBnNumber(item.quantity)} কৌটা` : `${item.quantity} jar`)
                              : isHalf && item.quantity === 1
                                ? (lang === 'bn' ? '০.৫০ কেজি' : '0.50 kg')
                                : isWeight
                                  ? (lang === 'bn' ? `${toBnNumber(item.quantity)} কেজি` : `${item.quantity} kg`)
                                  : (lang === 'bn' ? toBnNumber(item.quantity) : item.quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={handleStepUp}
                            className="p-1 text-gray-600 hover:text-black cursor-pointer"
                            aria-label="Increase"
                            title={lang === 'bn' ? 'পরিমাণ বাড়ান' : 'Increase quantity'}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })()}

                    <span className="text-xs font-extrabold text-[#133E2B] ml-auto">
                      {formatPrice(getItemUnitPrice(item) * item.quantity, lang)}
                    </span>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors shrink-0"
                  title={lang === 'bn' ? 'মুছে ফেলুন' : 'Remove'}
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer & Checkout Call-to-actions */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#E8E2D8] bg-[#FAF8F5] space-y-3">
            {/* Calculation details */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>{lang === 'bn' ? 'পণ্যের মোট মূল্য (সাবটোটাল):' : 'Subtotal:'}</span>
                <span className="font-bold text-gray-900">{formatPrice(subtotal, lang)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{lang === 'bn' ? 'মোট পণ্যের ওজন:' : 'Total Weight:'}</span>
                </span>
                <span className="font-bold text-emerald-900">
                  {lang === 'bn' ? `${toBnNumber(deliveryInfo.totalWeightKg)} কেজি` : `${deliveryInfo.totalWeightKg} kg`}
                </span>
              </div>
              <div className="flex justify-between text-gray-700 bg-[#F2EDE4]/60 p-2 rounded-lg border border-[#E8E2D8]">
                <span className="flex items-center gap-1 text-[11px] font-medium">
                  <Truck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{lang === 'bn' ? 'আনুমানিক কুরিয়ার চার্জ:' : 'Estimated Courier:'}</span>
                </span>
                <span className="font-extrabold text-[#133E2B]">
                  {formatPrice(deliveryInfo.charge, lang)}
                </span>
              </div>
            </div>

            {/* Total display */}
            <div className="pt-2 border-t border-[#E8E2D8] flex justify-between items-baseline">
              <span className="font-bold text-sm text-[#133E2B]">
                {lang === 'bn' ? 'সর্বমোট আনুমানিক বিল:' : 'Estimated Total:'}
              </span>
              <span className="font-extrabold text-xl text-[#133E2B]">
                {formatPrice(subtotal + deliveryInfo.charge, lang)}
              </span>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="w-full py-3.5 bg-[#133E2B] hover:bg-[#1B4332] active:scale-95 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <span>{lang === 'bn' ? 'অর্ডার সম্পন্ন করুন' : 'Proceed to Checkout'}</span>
              <ArrowRight className="w-4 h-4 text-[#E8C547]" />
            </button>

            {/* WhatsApp Ordering Button */}
            <a
              href={whatsappCartUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playWhatsAppPingSound()}
              className="w-full py-2.5 bg-[#E7F6ED] hover:bg-[#D5EFE0] active:scale-98 text-[#133E2B] font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-[#BDE5CB]"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>{lang === 'bn' ? 'কার্টের তালিকা সহ হোয়াটসঅ্যাপে অর্ডার' : 'Order Cart via WhatsApp'}</span>
            </a>
          </div>
        )}

      </div>
    </div>
  );
};
