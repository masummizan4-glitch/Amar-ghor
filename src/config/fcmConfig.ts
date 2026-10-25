/**
 * Firebase Cloud Messaging (FCM) Web Push Configuration
 *
 * For Web Push notifications, a VAPID Public Key generated from the Firebase Console is required.
 * Path: Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates -> Generate key pair
 */

export const VAPID_PUBLIC_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_VAPID_KEY) ||
  'YOUR_VAPID_PUBLIC_KEY_PLACEHOLDER';

export function isVapidKeyConfigured(): boolean {
  return Boolean(
    VAPID_PUBLIC_KEY &&
    VAPID_PUBLIC_KEY !== 'YOUR_VAPID_PUBLIC_KEY_PLACEHOLDER' &&
    VAPID_PUBLIC_KEY.length > 20
  );
}
