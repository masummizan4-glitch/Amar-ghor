import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let firestoreInstance: any = null;
let quotaExceededUntil = 0;
const QUOTA_FILE = path.resolve(process.cwd(), 'data', '.firestore_quota.json');

function getQuotaExceededUntil(): number {
  if (quotaExceededUntil > Date.now()) return quotaExceededUntil;
  try {
    if (fs.existsSync(QUOTA_FILE)) {
      const data = JSON.parse(fs.readFileSync(QUOTA_FILE, 'utf-8'));
      if (data?.exceededUntil && typeof data.exceededUntil === 'number') {
        quotaExceededUntil = data.exceededUntil;
        return quotaExceededUntil;
      }
    }
  } catch {}
  return quotaExceededUntil;
}

export function setFirestoreQuotaExceeded(durationMs: number = 30 * 60 * 1000): void {
  quotaExceededUntil = Date.now() + durationMs;
  try {
    const dir = path.dirname(QUOTA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(QUOTA_FILE, JSON.stringify({ exceededUntil: quotaExceededUntil, recordedAt: new Date().toISOString() }), 'utf-8');
  } catch {}
}

export function isFirestoreQuotaExceeded(): boolean {
  return Date.now() < getQuotaExceededUntil();
}

export function getFirestoreDb() {
  if (firestoreInstance) return firestoreInstance;

  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      console.warn('[Firestore] firebase-applet-config.json not found');
      return null;
    }

    const raw = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(raw);

    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(config);
    firestoreInstance = getFirestore(app, config.firestoreDatabaseId || '(default)');
    console.log('[Firestore] Initialized successfully with database:', config.firestoreDatabaseId);
    return firestoreInstance;
  } catch (err: any) {
    console.error('[Firestore] Initialization error:', err?.message || err);
    return null;
  }
}

/**
 * Sync entire DB state to Cloud Firestore
 */
export async function syncToFirestore(dbData: any): Promise<boolean> {
  if (isFirestoreQuotaExceeded()) {
    return false;
  }

  const db = getFirestoreDb();
  if (!db) return false;

  try {
    // 1. Sync Products
    if (dbData.products && Array.isArray(dbData.products)) {
      const prodRef = doc(db, 'app_store', 'products');
      await setDoc(prodRef, {
        items: dbData.products,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    // 2. Sync Orders
    if (dbData.orders && Array.isArray(dbData.orders)) {
      const ordersRef = doc(db, 'app_store', 'orders');
      await setDoc(ordersRef, {
        items: dbData.orders,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    // 3. Sync Settings
    if (dbData.settings) {
      const settingsRef = doc(db, 'app_store', 'settings');
      await setDoc(settingsRef, {
        data: dbData.settings,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    // 4. Sync Security & Admin
    const securityRef = doc(db, 'app_store', 'security');
    await setDoc(securityRef, {
      blacklist: dbData.blacklist || [],
      customerNotes: dbData.customerNotes || {},
      contacts: dbData.contacts || [],
      adminPasswordHash: dbData.adminPasswordHash || 'admin123',
      adminFcmTokens: dbData.adminFcmTokens || [],
      adminPushSubscriptions: dbData.adminPushSubscriptions || [],
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return true;
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (err?.code === 'resource-exhausted' || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota limit exceeded')) {
      setFirestoreQuotaExceeded(30 * 60 * 1000);
      console.warn('[Firestore] Free daily write quota reached (RESOURCE_EXHAUSTED). Cloud sync paused for 30 minutes; local db.json is handling all operations seamlessly.');
    } else {
      console.error('[Firestore] Sync to cloud failed:', msg);
    }
    return false;
  }
}

/**
 * Fetch DB state from Cloud Firestore
 */
export async function loadFromFirestore(): Promise<any | null> {
  const db = getFirestoreDb();
  if (!db) return null;

  try {
    const prodRef = doc(db, 'app_store', 'products');
    const ordersRef = doc(db, 'app_store', 'orders');
    const settingsRef = doc(db, 'app_store', 'settings');
    const securityRef = doc(db, 'app_store', 'security');
    const colOrdersRef = collection(db, 'orders');

    const [prodSnap, ordersSnap, settingsSnap, secSnap, colOrdersSnap] = await Promise.all([
      getDoc(prodRef).catch(() => null),
      getDoc(ordersRef).catch(() => null),
      getDoc(settingsRef).catch(() => null),
      getDoc(securityRef).catch(() => null),
      getDocs(colOrdersRef).catch(() => null)
    ]);

    const hasAny = (prodSnap && prodSnap.exists()) || (ordersSnap && ordersSnap.exists()) || (colOrdersSnap && !colOrdersSnap.empty);
    if (!hasAny) {
      console.log('[Firestore] Cloud database is empty, needs initial seeding.');
      return null;
    }

    const products = prodSnap && prodSnap.exists() ? prodSnap.data()?.items || [] : [];
    
    // Merge orders from app_store/orders AND collection('orders')
    const orderMap = new Map<string, any>();
    if (ordersSnap && ordersSnap.exists()) {
      (ordersSnap.data()?.items || []).forEach((o: any) => {
        if (o && (o.orderId || o.orderNumber)) {
          orderMap.set(o.orderId || o.orderNumber, o);
        }
      });
    }
    if (colOrdersSnap && !colOrdersSnap.empty) {
      colOrdersSnap.forEach((d: any) => {
        const o = d.data();
        if (o && (o.orderId || o.orderNumber)) {
          orderMap.set(o.orderId || o.orderNumber, o);
        }
      });
    }
    const orders = Array.from(orderMap.values()).sort(
      (a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    const settings = settingsSnap && settingsSnap.exists() ? settingsSnap.data()?.data || null : null;
    const secData = secSnap && secSnap.exists() ? secSnap.data() : {};

    return {
      products,
      orders,
      settings,
      blacklist: secData?.blacklist || [],
      customerNotes: secData?.customerNotes || {},
      contacts: secData?.contacts || [],
      adminPasswordHash: secData?.adminPasswordHash || 'admin123',
      adminFcmTokens: secData?.adminFcmTokens || [],
      adminPushSubscriptions: secData?.adminPushSubscriptions || []
    };
  } catch (err: any) {
    console.error('[Firestore] Load from cloud failed:', err?.message || err);
    return null;
  }
}

/**
 * Save an uploaded image to Cloud Firestore permanently
 */
export async function saveImageToFirestore(id: string, dataUrl: string, contentType: string = 'image/jpeg'): Promise<boolean> {
  if (isFirestoreQuotaExceeded()) {
    return false;
  }

  const db = getFirestoreDb();
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
    console.log('[Firestore] Image saved permanently to cloud:', cleanId);
    return true;
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (err?.code === 'resource-exhausted' || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota limit exceeded')) {
      setFirestoreQuotaExceeded(30 * 60 * 1000);
      console.warn('[Firestore] Free daily write quota reached on image save. Pausing cloud image writes for 30 minutes.');
    } else {
      console.error('[Firestore] Failed to save image to cloud:', msg);
    }
    return false;
  }
}

/**
 * Load an image from Cloud Firestore
 */
export async function loadImageFromFirestore(id: string): Promise<{ dataUrl: string; contentType: string } | null> {
  const db = getFirestoreDb();
  if (!db) return null;

  try {
    const cleanId = id.replace(/\.[a-zA-Z0-9]+$/, '');
    const imgRef = doc(db, 'app_images', cleanId);
    let snap = await getDoc(imgRef);

    if (!snap.exists() && cleanId !== id) {
      const exactRef = doc(db, 'app_images', id);
      snap = await getDoc(exactRef);
    }

    if (snap.exists()) {
      const data = snap.data();
      return {
        dataUrl: data.dataUrl,
        contentType: data.contentType || 'image/jpeg'
      };
    }
    return null;
  } catch (err: any) {
    console.error('[Firestore] Failed to load image from cloud:', err?.message || err);
    return null;
  }
}

/**
 * Persist an individual order directly to Cloud Firestore 'orders' collection and update 'app_store/orders'
 */
export async function saveSingleOrderToFirestore(order: any): Promise<boolean> {
  if (isFirestoreQuotaExceeded()) return false;
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    const docId = order.orderId || order.orderNumber || ('ord-' + Date.now());
    const orderDocRef = doc(db, 'orders', docId);
    await setDoc(orderDocRef, order, { merge: true });

    // Also update app_store/orders cache
    const ordersRef = doc(db, 'app_store', 'orders');
    const snap = await getDoc(ordersRef).catch(() => null);
    let existingItems: any[] = [];
    if (snap && snap.exists()) {
      existingItems = snap.data()?.items || [];
    }
    const filtered = existingItems.filter(
      (o: any) => o.orderId !== order.orderId && o.orderNumber !== order.orderNumber
    );
    await setDoc(ordersRef, {
      items: [order, ...filtered],
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log('[Firestore] Successfully persisted order to cloud:', order.orderNumber || docId);
    return true;
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (err?.code === 'resource-exhausted' || msg.includes('RESOURCE_EXHAUSTED')) {
      setFirestoreQuotaExceeded(30 * 60 * 1000);
      console.warn('[Firestore] Quota reached on order save.');
    } else {
      console.warn('[Firestore] Order save note:', msg);
    }
    return false;
  }
}
