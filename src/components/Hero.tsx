import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { Language, SiteSettings } from '../types';

interface HeroProps {
  lang: Language;
  onExploreFood: () => void;
  onExploreDecor: () => void;
  settings?: SiteSettings;
}

export const Hero: React.FC<HeroProps> = ({
  lang,
  onExploreFood,
  onExploreDecor,
  settings,
}) => {
  const badgeText = lang === 'bn' 
    ? (settings?.heroBadgeBn || 'আমার ঘর Online · বিশ্বস্ততার প্রতীক')
    : (settings?.heroBadgeEn || 'Amar Ghor Online · Symbol of Trust');

  const headline = lang === 'bn'
    ? (settings?.heroHeadlineBn || 'আপন ঘরের মতো নিরাপদ')
    : (settings?.heroHeadlineEn || 'Safe & Pure Like Your Own Home');

  const subheadlineBn = settings?.heroSubheadlineBn || '“বিশ্বস্ত উৎস থেকে বাছাইকৃত খাঁটি খাবার ও ঘরের সৌন্দর্য বাড়ানোর পণ্য—সবকিছু এক ঠিকানায়।”';
  const subheadlineEn = settings?.heroSubheadlineEn || '“Authentic Food & Beautiful Home Decor, All in One Place.”';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF8F5] via-[#F4EFE6] to-[#FAF8F5] py-12 md:py-20 border-b border-[#E8E2D8]">
      {/* Decorative subtle nature leaves background vectors */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#2D6A4F]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Quiet trust label without pill slop */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1B4332]">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{badgeText}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold text-[#133E2B] tracking-tight leading-[1.2]">
              {headline}
            </h1>

            {/* Subheadline in Bengali & English */}
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl leading-relaxed">
              {lang === 'bn' ? (
                <>
                  {subheadlineBn}
                  <span className="block mt-2 text-sm text-gray-600 font-normal italic">
                    {subheadlineEn}
                  </span>
                </>
              ) : (
                <>
                  {subheadlineEn}
                  <span className="block mt-2 text-sm text-gray-600 font-normal">
                    {subheadlineBn}
                  </span>
                </>
              )}
            </p>

            {/* Two Prominent Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <button
                onClick={onExploreFood}
                className="w-full sm:w-auto px-7 py-3.5 bg-[#133E2B] text-white font-bold rounded-xl shadow-md hover:bg-[#1B4332] hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base cursor-pointer"
              >
                <span>{lang === 'bn' ? 'খাঁটি খাবার কিনুন' : 'Shop Authentic Food'}</span>
                <ArrowRight className="w-4 h-4 text-[#E8C547]" />
              </button>

              <button
                onClick={onExploreDecor}
                className="w-full sm:w-auto px-7 py-3.5 bg-white text-[#133E2B] font-bold border-2 border-[#133E2B]/20 rounded-xl hover:border-[#133E2B] hover:bg-[#F2EDE4] active:scale-95 transition-all text-sm sm:text-base cursor-pointer"
              >
                <span>{lang === 'bn' ? 'হোম ডেকোর দেখুন' : 'Explore Home Decor'}</span>
              </button>
            </div>

            {/* Trust Highlights Checklist */}
            <div className="grid grid-cols-3 gap-2 pt-6 border-t border-[#E8E2D8] text-xs text-gray-700">
              <div className="flex flex-col items-center lg:items-start gap-1">
                <ShieldCheck className="w-5 h-5 text-[#2D6A4F]" />
                <span className="font-semibold text-gray-900">{lang === 'bn' ? 'শতভাগ নির্ভেজাল' : '100% Authentic'}</span>
                <span className="text-[11px] text-gray-500">{lang === 'bn' ? 'সরাসরি বিশ্বস্ত উৎস' : 'Direct from Source'}</span>
              </div>
              <div className="flex flex-col items-center lg:items-start gap-1">
                <Truck className="w-5 h-5 text-[#2D6A4F]" />
                <span className="font-semibold text-gray-900">{lang === 'bn' ? 'সারাদেশে হোম ডেলিভারি' : 'Countrywide Delivery'}</span>
                <span className="text-[11px] text-gray-500">{lang === 'bn' ? 'দ্রুত নিরাপদ সরবরাহ' : 'Fast & Secure'}</span>
              </div>
              <div className="flex flex-col items-center lg:items-start gap-1">
                <RefreshCw className="w-5 h-5 text-[#2D6A4F]" />
                <span className="font-semibold text-gray-900">{lang === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery'}</span>
                <span className="text-[11px] text-gray-500">{lang === 'bn' ? 'পণ্য হাতে পেয়ে মূল্য' : 'Pay After Inspection'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Visual Frame */}
              <div className="relative rounded-2xl overflow-hidden bg-white p-2.5 shadow-xl border border-[#DDD5C7]">
                <div className="aspect-[4/3] rounded-xl overflow-hidden relative">
                  <img
                    src="https://res.cloudinary.com/hcmtg1sc/image/upload/v1792005716/ChatGPT_Image_Sep_29_2026_09_43_29_PM.png"
                    alt="প্রাকৃতিক চাক ভাঙ্গা মধু"
                    className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                  />
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Overlay Info */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[11px] uppercase tracking-wider text-[#E8C547] font-bold">
                      {lang === 'bn' ? 'সেরা সংকলন' : 'Handpicked Collection'}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold drop-shadow-sm">
                      {lang === 'bn' ? 'প্রাকৃতিক চাক ভাঙ্গা মধু ও দানাদার ঘি' : 'Natural Honey & Granular Ghee'}
                    </h3>
                  </div>
                </div>

                {/* Sub thumbnails row */}
                <div className="grid grid-cols-3 gap-2 mt-2.5">
                  <div className="rounded-lg overflow-hidden h-20 relative bg-gray-100">
                    <img
                      src="https://res.cloudinary.com/hcmtg1sc/image/upload/v1792005762/Amar_Ghor_Pure_Granular_Ghee.png"
                      alt="খাঁটি দানাদার গাওয়া ঘি"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-end p-1">
                      <span className="text-[10px] text-white font-semibold truncate">
                        {lang === 'bn' ? 'দানাদার ঘি' : 'Pure Ghee'}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg overflow-hidden h-20 relative bg-gray-100">
                    <img
                      src="https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006037/1790509356678.jpg"
                      alt="ঘানি ভাঙ্গা সরিষার তেল"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-end p-1">
                      <span className="text-[10px] text-white font-semibold truncate">
                        {lang === 'bn' ? 'সরিষার তেল' : 'Mustard Oil'}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg overflow-hidden h-20 relative bg-gray-100">
                    <img
                      src="https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006036/1790695244373.png"
                      alt="প্রিমিয়াম হানি নাটস"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-end p-1">
                      <span className="text-[10px] text-white font-semibold truncate">
                        {lang === 'bn' ? 'হানি নাটস' : 'Honey Nuts'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating verified badge */}
              <div className="absolute -bottom-4 -left-4 sm:-bottom-5 sm:-left-5 bg-[#133E2B] text-white p-3.5 rounded-xl shadow-lg border border-[#2D6A4F] flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2D6A4F] flex items-center justify-center text-[#E8C547] font-bold">
                  ৳
                </div>
                <div>
                  <div className="text-xs text-emerald-200">
                    {lang === 'bn' ? 'সর্বোচ্চ গুণমান' : 'Finest Standard'}
                  </div>
                  <div className="text-sm font-bold text-white">
                    {lang === 'bn' ? 'ন্যায্য ও স্বচ্ছ মূল্য' : 'Transparent Pricing'}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
