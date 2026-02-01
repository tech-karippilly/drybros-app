/** Load typography first so FONT_FAMILY is defined before any component (avoids "regular of undefined") */
import './src/constants/typography';

import { registerRootComponent } from 'expo';
import { enableScreens } from 'react-native-screens';
import { RUNTIME_GLOBAL_FLAGS } from './src/constants/runtime';

import App from './App';

// Workaround: disable native screens to avoid "expected dynamic type 'boolean', but had type 'string'" (react-native-screens #3470)
declare global {
  // eslint-disable-next-line no-var
  var __DRYBROS_SCREENS_CONFIGURED__: boolean | undefined;
}

/**
 * Guard against Fast Refresh re-running the entry module and calling `enableScreens`
 * multiple times, which can cause:
 * "Invariant Violation: Tried to register two views with the same name RNSScreenContainer"
 */
if (!(globalThis as any)[RUNTIME_GLOBAL_FLAGS.SCREENS_CONFIGURED]) {
  (globalThis as any)[RUNTIME_GLOBAL_FLAGS.SCREENS_CONFIGURED] = true;
  enableScreens(false);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
