const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Force Metro to resolve react-native-svg from this package's node_modules
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = Object.assign({}, config.resolver.extraNodeModules || {}, {
  'react-native-svg': path.resolve(projectRoot, 'node_modules/react-native-svg'),
});

// If your repo is a monorepo, watch the repo root to avoid duplicate copies
config.watchFolders = Array.from(new Set([...(config.watchFolders || []), path.resolve(projectRoot, '..')]));

module.exports = config;
