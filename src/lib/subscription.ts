import { PACKAGE_TYPE, Purchases } from "@revenuecat/purchases-capacitor";
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from "@revenuecat/purchases-capacitor";

/**
 * Thin wrapper over the RevenueCat Capacitor plugin — wraps StoreKit (iOS)
 * and Play Billing (Android), required by both stores for in-app digital
 * purchases. Configured with the Firebase uid as the RevenueCat appUserID
 * (RevenueCat's documented Firebase-integration pattern) so entitlements
 * tie to the account, not the device.
 *
 * Purchases can't run in a plain web browser — see isAvailable(). A signed-in
 * web user's Pro status still reflects real purchases, since the server
 * checks the tier set by the RevenueCat webhook (server/revenuecat.ts),
 * not anything client-side.
 */

const PRO_ENTITLEMENT = "pro";

function apiKeyForPlatform(): string | undefined {
  // RevenueCat issues separate public SDK keys per store.
  if (/android/i.test(navigator.userAgent)) return import.meta.env.VITE_REVENUECAT_ANDROID_KEY;
  return import.meta.env.VITE_REVENUECAT_IOS_KEY;
}

/** Purchases only work inside the native iOS/Android app, not a browser tab. */
export function isAvailable(): boolean {
  return Boolean(apiKeyForPlatform()) && /iphone|ipad|ipod|android/i.test(navigator.userAgent);
}

let configured = false;

export async function configure(uid: string): Promise<void> {
  if (configured || !isAvailable()) return;
  const apiKey = apiKeyForPlatform();
  if (!apiKey) return;
  await Purchases.configure({ apiKey, appUserID: uid });
  configured = true;
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  const { current } = await Purchases.getOfferings();
  return current;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
  return isPro(customerInfo);
}

export async function restorePurchases(): Promise<boolean> {
  const { customerInfo } = await Purchases.restorePurchases();
  return isPro(customerInfo);
}

export async function isCurrentlyPro(): Promise<boolean> {
  if (!configured) return false;
  const { customerInfo } = await Purchases.getCustomerInfo();
  return isPro(customerInfo);
}

function isPro(customerInfo: CustomerInfo): boolean {
  return PRO_ENTITLEMENT in customerInfo.entitlements.active;
}

export { PACKAGE_TYPE };
export type { PurchasesOffering, PurchasesPackage };
