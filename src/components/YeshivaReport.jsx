import React, { forwardRef } from 'react';
import { PARAM_DEFINITIONS, REGION_TRANSLATIONS, TYPE_TRANSLATIONS } from '../knn';
import { REPORT_MIN_RECIPIENTS } from '../yeshivaReport';
import WhatsAppIcon from './WhatsAppIcon';
import BannerArt from './BannerArt';

// Three A4 pages (about + exposure, audience, ways to stand out) (794 x 1123 CSS px at 96dpi) rendered as plain DOM, then rasterized into the PDF.
export const PAGE_W = 794;
export const PAGE_H = 1123;
export const PAGE_COUNT = 3;

export const C = {
  paper: '#fbf8f2',
  ink: '#1c1410',
  body: '#3d342b',
  muted: '#7a6d5e',
  espresso: '#52341d',
  gold: '#b47828',
  sand: '#ece2d0',
  rule: '#d6c7ad'
};
export const SERIF = "'Frank Ruhl Libre', 'Frank Ruehl CLM', serif";
export const SANS = "'IBM Plex Sans Hebrew', 'Heebo', Arial, sans-serif";

const n = (v) => Number(v || 0).toLocaleString('he-IL');
// 1..999 in Hebrew letters with geresh/gershayim (15 and 16 as ט״ו, ט״ז), e.g. 787 -> תשפ״ז
const gematria = (num) => {
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const hundreds = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
  const rest = num % 100;
  const s = hundreds[Math.floor(num / 100)] + (rest === 15 ? 'טו' : rest === 16 ? 'טז' : tens[Math.floor(rest / 10)] + ones[rest % 10]);
  return s.length > 1 ? `${s.slice(0, -1)}״${s.slice(-1)}` : `${s}׳`;
};
export const hebDate = (d) => {
  try {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' })
      .formatToParts(new Date(d)).map(p => [p.type, p.value]));
    return `${gematria(Number(parts.day))} ב${parts.month} ${gematria(Number(parts.year) % 1000)}`;
  } catch { return ''; }
};
export const civDate = (d) => new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
const dayDate = (key) => civDate(`${key}T12:00:00`);
const shortDate = (d) => new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
const paramLabel = (id) => PARAM_DEFINITIONS.find(p => p.id === id)?.label || id;
const HEB_LETTERS = ['א', 'ב', 'ג', 'ד'];
// Size is a preference (small vs. large), not an emphasis, so it does not read well as "more than average".
const PROFILE_SKIP = new Set(['overall_size']);

const docRef = (r) => {
  const d = new Date(r.generatedAt);
  const code = String(r.yeshiva.id).replace(/\D/g, '').slice(-3).padStart(3, '0');
  return `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${code}`;
};

// What the report is allowed to say, decided once from the numbers.
export const reportFacts = (r) => {
  const { own, site } = r;
  const showOwn = own.top3 > REPORT_MIN_RECIPIENTS;
  const oneIn = showOwn && own.top3 ? Math.round(site.monthTotal / own.top3) : null;
  return {
    showOwn,
    oneIn: oneIn && oneIn >= 2 && oneIn <= 25 ? oneIn : null,
    showFirst: showOwn && own.first >= 5,
    showRank: showOwn && own.rank <= Math.ceil(site.institutions / 3),
    showScore: showOwn && own.avgScore != null && own.avgScore >= 50,
    showClicks: showOwn && own.clicks >= 5,
    showRegion: site.regionInterest >= 20 && !!REGION_TRANSLATIONS[r.yeshiva.region] && r.yeshiva.region !== 'all',
    showType: site.typeInterest >= 20 && !!TYPE_TRANSLATIONS[r.yeshiva.type]
  };
};

export const Mark = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="none" aria-hidden="true">
    <rect width="512" height="512" rx="112" fill={C.espresso} />
    <circle cx="256" cy="256" r="178" stroke="#e6dac5" strokeWidth="22" />
    <path d="M256 112L304 208L256 256L208 208Z" fill={C.gold} />
    <path d="M256 400L208 304L256 256L304 304Z" fill="#f4eee3" />
    <circle cx="256" cy="256" r="22" fill={C.espresso} stroke="#e6dac5" strokeWidth="10" />
  </svg>
);

export const Page = forwardRef(({ children, r, number, total = PAGE_COUNT, footer }, ref) => (
  <div
    ref={ref}
    dir="rtl"
    style={{
      width: PAGE_W, height: PAGE_H, background: C.paper, color: C.body, fontFamily: SANS,
      padding: '52px 62px 40px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden', fontSize: 14, lineHeight: 1.6
    }}
  >
    {/* thin frame line on the binding side gives the sheet some weight without decoration */}
    <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 8, background: C.espresso }} />
    <div style={{ position: 'absolute', top: 0, bottom: 0, right: 8, width: 2, background: C.gold }} />

    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: `1px solid ${C.ink}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Mark />
        <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 22, color: C.espresso, letterSpacing: 0.3 }}>שבושון</span>
        <span style={{ color: C.muted, fontSize: 12, marginInlineStart: 6 }}>מבחן התאמה לישיבות ומכינות</span>
      </div>
      <span dir="ltr" style={{ color: C.muted, fontSize: 12, letterSpacing: 0.4 }}>www.shvushon.com</span>
    </header>

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>

    <footer style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.rule}`, paddingTop: 10, fontSize: 11, color: C.muted }}>
      {footer || (
        <>
          <span>{r.yeshiva.name} · {civDate(r.generatedAt)}</span>
          <span>מס׳ <span dir="ltr">{docRef(r)}</span> · עמוד {number} מתוך {total}</span>
        </>
      )}
    </footer>
  </div>
));

export const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 14 }}>
    <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 25, color: C.ink, margin: 0, lineHeight: 1.2 }}>{children}</h2>
    {sub && <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{sub}</div>}
  </div>
);

const StatRow = ({ value, label, note }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, padding: '8px 0', borderBottom: `1px solid ${C.rule}` }}>
    <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 34, color: C.espresso, minWidth: 96, lineHeight: 1 }}>{value}</div>
    <div>
      <div style={{ color: C.ink, fontWeight: 500, fontSize: 14, lineHeight: 1.35 }}>{label}</div>
      {note && <div style={{ color: C.muted, fontSize: 12 }}>{note}</div>}
    </div>
  </div>
);

// Rows of 1-5 bars: the yeshiva's audience (filled) against the whole site (gold tick).
const ParamBars = ({ rows, withSite }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
    {rows.map(row => (
      <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 74px', alignItems: 'center', gap: 14 }}>
        <div style={{ color: C.ink, fontWeight: 500, fontSize: 14 }}>{paramLabel(row.id)}</div>
        <div style={{ position: 'relative', height: 12, background: C.sand, borderRadius: 2 }}>
          <div style={{ position: 'absolute', insetBlock: 0, right: 0, width: `${((row.value - 1) / 4) * 100}%`, background: C.espresso, borderRadius: 2 }} />
          {withSite && (
            <div style={{ position: 'absolute', top: -4, bottom: -4, right: `calc(${((row.site - 1) / 4) * 100}% - 1.5px)`, width: 3, background: C.gold }} />
          )}
        </div>
        <div style={{ fontSize: 12, color: C.muted, textAlign: 'left' }} dir="ltr">
          <strong style={{ color: C.ink, fontSize: 14 }}>{row.value.toFixed(1)}</strong>
          {withSite && <span> / {row.site.toFixed(1)}</span>}
        </div>
      </div>
    ))}
  </div>
);

export const ReportPageOne = forwardRef(({ r, f, recipient }, ref) => {
  const { yeshiva, own, site } = r;
  const typeLabel = TYPE_TRANSLATIONS[yeshiva.type];
  const regionLabel = REGION_TRANSLATIONS[yeshiva.region];

  const side = f.showOwn
    ? [
      f.showFirst && { value: n(own.first), label: `פעמים ש${yeshiva.name} יצאה במקום הראשון`, note: 'ההתאמה הכי גבוהה של התלמיד מכל המאגר' },
      f.showScore && { value: `${own.avgScore}%`, label: 'ציון התאמה ממוצע', note: 'אצל התלמידים שקיבלו אתכם' },
      f.showRank && { value: `${own.rank}`, label: `מקום בדירוג החשיפה, מתוך ${site.institutions} מוסדות`, note: 'לפי מספר ההופעות בשלוש ההתאמות המובילות' },
      f.showClicks && { value: n(own.clicks), label: 'פניות לאחראי השבושים שלכם', note: 'ישירות מדף התוצאות' }
    ]
    : [
      { value: n(Math.round(site.monthTotal / r.windowDays)), label: 'שאלונים מתמלאים בממוצע בכל יום' },
      f.showType && { value: n(site.typeInterest), label: `סיננו במפורש ${typeLabel}`, note: 'ב־30 הימים האחרונים' },
      f.showRegion && { value: n(site.regionInterest), label: `חיפשו מוסד באזור ${regionLabel}`, note: 'ב־30 הימים האחרונים' }
    ];

  return (
    <Page ref={ref} r={r} number={1}>
      <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ color: C.gold, fontWeight: 500, fontSize: 13 }}>על שבושון</div>
        <div style={{ textAlign: 'left', color: C.muted, fontSize: 12, lineHeight: 1.5 }}>
          <div>{hebDate(r.generatedAt)}</div>
          <div>{civDate(r.generatedAt)}</div>
        </div>
      </div>
      <h2 style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 32, lineHeight: 1.15, color: C.ink, margin: '2px 0 10px' }}>
        המקום שבו שמיניסטים מחפשים ישיבה
      </h2>
      <p style={{ margin: 0, maxWidth: 640, fontSize: 15, lineHeight: 1.75 }}>
        שבושון הוקם לפני יותר מחמש שנים כדי לעזור לשמיניסטים למצוא ישיבה או מכינה שמתאימה להם באמת.
        {' '}התלמיד עונה על שאלון קצר של 12 שאלות, ומקבל רשימה של המוסדות שהכי מתאימים לו, עם ציון התאמה לכל אחד.
        {' '}מאז שעלה לאוויר נרשמו באתר יותר מ־200,000 כניסות.
      </p>
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: C.sand, borderRight: `4px solid ${C.gold}` }}>
        {[
          { v: <span dir="ltr">5+</span>, l: 'שנים באוויר' },
          { v: <span dir="ltr">200,000+</span>, l: 'כניסות לאתר מאז שהוקם' },
          { v: n(site.institutions), l: 'ישיבות ומכינות במאגר' }
        ].map((x, i) => (
          <div key={i} style={{ padding: '14px 18px', borderInlineStart: i ? `1px solid ${C.rule}` : 'none' }}>
            <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 30, color: C.espresso, lineHeight: 1.05 }}>{x.v}</div>
            <div style={{ fontSize: 13, color: C.ink, marginTop: 4 }}>{x.l}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 26, borderTop: `1px solid ${C.ink}`, paddingTop: 16 }}>
        <div style={{ color: C.gold, fontWeight: 500, fontSize: 13 }}>דו״ח חשיפה · 30 הימים האחרונים</div>
        <h1 style={{ fontFamily: SERIF, fontWeight: 900, fontSize: yeshiva.name.length > 22 ? 40 : 50, lineHeight: 1.08, color: C.espresso, margin: '4px 0 6px' }}>
          {yeshiva.name}
        </h1>
        <div style={{ color: C.muted, fontSize: 14 }}>
          {[typeLabel, regionLabel].filter(Boolean).join(' · ')}
        </div>
      </div>

      <div style={{ marginTop: 16, maxWidth: 620, fontSize: 15.5, lineHeight: 1.75, color: C.body }}>
        {recipient && <p style={{ margin: '0 0 8px', color: C.ink, fontWeight: 500 }}>לכבוד {recipient},</p>}
        {f.showOwn ? (
          <p style={{ margin: 0 }}>
            בחודש האחרון מילאו את שאלון ההתאמה בשבושון {n(site.monthTotal)} תלמידים.
            {' '}{n(own.top3)} מהם קיבלו את {yeshiva.name} באחת משלוש ההתאמות הראשונות שלהם
            {f.oneIn ? <>, כלומר בערך אחד מכל {f.oneIn} תלמידים</> : null}.
            {' '}ריכזנו כאן את המספרים, ומה מחפשים התלמידים שמגיעים אליכם.
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            בחודש האחרון מילאו את השאלון {n(site.monthTotal)} תלמידים. ריכזנו כאן מה הם מחפשים,
            {' '}ואיך {yeshiva.name} יכולה להגיע ליותר מהם.
          </p>
        )}
      </div>

      <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '0.9fr 1.3fr', gap: 40, alignItems: 'start' }}>
        <div style={{ borderTop: `3px solid ${C.espresso}`, paddingTop: 16 }}>
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 104, lineHeight: 0.9, color: C.ink, letterSpacing: -2 }}>
            {n(f.showOwn ? own.top3 : site.monthTotal)}
          </div>
          <div style={{ marginTop: 14, fontSize: 15, color: C.ink, fontWeight: 500, lineHeight: 1.5 }}>
            {f.showOwn
              ? <>תלמידים קיבלו את {yeshiva.name} בין שלוש ההתאמות המובילות שלהם</>
              : <>תלמידים מילאו את השאלון ב־30 הימים האחרונים</>}
          </div>
          <div style={{ marginTop: 4, color: C.muted, fontSize: 12 }}>
            {shortDate(r.windowStart)} עד {shortDate(r.generatedAt)}
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${C.ink}` }}>
          {side.filter(Boolean).map((s, i) => <StatRow key={i} {...s} />)}
        </div>
      </div>
    </Page>
  );
});

export const ReportPageTwo = forwardRef(({ r, f }, ref) => {
  const { yeshiva, own, site } = r;
  const ownParams = own.paramAverages || {};
  const audienceRows = Object.keys(ownParams)
    .filter(id => site.paramAverages[id] != null && !PROFILE_SKIP.has(id))
    .map(id => ({ id, value: ownParams[id], site: site.paramAverages[id], diff: ownParams[id] - site.paramAverages[id] }))
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 5);
  const withAudience = f.showOwn && audienceRows.length >= 3 && audienceRows[0].diff > 0.1;
  const siteRows = Object.entries(site.paramAverages)
    .filter(([id]) => !PROFILE_SKIP.has(id))
    .map(([id, value]) => ({ id, value, site: value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const standout = withAudience ? audienceRows.filter(a => a.diff > 0.15).slice(0, 2) : [];

  const steps = [
    { t: 'שאלון קצר', d: 'התלמיד מדרג 11 נושאים: גמרא, אמונה, חסידות, חברה, יחס אישי ועוד, ובוחר אזור וסוג מוסד.' },
    { t: 'דירוג מהשטח', d: 'את המוסדות במאגר דירגו תלמידים שלומדים בהם היום, על סמך אלפי דיווחים, ולא רק הצוות.' },
    { t: 'מהתוצאה לשיחה', d: 'מוסד עם כרטיס מורחב מופיע בתוצאות עם טלפון ישיר לאחראי וקישור לאתר. באתר יש גם לוח ימים פתוחים ושבתות.' }
  ];

  return (
    <Page ref={ref} r={r} number={2}>
      <div style={{ marginTop: 30 }}>
        {withAudience ? (
          <>
            <SectionTitle sub="ממוצע הדירוג שנתנו בשאלון (1 עד 5), לעומת כל התלמידים באתר">
              מה חשוב לתלמידים שקיבלו את {yeshiva.name}
            </SectionTitle>
            <p style={{ margin: '0 0 18px', fontSize: 15, maxWidth: 620 }}>
              {standout.length
                ? <>מי שקיבל אתכם בתוצאות שם דגש גבוה מהממוצע על {standout.map(s => paramLabel(s.id)).join(' ועל ')}. אלה התלמידים שכבר מגיעים אליכם, ושווה לדבר אליהם.</>
                : <>אלה הנושאים שקיבלו את הדירוג הגבוה ביותר אצל התלמידים שקיבלו אתכם בתוצאות.</>}
            </p>
            <ParamBars rows={audienceRows} withSite />
            <div style={{ marginTop: 12, fontSize: 12, color: C.muted, display: 'flex', gap: 18 }}>
              <span><i style={{ display: 'inline-block', width: 14, height: 8, background: C.espresso, marginInlineEnd: 6 }} />התלמידים שקיבלו אתכם</span>
              <span><i style={{ display: 'inline-block', width: 3, height: 12, background: C.gold, marginInlineEnd: 6, verticalAlign: -2 }} />ממוצע כל האתר</span>
            </div>
          </>
        ) : (
          <>
            <SectionTitle sub="ממוצע הדירוג שנתנו התלמידים בשאלון בחודש האחרון (1 עד 5)">
              מה התלמידים מחפשים
            </SectionTitle>
            <p style={{ margin: '0 0 18px', fontSize: 15, maxWidth: 620 }}>
              אלה חמשת הנושאים שקיבלו את הדירוג הגבוה ביותר בשאלון. מוסד שמדגיש אותם מגיע אל יותר תלמידים.
            </p>
            <ParamBars rows={siteRows} />
          </>
        )}
      </div>

      <div style={{ marginTop: 34 }}>
        <SectionTitle sub="משאלון של כמה דקות לשיחה עם המוסד המתאים.">
          איך שבושון עובד
        </SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 26, borderTop: `1px solid ${C.ink}`, paddingTop: 16 }}>
          {steps.map((s, i) => (
            <div key={s.t}>
              <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 30, color: C.gold, lineHeight: 1 }}>{HEB_LETTERS[i]}.</div>
              <div style={{ fontWeight: 700, color: C.ink, fontSize: 15, margin: '8px 0 4px' }}>{s.t}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 16, paddingBottom: 14, fontSize: 11, color: C.muted, lineHeight: 1.6, maxWidth: 640 }}>
        הנתונים נלקחו ממערכת שבושון בין {civDate(r.windowStart)} ל־{civDate(r.generatedAt)}.
        {f.showOwn && <>{' '}״קיבלו את {yeshiva.name}״: המוסד הופיע באחד משלושת המקומות הראשונים בתוצאות השאלון של התלמיד.</>}
        {' '}השאלון אנונימי, ולא נאסף בו מידע מזהה על התלמידים.
      </div>
    </Page>
  );
});

const LOSS = '#9a3b2a';
const WA_GREEN = '#1f9d55';
const SITE_SERIF = "'Noto Serif Hebrew', 'Frank Ruhl Libre', serif";

// A results card as the student sees it. The regular one is faded on purpose; the expanded one is drawn
// a bit louder than the site's, so the difference reads on paper.
const CardMock = ({ name, meta, featured }) => (
  <div style={{
    position: 'relative',
    background: featured ? 'linear-gradient(to left, #f7e6c4, #fffaf0 75%)' : '#f3efe8',
    opacity: featured ? 1 : 0.8,
    border: featured ? `2px solid ${C.gold}` : `1px solid ${C.rule}`,
    borderRightWidth: featured ? 8 : 1,
    borderRadius: 10, padding: featured ? '16px 18px' : '11px 14px', fontFamily: SANS, boxSizing: 'border-box',
    boxShadow: featured ? '0 8px 22px rgba(180, 120, 40, 0.28)' : 'none'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
        <span style={{ fontWeight: 900, color: C.espresso, fontSize: featured ? 17 : 14 }}>#2</span>
        <span style={{ fontWeight: 800, fontSize: featured ? 20 : 15, color: featured ? C.espresso : C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
      </div>
      <div style={{ fontSize: featured ? 12.5 : 11, fontWeight: 700, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 99, padding: '2px 10px', whiteSpace: 'nowrap' }}>87% התאמה</div>
    </div>
    {meta && <div style={{ fontSize: 11.5, color: C.muted, marginTop: 3 }}>{meta}</div>}
    {featured && (
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, borderRadius: 8, padding: '7px 14px', color: '#fff', background: WA_GREEN, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <WhatsAppIcon size={14} />ווצאפ לאחראי הישיבה
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 700, borderRadius: 8, padding: '7px 14px', color: '#fff', background: C.espresso }}>לאתר הישיבה ←</span>
      </div>
    )}
  </div>
);

// What an unpaid card costs: the student liked you, had no way to reach you, and moved on.
const MissedCallout = ({ name }) => (
  <div style={{ marginTop: 14, background: '#fdf3f0', borderRight: `4px solid ${LOSS}`, padding: '9px 14px', fontSize: 13, lineHeight: 1.6 }}>
    <strong style={{ color: LOSS }}>ובכרטיס רגיל? </strong>
    התלמיד רואה את {name} ומתעניין, אבל אין לו מספר ואין קישור. הוא עובר למוסד הבא שאפשר לדבר איתו,
    {' '}ותוך כמה ימים <strong style={{ color: LOSS }}>שוכח את השם שלכם</strong>.
  </div>
);

// Phone screens drawn at real mobile size (375px wide) and scaled down, in a light frame.
const PHONE_SCALE = 0.52;
const PHONE_H = 585;
const PhoneFrame = ({ children, caption }) => (
  <div style={{ direction: 'ltr', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
    <div style={{ padding: 5, background: '#fff', border: `1px solid ${C.rule}`, borderRadius: 26, boxShadow: '0 10px 26px rgba(82, 52, 29, 0.16)' }}>
      <div style={{ width: 375 * PHONE_SCALE, height: PHONE_H * PHONE_SCALE, overflow: 'hidden', borderRadius: 21, background: '#f4eee3' }}>
        <div dir="rtl" style={{ width: 375, height: PHONE_H, transform: `scale(${PHONE_SCALE})`, transformOrigin: 'top left', position: 'relative', fontFamily: SANS, color: C.ink, padding: '18px 14px 0', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Mark size={30} />
            <span style={{ fontFamily: SITE_SERIF, fontWeight: 900, fontSize: 30, color: C.espresso }}>שבושון</span>
          </div>
          {children}
        </div>
      </div>
    </div>
    <div dir="rtl" style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{caption}</div>
  </div>
);


// Question 5 of 12, with the question's banner floating at the bottom of the screen.
const QuestionPhone = ({ name }) => (
  <PhoneFrame caption="באנר בזמן השאלון">
    <div style={{ background: '#fff', border: '1px solid #e4dac8', borderRadius: 16, padding: '14px 18px', marginBottom: 12 }}>
      <div style={{ fontSize: 14, color: C.body }}>שאלה <strong>5</strong> מתוך 12</div>
      <div style={{ marginTop: 10, height: 9, background: '#e9dcc6', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: '42%', height: '100%', background: C.espresso, borderRadius: 99 }} />
      </div>
    </div>
    <div style={{ background: '#fff', border: '1px solid #e4dac8', borderRadius: 16, padding: '20px 18px 22px', textAlign: 'center' }}>
      <div style={{ fontFamily: SITE_SERIF, fontWeight: 800, fontSize: 23, lineHeight: 1.35 }}>איזה דגש אתה מחפש על לימוד גמרא?</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted, margin: '16px 2px 8px' }}>
        <span><strong style={{ color: C.espresso }}>1</strong> · דגש נמוך</span>
        <span>דגש מרכזי · <strong style={{ color: C.espresso }}>5</strong></span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4, 5].map(v => (
          <div key={v} style={{ flex: 1, height: 62, borderRadius: 12, background: v === 4 ? C.espresso : '#efe6d6', color: v === 4 ? '#fff' : C.ink, fontWeight: 700, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{v}</div>
        ))}
      </div>
    </div>
    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
      <div style={{ flex: 1.6, height: 50, borderRadius: 12, background: C.espresso, color: '#fff', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>הבא</div>
      <div style={{ flex: 1, height: 50, borderRadius: 12, background: '#efe6d6', border: '1px solid #cfbfa6', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>הקודם</div>
    </div>

    <div style={{ position: 'absolute', left: 12, right: 12, bottom: 14, height: 112, borderRadius: 18, overflow: 'hidden', boxShadow: '0 10px 24px rgba(28, 20, 16, 0.35)', border: '1px solid rgba(230, 196, 143, 0.5)' }}>
      <BannerArt id="q-banner" />
      <div style={{ position: 'relative', height: '100%', boxSizing: 'border-box', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: '#f0c97e', fontWeight: 700, letterSpacing: 0.3 }}>ממומן</div>
          <div style={{ fontFamily: SITE_SERIF, fontWeight: 800, fontSize: 21, lineHeight: 1.3, color: '#fff', marginTop: 2, textShadow: '0 2px 6px rgba(0,0,0,0.35)' }}>בואו לשבת שבושים ב{name}</div>
        </div>
        <div style={{ flexShrink: 0, alignSelf: 'flex-end', background: '#e6c48f', color: '#3e2614', fontWeight: 800, fontSize: 15, borderRadius: 12, padding: '10px 16px' }}>לפרטים</div>
      </div>
    </div>
  </PhoneFrame>
);

// The home page with the main banner at the bottom, under the welcome card.
const HomePhone = ({ name, kind, meta }) => (
  <PhoneFrame caption="באנר ראשי בדף הבית">
    <div style={{ background: '#fff', border: '1px solid #e4dac8', borderRadius: 18, padding: '18px 20px 20px', textAlign: 'center' }}>
      <div style={{ fontFamily: SITE_SERIF, fontWeight: 900, fontSize: 30, lineHeight: 1.2, color: C.espresso }}>ברוכים הבאים ל״שבושון״</div>
      <div style={{ width: 80, height: 4, background: C.gold, borderRadius: 2, margin: '10px auto' }} />
      <div style={{ fontSize: 16, lineHeight: 1.55, color: C.body }}>שמיניסט יקר! שאלון קצר שיעזור לך לגלות איזו ישיבה או מכינה מתאימה לך באמת.</div>
      <div style={{ display: 'inline-block', marginTop: 14, background: C.espresso, color: '#fff', fontWeight: 800, fontSize: 19, borderRadius: 16, padding: '12px 40px' }}>מתחילים</div>
    </div>
    <div style={{ position: 'relative', marginTop: 14, height: 200, borderRadius: 20, overflow: 'hidden', boxShadow: '0 10px 24px rgba(28, 20, 16, 0.3)', border: '1px solid rgba(230, 196, 143, 0.5)' }}>
      <BannerArt id="h-banner" />
      <div style={{ position: 'relative', height: '100%', boxSizing: 'border-box', padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', color: '#f4eee3' }}>
        <div style={{ fontSize: 16, color: '#f0c97e', fontWeight: 700 }}>בואו {kind} חמה ומשפחתית</div>
        <div style={{ fontFamily: SITE_SERIF, fontWeight: 900, fontSize: 28, lineHeight: 1.2, color: '#fff', margin: '2px 0', textShadow: '0 2px 8px rgba(0,0,0,0.4)', maxWidth: 300 }}>{name}</div>
        {meta && <div style={{ fontSize: 13, color: '#e6dac5' }}>{meta}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <div style={{ background: '#e6c48f', color: '#3e2614', fontWeight: 800, fontSize: 15, borderRadius: 12, padding: '9px 16px' }}>לפרטים והרשמה</div>
          <div style={{ border: '1.5px solid rgba(244, 238, 227, 0.6)', background: 'rgba(36, 21, 11, 0.35)', color: '#fff', fontWeight: 700, fontSize: 15, borderRadius: 12, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}><WhatsAppIcon size={15} />ווצאפ</div>
        </div>
      </div>
    </div>
  </PhoneFrame>
);

const Option = ({ letter, title, children }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
    <span style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 24, color: C.gold, lineHeight: 1 }}>{letter}.</span>
    <div>
      <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, color: C.ink, lineHeight: 1.25 }}>{title}</div>
      {children && <div style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 3 }}>{children}</div>}
    </div>
  </div>
);

export const ReportPageThree = forwardRef(({ r, note, sender, phone }, ref) => {
  const { yeshiva, banner } = r;
  const today = banner?.today || r.generatedAt.slice(0, 10);
  const paidUntil = yeshiva.listingUntil && yeshiva.listingUntil >= today ? yeshiva.listingUntil : '';
  const holdsBanner = banner?.current && String(banner.current.yeshivaId) === String(yeshiva.id);
  const bannerTaken = !!banner?.nextFree && banner.nextFree > today;
  const meta = [TYPE_TRANSLATIONS[yeshiva.type], REGION_TRANSLATIONS[yeshiva.region]].filter(Boolean).join(' · ');

  return (
    <Page ref={ref} r={r} number={3}>
      <div style={{ marginTop: 14 }}>
        <SectionTitle sub="שלוש דרכים להגיע לתלמידים בדיוק כשהם בוחרים איפה ללמוד בשנה הבאה.">
          איך בולטים בשבושון
        </SectionTitle>
      </div>

      <div>
        <Option letter="א" title="כרטיס מורחב בדף התוצאות">
          {paidUntil ? <>הכרטיס המורחב של {yeshiva.name} בתוקף עד {dayDate(paidUntil)}. </> : null}
          טלפון וקישור לאתר מוצגים בתוצאות רק למוסדות עם כרטיס מורחב. הכרטיס מודגש, עם ווצאפ ישיר לאחראי הישיבה וקישור לאתר,
          {' '}והתלמיד פונה אליכם בלחיצה אחת, כל עוד הוא מתלהב.
        </Option>
        <div style={{ display: 'grid', gridTemplateColumns: '92px minmax(0, 1fr)', gap: '8px 14px', alignItems: 'center', marginTop: 10 }}>
          <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 700 }}>כרטיס רגיל</div>
          <CardMock name={yeshiva.name} meta={meta} />
          <div style={{ fontSize: 12.5, color: C.gold, fontWeight: 700 }}>כרטיס מורחב</div>
          <div style={{ paddingTop: 8 }}><CardMock name={yeshiva.name} meta={meta} featured /></div>
        </div>
        {!paidUntil && <MissedCallout name={yeshiva.name} />}
      </div>

      <div style={{ marginTop: 14, borderTop: `1px solid ${C.ink}`, paddingTop: 14, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 22, alignItems: 'start' }}>
        <div>
          <Option letter="ב" title="באנר בזמן השאלון">
            באנר בתחתית המסך בזמן שהתלמיד עונה. לכל אחת מ־12 השאלות יש באנר משלה,
            {' '}כך שהתלמיד רואה אתכם בדיוק כשהוא חושב על מה שחשוב לו.
          </Option>
          <div style={{ height: 18 }} />
          <Option letter="ג" title="באנר ראשי בדף הבית">
            הבאנר הבולט ביותר באתר, בדף הבית. <strong style={{ color: C.ink }}>100% חשיפה</strong>: כל מי שנכנס לשבושון רואה אותו. מוסד אחד בכל פעם.
            {' '}{holdsBanner
              ? <>{yeshiva.name} מוצגת בו כרגע, עד {dayDate(banner.current.end)}.</>
              : bannerTaken
                ? <>המועד הקרוב לשריון: <strong style={{ color: C.ink }}>{dayDate(banner.nextFree)}</strong>.</>
                : <>כרגע הוא פנוי, ואפשר להתחיל מיד.</>}
          </Option>
          <div style={{ marginTop: 14, marginInlineStart: 30, fontSize: 12.5, color: C.muted }}>רוב התלמידים נכנסים מהטלפון, וכך זה נראה אצלם.</div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <QuestionPhone name={yeshiva.name} />
          <HomePhone name={yeshiva.name} kind={yeshiva.type === 'mechina' ? 'למכינה' : 'לישיבה'} meta={meta} />
        </div>
      </div>

      <div style={{ marginTop: 'auto', borderTop: `3px solid ${C.espresso}`, paddingTop: 12, paddingBottom: 12, display: 'grid', gridTemplateColumns: '1fr auto', gap: 30, alignItems: 'end' }}>
        <div>
          <div style={{ fontSize: 14.5, lineHeight: 1.65, whiteSpace: 'pre-line' }}>
            {note?.trim() || 'נשמח לשמוע מכם ולענות על כל שאלה.'}
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 22, flexWrap: 'wrap', fontSize: 13.5, color: C.ink }}>
            {phone && <span>טלפון: <strong dir="ltr">{phone}</strong></span>}
            <span>מייל: <strong dir="ltr">shvushon@gmail.com</strong></span>
            <span>אתר: <strong dir="ltr">www.shvushon.com</strong></span>
          </div>
        </div>
        <div style={{ fontSize: 15, color: C.ink }}>
          <div>בברכה,</div>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, marginTop: 2 }}>{sender?.trim() || 'צוות שבושון'}</div>
          {sender?.trim() && <div style={{ fontSize: 13, color: C.muted }}>נציג שבושון</div>}
        </div>
      </div>
    </Page>
  );
});
