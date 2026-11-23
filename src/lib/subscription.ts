import { Capacitor } from "@capacitor/core";
import { LOG_LEVEL, PACKAGE_TYPE, Purchases } from "@revenuecat/purchases-capacitor";
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { PRO_ENTITLEMENT } from "./entitlements";

/**
 * Capacitor RevenueCat SDK (@revenuecat/purchases-capacitor) — StoreKit + Play Billing.
 * Firebase uid is the RevenueCat appUserID; server tier is updated via webhook.
 */

function apiKeyForPlatform(): string | undefined {
  const platform = Capacitor.getPlatform();
  const testKey = import.meta.env.VITE_REVENUECAT_TEST_KEY;
  const iosKey = import.meta.env.VITE_REVENUECAT_IOS_KEY;
  const androidKey = import.meta.env.VITE_REVENUECAT_ANDROID_KEY;

  const useTestStore =
    testKey &&
    (import.meta.env.DEV || import.meta.env.VITE_REVENUECAT_USE_TEST_STORE === "true");

  if (useTestStore) return testKey;

  if (platform === "android") return androidKey;
  if (platform === "ios") return iosKey;
  return undefined;
}

export function isAvailable(): boolean {
  return Capacitor.isNativePlatform() && Boolean(apiKeyForPlatform());
}

let configured = false;

export async function configure(uid: string): Promise<void> {
  if (configured || !isAvailable()) return;
  const apiKey = apiKeyForPlatform();
  if (!apiKey) return;
  if (import.meta.env.DEV) {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
  }
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

export { PACKAGE_TYPE, PRO_ENTITLEMENT };
export type { PurchasesOffering, PurchasesPackage };