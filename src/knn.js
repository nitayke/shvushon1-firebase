// A preference may be 'all', empty, a single id, or a list of ids; an empty list means no restriction.
const toList = (v) => {
  const list = Array.isArray(v) ? v : (v ? [v] : []);
  return list.includes('all') ? [] : list;
};

/**
 * Advanced Weighted KNN Matching Engine for Shvushon
 * Includes Uniform Answer Easter Egg Edge Cases from Shvushon 1 (Only when ALL 11 parameters are identical and active)
 */

export const PARAM_DEFINITIONS = [
  { 
    id: 'overall_size', 
    label: 'גודל הישיבה/מכינה הכולל', 
    question: 'איזה גודל ישיבה/מכינה אתה מחפש?', 
    minLabel: 'קטנה', 
    maxLabel: 'גדולה',
    type: 'preference'
  },
  { 
    id: 'conditions', 
    label: 'תנאים פיזיים', 
    question: 'כמה חשוב לך התנאים (אוכל, פנימיות וכדומה)?', 
    minLabel: 'לא חשוב בכלל', 
    maxLabel: 'חשוב מאוד (תנאים מעולים)',
    type: 'preference'
  },
  { 
    id: 'gemara', 
    label: 'לימוד גמרא', 
    question: 'איזה דגש אתה מחפש על לימוד גמרא?', 
    minLabel: 'דגש נמוך / משולב', 
    maxLabel: 'דגש מרכזי ואינטנסיבי',
    type: 'preference'
  },
  { 
    id: 'chassidut', 
    label: 'חסידות', 
    question: 'כמה דגש אתה מחפש על חסידות (לימוד, אווירה ורגש)?', 
    minLabel: 'ללא דגש חסידי', 
    maxLabel: 'דגש חסידי חזק והתוועדויות',
    type: 'preference'
  },
  { 
    id: 'tanach', 
    label: 'לימוד תנ"ך', 
    question: 'כמה דגש אתה מחפש על לימוד תנ"ך?', 
    minLabel: 'בסיסי', 
    maxLabel: 'לימוד תנ"ך מורחב ומעמיק',
    type: 'preference'
  },
  { 
    id: 'emunah', 
    label: 'לימוד אמונה', 
    question: 'כמה דגש אתה מחפש על לימוד אמונה ומחשבת ישראל?', 
    minLabel: 'בסיסי', 
    maxLabel: 'עיסוק מורחב ומעמיק באמונה',
    type: 'preference'
  },
  { 
    id: 'rav_kook', 
    label: 'לימוד הרב קוק', 
    question: 'כמה דגש אתה מחפש על לימוד תורת הרב קוק?', 
    minLabel: 'ללא דגש מיוחד', 
    maxLabel: 'לימוד מעמיק בתורת הרב קוק',
    type: 'preference'
  },
  { 
    id: 'social', 
    label: 'חברתיות', 
    question: 'כמה חשוב לך החברתיות והגיבוש?', 
    minLabel: 'לא חשוב בכלל', 
    maxLabel: 'חשוב מאוד (חברתיות וגיבוש חזק)',
    type: 'preference'
  },
  { 
    id: 'personal_relation', 
    label: 'יחס אישי', 
    question: 'כמה חשוב לך יחס אישי וקשר קרוב עם הצוות?', 
    minLabel: 'לא חשוב בכלל', 
    maxLabel: 'חשוב מאוד (קשר אישי וליווי)',
    type: 'preference'
  },
  { 
    id: 'liberalism', 
    label: 'ליברליות', 
    question: 'לאיזה סגנון רוחני ופתיחות מחשבתית אתה מתחבר?', 
    minLabel: 'שמרני ומסורתי', 
    maxLabel: 'ליברלי ופתוח',
    type: 'preference'
  },
  { 
    id: 'karviut', 
    label: 'קרביוּת', 
    question: 'איזה דגש אתה מחפש על אווירה צבאית, הכנה לקרבי וסיירות?', 
    minLabel: 'ללא דגש צבאי', 
    maxLabel: 'אווירה צבאית והכנה מורחבת',
    type: 'preference'
  }
];

export const REGION_TRANSLATIONS = {
  all: 'כל הארץ',
  north: 'צפון',
  center: 'מרכז',
  jerusalem: 'ירושלים',
  yosh: 'יהודה ושומרון',
  south: 'דרום'
};

export const REGIONS = [
  { id: 'all', label: 'כל הארץ' },
  { id: 'north', label: 'צפון (גליל / גולן / עכו / צפת)' },
  { id: 'center', label: 'מרכז (גוש דן / שפלה)' },
  { id: 'jerusalem', label: 'ירושלים וסביבתה' },
  { id: 'yosh', label: 'יהודה ושומרון' },
  { id: 'south', label: 'דרום (נגב / שדרות / אילת)' }
];

export const TYPES = [
  { id: 'all', label: 'כל הסוגים' },
  { id: 'hesder', label: 'ישיבת הסדר' },
  { id: 'gvoha', label: 'ישיבה גבוהה' },
  { id: 'mechina', label: 'מכינה קדם-צבאית' }
];

export const TYPE_TRANSLATIONS = {
  hesder: 'ישיבת הסדר',
  gvoha: 'ישיבה גבוהה',
  hesder_gvoha: 'ישיבה גבוהה וגם הסדר',
  mechina: 'מכינה קדם-צבאית'
};

// Types a yeshiva can be registered with (the questionnaire filters by TYPES, where the combined type is just both).
export const YESHIVA_TYPES = [
  { id: 'hesder', label: TYPE_TRANSLATIONS.hesder },
  { id: 'gvoha', label: TYPE_TRANSLATIONS.gvoha },
  { id: 'hesder_gvoha', label: TYPE_TRANSLATIONS.hesder_gvoha },
  { id: 'mechina', label: TYPE_TRANSLATIONS.mechina }
];

// A combined yeshiva matches a hesder or a gvoha selection.
export const typeMatches = (selectedTypes, yeshivaType) =>
  selectedTypes.includes(yeshivaType) ||
  (yeshivaType === 'hesder_gvoha' && (selectedTypes.includes('hesder') || selectedTypes.includes('gvoha')));

const PARAM_WEIGHTS = {
  overall_size: 1.8,
  conditions: 1.0,
  gemara: 1.3,
  chassidut: 1.3,
  tanach: 1.0,
  emunah: 1.1,
  rav_kook: 1.4,
  social: 1.0,
  personal_relation: 1.0,
  liberalism: 1.8,
  karviut: 1.2
};

// Hybrid distance: 85% weighted normalized Euclidean (RMS) + 15% cosine angular alignment.
const preferenceDistance = (ratings, ignoreParams, yeshiva) => {
  let dotProduct = 0;
  let normU = 0;
  let normV = 0;
  let weightedDistSq = 0;
  let totalWeight = 0;

  PARAM_DEFINITIONS.forEach(param => {
    if (ignoreParams[param.id]) return;

    const userVal = Number(ratings[param.id]) || 3;
    const yeshivaVal = Number(yeshiva.ratings ? yeshiva.ratings[param.id] : 3) || 3;
    const weight = PARAM_WEIGHTS[param.id] || 1.0;

    dotProduct += weight * userVal * yeshivaVal;
    normU += weight * userVal * userVal;
    normV += weight * yeshivaVal * yeshivaVal;

    const normDiff = (userVal - yeshivaVal) / 4.0;
    weightedDistSq += weight * (normDiff * normDiff);
    totalWeight += weight;
  });

  const cosineSim = (normU > 0 && normV > 0) ? (dotProduct / (Math.sqrt(normU) * Math.sqrt(normV))) : 1.0;
  const rmsDistance = totalWeight > 0 ? Math.sqrt(weightedDistSq / totalWeight) : 0;
  return (0.85 * rmsDistance) + (0.15 * (1 - Math.min(1.0, cosineSim)));
};

// Penalty for Type & Region mismatch
const filterPenalty = (types, regions, yeshiva) =>
  ((types.length > 0 && !typeMatches(types, yeshiva.type)) ? 0.35 : 0) +
  ((regions.length > 0 && !regions.includes(yeshiva.region)) ? 0.25 : 0);

/**
 * Exposure floor.
 * Real answers cluster (most users rate social / personal relation / emunah 4-5 and size 3-4), so the
 * yeshivot whose profile sits near that crowd take most top-3 slots, and yeshivot with less common
 * profiles almost never show up. To give every yeshiva a minimum exposure we simulate a reference crowd
 * drawn from the observed answer distribution, and every yeshiva that reaches the top 3 for less than
 * EXPOSURE_FLOOR of that crowd gets a small distance bonus (at most EXPOSURE_MAX_BOOST), raised step by
 * step until it reaches the floor. The bonus only decides close calls and is deterministic per list.
 */
const EXPOSURE_FLOOR = 0.025; // share of tests in which every yeshiva should reach the top 3
const EXPOSURE_STEP = 0.004;
const EXPOSURE_MAX_BOOST = 0.08; // distance units (a few match-score points)
const EXPOSURE_MAX_ITERATIONS = 80;
const REFERENCE_CROWD_SIZE = 1500;

// Answer distribution of ~5,900 real tests (Sep-Nov 2026): per parameter, % of [ignored, 1, 2, 3, 4, 5].
const ANSWER_DISTRIBUTION = {
  overall_size: [20, 7, 10, 32, 20, 12],
  conditions: [10, 10, 12, 27, 25, 16],
  gemara: [4, 9, 10, 20, 30, 27],
  chassidut: [5, 17, 19, 22, 21, 15],
  tanach: [6, 10, 13, 28, 25, 17],
  emunah: [5, 7, 7, 18, 32, 31],
  rav_kook: [7, 11, 11, 20, 24, 26],
  social: [6, 6, 6, 14, 29, 40],
  personal_relation: [6, 6, 5, 17, 34, 33],
  liberalism: [6, 17, 21, 25, 16, 15],
  karviut: [9, 18, 15, 20, 17, 20]
};
const TYPE_FILTER_DISTRIBUTION = [
  [[], 51], [['hesder'], 14], [['gvoha'], 13], [['mechina'], 10],
  [['hesder', 'gvoha'], 8], [['gvoha', 'mechina'], 2], [['hesder', 'mechina'], 1]
];
const REGION_FILTER_DISTRIBUTION = [
  [[], 84], [['jerusalem'], 4], [['center'], 3.5], [['north'], 2.5], [['south'], 2], [['yosh'], 1],
  [['center', 'jerusalem', 'north'], 1], [['center', 'jerusalem'], 1], [['north', 'south'], 1]
];

// Small deterministic PRNG (mulberry32), so every visitor gets the same bonuses.
const seededRandom = (seed) => () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pickWeighted = (rand, entries) => {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let x = rand() * total;
  for (const [value, w] of entries) {
    x -= w;
    if (x < 0) return value;
  }
  return entries[entries.length - 1][0];
};

let referenceCrowd = null;
const getReferenceCrowd = () => {
  if (referenceCrowd) return referenceCrowd;
  const rand = seededRandom(20261112);
  referenceCrowd = Array.from({ length: REFERENCE_CROWD_SIZE }, () => {
    const ratings = {};
    const ignoreParams = {};
    PARAM_DEFINITIONS.forEach(p => {
      const answer = pickWeighted(rand, ANSWER_DISTRIBUTION[p.id].map((w, i) => [i, w]));
      if (answer === 0) ignoreParams[p.id] = true;
      else ratings[p.id] = answer;
    });
    return {
      ratings,
      ignoreParams,
      types: pickWeighted(rand, TYPE_FILTER_DISTRIBUTION),
      regions: pickWeighted(rand, REGION_FILTER_DISTRIBUTION)
    };
  });
  return referenceCrowd;
};

const boostCache = { key: null, boosts: null };

// Distance bonus per yeshiva (same order as the list); 0 for yeshivot already above the floor.
export const computeExposureBoosts = (yeshivotList) => {
  const n = yeshivotList.length;
  const key = JSON.stringify(yeshivotList.map(y => [y.id, y.type, y.region, y.ratings]));
  if (boostCache.key === key) return boostCache.boosts;

  const boosts = new Array(n).fill(0);
  if (n > 3) {
    const crowd = getReferenceCrowd();
    // Same formula as preferenceDistance, on flat arrays (this runs crowd x yeshivot times).
    const P = PARAM_DEFINITIONS.length;
    const weights = PARAM_DEFINITIONS.map(p => PARAM_WEIGHTS[p.id] || 1.0);
    const yVals = yeshivotList.map(y => PARAM_DEFINITIONS.map(p => Number(y.ratings ? y.ratings[p.id] : 3) || 3));
    const distances = crowd.map(u => {
      const uVals = PARAM_DEFINITIONS.map(p => (u.ignoreParams[p.id] ? 0 : u.ratings[p.id]));
      return yeshivotList.map((y, j) => {
        const v = yVals[j];
        let dot = 0, nu = 0, nv = 0, sq = 0, tw = 0;
        for (let i = 0; i < P; i++) {
          const a = uVals[i];
          if (!a) continue;
          const w = weights[i], b = v[i], diff = (a - b) / 4;
          dot += w * a * b; nu += w * a * a; nv += w * b * b; sq += w * diff * diff; tw += w;
        }
        const cos = nu > 0 && nv > 0 ? dot / Math.sqrt(nu * nv) : 1.0;
        const rms = tw > 0 ? Math.sqrt(sq / tw) : 0;
        return 0.85 * rms + 0.15 * (1 - Math.min(1.0, cos)) + filterPenalty(u.types, u.regions, y);
      });
    });
    const minCount = EXPOSURE_FLOOR * crowd.length;

    for (let iter = 0; iter < EXPOSURE_MAX_ITERATIONS; iter++) {
      const counts = new Array(n).fill(0);
      distances.forEach(row => {
        // indices of the 3 smallest boosted distances
        const best = [-1, -1, -1];
        const bestVal = [Infinity, Infinity, Infinity];
        for (let j = 0; j < n; j++) {
          const d = row[j] - boosts[j];
          if (d >= bestVal[2]) continue;
          let pos = 2;
          while (pos > 0 && d < bestVal[pos - 1]) {
            bestVal[pos] = bestVal[pos - 1];
            best[pos] = best[pos - 1];
            pos--;
          }
          bestVal[pos] = d;
          best[pos] = j;
        }
        best.forEach(j => { if (j >= 0) counts[j]++; });
      });

      let changed = false;
      counts.forEach((c, j) => {
        if (c < minCount && boosts[j] < EXPOSURE_MAX_BOOST) {
          boosts[j] = Math.min(EXPOSURE_MAX_BOOST, boosts[j] + EXPOSURE_STEP);
          changed = true;
        }
      });
      if (!changed) break;
    }
  }

  boostCache.key = key;
  boostCache.boosts = boosts;
  return boosts;
};

/**
 * Advanced Weighted KNN Distance Matching Algorithm + Strict Uniform Answer Edge Cases
 */
export const calculateKNNMatches = (userPreferences, yeshivotList, k = 3) => {
  const { region, type, ratings, ignoreParams = {} } = userPreferences;
  const types = toList(type);
  const regions = toList(region);

  // Strict Easter Egg check: Trigger ONLY if ALL 11 parameters are rated (none ignored) AND all 11 ratings are 100% identical!
  const hasIgnoredParams = PARAM_DEFINITIONS.some(p => ignoreParams[p.id]);
  const allRatings = PARAM_DEFINITIONS.map(p => Number(ratings[p.id]) || 3);
  const allIdentical = allRatings.every(val => val === allRatings[0]);

  if (!hasIgnoredParams && allIdentical) {
    const val = allRatings[0];
    if (val === 1) {
      return [{
        id: 'tsahal',
        name: 'צבא ההגנה לישראל',
        type: 'all',
        region: 'all',
        matchScore: 100,
        isEasterEgg: true
      }];
    }

    if ([2, 3, 4].includes(val)) {
      return [{
        id: 'chevron',
        name: 'חברון החדשה',
        type: 'all',
        region: 'all',
        matchScore: 100,
        isEasterEgg: true
      }];
    }

    if (val === 5) {
      return [{
        id: 'ponovezh',
        name: "פוניבז'",
        type: 'all',
        region: 'all',
        matchScore: 100,
        isEasterEgg: true
      }];
    }
  }

  const boosts = computeExposureBoosts(yeshivotList);

  const scoredYeshivot = yeshivotList.map((yeshiva, index) => {
    const rawDistance = preferenceDistance(ratings, ignoreParams, yeshiva) + filterPenalty(types, regions, yeshiva);
    const hybridDistance = Math.abs(rawDistance) < 1e-6 ? 0 : rawDistance;
    // Exact matches always stay first; otherwise the exposure bonus shortens the distance a little.
    const rankDistance = hybridDistance === 0 ? -Infinity : Math.max(1e-6, hybridDistance - boosts[index]);

    let matchScore;
    if (hybridDistance === 0) {
      matchScore = 100;
    } else {
      matchScore = Math.round(Math.exp(-1.8 * rankDistance) * 100);
      matchScore = Math.max(18, Math.min(99, matchScore));
    }

    return {
      ...yeshiva,
      id: yeshiva.id,
      name: yeshiva.name,
      type: yeshiva.type,
      region: yeshiva.region,
      matchScore,
      distance: hybridDistance,
      rankDistance
    };
  });

  // Sort by the continuous distance, not the rounded score: ties on the score used to fall back to list order.
  scoredYeshivot.sort((a, b) => a.rankDistance - b.rankDistance);

  return scoredYeshivot.slice(0, k).map(({ rankDistance, ...match }) => match);
};
