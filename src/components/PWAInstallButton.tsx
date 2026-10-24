import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share2, PlusSquare, Check, X, ShieldCheck, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../types';

interface PWAInstallProps {
  lang?: Language;
  variant?: 'header' | 'mobile_menu' | 'footer' | 'floating_banner';
  onInstalled?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallProps> = ({
  lang = 'bn',
  variant = 'header',
  onInstalled,
}) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If the app is already installed and running standalone from home screen, hide completely
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
        onInstalled?.();
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Fallback: show instructions modal
      setShowIOSModal(true);
    }
  };

  // 1. Mobile Menu Drawer Item
  if (variant === 'mobile_menu') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full mt-2 py-2.5 px-3.5 bg-gradient-to-r from-emerald-50 to-[#FAF8F5] hover:from-emerald-100/70 hover:to-emerald-50 text-[#133E2B] font-bold text-xs rounded-xl border border-emerald-300/80 flex items-center justify-between transition-all shadow-2xs group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#133E2B] text-[#E8C547] flex items-center justify-center shrink-0 shadow-2xs">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="block leading-tight font-extrabold text-[#133E2B]">
                {lang === 'bn' ? 'হোমস্ক্রিনে অ্যাপ যোগ করুন' : 'Add App to Home Screen'}
              </span>
              <span className="block text-[10px] text-gray-500 font-medium">
                {lang === 'bn' ? 'এক ক্লিকে মোবাইল থেকে প্রবেশের সুবিধা' : '1-tap instant mobile access'}
              </span>
            </div>
          </div>
          <span className="bg-[#133E2B] text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 group-hover:bg-[#1B4332]">
            <Download className="w-2.5 h-2.5 text-[#E8C547]" />
            <span>{lang === 'bn' ? 'ইনস্টল' : 'Install'}</span>
          </span>
        </button>

        {showIOSModal && <InstallGuideModal lang={lang} isIOS={isIOS} isInIframe={isInIframe} onClose={() => setShowIOSModal(false)} />}
      </>
    );
  }

  // 2. Footer Link
  if (variant === 'footer') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className="inline-flex items-center gap-2 text-xs text-emerald-200/90 hover:text-white transition-colors cursor-pointer py-1"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#E8C547]" />
          <span>{lang === 'bn' ? 'মোবাইল হোমস্ক্রিন অ্যাপ ডাউনলোড' : 'Download Mobile Home Screen App'}</span>
        </button>

        {showIOSModal && <InstallGuideModal lang={lang} isIOS={isIOS} isInIframe={isInIframe} onClose={() => setShowIOSModal(false)} />}
      </>
    );
  }

  // 3. Compact Header Button (Default)
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#EAE2D4] text-[#133E2B] text-xs font-bold rounded-xl border border-[#DDD5C7] transition-all shadow-2xs cursor-pointer active:scale-95"
        title={lang === 'bn' ? 'মোবাইলের হোমস্ক্রিনে অ্যাপ হিসেবে রাখুন' : 'Install App to Home Screen'}
      >
        <Smartphone className="w-3.5 h-3.5 text-[#2D6A4F]" />
        <span className="hidden md:inline">{lang === 'bn' ? 'অ্যাপ ডাউনলোড' : 'App'}</span>
        <span className="bg-[#133E2B] text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold">
          {lang === 'bn' ? 'PWA' : 'PWA'}
        </span>
      </button>

      {installSuccess && (
        <div className="fixed top-20 right-4 z-50 bg-[#133E2B] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border border-emerald-400 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4 text-[#E8C547]" />
          <span>{lang === 'bn' ? 'সফলভাবে হোমস্ক্রিনে যোগ হয়েছে!' : 'Installed to Home Screen!'}</span>
        </div>
      )}

      {showIOSModal && <InstallGuideModal lang={lang} isIOS={isIOS} isInIframe={isInIframe} onClose={() => setShowIOSModal(false)} />}
    </>
  );
};

// Subtle, clean floating install banner on mobile (appears non-intrusively after scroll)
export const PWAFloatingBanner: React.FC<{ lang?: Language }> = ({ lang = 'bn' }) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if user dismissed it in this session
    const wasDismissed = sessionStorage.getItem('amarghor_pwa_dismissed');
    if (wasDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  if (isInstalled || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('amarghor_pwa_dismissed', 'true');
  };

  const handleInstall = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-40 animate-in slide-in-from-bottom-3 duration-300">
        <div className="bg-white/95 backdrop-blur-md border border-[#E8E2D8] p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#133E2B] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5 text-[#E8C547]" />
            </div>
            <div className="min-w-0">
              <h5 className="font-extrabold text-xs text-[#133E2B] truncate">
                {lang === 'bn' ? 'হোমস্ক্রিনে রাখুন' : 'Add to Home Screen'}
              </h5>
              <p className="text-[10px] text-gray-500 truncate">
                {lang === 'bn' ? 'অ্যাপের মতো সহজে এক ক্লিকে ব্যবহারের জন্য' : 'Fast 1-tap app access anytime'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstall}
              className="px-3 py-1.5 bg-[#133E2B] hover:bg-[#1B4332] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3 text-[#E8C547]" />
              <span>{lang === 'bn' ? 'ইনস্টল' : 'Install'}</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition-colors cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showIOSModal && <InstallGuideModal lang={lang} isIOS={isIOS} isInIframe={isInIframe} onClose={() => setShowIOSModal(false)} />}
    </>
  );
};

// Universal visual guide modal for iOS Safari and Android Chrome
export const InstallGuideModal: React.FC<{
  lang: Language;
  isIOS: boolean;
  isInIframe?: boolean;
  onClose: () => void;
}> = ({
  lang,
  isIOS,
  isInIframe: _isInIframe,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const directUrl = typeof window !== 'undefined'
    ? (window.location.origin || window.location.href)
    : 'https://ais-pre-gbnhtenxaui7tam4bmt64b-375809004900.asia-southeast1.run.app';

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(directUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#DDD5C7] space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#133E2B] text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-5 h-5 text-[#E8C547]" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-[#133E2B]">
                {lang === 'bn' ? "'আমার ঘর' অ্যাপ ইনস্টল করুন" : "Install 'Amar Ghor' App"}
              </h4>
              <p className="text-[11px] text-gray-500 font-medium">
                {isIOS ? 'iPhone / iPad (Safari ব্রাউজার)' : 'Android (Google Chrome ব্রাউজার)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-black rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual App Identity Banner */}
        <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-emerald-900/15 flex items-center gap-3 shadow-2xs">
          <img
            src="/pwa-192x192.png"
            alt="আমার ঘর"
            className="w-12 h-12 rounded-xl shadow-xs border border-emerald-900/10 object-cover shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-block px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                {lang === 'bn' ? 'অফিসিয়াল অ্যাপ' : 'Official Web App'}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">100% Free</span>
            </div>
            <h5 className="font-extrabold text-sm text-[#133E2B] truncate mt-0.5">
              আমার ঘর Online
            </h5>
            <p className="text-[11px] text-gray-600 truncate">
              {lang === 'bn' ? 'হোমস্ক্রিনের নাম হবে: ' : 'Home screen title: '}
              <strong className="text-gray-900 font-extrabold">আমার ঘর</strong>
            </p>
          </div>
        </div>

        {/* Root Cause Explanation for the Google Studio / 'R' icon */}
        <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-2 text-left">
          <div className="flex items-start gap-2">
            <span className="text-base shrink-0">💡</span>
            <div>
              <p className="font-extrabold text-xs text-amber-950">
                {lang === 'bn'
                  ? "কেন আগে 'গুগল স্টুডিও' বা ধূসর 'R' আইকন এসেছিল?"
                  : "Why did you see 'Google Studio' or an 'R' icon previously?"}
              </p>
              <p className="text-[11px] text-amber-900 leading-relaxed mt-1">
                {lang === 'bn'
                  ? "আপনি গুগল এআই স্টুডিওর এডিটর স্ক্রিনের ভেতর থাকায় ব্রাউজার মূল এডিটরকে শর্টকাট করেছিল। সরাসরি নিজস্ব 'আমার ঘর' লোগোসহ ইনস্টল করতে নিচে ক্রোম ব্রাউজারে খুলুন:"
                  : "Because the page was opened inside the AI Studio frame. To install cleanly as 'Amar Ghor', open directly in Google Chrome:"}
              </p>
            </div>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row items-stretch gap-2">
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-3 bg-[#133E2B] hover:bg-[#1B4332] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all text-center cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#E8C547]" />
              <span>{lang === 'bn' ? 'ক্রোম ব্রাউজারে সরাসরি খুলুন' : 'Open in Chrome Browser'}</span>
            </a>
            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2.5 px-3 bg-white hover:bg-gray-50 border border-amber-300 text-amber-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">{lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-amber-800" />
                  <span>{lang === 'bn' ? 'লিংক কপি করুন' : 'Copy Link'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {isIOS ? (
          // iOS Safari Instructions
          <div className="space-y-2 text-xs text-gray-700">
            <h6 className="font-extrabold text-xs text-gray-900">আইফোনে সেভ করার নিয়ম:</h6>
            <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8] flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#133E2B] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">১</span>
              <div>
                <p className="font-bold text-gray-900 text-xs">
                  {lang === 'bn' ? 'সাফারি ব্রাউজারের নিচে শেয়ার বাটনে চাপুন' : 'Tap Safari Share button'}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                  <span>নিচে</span>
                  <Share2 className="w-3.5 h-3.5 text-blue-600 inline" />
                  <span>আইকনটিতে ট্যাপ করুন।</span>
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8] flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#133E2B] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">২</span>
              <div>
                <p className="font-bold text-gray-900 text-xs">
                  {lang === 'bn' ? '"Add to Home Screen" অপশনটি বেছে নিন' : 'Tap "Add to Home Screen"'}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                  <span>মেনু স্ক্রোল করে</span>
                  <PlusSquare className="w-3.5 h-3.5 text-gray-700 inline" />
                  <span>বাটনে চাপুন।</span>
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8] flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#133E2B] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">৩</span>
              <div>
                <p className="font-bold text-gray-900 text-xs">
                  {lang === 'bn' ? 'উপরে "Add" চাপুন' : 'Tap "Add" at the top right'}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {lang === 'bn'
                    ? 'আপনার হোমস্ক্রিনে "আমার ঘর" অ্যাপ যোগ হয়ে যাবে।'
                    : 'The app icon will appear on your phone home screen.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Android Chrome Instructions
          <div className="space-y-2 text-xs text-gray-700">
            <h6 className="font-extrabold text-xs text-gray-900">
              {lang === 'bn' ? 'অ্যান্ড্রয়েড ফোনে সঠিক ইনস্টল পদ্ধতি:' : 'Android Installation Steps:'}
            </h6>
            
            <div className="p-2.5 bg-red-50/80 rounded-xl border border-red-200 flex items-start gap-2 text-[11px] text-red-900">
              <span className="shrink-0 font-bold">🗑️</span>
              <p>
                {lang === 'bn'
                  ? "প্রথমে ফোনের স্ক্রিনে আগের যে ধূসর 'R' বা গুগল স্টুডিও শর্টকাটটি এসেছে, সেটির উপর চেপে ধরে 'Remove/Delete' করে দিন।"
                  : "First, remove the old grey 'R' or Google Studio shortcut from your home screen."}
              </p>
            </div>

            <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8] flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#133E2B] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">১</span>
              <div>
                <p className="font-bold text-gray-900 text-xs">
                  {lang === 'bn' ? 'ক্রোম ব্রাউজারে ৩টি ডট (Menu ⋮) চাপুন' : 'Tap Chrome 3-dots Menu'}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {lang === 'bn' ? 'ডানদিকের কোণায় ৩ ডটে (⋮) ট্যাপ করুন।' : 'At the top-right of your screen.'}
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8] flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#133E2B] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">২</span>
              <div>
                <p className="font-bold text-gray-900 text-xs">
                  {lang === 'bn' ? '"Install app" (বা "Add to Home screen") চাপুন' : 'Tap "Install app" or "Add to Home screen"'}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {lang === 'bn'
                    ? "সেখানে 'আমার ঘর' এবং সবুজ লোগো দেখতে পাবেন। 'Install' চাপলেই অ্যাপটি সরাসরি ইনস্টল হয়ে যাবে!"
                    : "Confirm install to add Amar Ghor to your home screen."}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-2 text-[11px] text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{lang === 'bn' ? 'কোনো স্টোরেজ খরচ নেই, লাইটওয়েট এবং অফলাইনেও কাজ করে।' : 'Lightweight, offline-capable official PWA.'}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-[#133E2B] hover:bg-[#1B4332] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          {lang === 'bn' ? 'বুঝেছি, বন্ধ করুন' : 'Got it, close'}
        </button>
      </div>
    </div>
  );
};

