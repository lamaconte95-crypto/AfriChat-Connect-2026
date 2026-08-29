/**
 * Device & Platform Detection Utilities for AfriChat Connect
 */

export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isIosUA = /iphone|ipad|ipod/.test(ua);
  const isIpadOS = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
  return isIosUA || isIpadOS;
};

export const isAndroidDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /android/.test(ua);
};

export const isStandalonePWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};
