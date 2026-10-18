import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { Product, SiteSettings, Order } from '../types';
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
