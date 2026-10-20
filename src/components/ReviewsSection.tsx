import React, { useState } from 'react';
import { Star, CheckCircle2, MessageSquare, ThumbsUp, Send, X, Plus, Filter, Sparkles, User, MapPin } from 'lucide-react';
import { CustomerReview, Language, Product } from '../types';
import { toBnNumber } from '../utils/formatters';
import { BD_DIVISIONS, BD_DISTRICTS } from './CheckoutModal';
import { playWhatsAppPingSound } from '../utils/sound';

interface ReviewsSectionProps {
  lang: Language;
  reviews: CustomerReview[];
  onAddReview: (review: Omit<CustomerReview, 'id' | 'createdAt'>) => Promise<boolean>;
  products?: Product[];
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  lang,
  reviews = [],
  onAddReview,
  products = []
}) => {
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('ঢাকা (Dhaka)');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate statistics
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '5.0';

  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const fourStarCount = reviews.filter((r) => r.rating === 4).length;
  const otherStarCount = reviews.filter((r) => r.rating < 4).length;

  const filteredReviews = reviews.filter((r) => {
    if (filterRating === 'all') return true;
    return r.rating === filterRating;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে আপনার নাম লিখুন।' : 'Please enter your name.');
      return;
    }
    if (!comment.trim() || comment.trim().length < 5) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে আপনার মতামত বিস্তারিত লিখুন (কমপক্ষে ৫ অক্ষর)।' : 'Please provide a detailed comment (min 5 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const ok = await onAddReview({
        name: name.trim(),
        district,
        rating,
        comment: comment.trim(),
        productName: selectedProduct || (lang === 'bn' ? 'সাধারণ কেনাকাটা' : 'General Purchase'),
        verifiedPurchase: true,
        approved: true
      });

      if (ok) {
        playWhatsAppPingSound();
        setSuccessMsg(true);
        setTimeout(() => {
          setSuccessMsg(false);
          setModalOpen(false);
          setName('');
          setComment('');
          setSelectedProduct('');
          setRating(5);
        }, 1800);
      } else {
        setErrorMsg(lang === 'bn' ? 'রিভিউ সাবমিট ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।' : 'Failed to submit review. Please try again.');
      }
    } catch {
      setErrorMsg(lang === 'bn' ? 'ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <section id="reviews-section" className="py-14 bg-white border-b border-[#E8E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header and Summary Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E8E2D8] pb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F] uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{lang === 'bn' ? 'গ্রাহকদের আস্থা ও অভিজ্ঞতা' : 'Customer Trust & Reviews'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#133E2B]">
              {lang === 'bn' ? 'কাস্টমার রিভিউ ও মতামত' : 'Customer Reviews & Feedback'}
            </h2>
            <p className="text-sm text-gray-600 mt-1 max-w-xl">
              {lang === 'bn'
                ? 'আমাদের খাঁটি খাবার ও গৃহসজ্জা সামগ্রী ব্যবহার করে গ্রাহকরা কী বলছেন জেনে নিন।'
                : 'Real experiences from customers who ordered our pure foods & decor collections.'}
            </p>
          </div>

          {/* Action: Write a review */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                playWhatsAppPingSound();
                setModalOpen(true);
              }}
              className="px-5 py-3 bg-[#133E2B] hover:bg-[#1B4332] active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#E8C547]" />
              <span>{lang === 'bn' ? 'আপনার রিভিউ দিন' : 'Write a Review'}</span>
            </button>
          </div>
        </div>

        {/* Rating Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#FAF8F5] rounded-3xl p-6 sm:p-8 border border-[#E8E2D8]">
          {/* Average Rating Box */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-[#E8E2D8]">
            <div className="text-5xl sm:text-6xl font-black text-[#133E2B]">
              {lang === 'bn' ? toBnNumber(avgRating) : avgRating}
            </div>
            <div className="flex items-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 fill-[#D4AF37] text-[#D4AF37]" />
              ))}
            </div>
            <p className="text-xs text-gray-600 font-semibold">
              {lang === 'bn'
                ? `সর্বমোট ${toBnNumber(totalReviews)}টি সন্তুষ্ট গ্রাহক রিভিউ`
                : `Based on ${totalReviews} verified reviews`}
            </p>
            <span className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'bn' ? '১০০% পরীক্ষিত খাঁটি পণ্য' : '100% Authentic Quality'}</span>
            </span>
          </div>

          {/* Breakdown Bars & Filters */}
          <div className="md:col-span-8 flex flex-col justify-center space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                <span>{lang === 'bn' ? '৫ স্টার রিভিউ' : '5 Star Reviews'}</span>
              </span>
              <span>{toBnNumber(fiveStarCount)} টি</span>
            </div>
            <div className="w-full bg-[#E8E2D8] rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#2D6A4F] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${totalReviews > 0 ? (fiveStarCount / totalReviews) * 100 : 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 pt-1">
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                <span>{lang === 'bn' ? '৪ স্টার রিভিউ' : '4 Star Reviews'}</span>
              </span>
              <span>{toBnNumber(fourStarCount)} টি</span>
            </div>
            <div className="w-full bg-[#E8E2D8] rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#D4AF37] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${totalReviews > 0 ? (fourStarCount / totalReviews) * 100 : 0}%` }}
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#E8E2D8]">
              <span className="text-xs font-bold text-gray-600 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>{lang === 'bn' ? 'ফিল্টার:' : 'Filter:'}</span>
              </span>
              <button
                onClick={() => setFilterRating('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterRating === 'all'
                    ? 'bg-[#133E2B] text-white'
                    : 'bg-white text-gray-700 border border-[#DDD5C7] hover:bg-[#F2EDE4]'
                }`}
              >
                {lang === 'bn' ? 'সকল রিভিউ' : 'All Reviews'} ({toBnNumber(totalReviews)})
              </button>
              <button
                onClick={() => setFilterRating(5)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  filterRating === 5
                    ? 'bg-[#133E2B] text-white'
                    : 'bg-white text-gray-700 border border-[#DDD5C7] hover:bg-[#F2EDE4]'
                }`}
              >
                <span>৫ স্টার</span>
                <Star className="w-3 h-3 fill-current" />
              </button>
              <button
                onClick={() => setFilterRating(4)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  filterRating === 4
                    ? 'bg-[#133E2B] text-white'
                    : 'bg-white text-gray-700 border border-[#DDD5C7] hover:bg-[#F2EDE4]'
                }`}
              >
                <span>৪ স্টার</span>
                <Star className="w-3 h-3 fill-current" />
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-[#FAF8F5] rounded-3xl border border-[#E8E2D8] text-gray-500">
              <p className="text-sm">
                {lang === 'bn' ? 'কোনো রিভিউ পাওয়া যায়নি।' : 'No reviews found.'}
              </p>
            </div>
          ) : (
            filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#FAF8F5] rounded-2xl p-5 sm:p-6 border border-[#E8E2D8] hover:border-[#D4AF37] transition-all flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-xs"
              >
                <div className="space-y-3">
                  {/* Top: Avatar, Name, District & Stars */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#133E2B] text-[#E8C547] font-bold text-sm flex items-center justify-center shrink-0">
                        {rev.name ? rev.name.charAt(0).toUpperCase() : 'ক'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#133E2B] flex items-center gap-1.5">
                          <span>{rev.name}</span>
                          {rev.verifiedPurchase && (
                            <span title="যাচাইকৃত ক্রেতা">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline-block" />
                            </span>
                          )}
                        </h4>
                        {rev.district && (
                          <p className="text-[11px] text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#2D6A4F]" />
                            <span>{rev.district}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Product Tag */}
                  {rev.productName && (
                    <div className="inline-block bg-white px-2.5 py-1 rounded-md border border-[#E8E2D8] text-[11px] font-semibold text-[#2D6A4F]">
                      📦 {rev.productName}
                    </div>
                  )}

                  {/* Comment */}
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed italic">
                    “{rev.comment}”
                  </p>
                </div>

                {/* Footer Date & Verified Badge */}
                <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-[11px] text-gray-500">
                  <span>{formatDate(rev.createdAt)}</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{lang === 'bn' ? 'যাচাইকৃত অর্ডার' : 'Verified Order'}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Review Submission Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#DDD5C7] space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#F2EDE4] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#133E2B] text-[#E8C547] rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#133E2B]">
                    {lang === 'bn' ? 'আপনার রিভিউ প্রদান করুন' : 'Leave Your Review'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {lang === 'bn' ? 'আমাদের পণ্য ও সেবা সম্পর্কে মতামত জানান' : 'Share your authentic experience'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMsg ? (
              <div className="p-6 text-center space-y-3 bg-[#E7F6ED] rounded-2xl border border-[#BDE5CB]">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-emerald-900">
                  {lang === 'bn' ? 'ধন্যবাদ! আপনার রিভিউ গৃহীত হয়েছে।' : 'Thank you! Review submitted successfully.'}
                </h4>
                <p className="text-xs text-emerald-700">
                  {lang === 'bn' ? 'আপনার মূল্যবান মতামত ওয়েবসাইটের কাস্টমার রিভিউতে যুক্ত করা হয়েছে।' : 'Your feedback has been added to our customer reviews.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                    {errorMsg}
                  </div>
                )}

                {/* Rating Stars Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {lang === 'bn' ? 'রেটিং দিন (স্টার নির্বাচন করুন):' : 'Select Rating:'}
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 transition-transform hover:scale-115 cursor-pointer"
                        aria-label={`${star} star`}
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= (hoverRating ?? rating)
                              ? 'fill-[#D4AF37] text-[#D4AF37]'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-[#133E2B] ml-2">
                      {lang === 'bn' ? `${toBnNumber(rating)} স্টার` : `${rating} Stars`}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'bn' ? 'আপনার নাম *' : 'Your Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: তানভীর আহমেদ' : 'e.g. Tanvir Ahmed'}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#DDD5C7] focus:outline-none focus:border-[#2D6A4F] bg-[#FAF8F5]"
                  />
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'bn' ? 'আপনার জেলা *' : 'Your District *'}
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#DDD5C7] focus:outline-none focus:border-[#2D6A4F] bg-[#FAF8F5]"
                  >
                    {BD_DIVISIONS.map((div) => (
                      <optgroup
                        key={div.divisionEn}
                        label={lang === 'bn' ? `${div.divisionBn} (${toBnNumber(div.districts.length)}টি জেলা)` : `${div.divisionEn} (${div.districts.length} Districts)`}
                      >
                        {div.districts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Product Name (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'bn' ? 'যে পণ্যটি কিনেছেন (ঐচ্ছিক):' : 'Product Purchased (Optional):'}
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#DDD5C7] focus:outline-none focus:border-[#2D6A4F] bg-[#FAF8F5]"
                  >
                    <option value="">{lang === 'bn' ? 'পণ্য নির্বাচন করুন...' : 'Select product...'}</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.nameBn}>{p.nameBn}</option>
                    ))}
                  </select>
                </div>

                {/* Review Comment */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'bn' ? 'আপনার বিস্তারিত মতামত *' : 'Your Detailed Review *'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={lang === 'bn' ? 'পণ্যের স্বাদ, ঘ্রাণ, খাঁটি হওয়ার অনুভূতি বা ডেলিভারি অভিজ্ঞতা লিখুন...' : 'Share your genuine experience...'}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#DDD5C7] focus:outline-none focus:border-[#2D6A4F] bg-[#FAF8F5]"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-[#FAF8F5] border border-[#DDD5C7] text-gray-700 font-bold text-xs sm:text-sm rounded-xl hover:bg-[#F2EDE4] transition-colors cursor-pointer"
                  >
                    {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 px-4 bg-[#133E2B] hover:bg-[#1B4332] active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-[#E8C547]" />
                    <span>{submitting ? (lang === 'bn' ? 'জমা হচ্ছে...' : 'Submitting...') : (lang === 'bn' ? 'রিভিউ জমা দিন' : 'Submit Review')}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </section>
  );
};
