module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        // RN 0.79 bundles Hermes v0, whose hermesc rejects `#private` class
        // fields. babel-preset-expo 57 defaults to the Hermes v1 profile, which
        // leaves them untranspiled and breaks assembleRelease.
        { unstable_transformProfile: 'hermes-v0' },
      ],
    ],
  };
};
