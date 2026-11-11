import React, { forwardRef } from 'react';
import { PARAM_DEFINITIONS, REGION_TRANSLATIONS, TYPE_TRANSLATIONS } from '../knn';
import { REPORT_MIN_RECIPIENTS } from '../yeshivaReport';

// Two A4 pages (794 x 1123 CSS px at 96dpi) rendered as plain DOM, then rasterized into the PDF.
export const PAGE_W = 794;
export const PAGE_H = 1123;

const C = {
  paper: '#fbf8f2',
  ink: '#1c1410',
  body: '#3d342b',
  muted: '#7a6d5e',
  espresso: '#52341d',
  gold: '#b47828',
  sand: '#ece2d0',
  rule: '#d6c7ad'
};
const SERIF = "'Frank Ruhl Libre', 'Frank Ruehl CLM', serif";
const SANS = "'IBM Plex Sans Hebrew', 'Heebo', Arial, sans-serif";

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
const hebDate = (d) => {
  try {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' })
      .formatToParts(new Date(d)).map(p => [p.type, p.value]));
    return `${gematria(Number(parts.day))} ב${parts.month} ${gematria(Number(parts.year) % 1000)}`;
  } catch { return ''; }
};
const civDate = (d) => new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
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

const Mark = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="none" aria-hidden="true">
    <rect width="512" height="512" rx="112" fill={C.espresso} />
    <circle cx="256" cy="256" r="178" stroke="#e6dac5" strokeWidth="22" />
    <path d="M256 112L304 208L256 256L208 208Z" fill={C.gold} />
    <path d="M256 400L208 304L256 256L304 304Z" fill="#f4eee3" />
    <circle cx="256" cy="256" r="22" fill={C.espresso} stroke="#e6dac5" strokeWidth="10" />
  </svg>
);

const Page = forwardRef(({ children, r, number }, ref) => (
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
      <span>{r.yeshiva.name} · {civDate(r.generatedAt)}</span>
      <span>מס׳ <span dir="ltr">{docRef(r)}</span> · עמוד {number} מתוך 2</span>
    </footer>
  </div>
));

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 14 }}>
    <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 25, color: C.ink, margin: 0, lineHeight: 1.2 }}>{children}</h2>
    {sub && <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{sub}</div>}
  </div>
);

const StatRow = ({ value, label, note }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, padding: '11px 0', borderBottom: `1px solid ${C.rule}` }}>
    <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 34, color: C.espresso, minWidth: 96, lineHeight: 1 }}>{value}</div>
    <div>
      <div style={{ color: C.ink, fontWeight: 500, fontSize: 14, lineHeight: 1.35 }}>{label}</div>
      {note && <div style={{ color: C.muted, fontSize: 12 }}>{note}</div>}
    </div>
  </div>
);

// Daily bars for the window, oldest on the left.
const DailyChart = ({ days, start }) => {
  const W = 670, H = 150, padB = 22, padT = 8;
  const max = Math.max(1, ...days);
  const slot = W / days.length;
  const bw = slot * 0.62;
  const y = (v) => H - padB - (v / max) * (H - padB - padT);
  const labelAt = [0, Math.floor(days.length / 2), days.length - 1];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', direction: 'ltr' }}>
      {[0.5, 1].map(f => (
        <line key={f} x1="0" x2={W} y1={y(max * f)} y2={y(max * f)} stroke={C.rule} strokeDasharray="2 4" strokeWidth="1" />
      ))}
      {days.map((v, i) => (
        <rect key={i} x={i * slot + (slot - bw) / 2} y={y(v)} width={bw} height={H - padB - y(v)} fill={C.espresso} rx="1.5" />
      ))}
      <line x1="0" x2={W} y1={H - padB} y2={H - padB} stroke={C.ink} strokeWidth="1" />
      {labelAt.map(i => (
        <text key={i} x={i * slot + slot / 2} y={H - 6} fontSize="11" fill={C.muted} textAnchor={i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle'} fontFamily={SANS}>
          {shortDate(new Date(start).getTime() + (i + 1) * 864e5)}
        </text>
      ))}
      <text x={W} y={y(max) - 2 < 10 ? 10 : y(max) - 2} fontSize="10" fill={C.muted} textAnchor="end" fontFamily={SANS}>{n(max)}</text>
    </svg>
  );
};

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
      f.showClicks && { value: n(own.clicks), label: 'פניות לאחראי השבושים שלכם', note: 'ישירות מדף התוצאות' },
      { value: n(site.monthTotal), label: 'תלמידים מילאו את השאלון החודש', note: 'בכל האתר' }
    ]
    : [
      { value: n(Math.round(site.monthTotal / r.windowDays)), label: 'שאלונים מתמלאים בממוצע בכל יום' },
      f.showType && { value: n(site.typeInterest), label: `סיננו במפורש ${typeLabel}`, note: 'ב־30 הימים האחרונים' },
      f.showRegion && { value: n(site.regionInterest), label: `חיפשו מוסד באזור ${regionLabel}`, note: 'ב־30 הימים האחרונים' },
      { value: n(site.institutions), label: 'ישיבות ומכינות במאגר' }
    ];

  return (
    <Page ref={ref} r={r} number={1}>
      <div style={{ marginTop: 46, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ color: C.gold, fontWeight: 500, fontSize: 13 }}>
          דו״ח חשיפה · 30 הימים האחרונים
        </div>
        <div style={{ textAlign: 'left', color: C.muted, fontSize: 12, lineHeight: 1.5 }}>
          <div>{hebDate(r.generatedAt)}</div>
          <div>{civDate(r.generatedAt)}</div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <h1 style={{ fontFamily: SERIF, fontWeight: 900, fontSize: yeshiva.name.length > 22 ? 48 : 62, lineHeight: 1.08, color: C.espresso, margin: '4px 0 8px' }}>
          {yeshiva.name}
        </h1>
        <div style={{ color: C.muted, fontSize: 14 }}>
          {[typeLabel, regionLabel].filter(Boolean).join(' · ')}
        </div>
      </div>

      <div style={{ marginTop: 26, maxWidth: 600, fontSize: 16, lineHeight: 1.75, color: C.body }}>
        {recipient && <p style={{ margin: '0 0 10px', color: C.ink, fontWeight: 500 }}>לכבוד {recipient},</p>}
        {f.showOwn ? (
          <p style={{ margin: 0 }}>
            בחודש האחרון מילאו את שאלון ההתאמה בשבושון {n(site.monthTotal)} תלמידים.
            {' '}{n(own.top3)} מהם קיבלו את {yeshiva.name} באחת משלוש ההתאמות הראשונות שלהם
            {f.oneIn ? <>, כלומר בערך אחד מכל {f.oneIn} תלמידים</> : null}.
            {' '}ריכזנו כאן את המספרים, ומה מחפשים התלמידים שמגיעים אליכם.
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            שבושון עוזר לתלמידים לבחור ישיבה או מכינה: שאלון קצר, ובסופו רשימת המוסדות שהכי מתאימים להם.
            {' '}בחודש האחרון מילאו אותו {n(site.monthTotal)} תלמידים. ריכזנו כאן מה הם מחפשים,
            {' '}ואיך {yeshiva.name} יכולה להגיע ליותר מהם.
          </p>
        )}
      </div>

      <div style={{ marginTop: 34, display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 44, alignItems: 'start' }}>
        <div style={{ borderTop: `3px solid ${C.espresso}`, paddingTop: 16 }}>
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 112, lineHeight: 0.9, color: C.ink, letterSpacing: -2 }}>
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

      <div style={{ marginTop: 'auto', paddingBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 19, color: C.ink }}>
            {f.showOwn ? `${yeshiva.name} בתוצאות, יום אחרי יום` : 'שאלונים שהושלמו, יום אחרי יום'}
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            {f.showOwn ? 'מספר התלמידים שקיבלו אתכם בטופ 3, בכל יום' : 'כל האתר'}
          </div>
        </div>
        <DailyChart days={f.showOwn ? own.daily : site.daily} start={r.windowStart} />
      </div>
    </Page>
  );
});

export const ReportPageTwo = forwardRef(({ r, f, note, sender, phone }, ref) => {
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
    { t: 'מהתוצאה לשיחה', d: 'בדף התוצאות מופיעים פרטי האחראי של כל מוסד, וגם לוח ימים פתוחים ושבתות.' }
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
        <SectionTitle>איך שבושון עובד</SectionTitle>
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

      <div style={{ marginTop: 34, background: C.sand, padding: '26px 30px', borderRight: `4px solid ${C.espresso}` }}>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 23, color: C.ink, marginBottom: 8 }}>
          {f.showOwn ? `להגיע ליותר תלמידים כמו אלה` : `להביא את ${yeshiva.name} לעוד תלמידים`}
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
          {note?.trim() || (f.showOwn
            ? `נשמח להציע ל${yeshiva.name} חשיפה בולטת יותר בשבושון, בדיוק מול התלמידים שמחפשים את מה שאתם נותנים. אפשר לדבר איתנו בכל שאלה, גם אם רק רוצים לשמוע עוד.`
            : `נשמח להציע ל${yeshiva.name} חשיפה בולטת בשבושון, מול התלמידים שמחפשים בדיוק מוסד כמו שלכם. אפשר לדבר איתנו בכל שאלה, גם אם רק רוצים לשמוע עוד.`)}
        </div>
        <div style={{ marginTop: 18, display: 'flex', gap: 28, flexWrap: 'wrap', fontSize: 14, color: C.ink }}>
          {phone && <span>טלפון: <strong dir="ltr">{phone}</strong></span>}
          <span>מייל: <strong dir="ltr">shvushon@gmail.com</strong></span>
          <span>אתר: <strong dir="ltr">www.shvushon.com</strong></span>
        </div>
      </div>

      <div style={{ marginTop: 26, fontSize: 15, color: C.ink }}>
        <div>בברכה,</div>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, marginTop: 2 }}>{sender?.trim() || 'צוות שבושון'}</div>
        {sender?.trim() && <div style={{ fontSize: 13, color: C.muted }}>נציג שבושון</div>}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 16, paddingBottom: 14, fontSize: 11, color: C.muted, lineHeight: 1.6, maxWidth: 640 }}>
        הנתונים נלקחו ממערכת שבושון בין {civDate(r.windowStart)} ל־{civDate(r.generatedAt)}.
        {f.showOwn && <>{' '}״קיבלו את {yeshiva.name}״: המוסד הופיע באחד משלושת המקומות הראשונים בתוצאות השאלון של התלמיד.</>}
        {' '}השאלון אנונימי, ולא נאסף בו מידע מזהה על התלמידים.
      </div>
    </Page>
  );
});
