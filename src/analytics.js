// Pure aggregation of all_test_results documents into a compact, cacheable summary.
const IGNORED_NAMES = new Set(['לא ידוע', 'N/A']);

const matchesOf = (res) => {
  if (Array.isArray(res.top_matches) && res.top_matches.length > 0) return res.top_matches;
  return res.top_match ? [{ name: res.top_match }] : [];
};

export const computeAnalytics = (results) => {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const yeshivot = {}; // name -> { name, first, top3 }
  const paramTotals = {};
  const paramCounts = {};
  const regionCounts = {};
  let last7 = 0;

  results.forEach(res => {
    if (res.created_at && new Date(res.created_at).getTime() >= weekAgo) last7++;

    matchesOf(res).slice(0, 3).forEach((m, i) => {
      const name = m?.name;
      if (!name || IGNORED_NAMES.has(name)) return;
      const entry = yeshivot[name] || (yeshivot[name] = { name, first: 0, top3: 0 });
      entry.top3++;
      if (i === 0) entry.first++;
    });

    const ratings = res.preferences?.ratings;
    if (ratings) {
      Object.entries(ratings).forEach(([paramId, val]) => {
        if (val) {
          paramTotals[paramId] = (paramTotals[paramId] || 0) + Number(val);
          paramCounts[paramId] = (paramCounts[paramId] || 0) + 1;
        }
      });
    }

    const region = res.preferences?.region || 'all';
    regionCounts[region] = (regionCounts[region] || 0) + 1;
  });

  const paramAverages = {};
  Object.keys(paramTotals).forEach(id => {
    paramAverages[id] = Number((paramTotals[id] / paramCounts[id]).toFixed(1));
  });

  return {
    total: results.length,
    last7,
    yeshivot: Object.values(yeshivot),
    paramAverages,
    regionCounts,
    updatedAt: new Date().toISOString()
  };
};
