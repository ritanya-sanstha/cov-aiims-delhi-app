const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withHermesCommandFix(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const appBuildGradle = path.join(
        config.modRequest.platformProjectRoot, 'app', 'build.gradle'
      );

      if (!fs.existsSync(appBuildGradle)) {
        console.log('[withHermesCommandFix] android/app/build.gradle not found, skipping');
        return config;
      }

      let contents = fs.readFileSync(appBuildGradle, 'utf8');

      const OLD = /hermesCommand\s*=\s*new File\(\["node",\s*"--print",\s*"require\.resolve\('hermes-compiler\/package\.json'[^"]*"\]\.execute\(null,\s*rootDir\)\.text\.trim\(\)\)\.getParentFile\(\)\.getAbsolutePath\(\)\s*\+\s*"\/hermesc\/%OS-BIN%\/hermesc"/;

      if (OLD.test(contents)) {
        contents = contents.replace(
          OLD,
          `hermesCommand = new File(["node", "--print", "require.resolve('react-native/package.json')"].execute(null, rootDir).text.trim()).getParentFile().getAbsoluteFile().toString() + "/sdks/hermesc/%OS-BIN%/hermesc"`
        );
        fs.writeFileSync(appBuildGradle, contents, 'utf8');
        console.log('[withHermesCommandFix] Fixed hermesCommand to use react-native bundled hermesc');
      } else {
        console.log('[withHermesCommandFix] Pattern not matched - may already be fixed');
      }

      return config;
    },
  ]);
}

module.exports = withHermesCommandFix;
