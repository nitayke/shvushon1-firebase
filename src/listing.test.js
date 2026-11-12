import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tierFor, monthEnd, addDays, hasPaidListing, bannerStatus, nextBannerBooking, websiteUrl, todayKey } from './listing.js';

test('price tiers follow the monthly top-3 count', () => {
  assert.equal(tierFor(0).id, 'small');
  assert.equal(tierFor(19).id, 'small');
  assert.equal(tierFor(20).id, 'medium');
  assert.equal(tierFor(100).id, 'medium');
  assert.equal(tierFor(101).id, 'large');
  assert.deepEqual([tierFor(5).quarter, tierFor(5).year], [450, 750]);
  assert.deepEqual([tierFor(50).quarter, tierFor(50).year], [700, 1100]);
  assert.deepEqual([tierFor(500).quarter, tierFor(500).year], [950, 1500]);
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
