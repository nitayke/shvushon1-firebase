import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateKNNMatches, PARAM_DEFINITIONS, IMPORTANCE_PARAMS } from './knn.js';

const sampleYeshivot = [
  {
    id: 'y_test_1',
    name: 'ישיבת בית אל',
    type: 'hesder',
    region: 'center',
    ratings: { overall_size: 4, conditions: 4, chassidut: 2.5, rav_kook: 5, personal_relation: 4.5, liberalism: 2 },
    time: { gemara: 50, emunah: 20, tanach: 10, training: 10, social: 10 }
  },
  {
    id: 'y_test_2',
    name: 'מכינת עלי',
    type: 'mechina',
    region: 'center',
    ratings: { overall_size: 5, conditions: 3.5, chassidut: 2, rav_kook: 4, personal_relation: 4, liberalism: 2.5 },
    time: { gemara: 10, emunah: 30, tanach: 10, training: 30, social: 20 }
  }
];

const allIgnored = () => Object.fromEntries(PARAM_DEFINITIONS.map(p => [p.id, true]));

const exactPrefs = (y) => ({
  type: y.type,
  region: y.region,
  ratings: { ...y.ratings },
  time: { ...y.time },
  ignoreParams: { conditions: true } // importance question aims at 5, not at the yeshiva value
});

test('Exact match returns 100% matchScore for identical yeshiva parameters', () => {
  const matches = calculateKNNMatches(exactPrefs(sampleYeshivot[0]), sampleYeshivot, 3);
  assert.equal(matches[0].id, 'y_test_1');
  assert.equal(matches[0].matchScore, 100, 'Exact match must return 100% matchScore');
});

test('Exact match for second yeshiva returns 100% matchScore', () => {
  const matches = calculateKNNMatches(exactPrefs(sampleYeshivot[1]), sampleYeshivot, 3);
  assert.equal(matches[0].id, 'y_test_2');
  assert.equal(matches[0].matchScore, 100, 'Exact match for mechina must return 100% matchScore');
});

test('The time split alone separates a yeshiva from a mechina', () => {
  const prefs = (time) => ({ type: 'all', region: 'all', ratings: {}, ignoreParams: allIgnored(), time });
  assert.equal(calculateKNNMatches(prefs({ gemara: 60, emunah: 20, tanach: 10, training: 0, social: 10 }), sampleYeshivot)[0].id, 'y_test_1');
  assert.equal(calculateKNNMatches(prefs({ gemara: 10, emunah: 30, tanach: 0, training: 40, social: 20 }), sampleYeshivot)[0].id, 'y_test_2');
});

test('Yeshivot without a stored time split fall back to their old 1-5 ratings', () => {
  const legacy = { id: 'old', name: 'old', type: 'hesder', region: 'north', ratings: { gemara: 5, emunah: 3, tanach: 3, karviut: 1, social: 2 } };
  const mechina = { id: 'mech', name: 'mech', type: 'mechina', region: 'north', ratings: { gemara: 1, emunah: 5, tanach: 3, karviut: 5, social: 5 } };
  const time = { gemara: 70, emunah: 10, tanach: 10, training: 0, social: 10 };
  const m = calculateKNNMatches({ type: 'all', region: 'all', ratings: {}, ignoreParams: allIgnored(), time }, [legacy, mechina]);
  assert.equal(m[0].id, 'old');
});

test('Distance increases and matchScore drops below 100% when answers differ', () => {
  const userPreferences = {
    type: 'hesder',
    region: 'center',
    ratings: { overall_size: 1, conditions: 1, chassidut: 5, rav_kook: 1, personal_relation: 1, liberalism: 5 },
    time: { gemara: 0, emunah: 0, tanach: 0, training: 50, social: 50 },
    ignoreParams: {}
  };
  const matches = calculateKNNMatches(userPreferences, sampleYeshivot, 3);
  assert.equal(matches[0].matchScore < 100, true);
});

test('Uniform answers no longer return joke results', () => {
  const ratings = Object.fromEntries(PARAM_DEFINITIONS.map(p => [p.id, 5]));
  const time = { gemara: 20, emunah: 20, tanach: 20, training: 20, social: 20 };
  const matches = calculateKNNMatches({ type: 'all', region: 'all', ratings, ignoreParams: {}, time }, sampleYeshivot, 3);
  assert.ok(matches.length > 0);
  assert.ok(matches.every(m => !m.isEasterEgg && sampleYeshivot.some(y => y.id === m.id)));
});

test('Ignored parameters are skipped without penalizing distance', () => {
  const targetYeshiva = sampleYeshivot[0];
  const ignoreParams = allIgnored();
  ignoreParams.rav_kook = false; // Only rate rav_kook (and no time split)

  const matches = calculateKNNMatches({
    type: targetYeshiva.type,
    region: targetYeshiva.region,
    ratings: { rav_kook: targetYeshiva.ratings.rav_kook },
    ignoreParams
  }, sampleYeshivot, 3);
  assert.equal(matches[0].id, targetYeshiva.id);
  assert.equal(matches[0].matchScore, 100, 'Exact match on non-ignored parameter returns 100%');
});

test('Multi-select type/region only penalizes yeshivot outside the selected lists', () => {
  const ratings = Object.fromEntries(PARAM_DEFINITIONS.map((p, i) => [p.id, (i % 5) + 1]));
  const base = { ratings, ignoreParams: {} };
  const mk = (id, type, region) => ({ id, name: id, type, region, ratings, submissions_count: 1 });
  const list = [mk('a', 'hesder', 'north'), mk('b', 'gvoha', 'center'), mk('c', 'mechina', 'south')];
  const score = (prefs, id) => calculateKNNMatches({ ...base, ...prefs }, list, 3).find(m => m.id === id).matchScore;

  // 'all', an empty list and no preference are the same: nobody is penalized
  assert.equal(score({ type: 'all', region: 'all' }, 'a'), score({ type: [], region: [] }, 'a'));
  // Selecting hesder + gvoha keeps both unpenalized and penalizes mechina
  const multi = { type: ['hesder', 'gvoha'], region: 'all' };
  assert.equal(score(multi, 'a'), score({ type: 'all', region: 'all' }, 'a'));
  assert.equal(score(multi, 'b'), score({ type: 'all', region: 'all' }, 'b'));
  assert.ok(score(multi, 'c') < score({ type: 'all', region: 'all' }, 'c'));
  // Region list works the same way
  const regionMulti = { type: 'all', region: ['north', 'south'] };
  assert.ok(score(regionMulti, 'b') < score({ type: 'all', region: 'all' }, 'b'));
  assert.equal(score(regionMulti, 'c'), score({ type: 'all', region: 'all' }, 'c'));
});

test('A combined hesder+gvoha yeshiva is not penalized for either selection', () => {
  const ratings = { overall_size: 5 };
  const list = [{ id: 'x', name: 'x', type: 'hesder_gvoha', region: 'north', ratings, submissions_count: 1 }];
  const score = (type) => calculateKNNMatches({ type, region: 'all', ratings, ignoreParams: {} }, list)[0].matchScore;
  assert.equal(score(['hesder']), score('all'));
  assert.equal(score(['gvoha']), score('all'));
  assert.ok(score(['mechina']) < score('all'));
});

test('Importance questions: the answer is a weight, the target is always the top rating', () => {
  const neutral = Object.fromEntries(PARAM_DEFINITIONS.map((p, i) => [p.id, (i % 3) + 2]));
  const mk = (id, conditions) => ({ id, name: id, type: 'hesder', region: 'north', ratings: { ...neutral, conditions } });
  const list = [mk('low', 1), mk('mid', 3), mk('high', 5)];
  const rank = (answer) => calculateKNNMatches(
    { type: 'all', region: 'all', ratings: { ...neutral, conditions: answer }, ignoreParams: {} }, list, 3
  ).map(m => m.id);
  const scores = (answer) => Object.fromEntries(calculateKNNMatches(
    { type: 'all', region: 'all', ratings: { ...neutral, conditions: answer }, ignoreParams: {} }, list, 3
  ).map(m => [m.id, m.matchScore]));

  assert.ok(IMPORTANCE_PARAMS.has('conditions'));
  // Answering 1 ("not important") doesn't push the user away from a yeshiva with great conditions
  const notImportant = scores(1);
  assert.equal(notImportant.high, notImportant.low);
  assert.equal(notImportant.high, notImportant.mid);
  // Any higher answer prefers better conditions, and a higher answer separates them more
  assert.equal(rank(3)[0], 'high');
  assert.equal(rank(5)[0], 'high');
  assert.ok(scores(5).high - scores(5).low > scores(3).high - scores(3).low);
});
