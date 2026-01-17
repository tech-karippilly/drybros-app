# Images Needed

Please add the following images to this directory:

## 1. Logo (`logo.png`)
- **Description:** DRYBROS logo
- **Content:**
  - Top line: "DRYBROS" (DRY in red, BROS in white)
  - Bottom line: "DRIVER" (in white)
  - Background: Black
  - Style: Bold, uppercase, sans-serif
- **Recommended size:** 512x512px or higher (PNG with transparency)
- **Usage:** App logo, splash screen, headers

## 2. Background Pattern (`background-pattern.png`)
- **Description:** Abstract pattern with white curved lines on black background
- **Content:**
  - Black background
  - 15-20 thin white lines
  - Curved/wave-like pattern
  - Creates depth and movement effect
- **Recommended size:** 1080x1920px or higher (PNG)
- **Usage:** Background for screens, splash screens

## 3. Background Solid (`background-solid.png`)
- **Description:** Solid dark purplish-blue color
- **Content:**
  - Uniform dark indigo/slate blue color
  - No patterns or textures
- **Recommended size:** 1080x1920px or higher (PNG)
- **Usage:** Background for screens, loading states

## File Naming Convention
- Use lowercase with hyphens: `logo.png`, `background-pattern.png`
- PNG format recommended for transparency support
- Optimize images for mobile (compress but maintain quality)

## After Adding Images
Once you've added the images, they will be automatically available through:
```typescript
import { IMAGES } from '../constants/images';

// Usage in components
<Image source={IMAGES.logo} />
<Image source={IMAGES.backgroundPattern} />
```
