import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAnalytics } from './analytics.js';

const results = [
  { created_at: new Date().toISOString(), top_matches: [{ name: 'א' }, { name: 'ב' }, { name: 'ג' }], preferences: { region: 'north', ratings: { gemara: 5 } } },
  { created_at: '2020-01-01', top_matches: [{ name: 'ב' }, { name: 'א' }], preferences: { ratings: { gemara: 3 } } },
  { top_match: 'ג' },
  { top_matches: [{ name: 'לא ידוע' }] }
];

test('counts first-place and top-3 appearances per yeshiva', () => {
  const s = computeAnalytics(results);
  const byName = Object.fromEntries(s.yeshivot.map(y => [y.name, y]));
  assert.deepEqual(byName['א'], { name: 'א', first: 1, top3: 2, clicks: 0 });
  assert.deepEqual(byName['ב'], { name: 'ב', first: 1, top3: 2, clicks: 0 });
  assert.equal(byName['ג'].first, 1);
  assert.equal(byName['לא ידוע'], undefined);
});

test('counts manager-contact clicks per yeshiva, once per test taker', () => {
  const s = computeAnalytics([
    { top_matches: [{ id: 'y1', name: 'א' }, { id: 'y2', name: 'ב' }], contact_clicks: ['y1'] },
    { top_matches: [{ id: 'y1', name: 'א' }], contact_clicks: ['y1', 'y9'] },
    { top_matches: [{ id: 'y1', name: 'א' }] }
  ]);
  const byName = Object.fromEntries(s.yeshivot.map(y => [y.name, y]));
  assert.equal(byName['א'].clicks, 2);
  assert.equal(byName['ב'].clicks, 0);
  assert.equal(s.clickers, 2);
});

test('totals, recent count, averages and regions', () => {
  const s = computeAnalytics(results);
  assert.equal(s.total, 4);
  assert.equal(s.last7, 1);
  assert.equal(s.paramAverages.gemara, 4);
  assert.deepEqual(s.regionCounts, { north: 1, all: 3 });
});
