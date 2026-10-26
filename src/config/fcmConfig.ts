/**
 * Firebase Cloud Messaging (FCM) Web Push Configuration
 *
 * For Web Push notifications, a VAPID Public Key generated from the Firebase Console is required.
 * Path: Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates -> Generate key pair
 */

export const DEFAULT_VAPID_PUBLIC_KEY =
  'BEbkctEAHRQv7y6QQWac4G49UO1yqRFLXXmnN37NeI_KPNeIK5LBcNst73CU7TVmZ97AE130kpEUHJ-lJquDAWs';

export const VAPID_PUBLIC_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_VAPID_KEY) ||
  DEFAULT_VAPID_PUBLIC_KEY;

export function isVapidKeyConfigured(): boolean {
  return true;
}
