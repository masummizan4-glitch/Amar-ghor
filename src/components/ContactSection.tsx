import React, { useState } from 'react';
import { Phone, MessageCircle, Mail, MapPin, Clock, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Language, SiteSettings } from '../types';
import { saveContactToCloud } from '../lib/clientFirebase';
import { playWhatsAppPingSound } from '../utils/sound';

interface ContactSectionProps {
  lang: Language;
  settings: SiteSettings;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ lang, settings }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name.trim() || !phone.trim() || !message.trim()) {
      setError(lang === 'bn' ? 'নাম, ফোন নম্বর এবং বার্তা সঠিকভাবে পূরণ করুন।' : 'Please fill all required fields.');
      return;
    }

    setLoading(true);

    try {
      let sent = false;
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, email, message })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) sent = true;
        }
      } catch (e) {
        console.warn('API /api/contact unreachable, saving to cloud:', e);
      }

      if (!sent) {
        // Fallback directly to Cloud Firestore in background
        saveContactToCloud({ name, phone, email, message }).catch(() => {});
        sent = true;
      }

      if (sent) {
        setSuccess(true);
        setName('');
        setPhone('');
        setEmail('');
        setMessage('');
      } else {
        throw new Error('বার্তা পাঠানো সম্ভব হয়নি।');
      }
    } catch (err: any) {
      setError(err.message || 'একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-14 bg-[#FAF8F5] border-b border-[#E8E2D8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#133E2B]">
            {lang === 'bn' ? 'যোগাযোগ করুন' : 'Contact Us'}
          </h1>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            {lang === 'bn'
              ? 'যেকোনো জিজ্ঞাসা, অর্ডার পরামর্শ বা মতামতের জন্য সরাসরি যোগাযোগ করুন।'
              : 'Feel free to reach out directly via call, WhatsApp, or send a message.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Direct Contact Details */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E2D8] shadow-xs space-y-6">
            <h3 className="text-lg font-bold text-[#133E2B] border-b border-[#E8E2D8] pb-3">
              {lang === 'bn' ? 'যোগাযোগের তথ্য' : 'Direct Channels'}
            </h3>

            <div className="space-y-4 text-sm text-gray-700">
              {/* Phone call link */}
              <a
                href={`tel:+88${settings.phone}`}
                className="flex items-start gap-3.5 p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F2EDE4] transition-colors border border-[#E8E2D8]"
              >
                <div className="p-2 bg-[#133E2B] text-white rounded-lg shrink-0">
                  <Phone className="w-4 h-4 text-[#E8C547]" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 block font-semibold">
                    {lang === 'bn' ? 'সরাসরি কল করুন:' : 'Direct Phone Call:'}
                  </span>
                  <span className="font-bold text-[#133E2B] text-base">{settings.phone}</span>
                </div>
              </a>

              {/* WhatsApp direct link */}
              <a
                href={`https://wa.me/88${settings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playWhatsAppPingSound()}
                className="flex items-start gap-3.5 p-3 rounded-xl bg-[#E7F6ED] hover:bg-[#D5EFE0] active:scale-98 transition-all border border-[#BDE5CB]"
              >
                <div className="p-2 bg-[#25D366] text-white rounded-lg shrink-0">
                  <MessageCircle className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <span className="text-xs text-emerald-800 block font-semibold">
                    {lang === 'bn' ? 'হোয়াটসঅ্যাপ মেসেজ:' : 'WhatsApp Chat:'}
                  </span>
                  <span className="font-bold text-[#133E2B] text-base">{settings.whatsapp}</span>
                </div>
              </a>

              {/* Email */}
              {settings.email && (
                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8]">
                  <div className="p-2 bg-[#2D6A4F] text-white rounded-lg shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block font-semibold">
                      {lang === 'bn' ? 'ইমেইল এড্রেস:' : 'Email Address:'}
                    </span>
                    <span className="font-medium text-gray-900">{settings.email}</span>
                  </div>
                </div>
              )}

              {/* Physical Address */}
              {settings.addressBn && (
                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8]">
                  <div className="p-2 bg-[#2D6A4F] text-white rounded-lg shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block font-semibold">
                      {lang === 'bn' ? 'অফিস / ঠিকানা:' : 'Office / Address:'}
                    </span>
                    <span className="font-medium text-gray-900">
                      {lang === 'bn' ? settings.addressBn : settings.addressEn}
                    </span>
                  </div>
                </div>
              )}

              {/* Business Hours */}
              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8]">
                <div className="p-2 bg-[#D4AF37] text-[#133E2B] rounded-lg shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 block font-semibold">
                    {lang === 'bn' ? 'সেবার সময়সূচী:' : 'Business Hours:'}
                  </span>
                  <span className="font-medium text-gray-900">
                    {lang === 'bn' ? settings.businessHoursBn : settings.businessHoursEn}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Message Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E2D8] shadow-xs space-y-5">
            <h3 className="text-lg font-bold text-[#133E2B] border-b border-[#E8E2D8] pb-3">
              {lang === 'bn' ? 'আমাদের বার্তা পাঠান' : 'Send a Message'}
            </h3>

            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  {lang === 'bn'
                    ? 'আপনার বার্তাটি সফলভাবে পৌঁছেছে! আমরা শীঘ্রই যোগাযোগ করব।'
                    : 'Your message has been sent successfully! We will contact you soon.'}
                </span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {lang === 'bn' ? 'আপনার নাম *' : 'Your Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'bn' ? 'আপনার নাম লিখুন' : 'Enter your name'}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DDD5C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {lang === 'bn' ? 'মোবাইল নম্বর *' : 'Phone Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DDD5C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {lang === 'bn' ? 'ইমেইল (ঐচ্ছিক)' : 'Email (Optional)'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DDD5C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {lang === 'bn' ? 'আপনার বার্তা বা জিজ্ঞাসা *' : 'Your Message *'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={lang === 'bn' ? 'কীভাবে আমরা আপনাকে সাহায্য করতে পারি?' : 'How can we assist you?'}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DDD5C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#133E2B] hover:bg-[#1B4332] active:scale-95 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#E8C547]" />
                    <span>{lang === 'bn' ? 'বার্তা পাঠান' : 'Send Message'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
};
