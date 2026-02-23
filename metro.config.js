const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Make sure Metro only looks in this project's directory
config.watchFolders = [projectRoot];

// Only resolve node_modules from this project
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

// Reset asset roots to only this project
config.resolver.assetExts = config.resolver.assetExts || [];

module.exports = config;
