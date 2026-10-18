import React from 'react';
import { Sparkles, MessageCircle, ArrowRight } from 'lucide-react';
import { Product, Language } from '../types';
import { ProductCard } from './ProductCard';

interface HomeDecorSectionProps {
  products: Product[];
  lang: Language;
  onViewDetails: (p: Product) => void;
  onAddToCart: (p: Product, quantity?: number, selectedWeight?: string) => void;
  onOrderNow: (p: Product, quantity?: number, selectedWeight?: string) => void;
  whatsappPhone: string;
}

export const HomeDecorSection: React.FC<HomeDecorSectionProps> = ({
  products,
  lang,
  onViewDetails,
  onAddToCart,
  onOrderNow,
  whatsappPhone
}) => {
  const decorProducts = products.filter((p) => p.category === 'home_decor');

  return (
    <section className="py-12 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="bg-gradient-to-r from-[#133E2B] to-[#1B4332] text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-lg border border-[#2D6A4F]">
          <div className="absolute right-0 top-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E8C547] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'নান্দনিক গৃহসজ্জা' : 'Aesthetic Living'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              {lang === 'bn' ? 'আমার ঘর হোম ডেকোর কালেকশন' : 'Amar Ghor Home Decor Collection'}
            </h2>

            <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
              {lang === 'bn'
                ? 'আপনার ঘরের প্রতিটি কোণে প্রাকৃতিক শান্তি ও স্নিগ্ধতা ছড়িয়ে দিতে দেশীয় ঐতিহ্য ও আধুনিক নান্দনিকতায় তৈরি শৌখিন হোম ডেকোর সামগ্রী।'
                : 'Curated home decor pieces blending timeless Bangladeshi craftsmanship with contemporary aesthetic harmony.'}
            </p>

            <div className="pt-2">
              <a
                href={`https://wa.me/88${whatsappPhone}?text=${encodeURIComponent(
                  'আসসালামু আলাইকুম! আমার ঘর Online-এর হোম ডেকোর পণ্য সম্পর্কে তথ্য জানতে চাই।'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#E8C547] text-[#133E2B] font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>{lang === 'bn' ? 'কাস্টম ডেকোর পরামর্শ চান?' : 'Need Custom Decor Advice?'}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Product Grid or Empty State */}
        {decorProducts.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#133E2B]">
                {lang === 'bn' ? 'উপলব্ধ হোম ডেকোর পণ্য' : 'Available Home Decor Items'}
              </h3>
              <span className="text-xs text-gray-500">
                {lang === 'bn' ? `${decorProducts.length}টি পণ্য রয়েছে` : `${decorProducts.length} items`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {decorProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  lang={lang}
                  onViewDetails={onViewDetails}
                  onAddToCart={onAddToCart}
                  onOrderNow={onOrderNow}
                  whatsappPhone={whatsappPhone}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Empty / Coming Soon Banner for Home Decor */
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#E8E2D8] max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#DDD5C7] flex items-center justify-center mx-auto text-2xl">
              🏺
            </div>
            <h3 className="text-xl font-bold text-[#133E2B]">
              {lang === 'bn' ? 'হোম ডেকোর কালেকশন শীঘ্রই আসছে' : 'Home Decor Collection Coming Soon'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
              {lang === 'bn'
                ? 'আমরা আমাদের হস্তশিল্প ও নান্দনিক হোম ডেকোর সংগ্রহশালাটি সাজাচ্ছি। অ্যাডমিন প্যানেল থেকে যেকোনো সময় নতুন ডেকোর পণ্য যুক্ত করা যাবে।'
                : 'We are curating artisan-crafted home decor items. Products can also be added anytime via the Admin Dashboard.'}
            </p>
            <div className="pt-2">
              <a
                href={`https://wa.me/88${whatsappPhone}?text=${encodeURIComponent(
                  'আসসালামু আলাইকুম! আমি বিশেষ হোম ডেকোর আইটেম অর্ডার করতে আগ্রহী।'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#2D6A4F] hover:text-[#133E2B] underline"
              >
                <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপে প্রি-অর্ডার করতে যোগাযোগ করুন' : 'Contact for pre-orders'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
