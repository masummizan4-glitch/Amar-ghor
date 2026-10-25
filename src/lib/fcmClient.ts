import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { initializeApp, getApps, getApp } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';
import { VAPID_PUBLIC_KEY, isVapidKeyConfigured } from '../config/fcmConfig';

function getFirebaseAppInstance() {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig as any);
}

export async function isPushNotificationSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const hasBrowserSupport =
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window;
  if (!hasBrowserSupport) return false;

  try {
    return await isSupported();
  } catch {
    return false;
  }
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export function isNotificationsEnabledLocally(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    localStorage.getItem('amarghor_admin_notifications_enabled') === 'true' &&
    Notification.permission === 'granted'
  );
}

/**
 * Register Admin FCM Push Notification
 * Strictly restricted to logged-in Admin with valid session token
 */
export async function subscribeAdminPush(
  adminToken: string,
  userVapidKey?: string
): Promise<{ success: boolean; message: string; token?: string }> {
  try {
    const supported = await isPushNotificationSupported();
    if (!supported) {
      return {
        success: false,
        message: 'আপনার এই ব্রাউজার বা ডিভাইসে পুশ নোটিফিকেশন সমর্থিত নয়।'
      };
    }

    // 1. Request Browser Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        message: 'নোটিফিকেশন অনুমতি প্রত্যাখ্যান করা হয়েছে। ব্রাউজার সেটিংসে গিয়ে অনুমতি দিন।'
      };
    }

    const app = getFirebaseAppInstance();
    const messaging = getMessaging(app);

    // 2. Wait for Service Worker Registration
    const reg = await navigator.serviceWorker.ready;

    // 3. Determine VAPID Key
    const effectiveVapidKey = (userVapidKey && userVapidKey.trim()) || VAPID_PUBLIC_KEY;
    if (!effectiveVapidKey || effectiveVapidKey === 'YOUR_VAPID_PUBLIC_KEY_PLACEHOLDER') {
      return {
        success: false,
        message: 'Firebase Web Push VAPID Key কনফিগার করা প্রয়োজন।'
      };
    }

    // 4. Retrieve FCM Device Token
    const currentToken = await getToken(messaging, {
      vapidKey: effectiveVapidKey,
      serviceWorkerRegistration: reg
    });

    if (!currentToken) {
      return {
        success: false,
        message: 'ডিভাইস টোকেন তৈরি করা সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
      };
    }

    // 5. Securely register token on server with Admin authorization
    const res = await fetch('/api/admin/fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        token: currentToken,
        deviceInfo: navigator.userAgent.slice(0, 120),
        enabledAt: new Date().toISOString()
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'সার্ভারে নোটিফিকেশন টোকেন সংরক্ষণ ব্যর্থ হয়েছে।');
    }

    // 6. Cache locally for UI state
    localStorage.setItem('amarghor_admin_fcm_token', currentToken);
    localStorage.setItem('amarghor_admin_notifications_enabled', 'true');

    return {
      success: true,
      token: currentToken,
      message: 'পুশ নোটিফিকেশন সফলভাবে চালু করা হয়েছে! নতুন অর্ডার আসলেই আপনার ডিভাইসে নোটিফিকেশন যাবে।'
    };
  } catch (err: any) {
    console.error('[FCM] Subscription failed:', err);
    return {
      success: false,
      message: err.message || 'নোটিফিকেশন চালু করার সময় একটি অপ্রত্যাশিত ত্রুটি হয়েছে।'
    };
  }
}

/**
 * Unregister Admin FCM Push Notification
 */
export async function unsubscribeAdminPush(
  adminToken: string
): Promise<{ success: boolean; message: string }> {
  try {
    const storedToken = localStorage.getItem('amarghor_admin_fcm_token');
    if (storedToken) {
      await fetch('/api/admin/fcm-token', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ token: storedToken })
      }).catch((e) => console.warn('[FCM] Remote token deletion warning:', e));
    }

    localStorage.removeItem('amarghor_admin_fcm_token');
    localStorage.setItem('amarghor_admin_notifications_enabled', 'false');

    return {
      success: true,
      message: 'পুশ নোটিফিকেশন সফলভাবে বন্ধ করা হয়েছে।'
    };
  } catch (err: any) {
    console.error('[FCM] Unsubscription error:', err);
    return {
      success: false,
      message: err.message || 'নোটিফিকেশন বন্ধ করার সময় সমস্যা হয়েছে।'
    };
  }
}

/**
 * Listen to foreground messages when Admin Panel is open
 */
export function listenForegroundFCM(
  callback: (payload: { title: string; body: string; data?: any }) => void
): () => void {
  try {
    if (typeof window === 'undefined') return () => {};
    const app = getFirebaseAppInstance();
    const messaging = getMessaging(app);

    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || 'আমার ঘর Online';
      const body = payload.notification?.body || payload.data?.body || 'নতুন আপডেট পাওয়া গেছে';
      callback({
        title,
        body,
        data: payload.data
      });
    });

    return unsubscribe;
  } catch {
    return () => {};
  }
}
