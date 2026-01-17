/**
 * Image asset paths
 * 
 * Place your images in mobile/assets/images/ directory
 * 
 * Expected images:
 * - logo.png: DRYBROS logo (DRY in red, BROS in white, DRIVER in white on black)
 * - background-pattern.png: Abstract white lines pattern on black background
 * - background-solid.png: Solid dark purplish-blue background
 * 
 * NOTE: Uncomment the require statements below once you've added the images
 */

export const IMAGES = {
  // Logo
  // logo: require('../../assets/images/logo.png'),
  
  // Backgrounds
  // backgroundPattern: require('../../assets/images/background-pattern.png'),
  // backgroundSolid: require('../../assets/images/background-solid.png'),
  
  // App Icons (already in assets root)
  icon: require('../../assets/icon.png'),
  adaptiveIcon: require('../../assets/adaptive-icon.png'),
  splashIcon: require('../../assets/splash-icon.png'),
} as const;

export type ImageKey = keyof typeof IMAGES;