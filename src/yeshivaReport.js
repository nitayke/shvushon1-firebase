// Per-yeshiva exposure report (the PDF the admin sends to a yeshiva). Pure computation over the raw
// all_test_results of the last REPORT_WINDOW_DAYS days, so the server function and tests share it.
export const REPORT_WINDOW_DAYS = 30;
// The yeshiva's own exposure numbers are printed only above this many recipients in the window.
export const REPORT_MIN_RECIPIENTS = 20;

const DAY_MS = 24 * 60 * 60 * 1000;

const matchesOf = (res) => {
  if (Array.isArray(res.top_matches) && res.top_matches.length > 0) return res.top_matches;
  return res.top_match ? [{ name: res.top_match }] : [];
};

const listOf = (v) => {
  const list = Array.isArray(v) ? v : (v ? [v] : []);
  return list.includes('all') ? [] : list;
};

// Hesder+gvoha yeshivot answer both questionnaire type filters.
const typeFilterIds = (type) => (type === 'hesder_gvoha' ? ['hesder', 'gvoha'] : [type]);

const addRatings = (totals, counts, prefs) => {
  Object.entries(prefs?.ratings || {}).forEach(([id, val]) => {
    if (val == null || prefs?.ignoreParams?.[id]) return;
    totals[id] = (totals[id] || 0) + Number(val);
    counts[id] = (counts[id] || 0) + 1;
  });
};

const averages = (totals, counts) => Object.fromEntries(
  Object.keys(totals).map(id => [id, Number((totals[id] / counts[id]).toFixed(2))])
);

/**
 * @param yeshiva  the yeshivot document ({ id, name, type, region })
 * @param yeshivot every yeshiva in the database (for the ranking)
 * @param results  all_test_results documents created in the window
 */
export const buildYeshivaReport = ({ yeshiva, yeshivot, results, now = Date.now() }) => {
  const start = new Date(now - REPORT_WINDOW_DAYS * DAY_MS);
  const dayIndex = (iso) => Math.floor((new Date(iso) - start) / DAY_MS);
  const siteDaily = new Array(REPORT_WINDOW_DAYS).fill(0);
  const ownDaily = new Array(REPORT_WINDOW_DAYS).fill(0);
  const top3ByName = {};
  const siteTotals = {}, siteCounts = {}, audTotals = {}, audCounts = {};
  const types = typeFilterIds(yeshiva.type);

  let monthTotal = 0, top3 = 0, first = 0, scoreSum = 0, scoreCount = 0, clicks = 0, clickers = 0;
  let regionInterest = 0, typeInterest = 0;

  results.forEach(res => {
    const idx = dayIndex(res.created_at);
    if (!(idx >= 0 && idx < REPORT_WINDOW_DAYS)) return;
    monthTotal++;
    siteDaily[idx]++;
    addRatings(siteTotals, siteCounts, res.preferences);
    if (Array.isArray(res.contact_clicks) && res.contact_clicks.length) clickers++;
    if (listOf(res.preferences?.region).includes(yeshiva.region)) regionInterest++;
    if (listOf(res.preferences?.type).some(t => types.includes(t))) typeInterest++;

    const top = matchesOf(res).slice(0, 3);
    top.forEach(m => { if (m?.name) top3ByName[m.name] = (top3ByName[m.name] || 0) + 1; });

    const pos = top.findIndex(m => (m?.id && String(m.id) === String(yeshiva.id)) || m?.name === yeshiva.name);
    if (pos === -1) return;
    top3++;
    ownDaily[idx]++;
    if (pos === 0) first++;
    if (Number.isFinite(Number(top[pos].matchScore))) { scoreSum += Number(top[pos].matchScore); scoreCount++; }
    if ((res.contact_clicks || []).some(id => String(id) === String(yeshiva.id))) clicks++;
    addRatings(audTotals, audCounts, res.preferences);
  });

  // Rank among every yeshiva in the database by top-3 appearances (ties share a rank).
  const names = new Set([...yeshivot.map(y => y.name), yeshiva.name]);
  const rank = 1 + [...names].filter(n => (top3ByName[n] || 0) > top3).length;

  return {
    yeshiva: { id: yeshiva.id, name: yeshiva.name, type: yeshiva.type || '', region: yeshiva.region || '' },
    generatedAt: new Date(now).toISOString(),
    windowStart: start.toISOString(),
    windowDays: REPORT_WINDOW_DAYS,
    site: {
      monthTotal,
      clickers,
      institutions: names.size,
      daily: siteDaily,
      paramAverages: averages(siteTotals, siteCounts),
      regionInterest,
      typeInterest
    },
    own: {
      top3,
      first,
      rank,
      avgScore: scoreCount ? Math.round(scoreSum / scoreCount) : null,
      clicks,
      daily: ownDaily,
      paramAverages: averages(audTotals, audCounts)
    }
  };
};
