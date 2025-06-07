const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add TypeScript support
config.resolver.sourceExts.push('ts', 'tsx');

// Ensure proper module resolution
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

module.exports = config;