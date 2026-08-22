import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateKNNMatches, PARAM_DEFINITIONS } from './knn.js';

const sampleYeshivot = [
  {
    id: 'y_test_1',
    name: 'ישיבת בית אל',
    type: 'hesder',
    region: 'center',
    ratings: {
      overall_size: 4,
      conditions: 4,
      gemara: 4.5,
      chassidut: 2.5,
      tanach: 3.5,
      emunah: 4.5,
      rav_kook: 5,
      social: 4,
      personal_relation: 4.5,
      liberalism: 2,
      karviut: 4
    }
  },
  {
    id: 'y_test_2',
    name: 'מכינת עלי',
    type: 'mechina',
    region: 'center',
    ratings: {
      overall_size: 5,
      conditions: 3.5,
      gemara: 2,
      chassidut: 2,
      tanach: 4,
      emunah: 4,
      rav_kook: 4,
      social: 5,
      personal_relation: 4,
      liberalism: 2.5,
      karviut: 5
    }
  }
];

test('Exact match returns 100% matchScore for identical yeshiva parameters', () => {
  const targetYeshiva = sampleYeshivot[0];
  const userPreferences = {
    type: targetYeshiva.type,
    region: targetYeshiva.region,
    ratings: { ...targetYeshiva.ratings },
    ignoreParams: {}
  };

  const matches = calculateKNNMatches(userPreferences, sampleYeshivot, 3);
  
  assert.equal(matches.length > 0, true);
  assert.equal(matches[0].id, targetYeshiva.id);
  assert.equal(matches[0].matchScore, 100, 'Exact match must return 100% matchScore');
});

test('Exact match for second yeshiva returns 100% matchScore', () => {
  const targetYeshiva = sampleYeshivot[1];
  const userPreferences = {
    type: targetYeshiva.type,
    region: targetYeshiva.region,
    ratings: { ...targetYeshiva.ratings },
    ignoreParams: {}
  };

  const matches = calculateKNNMatches(userPreferences, sampleYeshivot, 3);

  assert.equal(matches.length > 0, true);
  assert.equal(matches[0].id, targetYeshiva.id);
  assert.equal(matches[0].matchScore, 100, 'Exact match for mechina must return 100% matchScore');
});

test('Distance increases and matchScore drops below 100% when ratings differ', () => {
  const userPreferences = {
    type: 'hesder',
    region: 'center',
    ratings: {
      overall_size: 1, // differs from 4
      conditions: 1,   // differs from 4
      gemara: 1,
      chassidut: 5,
      tanach: 1,
      emunah: 1,
      rav_kook: 1,
      social: 1,
      personal_relation: 1,
      liberalism: 5,
      karviut: 1
    },
    ignoreParams: {}
  };

  const matches = calculateKNNMatches(userPreferences, sampleYeshivot, 3);
  assert.equal(matches[0].matchScore < 100, true);
});

test('Ignored parameters are skipped without penalizing distance', () => {
  const targetYeshiva = sampleYeshivot[0];
  const ignoreParams = {};
  PARAM_DEFINITIONS.forEach(p => {
    ignoreParams[p.id] = true; // Ignore all params except one
  });
  ignoreParams['gemara'] = false; // Only rate gemara

  const userPreferences = {
    type: targetYeshiva.type,
    region: targetYeshiva.region,
    ratings: { gemara: targetYeshiva.ratings.gemara },
    ignoreParams
  };

  const matches = calculateKNNMatches(userPreferences, sampleYeshivot, 3);
  assert.equal(matches[0].id, targetYeshiva.id);
  assert.equal(matches[0].matchScore, 100, 'Exact match on non-ignored parameter returns 100%');
});
