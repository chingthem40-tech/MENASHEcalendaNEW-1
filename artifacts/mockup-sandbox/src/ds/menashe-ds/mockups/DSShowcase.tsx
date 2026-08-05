/**
 * DSShowcase — visual token reference for the Menashe Design System
 * Preview: /__mockup/src/ds/menashe-ds/#/DSShowcase
 */
import '@workspace/menashe-ds/styles.css';
import { useState } from 'react';

/* ── tiny helpers ─────────────────────────────────────────────── */
function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-14 h-14 rounded-xl border border-white/10 shadow-md"
        style={{ background: value }}
      />
      <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
        {name}
      </span>
      <span className="text-[9px] font-mono uppercase" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="mds-gold-divider flex-1" />
        <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
          {title}
        </h2>
        <div className="mds-gold-divider flex-1" />
      </div>
      {children}
    </section>
  );
}

/* ── theme wrapper ────────────────────────────────────────────── */
type Theme = 'royal' | 'parchment' | 'sapphire';

const THEME_META: Record<Theme, { label: string; cls: string; bg: string; accent: string }> = {
  royal:    { label: 'Royal Midnight', cls: '',               bg: '#080e1a', accent: '#ff631f' },
  parchment:{ label: 'Parchment Light',cls: 'light-theme',    bg: '#f3fbfd', accent: '#41bedd' },
  sapphire: { label: 'Deep Sapphire',  cls: 'sapphire-theme', bg: '#060e1e', accent: '#6382ff' },
};

/* ── palette definitions (theme-relative names → CSS vars) ────── */
const PALETTE = [
  { name: 'background',    value: 'var(--background)' },
  { name: 'card',          value: 'var(--card)' },
  { name: 'card-secondary',value: 'var(--card-secondary)' },
  { name: 'elevated',      value: 'var(--elevated)' },
  { name: 'border',        value: 'var(--border)' },
  { name: 'primary',       value: 'var(--primary)' },
  { name: 'gold',          value: 'var(--gold)' },
  { name: 'gold-light',    value: 'var(--gold-light)' },
  { name: 'text-primary',  value: 'var(--text-primary)' },
  { name: 'text-secondary',value: 'var(--text-secondary)' },
  { name: 'text-muted',    value: 'var(--text-muted)' },
  { name: 'green',         value: 'var(--green)' },
  { name: 'red',           value: 'var(--red)' },
];

/* ── main component ────────────────────────────────────────────── */
export default function DSShowcase() {
  const [theme, setTheme] = useState<Theme>('royal');
  const meta = THEME_META[theme];

  return (
    <div className={meta.cls} style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Header */}
        <div className="text-center mb-10">
          <p className="mds-hebrew mb-2" style={{ fontSize: 22, color: 'var(--gold)' }}>
            מנשה
          </p>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Menashe Design System
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Token showcase — three themes
          </p>
        </div>

        {/* Theme switcher */}
        <div className="flex gap-2 justify-center mb-10">
          {(Object.keys(THEME_META) as Theme[]).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
              style={{
                background: theme === t ? meta.accent : 'var(--card)',
                color: theme === t ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${theme === t ? meta.accent : 'var(--border)'}`,
                transform: theme === t ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {THEME_META[t].label}
            </button>
          ))}
        </div>

        {/* ── Colour Palette ─── */}
        <Section title="Colour Palette">
          <div className="flex flex-wrap gap-4 justify-center">
            {PALETTE.map((s) => (
              <Swatch key={s.name} name={s.name} value={s.value} />
            ))}
          </div>
        </Section>

        {/* ── Typography ─── */}
        <Section title="Typography">
          <div className="mds-card p-6 space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Display</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>בּנֵי מנשה</p>
            </div>
            <div className="mds-gold-divider" />
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Heading</p>
              <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Community Calendar</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Body</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                A sacred Jewish community app connecting Bnei Menashe families
                through prayer, remembrance, and shared heritage.
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Hebrew (mds-hebrew)</p>
              <p className="mds-hebrew" style={{ fontSize: 18, color: 'var(--gold)' }}>
                שַׁבָּת שָׁלוֹם
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Caption / Muted</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                כ״ה בְּאָב תשפ״ו · 25 Av 5786
              </p>
            </div>
          </div>
        </Section>

        {/* ── Buttons ─── */}
        <Section title="Buttons">
          <div className="mds-card p-6">
            <div className="flex flex-wrap gap-3 items-center">
              <button className="mds-btn-primary">Join Community</button>
              <button className="mds-btn-gold">✦ Premium</button>
              <button className="mds-btn-primary" disabled>Disabled</button>
              <button className="mds-btn-close">✕</button>
            </div>
            <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
              mds-btn-primary · mds-btn-gold · mds-btn-primary[disabled] · mds-btn-close
            </p>
          </div>
        </Section>

        {/* ── Cards ─── */}
        <Section title="Cards">
          <div className="space-y-3">
            <div className="mds-card p-4">
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>mds-card</p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>Standard elevated card surface</p>
            </div>
            <div className="mds-card-interactive p-4">
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>mds-card-interactive (hover me)</p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>Lifts with gold border glow on hover</p>
            </div>
            <div className="mds-card-secondary p-4">
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>mds-card-secondary</p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>Slightly more muted background</p>
            </div>
          </div>
        </Section>

        {/* ── Motion tokens ─── */}
        <Section title="Motion Tokens">
          <div className="mds-card p-5 grid grid-cols-2 gap-y-3 gap-x-6 text-xs font-mono">
            {[
              ['--ease-spring', 'cubic-bezier(0.34, 1.56, 0.64, 1)'],
              ['--ease-out',    'cubic-bezier(0.22, 1, 0.36, 1)'],
              ['--dur-instant', '80ms'],
              ['--dur-fast',    '180ms'],
              ['--dur-normal',  '280ms'],
              ['--dur-slow',    '420ms'],
            ].map(([k, v]) => (
              <div key={k}>
                <p style={{ color: 'var(--gold)' }}>{k}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 9 }}>{v}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Animations ─── */}
        <Section title="Animation Classes">
          <div className="space-y-3">
            <div className="mds-card p-4 mds-fade-in">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>mds-fade-in</p>
            </div>
            <div className="mds-card p-4 mds-slide-up">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>mds-slide-up</p>
            </div>
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="mds-card-secondary p-3 flex-1 mds-stagger-item text-center text-xs"
                  style={{ '--stagger-index': i } as React.CSSProperties}
                >
                  <p style={{ color: 'var(--text-muted)' }}>stagger {i}</p>
                </div>
              ))}
            </div>
            <div className="mds-skeleton h-10 rounded-xl" />
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              mds-stagger-item · mds-skeleton
            </p>
          </div>
        </Section>

        {/* ── Radii & spacing ─── */}
        <Section title="Radii">
          <div className="flex gap-4 flex-wrap items-end">
            {[
              { label: '--radius', r: 'var(--radius)' },
              { label: '6px',  r: '6px' },
              { label: '12px', r: '12px' },
              { label: '20px', r: '20px' },
              { label: '99px', r: '99px' },
            ].map(({ label, r }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div
                  className="w-14 h-14"
                  style={{
                    background: 'var(--primary)',
                    borderRadius: r,
                    opacity: 0.85,
                  }}
                />
                <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Gold divider ─── */}
        <Section title="Sacred Dividers">
          <div className="mds-card p-5 space-y-4">
            <div className="mds-gold-divider" />
            <div className="flex items-center gap-3">
              <div className="mds-gold-divider flex-1" />
              <span className="mds-hebrew text-sm" style={{ color: 'var(--gold)' }}>✦</span>
              <div className="mds-gold-divider flex-1" />
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            @workspace/menashe-ds · {meta.label} theme active
          </p>
        </div>

      </div>
    </div>
  );
}
