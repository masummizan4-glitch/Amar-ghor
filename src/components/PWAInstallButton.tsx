import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share2, PlusSquare, Check, X, ShieldCheck, Sparkles, ExternalLink, Globe } from 'lucide-react';
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
  const { isInstallable, isInstalled, isIOS, isInAppBrowser, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If the app is already installed and running standalone from home screen, hide completely
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setInstalling(true);

    const hasPrompt = isInstallable || (typeof window !== 'undefined' && !!(window as any).__pwaDeferredPrompt);
    if (hasPrompt) {
      try {
        const ok = await install();
        setInstalling(false);
        if (ok) {
          setInstallSuccess(true);
          setTimeout(() => setInstallSuccess(false), 4000);
          onInstalled?.();
          return;
        }
      } catch (err) {
        console.warn('Install error:', err);
        setInstalling(false);
      }
    } else {
      setInstalling(false);
      setShowGuideModal(true);
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
                {lang === 'bn' ? 'আমার ঘর অ্যাপ ইনস্টল' : 'Install Amar Ghor App'}
              </span>
              <span className="block text-[10px] text-gray-500 font-medium">
                {lang === 'bn' ? '১-ক্লিকে সরাসরি মোবাইলেই ইনস্টল করুন' : '1-tap instant install on mobile'}
              </span>
            </div>
          </div>
          <span className="bg-[#133E2B] text-white text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 group-hover:bg-[#1B4332] shadow-2xs">
            <Download className="w-2.5 h-2.5 text-[#E8C547]" />
            <span>{installing ? '...' : (lang === 'bn' ? 'ইনস্টল' : 'Install')}</span>
          </span>
        </button>

        {showGuideModal && (
          <InstallGuideModal
            lang={lang}
            isIOS={isIOS}
            isInAppBrowser={isInAppBrowser}
            onClose={() => setShowGuideModal(false)}
          />
        )}
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
          <span>{lang === 'bn' ? 'আমার ঘর মোবাইল অ্যাপ ইনস্টল' : 'Install Amar Ghor Mobile App'}</span>
        </button>

        {showGuideModal && (
          <InstallGuideModal
            lang={lang}
            isIOS={isIOS}
            isInAppBrowser={isInAppBrowser}
            onClose={() => setShowGuideModal(false)}
          />
        )}
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
        <span className="bg-[#133E2B] text-[#E8C547] text-[9px] px-1.5 py-0.5 rounded-md font-bold">
          {lang === 'bn' ? 'ইনস্টল' : 'Install'}
        </span>
      </button>

      {installSuccess && (
        <div className="fixed top-20 right-4 z-50 bg-[#133E2B] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border border-emerald-400 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4 text-[#E8C547]" />
          <span>{lang === 'bn' ? 'ধন্যবাদ! অ্যাপটি আপনার মোবাইলে যুক্ত হয়েছে।' : 'Installed to Home Screen!'}</span>
        </div>
      )}

      {showGuideModal && (
        <InstallGuideModal
          lang={lang}
          isIOS={isIOS}
          isInAppBrowser={isInAppBrowser}
          onClose={() => setShowGuideModal(false)}
        />
      )}
    </>
  );
};

// Clean, elegant floating install banner on mobile with 1-tap direct installation
export const PWAFloatingBanner: React.FC<{ lang?: Language }> = ({ lang = 'bn' }) => {
  const { isInstallable, isInstalled, isIOS, isInAppBrowser, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installedToast, setInstalledToast] = useState(false);

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

  const handleDismiss = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDismissed(true);
    sessionStorage.setItem('amarghor_pwa_dismissed', 'true');
  };

  const handleInstallClick = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setInstalling(true);

    const hasPrompt = isInstallable || (typeof window !== 'undefined' && !!(window as any).__pwaDeferredPrompt);
    
    // Direct 1-tap install on Android Chrome
    if (hasPrompt) {
      try {
        const ok = await install();
        setInstalling(false);
        if (ok) {
          setInstalledToast(true);
          setTimeout(() => {
            setInstalledToast(false);
            setDismissed(true);
          }, 3500);
          return;
        }
      } catch (err) {
        console.warn('Direct install failed:', err);
        setInstalling(false);
      }
    } else {
      setInstalling(false);
      // Fallback for iOS Safari or in-app webviews (FB/Messenger)
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-40 animate-in slide-in-from-bottom-3 duration-300">
        <div className="bg-white/95 backdrop-blur-md border border-emerald-900/20 p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-2.5">
          {/* Logo & Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/pwa-192x192.png"
              alt="আমার ঘর"
              className="w-10 h-10 rounded-xl shadow-xs border border-emerald-900/10 object-cover shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h5 className="font-extrabold text-xs text-[#133E2B] truncate">
                  {lang === 'bn' ? 'আমার ঘর অ্যাপ' : 'Amar Ghor App'}
                </h5>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded-md">
                  FREE
                </span>
              </div>
              <p className="text-[10px] text-gray-500 truncate">
                {lang === 'bn' ? '১-ক্লিকে সরাসরি মোবাইলে ইনস্টল করুন' : '1-tap fast mobile installation'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={installing}
              className="px-3.5 py-2 bg-[#133E2B] hover:bg-[#1B4332] active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
            >
              <Download className="w-3.5 h-3.5 text-[#E8C547]" />
              <span>{installing ? '...' : (lang === 'bn' ? 'ইনস্টল' : 'Install')}</span>
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

      {installedToast && (
        <div className="fixed top-20 right-4 z-50 bg-[#133E2B] text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold border border-[#E8C547]/50 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4 text-[#E8C547]" />
          <span>{lang === 'bn' ? 'ধন্যবাদ! অ্যাপটি আপনার মোবাইলে যুক্ত হয়েছে।' : 'Amar Ghor App installed successfully!'}</span>
        </div>
      )}

      {showGuideModal && (
        <InstallGuideModal
          lang={lang}
          isIOS={isIOS}
          isInAppBrowser={isInAppBrowser}
          onClose={() => setShowGuideModal(false)}
        />
      )}
    </>
  );
};

// Customer-friendly, minimal installation guide sheet (only shown when browser doesn't allow automatic prompt, like iOS Safari)
export const InstallGuideModal: React.FC<{
  lang: Language;
  isIOS: boolean;
  isInAppBrowser?: boolean;
  onClose: () => void;
}> = ({
  lang,
  isIOS,
  isInAppBrowser = false,
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
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-[#DDD5C7] space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/pwa-192x192.png"
              alt="আমার ঘর"
              className="w-9 h-9 rounded-xl shadow-xs border border-emerald-900/10 object-cover"
            />
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-[#133E2B]">
                {lang === 'bn' ? "'আমার ঘর' অ্যাপ ইনস্টল" : "Install 'Amar Ghor' App"}
              </h4>
              <p className="text-[11px] text-gray-500 font-medium">
                {isIOS ? 'iPhone / iPad (Safari)' : 'Android (Google Chrome)'}
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

        {/* If opened inside Facebook/Messenger in-app browser */}
        {isInAppBrowser ? (
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
            <p className="text-xs font-bold text-amber-900">
              {lang === 'bn'
                ? 'ফেসবুক/মেসেঞ্জারের ভেতর থেকে অ্যাপ সরাসরি ইনস্টল করা যায় না। ক্রোম ব্রাউজারে খুলুন:'
                : 'In-app browsers do not support direct installs. Open in Google Chrome:'}
            </p>
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 bg-[#133E2B] hover:bg-[#1B4332] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all text-center cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#E8C547]" />
              <span>{lang === 'bn' ? 'ক্রোম ব্রাউজারে খুলুন' : 'Open in Chrome Browser'}</span>
            </a>
          </div>
        ) : isIOS ? (
          // iPhone / Safari 2-step easy instructions
          <div className="space-y-2.5 text-xs text-gray-700">
            <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D8] flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#133E2B] text-white font-black flex items-center justify-center text-xs shrink-0 mt-0.5">১</span>
              <div>
                <p className="font-bold text-gray-900 text-xs">
                  {lang === 'bn' ? 'সাফারি ব্রাউজারের নিচে শেয়ার বাটনে চাপুন' : 'Tap Safari Share button'}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                  <span>স্ক্রিনের নিচে</span>
                  <Share2 className="w-3.5 h-3.5 text-blue-600 inline" />
                  <span>আইকনটিতে ট্যাপ করুন।</span>
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D8] flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#133E2B] text-white font-black flex items-center justify-center text-xs shrink-0 mt-0.5">২</span>
              <div>
                <p className="font-bold text-gray-900 text-xs">
                  {lang === 'bn' ? '"Add to Home Screen" চাপুন' : 'Tap "Add to Home Screen"'}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                  <PlusSquare className="w-3.5 h-3.5 text-gray-700 inline" />
                  <span>বাটনে চাপলে ফোনে অ্যাপ যুক্ত হবে।</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Android Chrome 2-step easy instructions (if auto-prompt was dismissed earlier)
          <div className="space-y-2.5 text-xs text-gray-700">
            <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D8] flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#133E2B] text-white font-black flex items-center justify-center text-xs shrink-0 mt-0.5">১</span>
              <div>
                <p className="font-bold text-gray-900 text-xs">
                  {lang === 'bn' ? 'ক্রোম ব্রাউজারে ৩টি ডট (মেনু ⋮) চাপুন' : 'Tap Chrome 3-dots Menu (⋮)'}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {lang === 'bn' ? 'উপরে ডানদিকের কোণায় ৩ ডটে (⋮) ট্যাপ করুন।' : 'At the top-right corner of Chrome.'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D8] flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#133E2B] text-white font-black flex items-center justify-center text-xs shrink-0 mt-0.5">২</span>
              <div>
                <p className="font-bold text-gray-900 text-xs">
                  {lang === 'bn' ? '"Install app" (বা Add to Home screen) চাপুন' : 'Tap "Install app" or "Add to Home screen"'}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {lang === 'bn'
                    ? "সরাসরি আপনার মোবাইলে 'আমার ঘর' অ্যাপ যুক্ত হয়ে যাবে!"
                    : "The app will be added directly to your phone."}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-2 text-[11px] text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{lang === 'bn' ? 'কোনো স্টোরেজ খরচ নেই, সম্পূর্ণ নিরাপদ ও দ্রুতগতির।' : 'Fast, secure and takes minimal storage.'}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-[#133E2B] hover:bg-[#1B4332] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          {lang === 'bn' ? 'ঠিক আছে' : 'OK, Close'}
        </button>
      </div>
    </div>
  );
};
