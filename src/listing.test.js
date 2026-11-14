import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPriceList, PRICE_PRESETS, monthEnd, addDays, hasPaidListing, bannerStatus, nextBannerBooking, websiteUrl, todayKey } from './listing.js';

test('price list derives the longer periods from the key prices', () => {
  const low = buildPriceList(PRICE_PRESETS.low);
  assert.deepEqual(low.card.map(r => r[2]), [500, 900, 1100]);
  assert.deepEqual(low.questionBanner.map(r => r[2]), [250, 450, 600]);
  assert.equal(low.mainBanner[0][2], 800);
  assert.equal(low.bundle, 1500);
  const high = buildPriceList(PRICE_PRESETS.high);
  assert.equal(high.bundle, 2600);
  // a year is always cheaper per month than a quarter
  for (const list of [low, high]) assert.ok(list.card[2][2] / 12 < list.card[0][2] / 3);
});

test('date helpers', () => {
  assert.equal(monthEnd('2026-11-15'), '2026-12-14');
  assert.equal(monthEnd('2026-12-01'), '2026-12-31');
  assert.equal(monthEnd('2027-01-31'), '2027-02-27');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(todayKey(Date.parse('2026-11-12T23:30:00Z')), '2026-11-13'); // Israel is ahead of UTC
});

test('paid listing is active through its last day', () => {
  assert.equal(hasPaidListing({ listing_until: '2026-11-12' }, '2026-11-12'), true);
  assert.equal(hasPaidListing({ listing_until: '2026-11-11' }, '2026-11-12'), false);
  assert.equal(hasPaidListing({}, '2026-11-12'), false);
  assert.equal(websiteUrl('www.x.co.il'), 'https://www.x.co.il');
  assert.equal(websiteUrl('http://x.com'), 'http://x.com');
});

test('banner queue: current holder, upcoming, next free slot', () => {
  const yeshivot = [
    { id: 'a', name: 'א', banner_bookings: [{ start: '2026-11-01', end: '2026-11-30' }, { start: '2026-09-01', end: '2026-09-30' }] },
    { id: 'b', name: 'ב', banner_bookings: [{ start: '2026-12-01', end: '2026-12-31' }] },
    { id: 'c', name: 'ג' }
  ];
  const s = bannerStatus(yeshivot, '2026-11-12');
  assert.equal(s.current.yeshivaId, 'a');
  assert.deepEqual(s.upcoming.map(b => b.yeshivaId), ['b']);
  assert.equal(s.nextFree, '2027-01-01');
  assert.deepEqual(nextBannerBooking(yeshivot, '2026-11-12'), { start: '2027-01-01', end: '2027-01-31' });

  const free = bannerStatus([{ id: 'c', name: 'ג' }], '2026-11-12');
  assert.equal(free.current, null);
  assert.equal(free.nextFree, '2026-11-12');
});
