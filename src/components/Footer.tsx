import React, { useState } from 'react';
import { Phone, MessageCircle, MapPin, Mail, ShieldCheck, X, Lock } from 'lucide-react';
import { Language, SiteSettings } from '../types';
import { BrandLogo } from './BrandLogo';
import { playWhatsAppPingSound } from '../utils/sound';

interface FooterProps {
  lang: Language;
  settings: SiteSettings;
  onNavigate: (tab: string) => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ lang, settings, onNavigate, onOpenAdmin }) => {
  const [activePolicy, setActivePolicy] = useState<string | null>(null);

  const policies: Record<string, { titleBn: string; titleEn: string; contentBn: string; contentEn: string }> = {
    privacy: {
      titleBn: 'গোপনীয়তা নীতি (Privacy Policy)',
      titleEn: 'Privacy Policy',
      contentBn: settings.privacyPolicyBn || 'আমরা আপনার ব্যক্তিগত তথ্যের সর্বোচ্চ সুরক্ষা নিশ্চিত করি। আপনার নাম, ঠিকানা ও ফোন নম্বর কেবল অর্ডার সরবরাহ এবং সেবা প্রদানের উদ্দেশ্যে ব্যবহৃত হয়।',
      contentEn: 'We are committed to protecting your privacy. Your personal information, such as name, phone number, and delivery address, is strictly used for order processing and delivery confirmation.'
    },
    terms: {
      titleBn: 'শর্তাবলি (Terms & Conditions)',
      titleEn: 'Terms & Conditions',
      contentBn: settings.termsBn || 'পণ্য গ্রহণের সময় অনুগ্রহ করে ডেলিভারি ম্যানের উপস্থিতিতে পণ্য দেখে নিন। কোনো ত্রুটি পরিলক্ষিত হলে সাথে সাথেই আমাদের জানান।',
      contentEn: 'Please inspect the ordered items upon delivery in front of the courier representative. Report any discrepancies immediately for swift resolution.'
    },
    shipping: {
      titleBn: 'ডেলিভারি ও শিপিং নীতি (Shipping Policy)',
      titleEn: 'Shipping & Delivery Policy',
      contentBn: settings.deliveryPricingType === 'flat_zone'
        ? `ঢাকার ভেতরে ডেলিভারি চার্জ মাত্র ৳${settings.deliveryInsideDhaka} (২৪-৪৮ ঘণ্টার মধ্যে সরবরাহ)। ঢাকার বাইরে জেলা সদরে ডেলিভারি চার্জ ৳${settings.deliveryOutsideDhaka} (২-৪ কার্যদিবসের মধ্যে সরবরাহ)। ক্যাশ অন ডেলিভারি সুবিধা প্রযোজ্য।`
        : `সারা বাংলাদেশে ১ কেজি পর্যন্ত কুরিয়ার চার্জ ৳${settings.deliveryBase1KgRate || 140} (হাফ কেজি অর্ডারে বিশেষ ছাড় ৳${settings.deliveryHalfKgRate || 120}, ১ কেজির বেশি হলে পরবর্তী প্রতি কেজিতে মাত্র +৳${settings.deliveryExtraPerKgRate || 20})। ক্যাশ অন ডেলিভারি সুবিধা প্রযোজ্য।`,
      contentEn: settings.deliveryPricingType === 'flat_zone'
        ? `Home delivery inside Dhaka: ৳${settings.deliveryInsideDhaka} (within 24-48 hours). Delivery outside Dhaka: ৳${settings.deliveryOutsideDhaka} (within 2-4 business days). Cash on delivery available across all supported zones.`
        : `Nationwide courier delivery: ৳${settings.deliveryBase1KgRate || 140} up to 1 kg (৳${settings.deliveryHalfKgRate || 120} for up to 500g, +৳${settings.deliveryExtraPerKgRate || 20} per additional kg). Cash on delivery available across all zones.`
    },
    refund: {
      titleBn: 'রিটার্ন ও রিফান্ড নীতি (Return & Refund)',
      titleEn: 'Return & Refund Policy',
      contentBn: settings.returnPolicyBn || 'পণ্য ভাঙা বা গুণগত মান যাচাইয়ে কোনো ঘাটতি পাওয়া গেলে ৭ দিনের মধ্যে সহজে রিটার্ন বা রিফান্ডের নিশ্চয়তা রয়েছে।',
      contentEn: 'We offer a 7-day hassle-free replacement or refund guarantee in case of damaged packaging or defective items upon delivery verification.'
    }
  };

  return (
    <footer className="bg-[#133E2B] text-emerald-100 pt-14 pb-8 border-t border-[#2D6A4F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <BrandLogo size="lg" dark logoUrl={settings.logoUrl} mode={settings.logoDisplayMode} />
            <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed max-w-sm">
              {lang === 'bn'
                ? 'বিশ্বস্ত উৎস থেকে বাছাইকৃত খাঁটি খাবার ও ঘরের সৌন্দর্য বাড়ানোর পণ্য—সবকিছু এক ঠিকানায়। আমাদের প্রতিশ্রুতি নিখাদ বিশুদ্ধতা ও আন্তরিক গ্রাহকসেবা।'
                : 'Authentic food items and refined home decor from trusted natural sources across Bangladesh.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-[#E8C547] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'bn' ? '১০০% খাঁটি ও নিরাপদ পণ্য' : '100% Genuine & Pure Products'}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {lang === 'bn' ? 'দ্রুত লিঙ্ক' : 'Quick Links'}
            </h3>
            <ul className="space-y-2 text-xs text-emerald-200">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-[#E8C547] transition-colors">
                  {lang === 'bn' ? 'হোম পেইজ' : 'Home'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shop')} className="hover:text-[#E8C547] transition-colors">
                  {lang === 'bn' ? 'সকল পণ্য' : 'Shop All'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('food')} className="hover:text-[#E8C547] transition-colors">
                  {lang === 'bn' ? 'খাঁটি খাবার' : 'Authentic Food'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('decor')} className="hover:text-[#E8C547] transition-colors">
                  {lang === 'bn' ? 'হোম ডেকোর' : 'Home Decor'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-[#E8C547] transition-colors">
                  {lang === 'bn' ? 'আমাদের সম্পর্কে' : 'About Us'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-[#E8C547] transition-colors">
                  {lang === 'bn' ? 'যোগাযোগ' : 'Contact'}
                </button>
              </li>
              {onOpenAdmin && (
                <li className="pt-1 border-t border-emerald-800/60">
                  <button
                    onClick={onOpenAdmin}
                    className="text-[#E8C547] hover:text-white transition-colors flex items-center gap-1.5 font-bold"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'অ্যাডমিন লগইন' : 'Admin Login'}</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Popular Categories */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {lang === 'bn' ? 'জনপ্রিয় ক্যাটাগরি' : 'Categories'}
            </h3>
            <ul className="space-y-2 text-xs text-emerald-200">
              <li>{lang === 'bn' ? 'প্রাকৃতিক চাক ভাঙ্গা মধু' : 'Natural Honey'}</li>
              <li>{lang === 'bn' ? 'খাঁটি দানাদার গাওয়া ও সরের ঘি' : 'Pure Granular Ghee'}</li>
              <li>{lang === 'bn' ? 'কোল্ডপ্রেস সরিষার তেল' : 'Cold-Pressed Mustard Oil'}</li>
              <li>{lang === 'bn' ? 'প্রিমিয়াম হানি নাটস ও সিড মিক্স' : 'Honey Nuts & Seeds Mix'}</li>
              <li>{lang === 'bn' ? 'মদিনার সুক্কারি ও আজওয়া খেজুর' : 'Premium Sukkari & Ajwa Dates'}</li>
              <li>{lang === 'bn' ? 'স্পেশাল আমসত্ত্ব চাটনি' : 'Special Amsotto Chutney'}</li>
            </ul>
          </div>

          {/* Contact Direct */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {lang === 'bn' ? 'যোগাযোগ ও অর্ডার' : 'Order & Support'}
            </h3>
            <ul className="space-y-2.5 text-xs text-emerald-200">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#E8C547] shrink-0" />
                <a href={`tel:+88${settings.phone}`} className="hover:text-white transition-colors">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                <a
                  href={`https://wa.me/88${settings.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => playWhatsAppPingSound()}
                  className="hover:text-white transition-colors"
                >
                  WhatsApp: {settings.whatsapp}
                </a>
              </li>
              {settings.email && (
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#E8C547] shrink-0" />
                  <span>{settings.email}</span>
                </li>
              )}
              {settings.addressBn && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#E8C547] shrink-0 mt-0.5" />
                  <span>{lang === 'bn' ? settings.addressBn : settings.addressEn}</span>
                </li>
              )}
            </ul>
          </div>

        </div>

        {/* Policies Row */}
        <div className="pt-8 border-t border-emerald-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-300">
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-center sm:justify-start">
            <button
              onClick={() => setActivePolicy('privacy')}
              className="hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              {lang === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
            </button>
            <button
              onClick={() => setActivePolicy('terms')}
              className="hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              {lang === 'bn' ? 'শর্তাবলি' : 'Terms & Conditions'}
            </button>
            <button
              onClick={() => setActivePolicy('shipping')}
              className="hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              {lang === 'bn' ? 'শিপিং পলিসি' : 'Shipping Policy'}
            </button>
            <button
              onClick={() => setActivePolicy('refund')}
              className="hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              {lang === 'bn' ? 'রিটার্ন পলিসি' : 'Return Policy'}
            </button>
          </div>

          <div className="text-center sm:text-right text-[11px] text-emerald-400">
            © {new Date().getFullYear()} আমার ঘর Online (Amar Ghor Online). All rights reserved.
          </div>
        </div>

      </div>

      {/* Policy Modal */}
      {activePolicy && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-gray-800 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-[#133E2B]">
                {lang === 'bn' ? policies[activePolicy].titleBn : policies[activePolicy].titleEn}
              </h3>
              <button
                onClick={() => setActivePolicy(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto">
              {lang === 'bn' ? policies[activePolicy].contentBn : policies[activePolicy].contentEn}
            </div>
            <div className="text-right pt-2 border-t">
              <button
                onClick={() => setActivePolicy(null)}
                className="px-4 py-1.5 bg-[#133E2B] text-white text-xs font-bold rounded-lg"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
