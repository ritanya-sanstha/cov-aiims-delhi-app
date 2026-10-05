const { withAppBuildGradle, withAndroidManifest } = require('@expo/config-plugins');

// Step 1+2: Fix Kotlin version and androidx.core resolution
function withKotlinVersionFix(config) {
  return withAppBuildGradle(config, (config) => {
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
        '            force \'androidx.core:core:1.16.0\'',
        '            force \'androidx.core:core-ktx:1.16.0\'',
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

// Step 3: Strip assetsPaths from configChanges (added by expo-dom-webview 57.0.1)
// assetsPaths flag requires compileSdk 36; EAS free tier uses compileSdk 35 -> AAPT error
function withStripAssetsPaths(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const app = manifest.manifest.application?.[0];
    if (!app) return config;

    const activities = app.activity || [];
    activities.forEach((activity) => {
      const attrs = activity['$'];
      if (attrs && attrs['android:configChanges']) {
        const original = attrs['android:configChanges'];
        // Remove assetsPaths (with or without surrounding |)
        const stripped = original
          .split('|')
          .map(s => s.trim())
          .filter(s => s !== 'assetsPaths')
          .join('|');
        if (stripped !== original) {
          attrs['android:configChanges'] = stripped;
          console.log('[withKotlinVersionFix] Stripped assetsPaths from configChanges (AAPT fix)');
        }
      }
    });

    return config;
  });
}

// Compose both fixes
function withAllFixes(config) {
  config = withKotlinVersionFix(config);
  config = withStripAssetsPaths(config);
  return config;
}

module.exports = withAllFixes;
