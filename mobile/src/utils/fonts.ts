/**
 * Font loading utility
 * Loads Poppins font family
 * 
 * NOTE: Add Poppins font files to assets/fonts/ directory before using:
 * - Poppins-Regular.ttf
 * - Poppins-Medium.ttf
 * - Poppins-SemiBold.ttf
 * - Poppins-Bold.ttf
 * - Poppins-Light.ttf
 * - Poppins-Thin.ttf
 * 
 * If fonts are not available, the app will use system font fallbacks.
 * To disable font loading temporarily, comment out the Font.loadAsync call.
 */

import * as Font from 'expo-font';

export const loadFonts = async (): Promise<void> => {
  try {
    // Uncomment and update paths once Poppins font files are added to assets/fonts/
    // await Font.loadAsync({
    //   'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
    //   'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
    //   'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
    //   'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
    //   'Poppins-Light': require('../../assets/fonts/Poppins-Light.ttf'),
    //   'Poppins-Thin': require('../../assets/fonts/Poppins-Thin.ttf'),
    // });
    
    // Temporarily using system fonts until Poppins fonts are added
    console.log('Using system fonts. Add Poppins fonts to enable custom typography.');
  } catch (error) {
    console.warn('Error loading fonts:', error);
    // Fonts will fallback to system fonts if loading fails
  }
};