// Standard W3C Web Push Client for Amar Ghor Online
// Wakes up phone & displays native notification banner even when browser is closed, phone is locked, or app is exited.

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch (err) {
    console.warn('[WebPush] Error checking existing subscription:', err);
    return null;
  }
}

export async function subscribeAdminToWebPush(
  adminToken: string
): Promise<{ success: boolean; message: string; subscription?: any }> {
  if (!isPushSupported()) {
    return {
      success: false,
      message: 'আপনার এই ব্রাউজার বা ডিভাইসে ব্যাকগ্রাউন্ড পুশ নোটিফিকেশন সমর্থিত নয়। অনুগ্রহ করে Google Chrome ব্যবহার করুন।'
    };
  }

  try {
    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        message: 'নোটিফিকেশন অনুমতি পাওয়া যায়নি। ব্রাউজারের সাইট সেটিংসে গিয়ে Notifications: Allow করুন।'
      };
    }

    // 2. Fetch server's auto-generated VAPID public key
    const vapidRes = await fetch('/api/admin/vapid-key');
    const vapidData = await vapidRes.json();
    if (!vapidRes.ok || !vapidData.publicKey) {
      throw new Error(vapidData.error || 'সার্ভার থেকে VAPID পাবলিক কী পাওয়া যায়নি।');
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);

    // 3. Register or reuse subscription in Service Worker
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any
      });
    }

    // 4. Send subscription JSON to backend
    const subJson = subscription.toJSON();
    const saveRes = await fetch('/api/admin/push-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ subscription: subJson })
    });

    const saveData = await saveRes.json();
    if (!saveRes.ok || !saveData.success) {
      throw new Error(saveData.error || 'সার্ভারে পুশ সাবস্ক্রিপশন সংরক্ষণ ব্যর্থ হয়েছে।');
    }

    localStorage.setItem('amarghor_admin_notifications_enabled', 'true');

    return {
      success: true,
      message: 'অভিনন্দন! আপনার মোবাইলে ব্যাকগ্রাউন্ড নোটিফিকেশন সফলভাবে সক্রিয় হয়েছে। ওয়েবসাইট সম্পূর্ণ বন্ধ থাকলেও নতুন অর্ডার আসলে সাথে সাথে নোটিফিকেশন বাজবে!',
      subscription: subJson
    };
  } catch (err: any) {
    console.error('[WebPush] Subscription error:', err);
    return {
      success: false,
      message: err?.message || 'নোটিফিকেশন চালু করার সময় একটি অপ্রত্যাশিত সমস্যা হয়েছে।'
    };
  }
}

export async function unsubscribeAdminFromWebPush(
  adminToken: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (isPushSupported()) {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe().catch(() => {});
        await fetch('/api/admin/push-subscription', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({ endpoint })
        }).catch(() => {});
      }
    }

    localStorage.setItem('amarghor_admin_notifications_enabled', 'false');
    return {
      success: true,
      message: 'ব্যাকগ্রাউন্ড নোটিফিকেশন সফলভাবে বন্ধ করা হয়েছে।'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'নোটিফিকেশন বন্ধ করার সময় ত্রুটি হয়েছে।'
    };
  }
}

export async function sendTestWebPush(
  adminToken: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/admin/test-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'টেস্ট নোটিফিকেশন পাঠানো যায়নি।');
    }
    return {
      success: true,
      message: data.message || 'টেস্ট নোটিফিকেশন সফলভাবে পাঠানো হয়েছে!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'টেস্ট পুশ পাঠাতে সমস্যা হয়েছে।'
    };
  }
}
