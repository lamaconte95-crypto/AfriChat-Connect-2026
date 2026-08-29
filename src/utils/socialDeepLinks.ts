/**
 * Social Media Deep Links Utility for AfriChat Connect
 * Handles 1-click mobile application launch (Facebook, TikTok, YouTube)
 * with graceful browser fallbacks and 1-click subscribe URLs.
 */

export interface SocialLinkConfig {
  platform: 'facebook' | 'tiktok' | 'youtube' | 'whatsapp' | 'instagram';
  name: string;
  handle: string;
  webUrl: string;
  appDeepLink: string;
  subscribeUrl: string;
  iconColor: string;
  badgeLabel: string;
}

export const OFFICIAL_SOCIAL_LINKS: Record<'facebook' | 'tiktok' | 'youtube', SocialLinkConfig> = {
  facebook: {
    platform: 'facebook',
    name: 'Facebook',
    handle: '@africhat.connect',
    webUrl: 'https://facebook.com/africhat.connect',
    appDeepLink: 'fb://facewebmodal/f?href=https%3A%2F%2Ffacebook.com%2Fafrichat.connect',
    subscribeUrl: 'https://facebook.com/africhat.connect',
    iconColor: '#1877F2',
    badgeLabel: 'Suivre sur Facebook',
  },
  tiktok: {
    platform: 'tiktok',
    name: 'TikTok',
    handle: '@africhat.connect',
    webUrl: 'https://www.tiktok.com/@africhat.connect',
    appDeepLink: 'tiktok://user?username=africhat.connect',
    subscribeUrl: 'https://www.tiktok.com/@africhat.connect?lang=fr',
    iconColor: '#00F2FE',
    badgeLabel: "S'abonner sur TikTok",
  },
  youtube: {
    platform: 'youtube',
    name: 'YouTube',
    handle: '@africhattv',
    webUrl: 'https://youtube.com/@africhattv?sub_confirmation=1',
    appDeepLink: 'vnd.youtube://www.youtube.com/@africhattv?sub_confirmation=1',
    subscribeUrl: 'https://youtube.com/@africhattv?sub_confirmation=1',
    iconColor: '#FF0000',
    badgeLabel: "S'abonner 1-Clic",
  },
};

/**
 * Open social media platform using deep link if available, with immediate web fallback
 */
export const openSocialDeepLink = (
  platform: 'facebook' | 'tiktok' | 'youtube' | string,
  customWebUrl?: string
) => {
  const config = OFFICIAL_SOCIAL_LINKS[platform as keyof typeof OFFICIAL_SOCIAL_LINKS];
  const targetWebUrl = customWebUrl || config?.webUrl || 'https://africhat-connect.firebaseapp.com';

  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile && config) {
    // Attempt to launch native app via deep link
    const now = Date.now();
    const deepLink = config.appDeepLink;

    // Use invisible iframe or direct assignment for deep link
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);

    // Fallback to web link if app does not open within 1.5 seconds
    setTimeout(() => {
      document.body.removeChild(iframe);
      if (Date.now() - now < 2000) {
        window.open(config.subscribeUrl || targetWebUrl, '_blank', 'noopener,noreferrer');
      }
    }, 1200);
  } else {
    // Desktop or fallback: open directly in a new tab with 1-click subscription
    window.open(config?.subscribeUrl || targetWebUrl, '_blank', 'noopener,noreferrer');
  }
};
