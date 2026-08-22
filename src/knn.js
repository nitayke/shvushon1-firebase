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
  south: 'דרום'
};

export const REGIONS = [
  { id: 'all', label: 'כל הארץ' },
  { id: 'north', label: 'צפון (גליל / גולן / עכו / צפת)' },
  { id: 'center', label: 'מרכז (גוש דן / שפלה / שומרון)' },
  { id: 'jerusalem', label: 'ירושלים וסביבתה' },
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
  mechina: 'מכינה קדם-צבאית'
};

/**
 * Advanced Weighted KNN Distance Matching Algorithm + Strict Uniform Answer Edge Cases
 */
export const calculateKNNMatches = (userPreferences, yeshivotList, k = 3) => {
  const { region, type, ratings, ignoreParams = {} } = userPreferences;

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

  // ADVANCED KNN MINKOWSKI DISTANCE ENGINE
  const paramWeights = {
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

  const scoredYeshivot = yeshivotList.map(yeshiva => {
    let weightedDistSq = 0;
    let totalWeight = 0;

    PARAM_DEFINITIONS.forEach(param => {
      if (ignoreParams[param.id]) return;

      const userVal = Number(ratings[param.id]) || 3;
      const yeshivaVal = Number(yeshiva.ratings ? yeshiva.ratings[param.id] : 3) || 3;

      const weight = paramWeights[param.id] || 1.0;
      const normDiff = (userVal - yeshivaVal) / 4.0;
      weightedDistSq += weight * (normDiff * normDiff);
      totalWeight += weight;
    });

    // Penalty for Type mismatch
    let typePenalty = 0;
    if (type && type !== 'all' && yeshiva.type !== type) {
      typePenalty = 0.35;
    }

    // Penalty for Region mismatch
    let regionPenalty = 0;
    if (region && region !== 'all' && yeshiva.region !== region) {
      regionPenalty = 0.25;
    }

    // Normalized RMS Distance
    const baseDistance = totalWeight > 0 ? Math.sqrt(weightedDistSq / totalWeight) : 0;
    const finalDistance = baseDistance + typePenalty + regionPenalty;

    // Exponential match score [18% - 99%]
    let matchFactor = Math.exp(-1.8 * finalDistance);
    let matchScore = Math.round(matchFactor * 98);
    matchScore = Math.max(18, Math.min(99, matchScore));

    return {
      id: yeshiva.id,
      name: yeshiva.name,
      type: yeshiva.type,
      region: yeshiva.region,
      matchScore,
      distance: finalDistance
    };
  });

  // Sort descending by match score
  scoredYeshivot.sort((a, b) => b.matchScore - a.matchScore);

  return scoredYeshivot.slice(0, k);
};
