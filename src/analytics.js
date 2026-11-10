// Aggregation of all_test_results documents. The aggregate is additive (plain sums), so the server
// can fold new documents into a stored aggregate instead of re-reading every result on each load.
const IGNORED_NAMES = new Set(['לא ידוע', 'N/A']);
const DAY_MS = 24 * 60 * 60 * 1000;

const matchesOf = (res) => {
  if (Array.isArray(res.top_matches) && res.top_matches.length > 0) return res.top_matches;
  return res.top_match ? [{ name: res.top_match }] : [];
};

const dayKey = (time) => new Date(time).toISOString().slice(0, 10);

export const createAggregate = () => ({
  total: 0,
  clickers: 0, // test takers who clicked a manager-contact button
  yeshivot: {}, // name -> { first, top3, clicks }
  paramTotals: {},
  paramCounts: {},
  regionCounts: {},
  daily: {} // 'YYYY-MM-DD' (UTC) -> number of tests
});

const yeshivaEntry = (agg, name) => agg.yeshivot[name] || (agg.yeshivot[name] = { first: 0, top3: 0, clicks: 0 });

export const addResult = (agg, res) => {
  agg.total++;
  if (typeof res.created_at === 'string' && res.created_at.length >= 10) {
    const day = res.created_at.slice(0, 10);
    agg.daily[day] = (agg.daily[day] || 0) + 1;
  }

  matchesOf(res).slice(0, 3).forEach((m, i) => {
    const name = m?.name;
    if (!name || IGNORED_NAMES.has(name)) return;
    const entry = yeshivaEntry(agg, name);
    entry.top3++;
    if (i === 0) entry.first++;
  });

  // contact_clicks holds yeshiva ids; resolve names through this result's own top_matches
  if (Array.isArray(res.contact_clicks) && res.contact_clicks.length > 0) {
    agg.clickers++;
    res.contact_clicks.forEach(id => {
      const name = matchesOf(res).find(m => String(m?.id) === String(id))?.name;
      if (!name || IGNORED_NAMES.has(name)) return;
      yeshivaEntry(agg, name).clicks++;
    });
  }

  const ratings = res.preferences?.ratings;
  if (ratings) {
    Object.entries(ratings).forEach(([paramId, val]) => {
      if (val) {
        agg.paramTotals[paramId] = (agg.paramTotals[paramId] || 0) + Number(val);
        agg.paramCounts[paramId] = (agg.paramCounts[paramId] || 0) + 1;
      }
    });
  }

  // region is 'all', a single id (old records) or a list of ids (multi-select)
  const rawRegion = res.preferences?.region;
  const regionList = Array.isArray(rawRegion) && rawRegion.length > 0 ? rawRegion : [rawRegion || 'all'];
  regionList.forEach(region => {
    agg.regionCounts[region] = (agg.regionCounts[region] || 0) + 1;
  });
};

const sumInto = (target, source) => {
  Object.entries(source || {}).forEach(([key, val]) => { target[key] = (target[key] || 0) + val; });
};

// Returns a new aggregate holding the sums of a and b (either may come from storage and be partial).
export const mergeAggregates = (a, b) => {
  const out = createAggregate();
  [a, b].forEach(src => {
    out.total += src.total || 0;
    out.clickers += src.clickers || 0;
    sumInto(out.paramTotals, src.paramTotals);
    sumInto(out.paramCounts, src.paramCounts);
    sumInto(out.regionCounts, src.regionCounts);
    sumInto(out.daily, src.daily);
    Object.entries(src.yeshivot || {}).forEach(([name, y]) => {
      const entry = yeshivaEntry(out, name);
      entry.first += y.first || 0;
      entry.top3 += y.top3 || 0;
      entry.clicks += y.clicks || 0;
    });
  });
  return out;
};

// Compact summary the admin analytics tab renders.
export const summarize = (agg, now = Date.now()) => {
  const weekStart = dayKey(now - 7 * DAY_MS);
  const last7 = Object.entries(agg.daily).reduce((sum, [day, n]) => (day >= weekStart ? sum + n : sum), 0);

  const paramAverages = {};
  Object.keys(agg.paramTotals).forEach(id => {
    paramAverages[id] = Number((agg.paramTotals[id] / agg.paramCounts[id]).toFixed(1));
  });

  return {
    total: agg.total,
    last7,
    clickers: agg.clickers,
    yeshivot: Object.entries(agg.yeshivot).map(([name, y]) => ({ name, ...y })),
    paramAverages,
    regionCounts: agg.regionCounts,
    updatedAt: new Date(now).toISOString()
  };
};

export const computeAnalytics = (results, now = Date.now()) => {
  const agg = createAggregate();
  results.forEach(res => addResult(agg, res));
  return summarize(agg, now);
};
