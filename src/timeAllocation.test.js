import test from 'node:test';
import assert from 'node:assert/strict';
import { hoursToTime, timeToHours, ratingsToTime, mergeTime, isValidTime, TIME_TOTAL_HOURS } from './timeAllocation.js';

const sum = (o) => Object.values(o).reduce((s, v) => s + v, 0);

test('hours <-> percents round-trip and always sum to the total', () => {
  const hours = { gemara: 20, emunah: 10, tanach: 5, training: 5, social: 10 };
  const time = hoursToTime(hours);
  assert.deepEqual(time, { gemara: 40, emunah: 20, tanach: 10, training: 10, social: 20 });
  assert.deepEqual(timeToHours(time), hours);
  const odd = timeToHours({ gemara: 37, emunah: 21, tanach: 14, training: 9, social: 19 });
  assert.equal(sum(odd), TIME_TOTAL_HOURS);
});

test('old 1-5 ratings convert to a full split that keeps the emphasis', () => {
  const yeshiva = ratingsToTime({ gemara: 5, emunah: 3, tanach: 3, karviut: 1, social: 3 });
  const mechina = ratingsToTime({ gemara: 2, emunah: 5, tanach: 3, karviut: 5, social: 4 });
  assert.ok(isValidTime(yeshiva) && isValidTime(mechina));
  assert.ok(yeshiva.gemara > 50);
  assert.ok(mechina.training > mechina.gemara && mechina.emunah > mechina.gemara);
  assert.ok(isValidTime(ratingsToTime({})));
});

test('mergeTime weights the stored average by its count', () => {
  const merged = mergeTime({ gemara: 50, emunah: 20, tanach: 10, training: 10, social: 10 }, 3,
    [{ gemara: 10, emunah: 20, tanach: 10, training: 50, social: 10 }]);
  assert.deepEqual(merged, { gemara: 40, emunah: 20, tanach: 10, training: 20, social: 10 });
  assert.equal(mergeTime(null, 1, [{ bad: 1 }]), null);
});
