// Time allocation: instead of rating gemara / emunah / tanach / training / friends 1-5 each (where most
// people answer 4-5 on everything), the user splits a fixed budget of free hours between them.
// Stored everywhere (test results, yeshivot, submissions, requests) as `time`: integer percents summing to 100.

// A week of free hours (50 gives 2% steps; the allocator's blocks are 5 hours each, with ± for single hours).
export const TIME_TOTAL_HOURS = 50;
export const TIME_PERIOD = 'בשבוע';
export const HOURS_PER_BLOCK = 5;

export const TIME_CATEGORIES = [
  { id: 'gemara', label: 'גמרא', hint: 'עיון, בקיאות, חברותא', color: '#52341d' },
  { id: 'emunah', label: 'אמונה', hint: 'שיעורי אמונה ומחשבת ישראל', color: '#b47828' },
  { id: 'tanach', label: 'תנ"ך', hint: 'לימוד תנ"ך', color: '#7a8a4a' },
  { id: 'training', label: 'אימונים', hint: 'כושר, ניווטים, הכנה לצבא', color: '#4a6f8a' },
  { id: 'social', label: 'חברים', hint: 'זמן חברתי, גיבוש, שיחות', color: '#a4556b' }
];

export const TIME_IDS = TIME_CATEGORIES.map(c => c.id);

// Old 1-5 parameter that each category replaces (used by the data migration).
export const LEGACY_PARAM_FOR_CATEGORY = {
  gemara: 'gemara',
  emunah: 'emunah',
  tanach: 'tanach',
  training: 'karviut',
  social: 'social'
};
export const LEGACY_TIME_PARAMS = Object.values(LEGACY_PARAM_FOR_CATEGORY);

// Rounds non-negative weights to integers summing to `total` (largest remainder), keeping every id.
const roundToTotal = (weights, total) => {
  const sum = TIME_IDS.reduce((s, id) => s + Math.max(0, Number(weights[id]) || 0), 0);
  if (sum <= 0) return Object.fromEntries(TIME_IDS.map(id => [id, 0]));
  const exact = TIME_IDS.map(id => [id, (Math.max(0, Number(weights[id]) || 0) / sum) * total]);
  const out = Object.fromEntries(exact.map(([id, v]) => [id, Math.floor(v)]));
  let left = total - Object.values(out).reduce((s, v) => s + v, 0);
  [...exact].sort((a, b) => (b[1] % 1) - (a[1] % 1)).forEach(([id]) => {
    if (left > 0) { out[id]++; left--; }
  });
  return out;
};

export const emptyHours = () => Object.fromEntries(TIME_IDS.map(id => [id, 0]));

export const hoursUsed = (hours) => TIME_IDS.reduce((s, id) => s + (Number(hours?.[id]) || 0), 0);

// Hours (from the allocator) -> stored percents.
export const hoursToTime = (hours) => roundToTotal(hours, 100);

// Stored percents -> hours for the allocator (always a full allocation when the input has any time).
export const timeToHours = (time) => roundToTotal(time || {}, TIME_TOTAL_HOURS);

// Text lines for admin emails.
export const timeLines = (time) => TIME_CATEGORIES.map(c => `${c.label}: ${time?.[c.id] ?? '-'}% מהזמן`);

export const isValidTime = (time) =>
  !!time && TIME_IDS.every(id => Number.isFinite(Number(time[id]))) &&
  Math.abs(TIME_IDS.reduce((s, id) => s + Number(time[id]), 0) - 100) < 1;

/**
 * Converts old 1-5 ratings to a time split (migration of existing yeshivot / submissions).
 * Each step on the old scale doubles the time (the 1-5 answers were compressed: almost everything got 3-5),
 * and a per-category prior reflects how a day in yeshiva is really split, calibrated so the average
 * yeshiva in the database lands near gemara 40% / emunah 20% / tanach 15% / training 10% / friends 15%.
 * Missing ratings count as 3.
 */
const LEGACY_PRIOR = { gemara: 1, emunah: 0.48, tanach: 0.58, training: 0.42, social: 0.24 };
export const ratingsToTime = (ratings = {}) => {
  const weights = {};
  TIME_IDS.forEach(id => {
    const r = Number(ratings[LEGACY_PARAM_FOR_CATEGORY[id]]);
    const rating = Number.isFinite(r) && r > 0 ? Math.min(5, Math.max(1, r)) : 3;
    weights[id] = LEGACY_PRIOR[id] * Math.pow(2, rating - 1);
  });
  return roundToTotal(weights, 100);
};

// Average of several time splits, renormalized to 100.
export const averageTime = (times) => {
  const valid = times.filter(isValidTime);
  if (valid.length === 0) return null;
  const sums = Object.fromEntries(TIME_IDS.map(id => [id, valid.reduce((s, t) => s + Number(t[id]), 0)]));
  return roundToTotal(sums, 100);
};

// Weighted merge of an existing average (weight `count`) with new splits; used when folding student reports.
export const mergeTime = (current, count, additions) => {
  const parts = additions.filter(isValidTime);
  if (parts.length === 0) return current;
  if (!isValidTime(current)) return averageTime(parts);
  const sums = Object.fromEntries(TIME_IDS.map(id => [
    id, Number(current[id]) * count + parts.reduce((s, t) => s + Number(t[id]), 0)
  ]));
  return roundToTotal(sums, 100);
};
