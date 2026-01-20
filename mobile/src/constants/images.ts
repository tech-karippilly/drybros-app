/**
 * Image asset paths
 * 
 * Place your images in mobile/assets/images/ directory
 */

export const IMAGES = {
  // Splash Screen Images
  bannerBg: require('../../assets/images/banner-bg.png'),
  pattern: require('../../assets/images/pattern.png'),
  driverLogo: require('../../assets/images/driver-logo.png'),
  
  // App Icons (already in assets root)
  icon: require('../../assets/icon.png'),
  adaptiveIcon: require('../../assets/adaptive-icon.png'),
  splashIcon: require('../../assets/splash-icon.png'),
} as const;

export type ImageKey = keyof typeof IMAGES;