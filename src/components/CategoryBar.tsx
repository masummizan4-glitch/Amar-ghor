import React from 'react';
import { Language } from '../types';

interface CategoryBarProps {
  lang: Language;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const CATEGORIES = [
  {
    id: 'all',
    nameBn: 'সকল পণ্য',
    nameEn: 'All Products',
    icon: '✨',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'natural_honey',
    nameBn: 'প্রাকৃতিক মধু',
    nameEn: 'Natural Honey',
    icon: '🍯',
    image: 'https://res.cloudinary.com/hcmtg1sc/image/upload/v1792005716/ChatGPT_Image_Sep_29_2026_09_43_29_PM.png'
  },
  {
    id: 'ghee',
    nameBn: 'ঘি',
    nameEn: 'Pure Ghee',
    icon: '🧈',
    image: 'https://res.cloudinary.com/hcmtg1sc/image/upload/v1792005762/Amar_Ghor_Pure_Granular_Ghee.png'
  },
  {
    id: 'mustard_oil',
    nameBn: 'সরিষার তেল',
    nameEn: 'Mustard Oil',
    icon: '🌻',
    image: 'https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006037/1790509356678.jpg'
  },
  {
    id: 'honey_nuts',
    nameBn: 'হানি নাটস',
    nameEn: 'Honey Nuts',
    icon: '🥜',
    image: 'https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006036/1790695244373.png'
  },
  {
    id: 'seeds_nuts',
    nameBn: 'সিড ও নাট মিক্স',
    nameEn: 'Seeds & Nuts Mix',
    icon: '🌰',
    image: 'https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006038/1791915557629.jpg'
  },
  {
    id: 'coconut_oil',
    nameBn: 'নারিকেল তেল',
    nameEn: 'Coconut Oil',
    icon: '🥥',
    image: 'https://res.cloudinary.com/hcmtg1sc/image/upload/v1792005838/1791739457980.jpg'
  },
  {
    id: 'dates',
    nameBn: 'খেজুর',
    nameEn: 'Premium Dates',
    icon: '🌴',
    image: 'https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006037/1787847283256.jpg'
  },
  {
    id: 'chutney',
    nameBn: 'আমসত্ত্ব চাটনি',
    nameEn: 'Mango Fruit Chutney',
    icon: '🥭',
    image: 'https://res.cloudinary.com/hcmtg1sc/image/upload/v1792005797/1791768902959.jpg'
  },
  {
    id: 'home_decor',
    nameBn: 'হোম ডেকোর',
    nameEn: 'Home Decor',
    icon: '🏺',
    image: 'https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006036/IMG-20260922-WA0000.jpg'
  }
];

export const CategoryBar: React.FC<CategoryBarProps> = ({
  lang,
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <section className="py-8 bg-white border-b border-[#E8E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#133E2B]">
              {lang === 'bn' ? 'পণ্য ক্যাটাগরি' : 'Product Categories'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {lang === 'bn' ? 'আপনার প্রয়োজনীয় খাদ্য ও গৃহসজ্জা সামগ্রী বেছে নিন' : 'Choose your desired authentic food & home decor items'}
            </p>
          </div>

          {selectedCategory !== 'all' && (
            <button
              onClick={() => onSelectCategory('all')}
              className="text-xs font-semibold text-[#2D6A4F] hover:text-[#133E2B] underline"
            >
              {lang === 'bn' ? 'সব দেখুন' : 'Show All'}
            </button>
          )}
        </div>

        {/* Scrollable / Grid Categories */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin pt-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[#133E2B] text-white border-[#133E2B] shadow-md scale-[1.02]'
                    : 'bg-[#FAF8F5] text-gray-800 border-[#E8E2D8] hover:border-[#2D6A4F] hover:bg-white'
                }`}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white border border-black/5 relative">
                  <img
                    src={cat.image}
                    alt={cat.nameBn}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center text-xs">
                    {cat.icon}
                  </div>
                </div>
                <div className="pr-1">
                  <div className="text-xs sm:text-sm font-bold whitespace-nowrap">
                    {lang === 'bn' ? cat.nameBn : cat.nameEn}
                  </div>
                  <div className={`text-[10px] whitespace-nowrap ${isSelected ? 'text-emerald-200' : 'text-gray-500'}`}>
                    {lang === 'bn' ? cat.nameEn : cat.nameBn}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
