import React, { forwardRef } from 'react';
import { Page, C, SERIF, SectionTitle, civDate, hebDate } from './YeshivaReport';

// A one-page A4 price list, the same for every yeshiva. Rendered as DOM and rasterized by reportPdf.js.
const ils = (v) => `${Number(v).toLocaleString('he-IL')} ₪`;
const HEB_LETTERS = ['א', 'ב', 'ג'];

const PriceCell = ({ period, months, price, base }) => {
  const perMonth = Math.round(price / months);
  const saving = Math.round((1 - perMonth / base) * 100);
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.rule}`, borderRadius: 8, padding: '14px 10px 12px', textAlign: 'center', position: 'relative' }}>
      {saving >= 5 && (
        <div style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', background: C.gold, color: '#fff', fontSize: 10.5, fontWeight: 700, borderRadius: 99, padding: '1px 8px', whiteSpace: 'nowrap' }}>
          חיסכון של {saving}%
        </div>
      )}
      <div style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>{period}</div>
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 27, color: C.espresso, lineHeight: 1.15, marginTop: 4, whiteSpace: 'nowrap' }}>{ils(price)}</div>
      <div style={{ fontSize: 11.5, color: C.muted }}>{months > 1 ? `${ils(perMonth)} לחודש` : ' '}</div>
    </div>
  );
};

const Product = ({ index, title, desc, rows }) => {
  const base = rows[0][2] / rows[0][1];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 410px', gap: 22, alignItems: 'center', padding: '24px 0', borderBottom: `1px solid ${C.rule}` }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
        <span style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 24, color: C.gold, lineHeight: 1 }}>{HEB_LETTERS[index]}.</span>
        <div>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, color: C.ink, lineHeight: 1.25 }}>{title}</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.65, marginTop: 5 }}>{desc}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {rows.map(([period, months, price]) => <PriceCell key={period} period={period} months={months} price={price} base={base} />)}
      </div>
    </div>
  );
};

export const PriceListPage = forwardRef(({ list, sender, phone, date = new Date().toISOString() }, ref) => {
  const yearCard = list.card.find(([, m]) => m === 12)?.[2] || 0;
  const monthBanner = list.mainBanner.find(([, m]) => m === 1)?.[2] || 0;
  const r = { generatedAt: date };
  return (
    <Page ref={ref} r={r} number={1} total={1} footer={<><span>מחירון שבושון · {civDate(date)}</span><span>עמוד 1 מתוך 1</span></>}>
      <div style={{ marginTop: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ color: C.gold, fontWeight: 500, fontSize: 13 }}>מחירון פרסום</div>
        <div style={{ textAlign: 'left', color: C.muted, fontSize: 12, lineHeight: 1.5 }}>
          <div>{hebDate(date)}</div>
          <div>{civDate(date)}</div>
        </div>
      </div>
      <SectionTitle sub="כל המחירים בש״ח, לכל התקופה. ככל שהתקופה ארוכה יותר, המחיר לחודש נמוך יותר.">
        המחירון של שבושון
      </SectionTitle>

      <div style={{ borderTop: `1px solid ${C.ink}`, marginTop: 6 }}>
        <Product
          index={0}
          title="כרטיס מורחב בדף התוצאות"
          desc="כרטיס מודגש בכל פעם שהמוסד יוצא בתוצאות של תלמיד, עם ווצאפ ישיר לאחראי הישיבה וקישור לאתר."
          rows={list.card}
        />
        <Product
          index={1}
          title="באנר ראשי בדף הבית"
          desc="הבאנר הבולט ביותר באתר, בתחתית דף הבית. מוסד אחד בכל פעם, וכל מי שנכנס לאתר רואה אותו."
          rows={list.mainBanner}
        />
        <Product
          index={2}
          title="באנר בזמן השאלון"
          desc="רצועה בתחתית המסך בזמן שהתלמיד עונה. 12 מקומות, אחד לכל שאלה; המחיר הוא לשאלה אחת."
          rows={list.questionBanner}
        />
      </div>

      <div style={{ marginTop: 34, background: C.sand, borderRight: `5px solid ${C.gold}`, padding: '18px 22px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 24, alignItems: 'center' }}>
        <div>
          <div style={{ color: C.gold, fontWeight: 700, fontSize: 12.5 }}>חבילה מומלצת</div>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 21, color: C.ink, lineHeight: 1.3 }}>כרטיס מורחב לשנה, ועוד חודש של באנר ראשי</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>שנה שלמה עם ווצאפ וקישור בתוצאות, ועוד חודש שבו המוסד מוצג בדף הבית לכל מי שנכנס לאתר.</div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 38, color: C.gold, lineHeight: 1 }}>{ils(list.bundle)}</div>
          {yearCard + monthBanner > list.bundle && (
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>במקום <s>{ils(yearCard + monthBanner)}</s></div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 12.5, color: C.muted, lineHeight: 1.7 }}>
        הבאנר הראשי והבאנרים בשאלות משוריינים לפי סדר ההרשמה. לשאלה על מקום פנוי או על שילוב אחר, דברו איתנו.
      </div>

      <div style={{ marginTop: 'auto', borderTop: `3px solid ${C.espresso}`, paddingTop: 12, paddingBottom: 12, display: 'grid', gridTemplateColumns: '1fr auto', gap: 30, alignItems: 'end' }}>
        <div>
          <div style={{ fontSize: 14.5, lineHeight: 1.65 }}>נשמח לשמוע מכם ולענות על כל שאלה.</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 22, flexWrap: 'wrap', fontSize: 13.5, color: C.ink }}>
            {phone && <span>טלפון: <strong dir="ltr">{phone}</strong></span>}
            <span>מייל: <strong dir="ltr">shvushon@gmail.com</strong></span>
            <span>אתר: <strong dir="ltr">www.shvushon.com</strong></span>
          </div>
        </div>
        <div style={{ fontSize: 15, color: C.ink }}>
          <div>בברכה,</div>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, marginTop: 2 }}>{sender?.trim() || 'צוות שבושון'}</div>
        </div>
      </div>
    </Page>
  );
});
