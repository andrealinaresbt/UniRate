// Quick polyfill for environments that lack SharedArrayBuffer (helps avoid runtime
// startup errors caused by some native modules or JS libs that check for it).
// NOTE: This is a lightweight workaround for development/testing only. Prefer a
// proper fix (remove the module that requires SharedArrayBuffer, or enable the
// feature on the target runtime) for production.
if (typeof global !== 'undefined' && typeof global.SharedArrayBuffer === 'undefined') {
	try {
		// Use ArrayBuffer as a minimal stand-in so modules that check existence won't crash.
		// This does NOT provide the same concurrency semantics as SharedArrayBuffer.
		global.SharedArrayBuffer = global.ArrayBuffer;
	} catch (e) {
		// ignore
	}
}

import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
