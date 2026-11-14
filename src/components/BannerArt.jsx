import React from 'react';

// Evening scene behind the sponsored banners: hills at dusk and a yeshiva building with lit windows.
// The art sits on the left (the text side in RTL is the right), with a dark wash under the text.
// Plain inline SVG so it works on the site and when the PDF rasterizes the page.
export default function BannerArt({ id = 'ba' }) {
  const g = (name) => `${id}-${name}`;
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMinYMid slice" aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b1a0e" />
          <stop offset="0.55" stopColor="#6b4022" />
          <stop offset="1" stopColor="#c98a3a" />
        </linearGradient>
        <radialGradient id={g('sun')} cx="0.28" cy="0.78" r="0.42">
          <stop offset="0" stopColor="#ffd98e" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#e6a855" stopOpacity="0.45" />
          <stop offset="1" stopColor="#e6a855" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={g('wash')} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#24150b" stopOpacity="0.92" />
          <stop offset="0.45" stopColor="#24150b" stopOpacity="0.72" />
          <stop offset="1" stopColor="#24150b" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill={`url(#${g('sky')})`} />
      <rect width="400" height="200" fill={`url(#${g('sun')})`} />
      {[[30, 22], [70, 40], [128, 18], [180, 34], [232, 14], [300, 28], [352, 44], [96, 62]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 ? 0.9 : 1.3} fill="#f6e6c8" opacity="0.75" />
      ))}
      <path d="M0 150 C 60 128, 120 136, 180 126 S 300 120, 400 134 L400 200 L0 200 Z" fill="#7a4a24" opacity="0.55" />
      <path d="M0 164 C 70 146, 150 156, 220 146 S 330 150, 400 156 L400 200 L0 200 Z" fill="#4e2f17" />

      {/* the building */}
      <g fill="#2a190d">
        <rect x="58" y="112" width="118" height="52" />
        <rect x="96" y="96" width="42" height="18" />
        <path d="M100 96 Q 117 72 134 96 Z" />
        <rect x="115.5" y="66" width="3" height="10" />
        <path d="M52 114 L 117 100 L 182 114 Z" />
      </g>
      <g fill="#ffcf7a">
        {[70, 92, 136, 158].map(x => <path key={x} d={`M${x} 150 v-16 a5 5 0 0 1 10 0 v16 Z`} opacity="0.92" />)}
        <path d="M110 150 v-22 a7 7 0 0 1 14 0 v22 Z" />
        <circle cx="117" cy="88" r="3.2" opacity="0.85" />
      </g>
      {/* cypress trees */}
      <g fill="#24150b">
        <path d="M34 168 C 28 150, 32 128, 38 116 C 44 128, 48 150, 42 168 Z" />
        <path d="M196 168 C 191 152, 194 134, 199 124 C 204 134, 207 152, 202 168 Z" />
        <path d="M214 170 C 210 158, 212 144, 216 136 C 220 144, 222 158, 218 170 Z" />
      </g>
      <path d="M0 176 C 90 164, 200 172, 280 166 S 360 168, 400 172 L400 200 L0 200 Z" fill="#2a190d" />
      <rect width="400" height="200" fill={`url(#${g('wash')})`} />
    </svg>
  );
}
