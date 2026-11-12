// Paid listings ("expanded card") and the monthly results-page banner. Pure helpers shared by the site,
// the admin panel and the report API.
//
// Stored on the yeshivot documents (public read, admin write):
//   listing_until:   'YYYY-MM-DD', last day of the paid expanded card (inclusive)
//   website:         the yeshiva's site, linked from the expanded card and the banner
//   banner_bookings: [{ start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }], inclusive, one month each.
//                    Only one yeshiva holds the banner at a time; a new booking queues after the last one.

// Prices by exposure: how many students got the yeshiva in their top 3 in the last 30 days.
export const PRICE_TIERS = [
  { id: 'small', label: 'עד 20 תלמידים בחודש', max: 19, quarter: 450, year: 750, bundle: 1700 },
  { id: 'medium', label: '20 עד 100 תלמידים בחודש', max: 100, quarter: 700, year: 1100, bundle: 2100 },
  { id: 'large', label: 'מעל 100 תלמידים בחודש', max: Infinity, quarter: 950, year: 1500, bundle: 2500 }
];

export const tierFor = (monthlyTop3) => PRICE_TIERS.find(t => Number(monthlyTop3 || 0) <= t.max);

const pad = (n) => String(n).padStart(2, '0');
// Israel local date, so the server (UTC) and the browser agree on "today".
export const todayKey = (now = Date.now()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));

const toUtc = (key) => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const fromUtc = (ms) => { const d = new Date(ms); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
export const addDays = (key, days) => fromUtc(toUtc(key) + days * 864e5);
// One calendar month, inclusive: 15/11 -> 14/12 (the start day is clamped to short months: 31/1 -> 27/2).
export const monthEnd = (start) => {
  const [y, m, d] = start.split('-').map(Number);
  const lastOfNext = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return addDays(fromUtc(Date.UTC(y, m, Math.min(d, lastOfNext))), -1);
};

export const isValidDateKey = (key) => /^\d{4}-\d{2}-\d{2}$/.test(String(key || '')) && fromUtc(toUtc(key)) === key;

export const hasPaidListing = (yeshiva, today = todayKey()) =>
  isValidDateKey(yeshiva?.listing_until) && yeshiva.listing_until >= today;

export const websiteUrl = (site) => {
  const s = String(site || '').trim();
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

// Every booking across yeshivot, soonest first: [{ yeshivaId, yeshivaName, start, end }]
export const bannerSchedule = (yeshivot) => yeshivot
  .flatMap(y => (Array.isArray(y.banner_bookings) ? y.banner_bookings : [])
    .filter(b => isValidDateKey(b?.start) && isValidDateKey(b?.end))
    .map(b => ({ yeshivaId: y.id, yeshivaName: y.name, start: b.start, end: b.end })))
  .sort((a, b) => a.start.localeCompare(b.start));

// Who holds the banner today, and the first day a new booking can start (the day after the last booking).
export const bannerStatus = (yeshivot, today = todayKey()) => {
  const schedule = bannerSchedule(yeshivot).filter(b => b.end >= today);
  const current = schedule.find(b => b.start <= today) || null;
  const lastEnd = schedule.reduce((max, b) => (b.end > max ? b.end : max), '');
  const nextFree = lastEnd ? addDays(lastEnd, 1) : today;
  return { today, current, upcoming: schedule.filter(b => b !== current), nextFree: nextFree > today ? nextFree : today };
};

// A one-month booking for the next free slot.
export const nextBannerBooking = (yeshivot, today = todayKey()) => {
  const start = bannerStatus(yeshivot, today).nextFree;
  return { start, end: monthEnd(start) };
};
