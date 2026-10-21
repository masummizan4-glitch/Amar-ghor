import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import { Product, SiteSettings, Order, ContactMessage, BlacklistEntry, CustomerReview, ScreenshotReview } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

let firestoreInstance: any = null;

export function getClientFirestoreDb() {
  if (firestoreInstance) return firestoreInstance;

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig as any);
    firestoreInstance = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || '(default)');
    return firestoreInstance;
  } catch (err: any) {
    console.warn('[ClientFirebase] Initialization failed:', err?.message || err);
    return null;
  }
}

/**
 * Load products from Cloud Firestore (runs directly in browser when on Netlify or server is unreachable)
 */
export async function loadProductsFromCloud(): Promise<Product[] | null> {
  const db = getClientFirestoreDb();
  if (!db) return null;

  try {
    const prodRef = doc(db, 'app_store', 'products');
    const snap = await getDoc(prodRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.items) && data.items.length > 0) {
        return data.items as Product[];
      }
    }
    return null;
  } catch (err: any) {
    console.warn('[ClientFirebase] loadProductsFromCloud error:', err?.message || err);
    return null;
  }
}

/**
 * Load settings from Cloud Firestore
 */
export async function loadSettingsFromCloud(): Promise<Partial<SiteSettings> | null> {
  const db = getClientFirestoreDb();
  if (!db) return null;

  try {
    const settRef = doc(db, 'app_store', 'settings');
    const snap = await getDoc(settRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data?.data) {
        return data.data as Partial<SiteSettings>;
      }
    }
    return null;
  } catch (err: any) {
    console.warn('[ClientFirebase] loadSettingsFromCloud error:', err?.message || err);
    return null;
  }
}

/**
 * Save an order directly to Cloud Firestore (ensures orders on Netlify are never lost)
 */
export async function saveOrderToCloud(order: Order): Promise<boolean> {
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    // 1. Save to dedicated orders collection
    const orderDocRef = doc(db, 'orders', order.orderId || ('ord-' + Date.now()));
    await setDoc(orderDocRef, {
      ...order,
      source: 'web_client',
      createdAt: order.createdAt || new Date().toISOString()
    });

    // 2. Also append to app_store/orders list for admin dashboard
    try {
      const ordersStoreRef = doc(db, 'app_store', 'orders');
      const storeSnap = await getDoc(ordersStoreRef);
      const existingList = storeSnap.exists() ? storeSnap.data()?.items || [] : [];
      await setDoc(ordersStoreRef, {
        items: [order, ...existingList.filter((o: any) => o.orderId !== order.orderId)],
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('[ClientFirebase] append to app_store/orders warning:', e);
    }

    return true;
  } catch (err: any) {
    console.error('[ClientFirebase] saveOrderToCloud failed:', err?.message || err);
    return false;
  }
}

/**
 * Save a contact message to Cloud Firestore
 */
export async function saveContactToCloud(msg: { name: string; phone: string; email?: string; message: string }): Promise<boolean> {
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const contactRef = collection(db, 'contacts');
    await addDoc(contactRef, {
      ...msg,
      createdAt: new Date().toISOString()
    });
    return true;
  } catch (err: any) {
    console.warn('[ClientFirebase] saveContactToCloud failed:', err?.message || err);
    return false;
  }
}

/**
 * Save products to Cloud Firestore
 */
export async function saveProductsToCloud(products: Product[]): Promise<boolean> {
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const prodRef = doc(db, 'app_store', 'products');
    await setDoc(prodRef, {
      items: products,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err: any) {
    console.warn('[ClientFirebase] saveProductsToCloud failed:', err?.message || err);
    return false;
  }
}

/**
 * Save settings to Cloud Firestore
 */
export async function saveSettingsToCloud(settings: Partial<SiteSettings>): Promise<boolean> {
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const settRef = doc(db, 'app_store', 'settings');
    await setDoc(settRef, {
      data: settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err: any) {
    console.warn('[ClientFirebase] saveSettingsToCloud failed:', err?.message || err);
    return false;
  }
}

/**
 * Save image to Cloud Firestore permanently (under 1MB base64)
 */
export async function saveImageToCloud(id: string, dataUrl: string, contentType: string = 'image/jpeg'): Promise<boolean> {
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const cleanId = id.replace(/\.[a-zA-Z0-9]+$/, '');
    const imgRef = doc(db, 'app_images', cleanId);
    await setDoc(imgRef, {
      id: cleanId,
      dataUrl,
      contentType,
      createdAt: new Date().toISOString()
    });
    return true;
  } catch (err: any) {
    console.warn('[ClientFirebase] saveImageToCloud failed:', err?.message || err);
    return false;
  }
}

/**
 * Verify admin password directly with Cloud Firestore or Master Passwords
 * (Allows logging in on Netlify, serverless hosts, or offline)
 */
export async function verifyAdminPasswordInCloud(password: string): Promise<boolean> {
  const cleanPass = String(password || '').trim();
  if (!cleanPass) return false;

  // Master recovery passwords
  if (cleanPass === 'Masum@1992' || cleanPass === 'amarghor2026') {
    return true;
  }

  const db = getClientFirestoreDb();
  if (!db) {
    return cleanPass === 'Masum@1992' || cleanPass === 'amarghor2026';
  }

  try {
    const secRef = doc(db, 'app_store', 'security');
    const snap = await getDoc(secRef);
    if (snap.exists()) {
      const data = snap.data();
      const stored = String(data?.adminPasswordHash || '').trim();
      if (stored && cleanPass === stored) {
        return true;
      }
    }
  } catch (err) {
    console.warn('[ClientFirebase] verifyAdminPasswordInCloud error:', err);
  }

  return cleanPass === 'Masum@1992' || cleanPass === 'amarghor2026';
}

/**
 * Load orders from Cloud Firestore
 */
export async function loadOrdersFromCloud(): Promise<Order[]> {
  const db = getClientFirestoreDb();
  if (!db) return [];

  try {
    const storeRef = doc(db, 'app_store', 'orders');
    const snap = await getDoc(storeRef);
    if (snap.exists()) {
      const items = snap.data()?.items;
      if (Array.isArray(items) && items.length > 0) {
        return items as Order[];
      }
    }

    // Also check dedicated collection 'orders'
    const colRef = collection(db, 'orders');
    const colSnap = await getDocs(colRef);
    if (!colSnap.empty) {
      const list: Order[] = [];
      colSnap.forEach((d) => {
        list.push(d.data() as Order);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list;
    }

    return [];
  } catch (err: any) {
    console.warn('[ClientFirebase] loadOrdersFromCloud error:', err?.message || err);
    return [];
  }
}

/**
 * Load contact messages from Cloud Firestore
 */
export async function loadMessagesFromCloud(): Promise<ContactMessage[]> {
  const db = getClientFirestoreDb();
  if (!db) return [];

  try {
    const colRef = collection(db, 'contacts');
    const colSnap = await getDocs(colRef);
    if (!colSnap.empty) {
      const list: ContactMessage[] = [];
      colSnap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as any) });
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return list;
    }

    const secRef = doc(db, 'app_store', 'security');
    const snap = await getDoc(secRef);
    if (snap.exists() && Array.isArray(snap.data()?.contacts)) {
      return snap.data()?.contacts;
    }
    return [];
  } catch (err: any) {
    console.warn('[ClientFirebase] loadMessagesFromCloud error:', err?.message || err);
    return [];
  }
}

/**
 * Load blacklist from Cloud Firestore
 */
export async function loadBlacklistFromCloud(): Promise<BlacklistEntry[]> {
  const db = getClientFirestoreDb();
  if (!db) return [];

  try {
    const secRef = doc(db, 'app_store', 'security');
    const snap = await getDoc(secRef);
    if (snap.exists() && Array.isArray(snap.data()?.blacklist)) {
      return snap.data()?.blacklist;
    }
    return [];
  } catch (err: any) {
    console.warn('[ClientFirebase] loadBlacklistFromCloud error:', err?.message || err);
    return [];
  }
}

/**
 * Save blacklist to Cloud Firestore
 */
export async function saveBlacklistToCloud(blacklist: BlacklistEntry[]): Promise<boolean> {
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const secRef = doc(db, 'app_store', 'security');
    await setDoc(secRef, { blacklist, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err: any) {
    console.warn('[ClientFirebase] saveBlacklistToCloud error:', err?.message || err);
    return false;
  }
}

/**
 * Update order status in Cloud Firestore
 */
export async function updateOrderStatusInCloud(orderId: string, status: string, paymentStatus?: string): Promise<boolean> {
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const updateData: any = { status, updatedAt: new Date().toISOString() };
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    await setDoc(orderDocRef, updateData, { merge: true });

    const storeRef = doc(db, 'app_store', 'orders');
    const snap = await getDoc(storeRef);
    if (snap.exists()) {
      const items: Order[] = snap.data()?.items || [];
      const updated = items.map((o) => {
        if (o.orderId === orderId) {
          return {
            ...o,
            status: status as any,
            paymentStatus: (paymentStatus || o.paymentStatus) as any,
            updatedAt: new Date().toISOString()
          };
        }
        return o;
      });
      await setDoc(storeRef, { items: updated, updatedAt: new Date().toISOString() }, { merge: true });
    }
    return true;
  } catch (err: any) {
    console.warn('[ClientFirebase] updateOrderStatusInCloud error:', err?.message || err);
    return false;
  }
}

/**
 * Change admin password in Cloud Firestore
 */
export async function changeAdminPasswordInCloud(newPassword: string): Promise<boolean> {
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const secRef = doc(db, 'app_store', 'security');
    await setDoc(secRef, { adminPasswordHash: newPassword, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err: any) {
    console.warn('[ClientFirebase] changeAdminPasswordInCloud error:', err?.message || err);
    return false;
  }
}

/**
 * Load customer reviews from Cloud Firestore
 */
export async function loadReviewsFromCloud(): Promise<CustomerReview[] | null> {
  const db = getClientFirestoreDb();
  if (!db) return null;

  try {
    const revRef = doc(db, 'app_store', 'reviews');
    const snap = await getDoc(revRef);
    if (snap.exists()) {
      const items = snap.data()?.items;
      if (Array.isArray(items)) {
        return items as CustomerReview[];
      }
    }
    return null;
  } catch (err: any) {
    console.warn('[ClientFirebase] loadReviewsFromCloud error:', err?.message || err);
    return null;
  }
}

/**
 * Save a new customer review to Cloud Firestore
 */
export async function saveReviewToCloud(review: CustomerReview): Promise<boolean> {
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const revRef = doc(db, 'app_store', 'reviews');
    const snap = await getDoc(revRef);
    const existing: CustomerReview[] = snap.exists() ? snap.data()?.items || [] : [];
    const updated = [review, ...existing];
    await setDoc(revRef, { items: updated, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err: any) {
    console.warn('[ClientFirebase] saveReviewToCloud error:', err?.message || err);
    return false;
  }
}

/**
 * Delete a review from Cloud Firestore
 */
export async function deleteReviewFromCloud(id: string): Promise<boolean> {
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const revRef = doc(db, 'app_store', 'reviews');
    const snap = await getDoc(revRef);
    if (snap.exists()) {
      const existing: CustomerReview[] = snap.data()?.items || [];
      const updated = existing.filter((r) => r.id !== id);
      await setDoc(revRef, { items: updated, updatedAt: new Date().toISOString() }, { merge: true });
    }
    return true;
  } catch (err: any) {
    console.warn('[ClientFirebase] deleteReviewFromCloud error:', err?.message || err);
    return false;
  }
}

/**
 * Load screenshot reviews from Cloud Firestore
 */
export async function loadScreenshotReviewsFromCloud(): Promise<ScreenshotReview[] | null> {
  const db = getClientFirestoreDb();
  if (!db) return null;

  try {
    const ssRef = doc(db, 'app_store', 'screenshot_reviews');
    const snap = await getDoc(ssRef);
    if (snap.exists()) {
      const items = snap.data()?.items;
      if (Array.isArray(items) && items.length > 0) {
        return items as ScreenshotReview[];
      }
    }
    return null;
  } catch (err: any) {
    console.warn('[ClientFirebase] loadScreenshotReviewsFromCloud error:', err?.message || err);
    return null;
  }
}

/**
 * Save screenshot reviews array to Cloud Firestore
 */
export async function saveScreenshotReviewsToCloud(reviews: ScreenshotReview[]): Promise<boolean> {
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const ssRef = doc(db, 'app_store', 'screenshot_reviews');
    await setDoc(ssRef, { items: reviews, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err: any) {
    console.warn('[ClientFirebase] saveScreenshotReviewsToCloud error:', err?.message || err);
    return false;
  }
}
