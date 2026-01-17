# Images Directory

Place your app images here.

## Expected Images:

1. **Logo Files:**
   - `logo.png` or `logo.svg` - Main DRYBROS logo (DRY in red, BROS in white, DRIVER in white)
   - `logo-dark.png` - Dark variant if needed
   - `logo-light.png` - Light variant if needed

2. **Background/Pattern:**
   - `background-pattern.png` - Abstract white lines pattern on black background
   - `background-solid.png` - Solid dark purplish-blue background

3. **Icons:**
   - App icons are in the root assets folder (icon.png, adaptive-icon.png, etc.)

## Usage:

Import images in your components:
```typescript
import logoImage from '../assets/images/logo.png';
import backgroundPattern from '../assets/images/background-pattern.png';
```

Or use require:
```typescript
<Image source={require('../assets/images/logo.png')} />
```
