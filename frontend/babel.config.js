module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // This plugin is required for Reanimated 3+ and must be LAST
      'react-native-reanimated/plugin', 
    ],
  };
};