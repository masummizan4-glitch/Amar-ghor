import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { Product, SiteSettings, Order, ContactMessage, BlacklistEntry, CustomerReview, ScreenshotReview } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

let firestoreInstance: any = null;
let clientQuotaExceededUntil = 0;
const CLIENT_QUOTA_STORAGE_KEY = 'amarghor_client_firestore_quota_until';

/**
 * Strict timeout wrapper: guarantees that no Cloud Firestore call can hang or buffer the UI
 */
export function withTimeout<T>(promise: Promise<T>, ms = 2500, fallbackVal?: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        if (fallbackVal !== undefined) {
          resolve(fallbackVal);
        } else {
          reject(new Error(`[ClientFirebase] Operation timed out after ${ms}ms`));
        }
      }, ms);
    })
  ]);
}

export function isClientQuotaExceeded(): boolean {
  if (clientQuotaExceededUntil > Date.now()) return true;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(CLIENT_QUOTA_STORAGE_KEY);
      if (stored) {
        const val = Number(stored);
        if (val > Date.now()) {
          clientQuotaExceededUntil = val;
          return true;
        }
      }
    }
  } catch {}
  return false;
}

export function handleClientFirestoreError(err: any, context: string): void {
  const msg = String(err?.message || err || '');
  if (err?.code === 'resource-exhausted' || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota limit exceeded')) {
    clientQuotaExceededUntil = Date.now() + 30 * 60 * 1000;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(CLIENT_QUOTA_STORAGE_KEY, String(clientQuotaExceededUntil));
      }
    } catch {}
    console.warn(`[ClientFirebase] Free quota reached (${context}). Pausing direct cloud write attempts for 30m; local/server storage active.`);
  } else {
    console.warn(`[ClientFirebase] ${context} error:`, msg);
  }
}

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
  if (isClientQuotaExceeded()) return null;
  const db = getClientFirestoreDb();
  if (!db) return null;

  try {
    const prodRef = doc(db, 'app_store', 'products');
    const snap = await withTimeout(getDoc(prodRef), 2500, null as any);
    if (snap && snap.exists && snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.items) && data.items.length > 0) {
        return data.items as Product[];
      }
    }
    return null;
  } catch (err: any) {
    handleClientFirestoreError(err, 'loadProductsFromCloud');
    return null;
  }
}

/**
 * Load settings from Cloud Firestore
 */
export async function loadSettingsFromCloud(): Promise<Partial<SiteSettings> | null> {
  if (isClientQuotaExceeded()) return null;
  const db = getClientFirestoreDb();
  if (!db) return null;

  try {
    const settRef = doc(db, 'app_store', 'settings');
    const snap = await withTimeout(getDoc(settRef), 2500, null as any);
    if (snap && snap.exists && snap.exists()) {
      const data = snap.data();
      if (data?.data) {
        return data.data as Partial<SiteSettings>;
      }
    }
    return null;
  } catch (err: any) {
    handleClientFirestoreError(err, 'loadSettingsFromCloud');
    return null;
  }
}

/**
 * Save an order directly to Cloud Firestore (guaranteed fast non-blocking timeout)
 */
export async function saveOrderToCloud(order: Order): Promise<boolean> {
  if (isClientQuotaExceeded()) return false;
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const orderDocRef = doc(db, 'orders', order.orderId || ('ord-' + Date.now()));
    await withTimeout(
      setDoc(orderDocRef, {
        ...order,
        source: 'web_client',
        createdAt: order.createdAt || new Date().toISOString()
      }),
      2500
    );

    // Also best-effort append to app_store/orders list for admin dashboard
    try {
      const ordersStoreRef = doc(db, 'app_store', 'orders');
      const storeSnap = await withTimeout(getDoc(ordersStoreRef), 2000, null as any);
      const existingList = storeSnap && storeSnap.exists() ? storeSnap.data()?.items || [] : [];
      await withTimeout(
        setDoc(ordersStoreRef, {
          items: [order, ...existingList.filter((o: any) => o.orderId !== order.orderId)],
          updatedAt: new Date().toISOString()
        }, { merge: true }),
        2000
      );
    } catch {}

    return true;
  } catch (err: any) {
    handleClientFirestoreError(err, 'saveOrderToCloud');
    return false;
  }
}

/**
 * Save a contact message to Cloud Firestore
 */
export async function saveContactToCloud(msg: { name: string; phone: string; email?: string; message: string }): Promise<boolean> {
  if (isClientQuotaExceeded()) return false;
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const contactRef = collection(db, 'contacts');
    await withTimeout(
      addDoc(contactRef, {
        ...msg,
        createdAt: new Date().toISOString()
      }),
      2500
    );
    return true;
  } catch (err: any) {
    handleClientFirestoreError(err, 'saveContactToCloud');
    return false;
  }
}

/**
 * Save products to Cloud Firestore
 */
export async function saveProductsToCloud(products: Product[]): Promise<boolean> {
  if (isClientQuotaExceeded()) return false;
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const prodRef = doc(db, 'app_store', 'products');
    await withTimeout(
      setDoc(prodRef, {
        items: products,
        updatedAt: new Date().toISOString()
      }, { merge: true }),
      2500
    );
    return true;
  } catch (err: any) {
    handleClientFirestoreError(err, 'saveProductsToCloud');
    return false;
  }
}

/**
 * Save settings to Cloud Firestore
 */
export async function saveSettingsToCloud(settings: Partial<SiteSettings>): Promise<boolean> {
  if (isClientQuotaExceeded()) return false;
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const settRef = doc(db, 'app_store', 'settings');
    await withTimeout(
      setDoc(settRef, {
        data: settings,
        updatedAt: new Date().toISOString()
      }, { merge: true }),
      2500
    );
    return true;
  } catch (err: any) {
    handleClientFirestoreError(err, 'saveSettingsToCloud');
    return false;
  }
}

/**
 * Save image to Cloud Firestore permanently (under 1MB base64)
 */
export async function saveImageToCloud(id: string, dataUrl: string, contentType: string = 'image/jpeg'): Promise<boolean> {
  if (isClientQuotaExceeded()) return false;
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const cleanId = id.replace(/\.[a-zA-Z0-9]+$/, '');
    const imgRef = doc(db, 'app_images', cleanId);
    await withTimeout(
      setDoc(imgRef, {
        id: cleanId,
        dataUrl,
        contentType,
        createdAt: new Date().toISOString()
      }),
      2500
    );
    return true;
  } catch (err: any) {
    handleClientFirestoreError(err, 'saveImageToCloud');
    return false;
  }
}

/**
 * Verify admin password directly with Cloud Firestore or Master Passwords
 */
export async function verifyAdminPasswordInCloud(password: string): Promise<boolean> {
  const cleanPass = String(password || '').trim();
  if (!cleanPass) return false;

  // Master recovery passwords
  if (cleanPass === 'Masum@1992' || cleanPass === 'amarghor2026') {
    return true;
  }

  const db = getClientFirestoreDb();
  if (!db || isClientQuotaExceeded()) {
    return cleanPass === 'Masum@1992' || cleanPass === 'amarghor2026';
  }

  try {
    const secRef = doc(db, 'app_store', 'security');
    const snap = await withTimeout(getDoc(secRef), 2000, null as any);
    if (snap && snap.exists && snap.exists()) {
      const data = snap.data();
      const stored = String(data?.adminPasswordHash || '').trim();
      if (stored && cleanPass === stored) {
        return true;
      }
    }
  } catch (err) {
    console.warn('[ClientFirebase] verifyAdminPasswordInCloud note:', err);
  }

  return cleanPass === 'Masum@1992' || cleanPass === 'amarghor2026';
}

/**
 * Load orders from Cloud Firestore (merges all sources)
 */
export async function loadOrdersFromCloud(): Promise<Order[]> {
  if (isClientQuotaExceeded()) return [];
  const db = getClientFirestoreDb();
  if (!db) return [];

  try {
    const storeRef = doc(db, 'app_store', 'orders');
    const colRef = collection(db, 'orders');

    const [snap, colSnap] = await Promise.all([
      withTimeout(getDoc(storeRef), 2500, null as any),
      withTimeout(getDocs(colRef), 2500, null as any)
    ]);

    const orderMap = new Map<string, Order>();

    if (snap && snap.exists && snap.exists()) {
      const items = snap.data()?.items;
      if (Array.isArray(items)) {
        items.forEach((o: any) => {
          if (o && (o.orderId || o.orderNumber)) {
            orderMap.set(o.orderId || o.orderNumber, o);
          }
        });
      }
    }

    if (colSnap && !colSnap.empty) {
      colSnap.forEach((d: any) => {
        const o = d.data();
        if (o && (o.orderId || o.orderNumber)) {
          orderMap.set(o.orderId || o.orderNumber, o);
        }
      });
    }

    const list = Array.from(orderMap.values());
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  } catch (err: any) {
    handleClientFirestoreError(err, 'loadOrdersFromCloud');
    return [];
  }
}

/**
 * Real-time listener for orders from Cloud Firestore using onSnapshot.
 * Triggers live alerts instantly whenever ANY customer orders worldwide!
 */
export function listenToCloudOrders(
  onOrdersUpdate: (orders: Order[], isInitial: boolean) => void
): () => void {
  const db = getClientFirestoreDb();
  if (!db || isClientQuotaExceeded()) {
    return () => {};
  }

  try {
    const colRef = collection(db, 'orders');
    let isInitial = true;
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const orderList: Order[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Order;
          if (data && (data.orderId || data.orderNumber)) {
            orderList.push(data);
          }
        });
        orderList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        onOrdersUpdate(orderList, isInitial);
        isInitial = false;
      },
      (err) => {
        console.warn('[Firestore] Live orders subscription notice:', err?.message || err);
      }
    );
    return unsub;
  } catch (err) {
    console.warn('[Firestore] Error attaching real-time order listener:', err);
    return () => {};
  }
}

/**
 * Load contact messages from Cloud Firestore
 */
export async function loadMessagesFromCloud(): Promise<ContactMessage[]> {
  if (isClientQuotaExceeded()) return [];
  const db = getClientFirestoreDb();
  if (!db) return [];

  try {
    const colRef = collection(db, 'contacts');
    const colSnap = await withTimeout(getDocs(colRef), 2500, null as any);
    if (colSnap && !colSnap.empty) {
      const list: ContactMessage[] = [];
      colSnap.forEach((d: any) => {
        list.push({ id: d.id, ...(d.data() as any) });
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return list;
    }

    const secRef = doc(db, 'app_store', 'security');
    const snap = await withTimeout(getDoc(secRef), 2000, null as any);
    if (snap && snap.exists && snap.exists() && Array.isArray(snap.data()?.contacts)) {
      return snap.data()?.contacts;
    }
    return [];
  } catch (err: any) {
    handleClientFirestoreError(err, 'loadMessagesFromCloud');
    return [];
  }
}

/**
 * Load blacklist from Cloud Firestore
 */
export async function loadBlacklistFromCloud(): Promise<BlacklistEntry[]> {
  if (isClientQuotaExceeded()) return [];
  const db = getClientFirestoreDb();
  if (!db) return [];

  try {
    const secRef = doc(db, 'app_store', 'security');
    const snap = await withTimeout(getDoc(secRef), 2000, null as any);
    if (snap && snap.exists && snap.exists() && Array.isArray(snap.data()?.blacklist)) {
      return snap.data()?.blacklist;
    }
    return [];
  } catch (err: any) {
    handleClientFirestoreError(err, 'loadBlacklistFromCloud');
    return [];
  }
}

/**
 * Save blacklist to Cloud Firestore
 */
export async function saveBlacklistToCloud(blacklist: BlacklistEntry[]): Promise<boolean> {
  if (isClientQuotaExceeded()) return false;
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const secRef = doc(db, 'app_store', 'security');
    await withTimeout(
      setDoc(secRef, { blacklist, updatedAt: new Date().toISOString() }, { merge: true }),
      2500
    );
    return true;
  } catch (err: any) {
    handleClientFirestoreError(err, 'saveBlacklistToCloud');
    return false;
  }
}

/**
 * Update order status in Cloud Firestore
 */
export async function updateOrderStatusInCloud(orderId: string, status: string, paymentStatus?: string): Promise<boolean> {
  if (isClientQuotaExceeded()) return false;
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const updateData: any = { status, updatedAt: new Date().toISOString() };
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    await withTimeout(setDoc(orderDocRef, updateData, { merge: true }), 2500);

    const storeRef = doc(db, 'app_store', 'orders');
    const snap = await withTimeout(getDoc(storeRef), 2000, null as any);
    if (snap && snap.exists && snap.exists()) {
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
      await withTimeout(setDoc(storeRef, { items: updated, updatedAt: new Date().toISOString() }, { merge: true }), 2000);
    }
    return true;
  } catch (err: any) {
    handleClientFirestoreError(err, 'updateOrderStatusInCloud');
    return false;
  }
}

/**
 * Change admin password in Cloud Firestore
 */
export async function changeAdminPasswordInCloud(newPassword: string): Promise<boolean> {
  if (isClientQuotaExceeded()) return false;
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const secRef = doc(db, 'app_store', 'security');
    await withTimeout(setDoc(secRef, { adminPasswordHash: newPassword, updatedAt: new Date().toISOString() }, { merge: true }), 2500);
    return true;
  } catch (err: any) {
    handleClientFirestoreError(err, 'changeAdminPasswordInCloud');
    return false;
  }
}

/**
 * Load customer reviews from Cloud Firestore
 */
export async function loadReviewsFromCloud(): Promise<CustomerReview[] | null> {
  if (isClientQuotaExceeded()) return null;
  const db = getClientFirestoreDb();
  if (!db) return null;

  try {
    const revRef = doc(db, 'app_store', 'reviews');
    const snap = await withTimeout(getDoc(revRef), 2500, null as any);
    if (snap && snap.exists && snap.exists()) {
      const items = snap.data()?.items;
      if (Array.isArray(items)) {
        return items as CustomerReview[];
      }
    }
    return null;
  } catch (err: any) {
    handleClientFirestoreError(err, 'loadReviewsFromCloud');
    return null;
  }
}

/**
 * Save a new customer review to Cloud Firestore
 */
export async function saveReviewToCloud(review: CustomerReview): Promise<boolean> {
  if (isClientQuotaExceeded()) return false;
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const revRef = doc(db, 'app_store', 'reviews');
    const snap = await withTimeout(getDoc(revRef), 2000, null as any);
    const existing: CustomerReview[] = snap && snap.exists && snap.exists() ? snap.data()?.items || [] : [];
    const updated = [review, ...existing];
    await withTimeout(setDoc(revRef, { items: updated, updatedAt: new Date().toISOString() }, { merge: true }), 2500);
    return true;
  } catch (err: any) {
    handleClientFirestoreError(err, 'saveReviewToCloud');
    return false;
  }
}

/**
 * Delete a review from Cloud Firestore
 */
export async function deleteReviewFromCloud(id: string): Promise<boolean> {
  if (isClientQuotaExceeded()) return false;
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const revRef = doc(db, 'app_store', 'reviews');
    const snap = await withTimeout(getDoc(revRef), 2000, null as any);
    if (snap && snap.exists && snap.exists()) {
      const existing: CustomerReview[] = snap.data()?.items || [];
      const updated = existing.filter((r) => r.id !== id);
      await withTimeout(setDoc(revRef, { items: updated, updatedAt: new Date().toISOString() }, { merge: true }), 2500);
    }
    return true;
  } catch (err: any) {
    handleClientFirestoreError(err, 'deleteReviewFromCloud');
    return false;
  }
}

/**
 * Load screenshot reviews from Cloud Firestore
 */
export async function loadScreenshotReviewsFromCloud(): Promise<ScreenshotReview[] | null> {
  if (isClientQuotaExceeded()) return null;
  const db = getClientFirestoreDb();
  if (!db) return null;

  try {
    const ssRef = doc(db, 'app_store', 'screenshot_reviews');
    const snap = await withTimeout(getDoc(ssRef), 2500, null as any);
    if (snap && snap.exists && snap.exists()) {
      const items = snap.data()?.items;
      if (Array.isArray(items) && items.length > 0) {
        return items as ScreenshotReview[];
      }
    }
    return null;
  } catch (err: any) {
    handleClientFirestoreError(err, 'loadScreenshotReviewsFromCloud');
    return null;
  }
}

/**
 * Save screenshot reviews array to Cloud Firestore
 */
export async function saveScreenshotReviewsToCloud(reviews: ScreenshotReview[]): Promise<boolean> {
  if (isClientQuotaExceeded()) return false;
  const db = getClientFirestoreDb();
  if (!db) return false;

  try {
    const ssRef = doc(db, 'app_store', 'screenshot_reviews');
    await withTimeout(setDoc(ssRef, { items: reviews, updatedAt: new Date().toISOString() }, { merge: true }), 2500);
    return true;
  } catch (err: any) {
    handleClientFirestoreError(err, 'saveScreenshotReviewsToCloud');
    return false;
  }
}
