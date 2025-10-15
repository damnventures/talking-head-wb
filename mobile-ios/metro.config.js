const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for 3D model files
config.resolver.assetExts.push(
  // 3D models
  'glb',
  'gltf',
  'obj',
  'fbx',
  // Audio
  'mp3',
  'wav',
  'ogg',
  // Shaders
  'glsl',
  'vert',
  'frag'
);

// Ensure JavaScript module extensions are handled
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json', 'mjs');

module.exports = config;
