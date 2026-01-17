# Drybros Mobile App

React Native mobile application built with Expo for iOS and Android.

## Features

- ✅ Internet connection monitoring
- ✅ Location services
- ✅ Camera access
- ✅ Push notifications
- ✅ Battery level monitoring
- ✅ SMS functionality
- ✅ Portrait-only orientation
- ✅ Responsive design for different screen sizes
- ✅ Poppins font family
- ✅ Toast notifications
- ✅ Calendar and date/time pickers

## Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── ui/             # Base UI components (Toast, Card, Modal, Input, Calendar, DateTimePicker)
│   ├── screens/            # Screen components
│   ├── hooks/              # Custom React hooks
│   │   ├── useNetwork.ts   # Network connection hook
│   │   ├── useLocation.ts  # Location permissions and access
│   │   ├── useCamera.ts    # Camera permissions and access
│   │   ├── useNotifications.ts # Push notifications
│   │   ├── useBattery.ts   # Battery monitoring
│   │   └── useSMS.ts       # SMS functionality
│   ├── contexts/           # React contexts
│   │   └── ToastContext.tsx # Toast notification context
│   ├── constants/          # App constants
│   │   ├── colors.ts       # Color palette
│   │   ├── typography.ts   # Font sizes and families
│   │   ├── permissions.ts  # Permission-related constants
│   │   └── app.ts          # App configuration
│   ├── types/              # TypeScript types
│   │   ├── theme.ts        # Theme types
│   │   └── common.ts       # Common component types
│   ├── themes/             # Theme configurations
│   │   └── defaultTheme.ts # Default theme
│   ├── typography/         # Typography components
│   │   └── Text.tsx        # Custom Text component with Poppins
│   └── utils/              # Utility functions
│       ├── responsive.ts   # Responsive utilities
│       ├── formatters.ts   # Date, time, currency formatters
│       └── validators.ts   # Validation utilities
├── assets/                 # Images, fonts, etc.
├── App.tsx                 # Main app component
├── app.json                # Expo configuration
└── package.json            # Dependencies

```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install fonts (Poppins):
   - Download Poppins font files
   - Add them to `assets/fonts/` directory
   - Configure in `app.json` if needed

## Running the App

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Key Dependencies

- `expo` - Expo SDK
- `expo-location` - Location services
- `expo-image-picker` - Camera and image library access
- `expo-notifications` - Push notifications
- `expo-battery` - Battery monitoring
- `expo-sms` - SMS functionality
- `@react-native-community/netinfo` - Network connection monitoring
- `@react-native-community/datetimepicker` - Date and time picker

## Usage Examples

### Using Toast Notifications

```typescript
import { useToast } from '../contexts';

const MyComponent = () => {
  const { showToast } = useToast();

  const handleAction = () => {
    showToast({
      message: 'Action completed successfully!',
      type: 'success',
      duration: 3000,
      position: 'top',
    });
  };

  return <Button onPress={handleAction} />;
};
```

### Using Location Hook

```typescript
import { useLocation } from '../hooks';

const LocationComponent = () => {
  const { getCurrentLocation, hasPermission, requestPermission } = useLocation();

  const handleGetLocation = async () => {
    if (!hasPermission) {
      await requestPermission();
    }
    const location = await getCurrentLocation();
    console.log(location);
  };

  return <Button onPress={handleGetLocation} title="Get Location" />;
};
```

### Using Custom Text Component

```typescript
import { Text } from '../typography';

<Text variant="h1" weight="bold" color={COLORS.primary}>
  Hello World
</Text>
```

### Using Responsive Utilities

```typescript
import { normalizeWidth, normalizeHeight, isSmallDevice } from '../utils/responsive';

const styles = StyleSheet.create({
  container: {
    width: normalizeWidth(300),
    height: normalizeHeight(200),
    padding: isSmallDevice() ? 10 : 20,
  },
});
```

## Permissions

The app requires the following permissions:

- **Location**: For location-based features
- **Camera**: For taking photos
- **Notifications**: For push notifications
- **SMS**: For sending SMS (Android only, limited on iOS)

Permissions are requested when features are used. Users can grant or deny permissions through the system dialogs.

## Theme Customization

Update colors in `src/constants/colors.ts` based on your Figma design:
- Primary colors
- Secondary colors
- Semantic colors (success, error, warning, info)
- Neutral colors
- Text and background colors

## Typography

The app uses Poppins font family. Configure font sizes in `src/constants/typography.ts`.

## Orientation

The app is configured for portrait-only mode. Landscape orientation is disabled in `app.json`.

## Platform Support

- ✅ iOS
- ✅ Android

Web support is available but not the primary target.

## Development Guidelines

1. All constants must be stored in `src/constants/`
2. Use the custom `Text` component instead of React Native's `Text`
3. Use responsive utilities for sizing (`normalizeWidth`, `normalizeHeight`, `normalizeFont`)
4. Use TypeScript for all files
5. Follow the established folder structure
6. Keep components modular and reusable

## Notes

- Update colors in `src/constants/colors.ts` based on Figma design
- Add Poppins font files to the project
- Configure bundle identifiers in `app.json` for production builds