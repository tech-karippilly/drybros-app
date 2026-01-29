/** Load typography first so FONT_FAMILY is defined before any component (avoids "regular of undefined") */
import './src/constants/typography';

import { registerRootComponent } from 'expo';
import { enableScreens } from 'react-native-screens';

import App from './App';

// Workaround: disable native screens to avoid "expected dynamic type 'boolean', but had type 'string'" (react-native-screens #3470)
enableScreens(false);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
