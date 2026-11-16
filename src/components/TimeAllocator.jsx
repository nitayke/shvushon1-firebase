import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Sparkles, ScrollText, Dumbbell, Users, Minus, Plus, Check, RotateCcw } from 'lucide-react';
import { TIME_CATEGORIES, TIME_TOTAL_HOURS, TIME_PERIOD, HOURS_PER_BLOCK, hoursUsed } from '../timeAllocation';

const ICONS = { gemara: BookOpen, emunah: Sparkles, tanach: ScrollText, training: Dumbbell, social: Users };
const TICKS = Array.from({ length: Math.ceil(TIME_TOTAL_HOURS / HOURS_PER_BLOCK) - 1 }, (_, i) => (i + 1) * HOURS_PER_BLOCK);
const DRAG_SLOP = 6; // px a finger must move sideways before a touch counts as a drag (not a scroll)

const pct = (h) => `${(h / TIME_TOTAL_HOURS) * 100}%`;

/**
 * Split a fixed weekly budget of hours between the time categories (mobile first).
 * Each category has a full-width slider (drag or tap, 1-hour steps) plus ± buttons (hold to repeat).
 * On touch, a vertical swipe still scrolls the page; only a sideways drag or a tap moves the slider.
 * value: { [categoryId]: hours }, onChange(nextHours). Hours never exceed TIME_TOTAL_HOURS in total.
 */
export default function TimeAllocator({ value, onChange, compact = false }) {
  const used = hoursUsed(value);
  const remaining = TIME_TOTAL_HOURS - used;
  const [blockedId, setBlockedId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const blockTimer = useRef(null);

  // Latest props for the hold-to-repeat timer and drag handlers
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };
  const repeat = useRef(null);
  const drag = useRef(null);
  const stopRepeat = () => {
    if (repeat.current) { clearTimeout(repeat.current); repeat.current = null; }
  };
  useEffect(() => () => { stopRepeat(); if (blockTimer.current) clearTimeout(blockTimer.current); }, []);

  const flashBlocked = (id) => {
    if (blockTimer.current) clearTimeout(blockTimer.current);
    else navigator.vibrate?.(12);
    setBlockedId(id);
    blockTimer.current = setTimeout(() => { setBlockedId(null); blockTimer.current = null; }, 1400);
  };

  // Returns false when nothing could change (so a held button stops repeating).
  const setHours = (id, target) => {
    const { value: v, onChange: change } = latest.current;
    const current = v[id] || 0;
    const max = current + TIME_TOTAL_HOURS - hoursUsed(v);
    const next = Math.max(0, Math.min(Math.round(target), max));
    if (target > max) flashBlocked(id);
    if (next === current) return false;
    const nextValue = { ...v, [id]: next };
    latest.current = { value: nextValue, onChange: change };
    change(nextValue);
    return true;
  };

  const step = (id, delta) => setHours(id, (latest.current.value[id] || 0) + delta);

  const startRepeat = (id, delta) => (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    stopRepeat();
    if (!step(id, delta)) return;
    const tick = (delay) => {
      repeat.current = setTimeout(() => {
        if (step(id, delta)) tick(Math.max(45, delay * 0.8));
        else stopRepeat();
      }, delay);
    };
    tick(380);
  };

  const stepButtonProps = (id, delta) => ({
    type: 'button',
    className: 'ta-step',
    onPointerDown: startRepeat(id, delta),
    onPointerUp: stopRepeat,
    onPointerLeave: stopRepeat,
    onPointerCancel: stopRepeat,
    onContextMenu: (e) => e.preventDefault(),
    // keyboard activation (pointer clicks are handled by onPointerDown)
    onClick: (e) => { if (e.detail === 0) step(id, delta); }
  });

  // --- Slider (right-to-left: 0 at the right edge) ---
  const hoursAt = (track, clientX) => {
    const r = track.querySelector('.ta-bar').getBoundingClientRect();
    return Math.max(0, Math.min(1, (r.right - clientX) / r.width)) * TIME_TOTAL_HOURS;
  };

  const trackProps = (c, h) => ({
    className: 'ta-track',
    role: 'slider',
    tabIndex: 0,
    'aria-label': c.label,
    'aria-valuemin': 0,
    'aria-valuemax': TIME_TOTAL_HOURS,
    'aria-valuenow': h,
    'aria-valuetext': `${h} שעות`,
    onPointerDown: (e) => {
      if (e.button !== 0) return;
      const mouse = e.pointerType === 'mouse';
      drag.current = { id: c.id, x: e.clientX, y: e.clientY, active: mouse };
      if (mouse) {
        e.preventDefault();
        e.currentTarget.focus();
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
        setDragId(c.id);
        setHours(c.id, hoursAt(e.currentTarget, e.clientX));
      }
    },
    onPointerMove: (e) => {
      const d = drag.current;
      if (!d || d.id !== c.id) return;
      if (!d.active) {
        const dx = Math.abs(e.clientX - d.x);
        if (dx < DRAG_SLOP || dx < Math.abs(e.clientY - d.y)) return;
        d.active = true;
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
        setDragId(c.id);
      }
      setHours(c.id, hoursAt(e.currentTarget, e.clientX));
    },
    onPointerUp: (e) => {
      const d = drag.current;
      drag.current = null;
      setDragId(null);
      // A tap (finger barely moved) jumps to that spot
      if (d && d.id === c.id && !d.active && Math.hypot(e.clientX - d.x, e.clientY - d.y) < DRAG_SLOP) {
        setHours(c.id, hoursAt(e.currentTarget, e.clientX));
      }
    },
    onPointerCancel: () => { drag.current = null; setDragId(null); },
    onLostPointerCapture: () => { if (drag.current?.active) { drag.current = null; setDragId(null); } },
    onKeyDown: (e) => {
      const moves = {
        ArrowLeft: 1, ArrowUp: 1, ArrowRight: -1, ArrowDown: -1,
        PageUp: HOURS_PER_BLOCK, PageDown: -HOURS_PER_BLOCK
      };
      if (e.key in moves) step(c.id, moves[e.key]);
      else if (e.key === 'Home') setHours(c.id, 0);
      else if (e.key === 'End') setHours(c.id, TIME_TOTAL_HOURS);
      else return;
      e.preventDefault();
    }
  });

  return (
    <div className={`time-alloc ${compact ? 'compact' : ''}`}>
      {/* The week at a glance (stays in view while scrolling the rows on a phone) */}
      <div className="ta-summary">
        <div className={`ta-status ${remaining === 0 ? 'done' : ''} ${blockedId ? 'warn' : ''}`} role="status" aria-live="polite">
          {blockedId
            ? 'כל השעות חולקו. כדי להוסיף כאן, הורד ממשהו אחר.'
            : remaining === 0
              ? <><Check style={{ width: 16, height: 16 }} /> כל {TIME_TOTAL_HOURS} השעות חולקו</>
              : used === 0
                ? <>גרור את הפסים כדי לחלק <strong>{TIME_TOTAL_HOURS}</strong> שעות {TIME_PERIOD}</>
                : remaining === 1
                  ? <>נשארה עוד <strong>שעה אחת</strong> לחלק</>
                  : <>נשארו <strong>{remaining}</strong> מתוך {TIME_TOTAL_HOURS} שעות</>}
        </div>
        <div className="ta-day" aria-hidden="true">
          {TIME_CATEGORIES.map(c => value[c.id] > 0 && (
            <div key={c.id} className="ta-day-seg" style={{ flexGrow: value[c.id], background: c.color }}>
              {value[c.id] >= 4 && <span>{value[c.id]}</span>}
            </div>
          ))}
          {remaining > 0 && <div className="ta-day-seg ta-day-free" style={{ flexGrow: remaining }} />}
        </div>
      </div>

      <div className="ta-rows">
        {TIME_CATEGORIES.map(c => {
          const Icon = ICONS[c.id];
          const h = value[c.id] || 0;
          const reachable = h + remaining;
          const dragging = dragId === c.id;
          return (
            <div
              key={c.id}
              className={`ta-row ${blockedId === c.id ? 'shake' : ''} ${dragging ? 'dragging' : ''} ${h > 0 ? 'has' : ''}`}
              style={{ '--cat': c.color }}
              role="group"
              aria-label={c.label}
            >
              <div className="ta-head">
                <span className="ta-icon"><Icon style={{ width: 18, height: 18 }} /></span>
                <span className="ta-name">
                  <strong>{c.label}</strong>
                  {!compact && <small>{c.hint}</small>}
                </span>
                <div className="ta-stepper">
                  <button {...stepButtonProps(c.id, -1)} disabled={h === 0} aria-label={`שעה פחות ל${c.label}`}>
                    <Minus style={{ width: 16, height: 16 }} />
                  </button>
                  <span className={`ta-value ${h === 0 ? 'zero' : ''}`} aria-hidden="true">
                    <b>{h}</b>
                    <small>שע׳</small>
                  </span>
                  <button {...stepButtonProps(c.id, 1)} disabled={h >= TIME_TOTAL_HOURS} aria-label={`שעה יותר ל${c.label}`}>
                    <Plus style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>

              <div {...trackProps(c, h)}>
                <div className="ta-bar">
                  <div className="ta-rail">
                    {reachable < TIME_TOTAL_HOURS && (
                      <div className="ta-locked" style={{ width: `calc(100% - ${pct(reachable)})` }} />
                    )}
                    <div className="ta-fill" style={{ width: pct(h) }} />
                    {TICKS.map(t => <span key={t} className={`ta-tick ${t <= h ? 'in' : ''}`} style={{ insetInlineStart: pct(t) }} />)}
                  </div>
                  <div className="ta-thumb" style={{ insetInlineStart: pct(h) }}>
                    {dragging && <span className="ta-bubble">{h}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {used > 0 && (
        <button type="button" className="ta-reset" onClick={() => onChange(Object.fromEntries(TIME_CATEGORIES.map(c => [c.id, 0])))}>
          <RotateCcw style={{ width: 14, height: 14 }} />
          לאפס ולהתחיל מחדש
        </button>
      )}
    </div>
  );
}
