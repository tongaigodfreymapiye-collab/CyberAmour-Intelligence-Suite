export const PRODUCT_IDS = {
  SUBSCRIPTION_MONTHLY: 'ca_premium_monthly',
  SUBSCRIPTION_ANNUAL: 'ca_premium_annual',
  ONE_TIME_FORENSICS: 'ca_unlock_forensics'
};

export const AD_UNITS = {
  BANNER_MAIN: 'ca-app-pub-xxxxxxxx/banner1',
  REWARDED_SCAN: 'ca-app-pub-xxxxxxxx/rewarded1'
};

type SubscriptionUpdateCallback = (productId: string, isActive: boolean) => void;

let subscriptionListener: SubscriptionUpdateCallback | null = null;

// This service acts as a bridge for Google Play Billing (via Capacitor/TWA) or Web Payments (Stripe)
export const BillingService = {
  setSubscriptionListener(callback: SubscriptionUpdateCallback) {
    subscriptionListener = callback;
  },

  simulateRealTimeUpdate(productId: string, isActive: boolean) {
    if (subscriptionListener) {
      subscriptionListener(productId, isActive);
    }
  },

  async initialize() {
    console.log("BillingService: Initializing native billing bridge...");
    // Native plugin initialization would go here (e.g., Capacitor Google Play Billing)
    return true;
  },

  async getProducts() {
    return [
      { id: PRODUCT_IDS.SUBSCRIPTION_MONTHLY, title: 'Premium (Monthly)', price: '$9.99/mo', type: 'subs' },
      { id: PRODUCT_IDS.SUBSCRIPTION_ANNUAL, title: 'Premium (Annual)', price: '$89.99/yr', type: 'subs' },
      { id: PRODUCT_IDS.ONE_TIME_FORENSICS, title: 'Deep Forensics Report', price: '$4.99', type: 'inapp' }
    ];
  },

  async purchaseProduct(productId: string): Promise<boolean> {
    console.log(`BillingService: Initiating purchase for ${productId}`);
    // Native bridge call: await PlayBilling.purchase({ productId })
    
    // Simulating successful purchase for demonstration
    return new Promise(resolve => setTimeout(() => resolve(true), 1500));
  },
  
  async restorePurchases(): Promise<string[]> {
    console.log("BillingService: Restoring purchases...");
    // Native bridge call: await PlayBilling.restorePurchases()
    return [];
  },

  async showRewardedAd(adUnitId: string): Promise<boolean> {
    console.log(`BillingService: Showing rewarded ad ${adUnitId}...`);
    // Native bridge call for AdMob rewarded video
    return new Promise(resolve => {
      // Simulate watching ad
      setTimeout(() => {
        // Simulating the user watched the ad and earned the reward
        resolve(true); 
      }, 2000); // 2 second simulated ad
    });
  }
};
