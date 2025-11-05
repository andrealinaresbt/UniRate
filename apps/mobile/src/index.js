// Robust polyfill for environments that lack SharedArrayBuffer (helps avoid
// runtime startup errors caused by some native modules or JS libs that check
// for it). This runs on web (window/self), Node-like (global), and globalThis.
// NOTE: Lightweight workaround for development only. Prefer a proper fix for
// production (enable SharedArrayBuffer or remove the depending module).
(() => {
	try {
		const root = (typeof globalThis !== 'undefined' && globalThis)
			|| (typeof global !== 'undefined' && global)
			|| (typeof self !== 'undefined' && self)
			|| (typeof window !== 'undefined' && window);
		if (root && typeof root.SharedArrayBuffer === 'undefined') {
			// Use ArrayBuffer as a minimal stand-in so modules that check existence
			// won't crash. This does NOT provide the same concurrency semantics.
			root.SharedArrayBuffer = root.ArrayBuffer;
		}
	} catch (e) {
		// ignore failures in polyfill
	}
})();

import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
