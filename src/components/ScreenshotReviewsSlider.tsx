import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, MessageCircle, Star, Sparkles, CheckCircle2 } from 'lucide-react';
import { ScreenshotReview, Language } from '../types';
import { playWhatsAppPingSound } from '../utils/sound';

interface ScreenshotReviewsSliderProps {
  lang: Language;
  reviews?: ScreenshotReview[];
}

const DEFAULT_SCREENSHOTS: ScreenshotReview[] = [];

export const ScreenshotReviewsSlider: React.FC<ScreenshotReviewsSliderProps> = ({
  lang,
  reviews = DEFAULT_SCREENSHOTS
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<ScreenshotReview | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = reviews?.length || 0;

  const nextSlide = () => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const prevSlide = () => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  // Auto-slide effect
  useEffect(() => {
    if (isPaused || total <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, total]);

  // If no reviews, return null AFTER all hooks have executed
  if (!reviews || reviews.length === 0) return null;

  const current = reviews[currentIndex % total] || reviews[0];
  if (!current) return null;

  const getPlatformBadge = (platform: ScreenshotReview['platform']) => {
    switch (platform) {
      case 'whatsapp':
        return {
          label: 'WhatsApp Chat',
          bg: 'bg-[#25D366]/15 text-[#138A36] border-[#25D366]/30',
          icon: '💬'
        };
      case 'facebook':
        return {
          label: 'Facebook Post',
          bg: 'bg-[#1877F2]/15 text-[#1877F2] border-[#1877F2]/30',
          icon: '👍'
        };
      case 'google':
        return {
          label: 'Google Review',
          bg: 'bg-[#EA4335]/15 text-[#EA4335] border-[#EA4335]/30',
          icon: '⭐'
        };
      default:
        return {
          label: 'Social Proof',
          bg: 'bg-[#2D6A4F]/15 text-[#2D6A4F] border-[#2D6A4F]/30',
          icon: '📸'
        };
    }
  };

  const badge = getPlatformBadge(current.platform);

  return (
    <section className="py-14 bg-[#FAF8F5] border-b border-[#E8E2D8] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{lang === 'bn' ? 'সরাসরি কাস্টমারদের মতামত' : 'Real Platform Feedback'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#133E2B]">
            {lang === 'bn' ? 'সোশ্যাল প্রমাণ ও স্ক্রিনশট রিভিউ' : 'Customer Review Screenshots'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            {lang === 'bn'
              ? 'হোয়াটসঅ্যাপ, ফেসবুক ও ইনবক্সে গ্রাহকদের সরাসরি সন্তুষ্টি ও আনবক্সিং প্রমাণ।'
              : 'Direct customer chats, feedback screenshots, and verified delivery proofs.'}
          </p>
        </div>

        {/* Carousel Container */}
        <div
          className="relative max-w-4xl mx-auto bg-white rounded-3xl border border-[#E8E2D8] shadow-lg overflow-hidden group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px] sm:min-h-[440px]">
            
            {/* Screenshot Image Frame */}
            <div
              className="md:col-span-7 bg-[#133E2B]/5 flex items-center justify-center p-3 sm:p-5 relative overflow-hidden cursor-pointer group/img"
              onClick={() => {
                playWhatsAppPingSound();
                setLightboxImage(current);
              }}
            >
              <img
                src={current.imageUrl}
                alt={current.title || 'Customer Review'}
                className="max-h-[360px] sm:max-h-[420px] w-auto max-w-full object-contain rounded-2xl shadow-sm transition-transform duration-300 group-hover/img:scale-102"
              />

              {/* View Fullscreen overlay hint */}
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs sm:text-sm backdrop-blur-[1px]">
                <div className="px-4 py-2 bg-[#133E2B]/90 rounded-xl flex items-center gap-2 border border-white/20 shadow-md">
                  <Maximize2 className="w-4 h-4 text-[#E8C547]" />
                  <span>{lang === 'bn' ? 'স্ক্রিনশটটি বড় করে দেখুন' : 'Click to View Fullscreen'}</span>
                </div>
              </div>

              {/* Platform Tag Badge */}
              <div className="absolute top-4 left-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-xs ${badge.bg}`}>
                  <span>{badge.icon}</span>
                  <span>{badge.label}</span>
                </span>
              </div>
            </div>

            {/* Content & Testimonial Details */}
            <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-[#E8E2D8] bg-[#FAF8F5]">
              <div className="space-y-4">
                
                {/* Star rating */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= (current.rating || 5) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold text-[#133E2B] ml-1.5">৫.০ / ৫.০</span>
                </div>

                {/* Title */}
                <h3 className="font-extrabold text-lg sm:text-xl text-[#133E2B]">
                  {current.title || (lang === 'bn' ? 'যাচাইকৃত কাস্টমার রিভিউ' : 'Verified Customer Review')}
                </h3>

                {/* Caption quote */}
                {current.caption && (
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium italic border-l-3 border-[#D4AF37] pl-3">
                    {current.caption}
                  </p>
                )}

                {/* Customer name */}
                {current.customerName && (
                  <div className="pt-2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#133E2B] text-[#E8C547] text-xs font-bold flex items-center justify-center">
                      ✓
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-[#133E2B]">
                        {current.customerName}
                      </p>
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{lang === 'bn' ? 'সরাসরি প্ল্যাটফর্ম চ্যাট' : 'Direct Verified Chat'}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom: Zoom button & Slide Counter */}
              <div className="pt-6 border-t border-[#E8E2D8] flex items-center justify-between">
                <button
                  onClick={() => {
                    playWhatsAppPingSound();
                    setLightboxImage(current);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F] hover:text-[#133E2B] transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'পূর্ণাঙ্গ ছবি দেখুন' : 'View Full Image'}</span>
                </button>

                <span className="text-xs font-bold text-gray-500">
                  {currentIndex + 1} / {total}
                </span>
              </div>

            </div>

          </div>

          {/* Navigation Arrows */}
          {total > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playWhatsAppPingSound();
                  prevSlide();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-white/95 hover:bg-white text-[#133E2B] rounded-full shadow-md border border-[#DDD5C7] flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-90"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playWhatsAppPingSound();
                  nextSlide();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-white/95 hover:bg-white text-[#133E2B] rounded-full shadow-md border border-[#DDD5C7] flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-90"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Dot Indicators */}
          {total > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-full">
              {reviews.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex ? 'bg-[#E8C547] w-5' : 'bg-white/60 hover:bg-white'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Bar */}
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#E8C547]">{lightboxImage.title}</span>
                {lightboxImage.customerName && (
                  <span className="text-xs text-gray-300">· {lightboxImage.customerName}</span>
                )}
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image */}
            <div className="relative bg-black rounded-2xl overflow-hidden border border-white/20 max-h-[80vh] flex items-center justify-center shadow-2xl">
              <img
                src={lightboxImage.imageUrl}
                alt={lightboxImage.title || 'Review Screenshot'}
                className="max-h-[78vh] w-auto object-contain"
              />
            </div>

            {/* Caption below */}
            {lightboxImage.caption && (
              <p className="mt-3 text-xs sm:text-sm text-center text-gray-300 max-w-xl italic">
                {lightboxImage.caption}
              </p>
            )}
          </div>
        </div>
      )}

    </section>
  );
};
