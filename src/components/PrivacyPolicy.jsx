import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const PRIVACY_VERSION = '2026-10';

const h3 = { fontSize: '1.1rem', fontWeight: 700, margin: '1.1rem 0 0.4rem', color: '#111827' };
const li = { marginBottom: '0.3rem' };

export default function PrivacyPolicy() {
  return (
    <div className="glass-card" style={{ maxWidth: 720, margin: '0 auto', lineHeight: 1.7 }}>
      <h2 className="section-title" style={{ marginBottom: '0.8rem' }}>
        <ShieldCheck className="w-5 h-5" />
        מדיניות פרטיות לאחראי שבושים
      </h2>
      <p style={{ color: 'var(--text-secondary)' }}>
        מסמך זה מיועד לאחראי שבושים של ישיבה או מכינה הנרשם לאתר שבושון. ההרשמה והשימוש בלוח האירועים מותנים באישורו.
      </p>

      <h3 style={h3}>איזה מידע נשמר</h3>
      <ul style={{ paddingInlineStart: '1.2rem' }}>
        <li style={li}>כתובת האימייל שאיתה נרשמת.</li>
        <li style={li}>מספר הטלפון שהזנת, והאם יש עליו ווצאפ.</li>
        <li style={li}>שם הישיבה שאליה אתה משויך, והאירועים (ימים פתוחים ושבתות שבושים) שהוספת.</li>
        <li style={li}>מועד אישור מדיניות זו.</li>
      </ul>

      <h3 style={h3}>מה מוצג לציבור</h3>
      <p>
        מספר הטלפון שלך מוצג בלוח האירועים הציבורי, ליד האירועים של הישיבה שלך, כדי שמתעניינים יוכלו ליצור איתך קשר
        בטלפון או בווצאפ (אם סימנת שיש לך ווצאפ). כל גולש באתר יכול לראות אותו. האימייל שלך אינו מוצג לציבור.
      </p>

      <h3 style={h3}>יצירת קשר מצד שבושון</h3>
      <p>
        בהרשמה אתה מאשר שצוות שבושון רשאי ליצור איתך קשר באימייל, בהודעות ווצאפ ובשיחת טלפון בנושאי האתר, כולל עדכונים,
        תזכורות, בקשות לעדכון פרטים והודעות על שירותים חדשים.
      </p>

      <h3 style={h3}>שימוש במידע ושיתופו</h3>
      <p>
        המידע משמש לניהול הלוח ולתקשורת איתך בלבד. איננו מוכרים אותו לצד שלישי. המידע נשמר בשירותי Firebase של Google.
      </p>

      <h3 style={h3}>עדכון ומחיקה</h3>
      <p>
        אפשר לעדכן את הטלפון ואת סימון הווצאפ בכל עת מאזור האחראים, ולמחוק אירועים שהוספת. לבקשת מחיקה של החשבון
        וכל המידע שלך פנה אלינו בכתובת shvushon@gmail.com.
      </p>
    </div>
  );
}
