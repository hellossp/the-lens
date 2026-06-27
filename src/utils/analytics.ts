declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Sends a tracking event to Google Analytics and Meta (Facebook) Pixel.
 * If the event name matches a standard Meta Pixel event, it uses 'track'.
 * Otherwise, it uses 'trackCustom'.
 */
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window === "undefined") return;

  // 1. Google Analytics Tracking
  if (window.gtag) {
    window.gtag("event", eventName, params);
  }

  // 2. Meta Pixel Tracking
  if (window.fbq) {
    const standardPixelEvents = [
      "AddPaymentInfo",
      "AddToCart",
      "AddToWishlist",
      "CompleteRegistration",
      "Contact",
      "CustomizeProduct",
      "Donate",
      "FindLocation",
      "InitiateCheckout",
      "Lead",
      "Purchase",
      "Schedule",
      "Search",
      "StartTrial",
      "SubmitApplication",
      "Subscribe",
      "ViewContent",
    ];

    if (standardPixelEvents.includes(eventName)) {
      window.fbq("track", eventName, params);
    } else {
      window.fbq("trackCustom", eventName, params);
    }
  }
};
