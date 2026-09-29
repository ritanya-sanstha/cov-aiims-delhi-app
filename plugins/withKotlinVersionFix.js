const { withProjectBuildGradle } = require('@expo/config-plugins');

function withKotlinVersionFix(config) {
  return withProjectBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    if (!contents.includes('ext.kotlinVersion') && !contents.includes('kotlinVersion =')) {
      config.modResults.contents = contents.replace(
        'buildscript {',
        'buildscript {\n    ext {\n        kotlinVersion = "2.2.0"\n    }\n'
      );
    }
    return config;
  });
}

module.exports = withKotlinVersionFix;
