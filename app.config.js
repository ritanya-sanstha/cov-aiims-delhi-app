/**
 * app.config.js — COV Alumni App
 * Reads the Register Artifact for the target institute and generates
 * the Expo app.json config at build time.
 *
 * Usage:
 *   REGISTER_FILE=./registers/aiims-delhi.register.json npx expo start
 *   eas build --profile aiims-delhi --platform android
 *
 * Defaults to AIIMS Delhi when REGISTER_FILE is not set.
 */
const register = require(
  process.env.REGISTER_FILE || './registers/aiims-delhi.register.json'
);

module.exports = {
  expo: {
    name: register.app.appName,
    slug: register.app.easProfileName,
    version: '1.0.0',
    orientation: 'portrait',
    icon: `./assets/logos/${register.branding.logoFile}`,
    userInterfaceStyle: 'light',
    newArchEnabled: false,

    splash: {
      image: `./assets/logos/${register.branding.logoFile}`,
      resizeMode: 'contain',
      backgroundColor: register.branding.splashBg,
    },

    ios: {
      supportsTablet: false,
      bundleIdentifier: register.app.bundleId,
    },

    android: {
      package: register.app.androidPackage,
      versionCode: register.app.versionCode,
      adaptiveIcon: {
        foregroundImage: `./assets/logos/${register.branding.logoFile}`,
        backgroundColor: register.branding.splashBg,
      },
      permissions: ['INTERNET'],
    },

    plugins: [
      'expo-router',
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic: false,
          },
        },
      ],
    ],

    scheme: register.app.easProfileName,

    extra: {
      register,            // entire Register Artifact available at runtime
      eas: {
        projectId: 'cov-aiims-delhi-app',
      },
    },
  },
};
