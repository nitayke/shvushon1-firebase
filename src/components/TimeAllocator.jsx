import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Sparkles, ScrollText, Dumbbell, Users, Minus, Plus, Check, RotateCcw } from 'lucide-react';
import { TIME_CATEGORIES, TIME_TOTAL_HOURS, TIME_PERIOD, HOURS_PER_BLOCK, hoursUsed } from '../timeAllocation';

const ICONS = { gemara: BookOpen, emunah: Sparkles, tanach: ScrollText, training: Dumbbell, social: Users };
const BLOCKS = Math.ceil(TIME_TOTAL_HOURS / HOURS_PER_BLOCK);

const hoursText = (h) => (h === 1 ? 'שעה אחת' : `${h} שעות`);

/**
 * Split a fixed weekly budget of hours between the time categories.
 * Each block is HOURS_PER_BLOCK hours (tap to jump), and the ± buttons move one hour (hold to repeat).
 * value: { [categoryId]: hours }, onChange(nextHours). Hours never exceed TIME_TOTAL_HOURS in total.
 */
export default function TimeAllocator({ value, onChange, compact = false }) {
  const used = hoursUsed(value);
  const remaining = TIME_TOTAL_HOURS - used;
  const [blockedId, setBlockedId] = useState(null);
  const blockTimer = useRef(null);

  // Latest props for the hold-to-repeat timer
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };
  const repeat = useRef(null);
  const stopRepeat = () => {
    if (repeat.current) { clearTimeout(repeat.current); repeat.current = null; }
  };
  useEffect(() => () => { stopRepeat(); if (blockTimer.current) clearTimeout(blockTimer.current); }, []);

  const flashBlocked = (id) => {
    setBlockedId(id);
    if (blockTimer.current) clearTimeout(blockTimer.current);
    blockTimer.current = setTimeout(() => setBlockedId(null), 1400);
  };

  // Returns false when nothing could change (so a held button stops repeating).
  const setHours = (id, target) => {
    const { value: v, onChange: change } = latest.current;
    const current = v[id] || 0;
    const max = current + TIME_TOTAL_HOURS - hoursUsed(v);
    const next = Math.max(0, Math.min(target, max));
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

  return (
    <div className={`time-alloc ${compact ? 'compact' : ''}`}>
      {/* The week at a glance (stays in view while scrolling the rows on a phone) */}
      <div className="ta-summary">
        <div className="ta-day" aria-hidden="true">
          {TIME_CATEGORIES.map(c => value[c.id] > 0 && (
            <div key={c.id} className="ta-day-seg" style={{ flexGrow: value[c.id], background: c.color }}>
              {value[c.id] >= 4 && <span>{value[c.id]}</span>}
            </div>
          ))}
          {remaining > 0 && <div className="ta-day-seg ta-day-free" style={{ flexGrow: remaining }} />}
        </div>

        <div className={`ta-status ${remaining === 0 ? 'done' : ''} ${blockedId ? 'warn' : ''}`} role="status" aria-live="polite">
          {blockedId
            ? 'כל השעות כבר חולקו. כדי להוסיף כאן, הורד שעות ממשהו אחר.'
            : remaining === 0
              ? <><Check style={{ width: 16, height: 16 }} /> כל {TIME_TOTAL_HOURS} השעות חולקו</>
              : used === 0
                ? <>יש לך <strong>{TIME_TOTAL_HOURS}</strong> שעות {TIME_PERIOD} לחלק. כל קובייה = {HOURS_PER_BLOCK} שעות.</>
                : <>נשארו עוד <strong>{remaining}</strong> {remaining === 1 ? 'שעה' : 'שעות'} לחלק</>}
        </div>
      </div>

      <div className="ta-rows">
        {TIME_CATEGORIES.map(c => {
          const Icon = ICONS[c.id];
          const h = value[c.id] || 0;
          const reachable = h + remaining;
          return (
            <div key={c.id} className={`ta-row ${blockedId === c.id ? 'shake' : ''}`} style={{ '--cat': c.color }} role="group" aria-label={c.label}>
              <div className="ta-head">
                <span className="ta-icon"><Icon style={{ width: 18, height: 18 }} /></span>
                <span className="ta-name">
                  <strong>{c.label}</strong>
                  {!compact && <small>{c.hint}</small>}
                </span>
                <span className={`ta-value ${h === 0 ? 'zero' : ''}`}>
                  {h === 0 ? '0' : hoursText(h)}
                  {h > 0 && <small> · {Math.round((h / TIME_TOTAL_HOURS) * 100)}%</small>}
                </span>
              </div>
              <div className="ta-controls">
                <button {...stepButtonProps(c.id, -1)} disabled={h === 0} aria-label={`שעה פחות ל${c.label}`}>
                  <Minus style={{ width: 16, height: 16 }} />
                </button>
                <div className="ta-cells">
                  {Array.from({ length: BLOCKS }, (_, i) => {
                    const start = i * HOURS_PER_BLOCK;
                    const end = start + HOURS_PER_BLOCK;
                    const fill = Math.max(0, Math.min(1, (h - start) / HOURS_PER_BLOCK));
                    const state = fill >= 1 ? 'on' : fill > 0 ? 'part' : start < reachable ? 'free' : 'locked';
                    return (
                      <button
                        type="button"
                        key={i}
                        className={`ta-cell ${state}`}
                        style={{ '--fill': `${fill * 100}%` }}
                        onClick={() => setHours(c.id, h === end ? start : end)}
                        aria-label={`${c.label}: ${end} שעות`}
                        aria-pressed={fill >= 1}
                      />
                    );
                  })}
                </div>
                <button {...stepButtonProps(c.id, 1)} disabled={h >= TIME_TOTAL_HOURS} aria-label={`שעה יותר ל${c.label}`}>
                  <Plus style={{ width: 16, height: 16 }} />
                </button>
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
