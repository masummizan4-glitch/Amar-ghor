import React, { useState } from 'react';
import { MessageCircle, Phone, X } from 'lucide-react';
import { Language } from '../types';
import { playWhatsAppPingSound } from '../utils/sound';

interface FloatingWhatsAppProps {
  phone: string;
  lang: Language;
  hasBottomBar?: boolean;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({ phone, lang, hasBottomBar = false }) => {
  const [openPopup, setOpenPopup] = useState(false);
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const intPhone = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;

  return (
    <div className={`fixed ${hasBottomBar ? 'bottom-20 sm:bottom-6' : 'bottom-4 sm:bottom-6'} right-3 sm:right-6 z-40 flex flex-col items-end gap-2 safe-pb transition-all duration-300`}>
      {/* Quick chat popup helper */}
      {openPopup && (
        <div className="bg-white rounded-2xl shadow-2xl border border-[#DDD5C7] p-4 w-[calc(100vw-2rem)] max-w-xs sm:w-72 mb-2 animate-in slide-in-from-bottom-3 duration-200 text-gray-800">
          <div className="flex items-center justify-between border-b border-[#F2EDE4] pb-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-[#133E2B]">
                {lang === 'bn' ? 'আমার ঘর অনলাইন হেল্পডেস্ক' : 'Amar Ghor Helpdesk'}
              </span>
            </div>
            <button
              onClick={() => setOpenPopup(false)}
              className="text-gray-400 hover:text-gray-600 p-0.5"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            {lang === 'bn'
              ? 'আসসালামু আলাইকুম! খাঁটি খাবার বা হোম ডেকোর পণ্য সম্পর্কে কোনো তথ্য জানতে চান? সরাসরি হোয়াটসঅ্যাপে মেসেজ দিন।'
              : 'Assalamu Alaikum! Inquiring about our pure foods or decor? Chat with us directly on WhatsApp.'}
          </p>

          <div className="space-y-2">
            <a
              href={`https://wa.me/${intPhone}?text=${encodeURIComponent(
                'আসসালামু আলাইকুম! আমার ঘর Online থেকে পণ্য সংক্রান্ত তথ্য জানতে চাচ্ছি।'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playWhatsAppPingSound()}
              className="w-full py-2 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপে চ্যাট করুন' : 'Chat on WhatsApp'}</span>
            </a>

            <a
              href={`tel:+${intPhone}`}
              className="w-full py-2 px-3 bg-[#FAF8F5] hover:bg-[#F2EDE4] text-[#133E2B] font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-[#DDD5C7] transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>{lang === 'bn' ? 'সরাসরি কল করুন (01742749028)' : 'Direct Call (01742749028)'}</span>
            </a>
          </div>
        </div>
      )}

      {/* Main floating action buttons */}
      <div className="flex items-center gap-2">
        <a
          href={`tel:+${intPhone}`}
          className="p-3 bg-white text-[#133E2B] rounded-full shadow-lg border border-[#DDD5C7] hover:bg-[#FAF8F5] active:scale-90 transition-all flex items-center justify-center"
          title="কল করুন"
          aria-label="Call Now"
        >
          <Phone className="w-5 h-5 text-[#2D6A4F]" />
        </a>

        <button
          onClick={() => {
            playWhatsAppPingSound();
            setOpenPopup(!openPopup);
          }}
          className="p-3.5 bg-[#25D366] text-white rounded-full shadow-xl hover:bg-[#1EBE5D] active:scale-95 transition-all flex items-center justify-center relative group"
          title="WhatsApp Order"
          aria-label="WhatsApp Support"
        >
          <MessageCircle className="w-6 h-6 fill-current" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
          </span>
        </button>
      </div>
    </div>
  );
};
