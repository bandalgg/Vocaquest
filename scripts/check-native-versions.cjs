const assert = require('node:assert/strict');
const semver = require('semver');
const supported = require('expo/bundledNativeModules.json');
for (const name of ['expo-asset', 'expo-font', 'expo-constants', 'expo-modules-core']) {
  const actual = require(name + '/package.json').version;
  assert.ok(semver.satisfies(actual, supported[name]), `${name}: ${actual} is incompatible with ${supported[name]}`);
  console.log(`${name}: ${actual} matches ${supported[name]}`);
}
