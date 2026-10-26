/**
 * Billing/ads adapter for the web build.
 * No native billing SDK, Stripe checkout flow, or ad SDK is wired here.
 * These methods intentionally fail closed rather than simulating purchases,
 * rewards, or subscription state. Paid entitlements must be granted by the
 * server after a verified provider webhook/receipt.
 */
export const PRODUCT_IDS = {
  SUBSCRIPTION_MONTHLY: 'ca_premium_monthly',
  SUBSCRIPTION_ANNUAL: 'ca_premium_annual',
  ONE_TIME_FORENSICS: 'ca_unlock_forensics'
};

export const AD_UNITS = {
  BANNER_MAIN: '',
  REWARDED_SCAN: ''
};

type SubscriptionUpdateCallback = (productId: string, isActive: boolean) => void;
let subscriptionListener: SubscriptionUpdateCallback | null = null;
const unavailable = (feature: string): Error => new Error(`${feature} is not integrated in this web build. No purchase, subscription, ad view, or reward was recorded.`);

export const BillingService = {
  setSubscriptionListener(callback: SubscriptionUpdateCallback) { subscriptionListener = callback; },
  /** Only verified server-side billing events should call this listener. */
  publishVerifiedSubscriptionUpdate(productId: string, isActive: boolean) {
    subscriptionListener?.(productId, isActive);
  },
  async initialize() { return { available: false, reason: 'No web billing provider is configured.' }; },
  async getProducts() { return []; },
  async purchaseProduct(_productId: string): Promise<boolean> { throw unavailable('Purchases'); },
  async restorePurchases(): Promise<string[]> { throw unavailable('Purchase restoration'); },
  async showRewardedAd(_adUnitId: string): Promise<boolean> { throw unavailable('Rewarded ads'); }
};
