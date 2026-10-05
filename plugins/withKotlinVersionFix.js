const { withProjectBuildGradle } = require('@expo/config-plugins');

function withKotlinVersionFix(config) {
  return withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // 1. Add kotlinVersion = "2.2.0" to buildscript ext (needed for Kotlin 2.2.0 / K2 compiler)
    if (!contents.includes('ext.kotlinVersion') && !contents.includes('kotlinVersion =')) {
      contents = contents.replace(
        'buildscript {',
        'buildscript {\n    ext {\n        kotlinVersion = "2.2.0"\n    }\n'
      );
    }

    // 2. Force androidx.core to 1.16.0 to prevent 1.17.0 pulling in (requires compileSdk 36 + AGP 8.9.1)
    //    EAS free tier uses AGP 8.8.2 with compileSdk 35  1.17.0 is incompatible.
    if (!contents.includes('androidx.core:core:1.16.0')) {
      contents += [
        '',
        'allprojects {',
        '    configurations.all {',
        '        resolutionStrategy {',
        "            force 'androidx.core:core:1.16.0'",
        "            force 'androidx.core:core-ktx:1.16.0'",
        '        }',
        '    }',
        '}',
        '',
      ].join('\n');
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withKotlinVersionFix;
