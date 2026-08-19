/**
 * Advanced Weighted KNN Matching Engine for Shvushon 2.0
 * Includes Uniform Answer Easter Egg Edge Cases from Shvushon 1
 */

export const PARAM_DEFINITIONS = [
  { 
    id: 'overall_size', 
    label: 'גודל הישיבה הכולל', 
    question: 'איזה גודל ישיבה את/ה מחפש/ת?', 
    minLabel: 'קטנה', 
    maxLabel: 'גדולה',
    type: 'preference'
  },
  { 
    id: 'conditions', 
    label: 'תנאים פיזיים', 
    question: 'כמה חשוב לך התנאים (אוכל, פנימיות וכד\')?', 
    minLabel: 'לא חשוב בכלל', 
    maxLabel: 'חשוב מאוד (תנאים מעולים)',
    type: 'importance' // Automatic Target = 5, User Answer = Dynamic Weight
  },
  { 
    id: 'gemara', 
    label: 'לימוד גמרא', 
    question: 'איזה דגש את/ה מחפש/ת על לימוד גמרא?', 
    minLabel: 'דגש נמוך / משולב', 
    maxLabel: 'דגש מרכזי ואינטנסיבי',
    type: 'preference'
  },
  { 
    id: 'chassidut', 
    label: 'חסידות', 
    question: 'כמה דגש את/ה מחפש/ת על חסידות (לימוד, אווירה ורגש)?', 
    minLabel: 'ללא דגש חסידי', 
    maxLabel: 'דגש חסידי חזק והתוועדויות',
    type: 'preference'
  },
  { 
    id: 'tanach', 
    label: 'לימוד תנ"ך', 
    question: 'כמה דגש את/ה מחפש/ת על לימוד תנ"ך?', 
    minLabel: 'בסיסי', 
    maxLabel: 'לימוד תנ"ך מורחב ומעמיק',
    type: 'preference'
  },
  { 
    id: 'emunah', 
    label: 'לימוד אמונה', 
    question: 'כמה דגש את/ה מחפש/ת על לימוד אמונה ומחשבת ישראל?', 
    minLabel: 'בסיסי', 
    maxLabel: 'עיסוק מורחב ומעמיק באמונה',
    type: 'preference'
  },
  { 
    id: 'rav_kook', 
    label: 'לימוד הרב קוק', 
    question: 'כמה דגש את/ה מחפש/ת על לימוד תורת הרב קוק והרצי"ה?', 
    minLabel: 'ללא דגש מיוחד', 
    maxLabel: 'לימוד מעמיק בגישת הקו/הרב קוק',
    type: 'preference'
  },
  { 
    id: 'social', 
    label: 'חברתיות', 
    question: 'כמה חשוב לך החברתיות והגיבוש?', 
    minLabel: 'לא חשוב בכלל', 
    maxLabel: 'חשוב מאוד (חברתיות וגיבוש חזק)',
    type: 'importance' // Automatic Target = 5, User Answer = Dynamic Weight
  },
  { 
    id: 'personal_relation', 
    label: 'יחס אישי', 
    question: 'כמה חשוב לך יחס אישי וקשר קרוב עם הצוות?', 
    minLabel: 'לא חשוב בכלל', 
    maxLabel: 'חשוב מאוד (קשר אישי וליווי)',
    type: 'importance' // Automatic Target = 5, User Answer = Dynamic Weight
  },
  { 
    id: 'liberalism', 
    label: 'ליברליות', 
    question: 'לאיזה סגנון רוחני ופתיחות מחשבתית את/ה מתחבר/ת?', 
    minLabel: 'שמרני ומסורתי', 
    maxLabel: 'ליברלי ופתוח',
    type: 'preference'
  },
  { 
    id: 'karviut', 
    label: 'קרביוּת', 
    question: 'איזה דגש את/ה מחפש/ת על אווירה צבאית, הכנה לקרבי וסיירות?', 
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
 * Advanced Weighted KNN Distance Matching Algorithm + Uniform Answer Edge Cases
 */
export const calculateKNNMatches = (userPreferences, yeshivotList, k = 3) => {
  const { region, type, ratings, ignoreParams = {} } = userPreferences;

  // Extract active numerical answers
  const activeValues = PARAM_DEFINITIONS
    .filter(p => !ignoreParams[p.id])
    .map(p => Number(ratings[p.id]) || 3);

  // Helper: check if all active elements are equal
  const allEqual = (arr) => {
    if (arr.length === 0) return null;
    return arr.every(val => val === arr[0]) ? arr[0] : -1;
  };

  const uniformVal = allEqual(activeValues);

  // EDGE CASE 1: Empty answers or all answers equal 1 -> "צבא ההגנה לישראל"
  if (uniformVal === 1 || activeValues.length === 0) {
    return [{
      id: 'tsahal',
      name: 'צבא ההגנה לישראל',
      type: 'all',
      region: 'all',
      matchScore: 100,
      isEasterEgg: true
    }];
  }

  // EDGE CASE 2: All answers equal 2, 3, or 4 -> "חברון החדשה"
  if ([2, 3, 4].includes(uniformVal)) {
    return [{
      id: 'chevron',
      name: 'חברון החדשה',
      type: 'all',
      region: 'all',
      matchScore: 100,
      isEasterEgg: true
    }];
  }

  // EDGE CASE 3: All answers equal 5 -> "פוניבז'"
  if (uniformVal === 5) {
    return [{
      id: 'ponovezh',
      name: "פוניבז'",
      type: 'all',
      region: 'all',
      matchScore: 100,
      isEasterEgg: true
    }];
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

      let targetVal = userVal;
      let weight = paramWeights[param.id] || 1.0;

      // Target = 5 logic for "How important is it to you" parameters
      if (param.type === 'importance') {
        targetVal = 5.0;
        const dynamicWeightMultiplier = [0, 0.2, 0.6, 1.2, 1.8, 2.6][userVal] || 1.2;
        weight = weight * dynamicWeightMultiplier;
      }

      const normDiff = (targetVal - yeshivaVal) / 4.0;
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
