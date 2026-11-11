import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildYeshivaReport } from './yeshivaReport.js';

const now = Date.parse('2026-11-11T12:00:00Z');
const daysAgo = (d) => new Date(now - d * 864e5).toISOString();
const yeshiva = { id: 'y_1', name: 'א', type: 'hesder_gvoha', region: 'north' };
const yeshivot = [yeshiva, { id: 'y_2', name: 'ב' }, { id: 'y_3', name: 'ג' }];

const result = (ids, extra = {}) => ({
  created_at: daysAgo(1),
  top_matches: ids.map((id, i) => ({ id, name: yeshivot.find(y => y.id === id).name, matchScore: 80 - i * 10 })),
  ...extra
});

test('counts appearances, first places, score, clicks and filters for the yeshiva', () => {
  const results = [
    result(['y_1', 'y_2'], { contact_clicks: ['y_1'], preferences: { region: ['north'], type: 'gvoha', ratings: { gemara: 5, social: null }, ignoreParams: {} } }),
    result(['y_2', 'y_1']),
    result(['y_2', 'y_3'], { preferences: { region: 'all', type: 'mechina', ratings: { gemara: 1 } } }),
    result(['y_1'], { created_at: daysAgo(40) }) // outside the window
  ];
  const r = buildYeshivaReport({ yeshiva, yeshivot, results, now });
  assert.equal(r.site.monthTotal, 3);
  assert.equal(r.site.institutions, 3);
  assert.equal(r.site.regionInterest, 1);
  assert.equal(r.site.typeInterest, 1);
  assert.equal(r.site.clickers, 1);
  assert.deepEqual(r.site.paramAverages, { gemara: 3 });
  assert.equal(r.own.top3, 2);
  assert.equal(r.own.first, 1);
  assert.equal(r.own.avgScore, 75);
  assert.equal(r.own.clicks, 1);
  assert.equal(r.own.rank, 2); // ב appears 3 times
  assert.deepEqual(r.own.paramAverages, { gemara: 5 });
  assert.equal(r.own.daily.reduce((a, b) => a + b, 0), 2);
});

test('matches by name for old results without ids', () => {
  const r = buildYeshivaReport({ yeshiva, yeshivot, results: [{ created_at: daysAgo(2), top_match: 'א' }], now });
  assert.equal(r.own.top3, 1);
  assert.equal(r.own.first, 1);
  assert.equal(r.site.monthTotal, 1);
});
