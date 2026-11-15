const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Reference checkout is not app source; avoid crawling its dependencies.
config.resolver.blockList = [/[/\\\\]\.reference[/\\\\].*/];

// expo-sqlite on web needs the wa-sqlite .wasm file to be treated as an asset
config.resolver.assetExts.push('wasm');

// Required headers for SharedArrayBuffer (used by expo-sqlite on web)
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  middleware(req, res, next);
};

module.exports = config;

