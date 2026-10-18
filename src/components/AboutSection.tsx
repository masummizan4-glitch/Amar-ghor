import React from 'react';
import { ShieldCheck, Heart, Award, Sparkles } from 'lucide-react';
import { Language, SiteSettings } from '../types';

interface AboutSectionProps {
  lang: Language;
  settings: SiteSettings;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ lang, settings }) => {
  return (
    <section className="py-14 bg-white border-b border-[#E8E2D8]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{lang === 'bn' ? 'আমাদের গল্প ও অঙ্গীকার' : 'Our Story & Commitment'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#133E2B]">
            {lang === 'bn' ? 'আমাদের সম্পর্কে' : 'About Us'}
          </h1>
          <p className="text-sm font-semibold text-[#D4AF37]">
            {lang === 'bn' ? settings.taglineBn : settings.taglineEn}
          </p>
        </div>

        {/* Narrative Card */}
        <div className="bg-[#FAF8F5] rounded-3xl p-6 sm:p-10 border border-[#E8E2D8] space-y-6 text-gray-800 leading-relaxed shadow-xs">
          <div className="text-base sm:text-lg font-medium text-gray-800 leading-relaxed">
            {lang === 'bn' ? settings.aboutBn : settings.aboutEn}
          </div>

          <div className="border-t border-[#E8E2D8] pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-3.5 items-start">
              <div className="p-2.5 rounded-xl bg-white text-[#2D6A4F] border border-[#DDD5C7] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#133E2B]">
                  {lang === 'bn' ? 'শতভাগ বিশুদ্ধতা' : '100% Purity'}
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  {lang === 'bn'
                    ? 'কোনো প্রকার ভেজাল বা রাসায়নিক সংযোজন ছাড়া প্রকৃতি থেকে সরাসরি।'
                    : 'Directly sourced from trusted nature harvests without harmful chemicals.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="p-2.5 rounded-xl bg-white text-[#2D6A4F] border border-[#DDD5C7] shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#133E2B]">
                  {lang === 'bn' ? 'স্বচ্ছ মূল্য নীতি' : 'Fair Pricing'}
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  {lang === 'bn'
                    ? 'কোনো লুকায়িত চার্জ নেই, খাঁটি পণ্যের জন্য সঠিক ও ন্যায্য দাম।'
                    : 'Transparent, honest prices per kg with no hidden markups.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="p-2.5 rounded-xl bg-white text-[#2D6A4F] border border-[#DDD5C7] shrink-0">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#133E2B]">
                  {lang === 'bn' ? 'আন্তরিক সেবা' : 'Caring Support'}
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  {lang === 'bn'
                    ? 'প্রতিটি অর্ডারে গ্রাহকের সন্তুষ্টি ও আস্থা অর্জনই আমাদের সর্বোচ্চ অগ্রাধিকার।'
                    : 'Personalized assistance via phone and WhatsApp on every single order.'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
