import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && (window as any).__pwaDeferredPrompt) {
      return (window as any).__pwaDeferredPrompt;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInIframe, setIsInIframe] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  });
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already running as installed app on home screen)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS devices (iPhone, iPad, iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Detect in-app browsers (Facebook, Instagram, Messenger, WeChat, Line)
    const inApp = /fban|fbav|instagram|messenger|line|micromessenger|wechat/i.test(userAgent);
    setIsInAppBrowser(inApp);

    // Check iframe status
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    // Sync from global window object if already captured before React mount
    if ((window as any).__pwaDeferredPrompt) {
      setDeferredPrompt((window as any).__pwaDeferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as any).__pwaDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handlePromptReady = () => {
      if ((window as any).__pwaDeferredPrompt) {
        setDeferredPrompt((window as any).__pwaDeferredPrompt);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') {
        (window as any).__pwaDeferredPrompt = null;
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-deferred-prompt-ready', handlePromptReady);
    window.addEventListener('pwa-installed-success', handleAppInstalled);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-deferred-prompt-ready', handlePromptReady);
      window.removeEventListener('pwa-installed-success', handleAppInstalled);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    let promptEvent = deferredPrompt || (typeof window !== 'undefined' ? (window as any).__pwaDeferredPrompt : null);

    // If on a direct top-level tab and prompt is still loading, wait up to 1.5s
    if (!promptEvent && typeof window !== 'undefined' && !isInIframe && !isIOS) {
      promptEvent = await new Promise<any>((resolve) => {
        let timer: any;
        const onReady = () => {
          clearTimeout(timer);
          window.removeEventListener('pwa-deferred-prompt-ready', onReady);
          window.removeEventListener('beforeinstallprompt', onReady);
          resolve((window as any).__pwaDeferredPrompt || null);
        };
        window.addEventListener('pwa-deferred-prompt-ready', onReady, { once: true });
        window.addEventListener('beforeinstallprompt', onReady, { once: true });
        timer = setTimeout(() => {
          window.removeEventListener('pwa-deferred-prompt-ready', onReady);
          window.removeEventListener('beforeinstallprompt', onReady);
          resolve((window as any).__pwaDeferredPrompt || null);
        }, 1500);
      });
    }

    if (!promptEvent) return false;
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        if (typeof window !== 'undefined') {
          (window as any).__pwaDeferredPrompt = null;
        }
        return true;
      }
    } catch (err) {
      console.warn('PWA install prompt error:', err);
    }
    return false;
  };

  const hasPrompt = !!deferredPrompt || (typeof window !== 'undefined' && !!(window as any).__pwaDeferredPrompt);

  return {
    isInstallable: hasPrompt,
    isInstalled,
    isIOS,
    isInIframe,
    isInAppBrowser,
    install,
  };
}
