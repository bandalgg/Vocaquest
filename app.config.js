const { expo } = require('./app.json');

// Keep the application id and storage namespace stable across upgrades.
// Each Actions run creates a strictly newer Android version code.
module.exports = {
  ...expo,
  android: {
    ...expo.android,
    versionCode: Number(process.env.GITHUB_RUN_NUMBER || 1),
  },
};
