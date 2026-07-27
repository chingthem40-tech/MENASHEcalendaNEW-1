import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export interface CompassCardProps {
  gradient: string;
  accentColor: string;
  category: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  previewContent?: React.ReactNode;
  onTap?: () => void;
  expandedTitle?: string;
  expandedSubtitle?: string;
  children?: React.ReactNode;
  minHeight?: number;
  style?: React.CSSProperties;
  shimmerColor?: string;
  popupMaxWidth?: number;
  watermarkSrc?: string;
  backgroundLayer?: React.ReactNode;
}

/* ─────────────────────────────────────────────
   Centered floating popup — matches Jerusalem
   Compass popup style exactly
───────────────────────────────────────────── */
function CompassPopup({
  open,
  onClose,
  accentColor,
  gradient,
  category,
  title,
  subtitle,
  icon,
  children,
  maxWidth = 820,
}: {
  open: boolean;
  onClose: () => void;
  accentColor: string;
  gradient: string;
  category: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  const [visible, setVisible] = useState(false);
  const [animOut, setAnimOut] = useState(false);

  useEffect(() => {
    if (open) {
      setAnimOut(false);
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setVisible(false);
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function handleClose() {
    setAnimOut(true);
    setTimeout(() => { setAnimOut(false); onClose(); }, 280);
  }

  if (!open && !animOut) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes cc-pop-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cc-pop-backdrop-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes cc-pop-card-in {
          from { opacity: 0; transform: scale(0.82) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes cc-pop-card-out {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to   { opacity: 0; transform: scale(0.82) translateY(16px); }
        }
        @keyframes cc-shimmer-pop {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9900,
          background: "rgba(0,0,0,0.78)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px 20px",
          animation: animOut
            ? "cc-pop-backdrop-out 0.28s ease forwards"
            : "cc-pop-backdrop-in 0.22s ease",
        }}
      >
        {/* Card */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: `min(92vw, ${maxWidth}px)`,
            background: "linear-gradient(160deg, #0e1020 0%, #0a0e1a 55%, #10090a 100%)",
            border: `1.5px solid ${accentColor}70`,
            borderRadius: 24,
            boxShadow: `0 28px 90px rgba(0,0,0,0.85), 0 0 0 1px ${accentColor}20, inset 0 1px 0 ${accentColor}15`,
            position: "relative",
            overflow: "hidden",
            maxHeight: "85vh",
            display: "flex", flexDirection: "column",
            animation: animOut
              ? "cc-pop-card-out 0.28s cubic-bezier(0.4,0,1,1) forwards"
              : "cc-pop-card-in 0.32s cubic-bezier(0.34,1.4,0.64,1)",
          }}
        >
          {/* Shimmer overlay */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
            background: `linear-gradient(105deg, transparent 30%, ${accentColor}12 50%, transparent 70%)`,
            backgroundSize: "200% 100%",
            animation: "cc-shimmer-pop 6s linear infinite",
          }} />

          {/* Radial accent glow top-right */}
          <div style={{
            position: "absolute", top: 0, right: 0, width: 180, height: 180,
            background: `radial-gradient(ellipse at 80% 20%, ${accentColor}18 0%, transparent 65%)`,
            pointerEvents: "none", zIndex: 0,
          }} />

          {/* ── Header ── */}
          <div style={{
            position: "relative", zIndex: 1,
            padding: "22px 22px 18px",
            borderBottom: `1px solid ${accentColor}20`,
            flexShrink: 0,
          }}>
            {/* Category label + icon row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              {icon && <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>}
              <span style={{
                fontSize: 9.5, fontWeight: 900, letterSpacing: "0.18em",
                color: accentColor, textTransform: "uppercase",
              }}>{category}</span>
            </div>

            {/* Title */}
            <div style={{
              fontSize: 20, fontWeight: 900, color: "white", lineHeight: 1.2,
              letterSpacing: "-0.01em", marginBottom: subtitle ? 4 : 0,
              paddingRight: 36,
            }}>{title}</div>

            {subtitle && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{subtitle}</div>
            )}

            {/* Close button */}
            <button
              onClick={handleClose}
              style={{
                position: "absolute", top: 18, right: 18,
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.14)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.65)", fontSize: 15, fontWeight: 700,
                transition: "background 0.15s",
                flexShrink: 0,
              }}
            >✕</button>
          </div>

          {/* ── Scrollable body ── */}
          <div style={{
            position: "relative", zIndex: 1,
            overflowY: "auto", flex: 1,
            padding: "0 0 24px",
            WebkitOverflowScrolling: "touch",
          }}>
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ─────────────────────────────────────────────
   CompassCard — the card that sits in the feed
───────────────────────────────────────────── */
export default function CompassCard({
  gradient,
  accentColor,
  category,
  icon,
  title,
  subtitle,
  badge,
  previewContent,
  onTap,
  expandedTitle,
  expandedSubtitle,
  children,
  minHeight = 200,
  style,
  shimmerColor,
  popupMaxWidth = 820,
  watermarkSrc,
  backgroundLayer,
}: CompassCardProps) {
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);

  const shimmer = shimmerColor ?? accentColor;

  function handleTap() {
    if (onTap) { onTap(); return; }
    if (children) setOpen(true);
  }

  return (
    <>
      <style>{`
        @keyframes cc-feed-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes cc-explore-pulse {
          0%, 100% { opacity: 0.45; transform: translateX(0); }
          50%       { opacity: 1;   transform: translateX(3px); }
        }
        .compass-card-root {
          position: relative;
          border-radius: 22px;
          overflow: hidden;
          margin-bottom: 14px;
          cursor: pointer;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.16s cubic-bezier(0.34,1.56,0.64,1),
                      box-shadow 0.16s ease;
          will-change: transform;
        }
        .compass-card-root:active,
        .compass-card-root.pressed {
          transform: scale(0.968);
          box-shadow: 0 2px 10px rgba(0,0,0,0.5) !important;
        }
        .cc-explore-chevron {
          animation: cc-explore-pulse 1.9s ease-in-out infinite;
        }
      `}</style>

      {/* ── Feed Card ── */}
      <div
        className={`compass-card-root${pressed ? " pressed" : ""}`}
        style={{
          background: backgroundLayer ? "transparent" : gradient,
          boxShadow: `0 8px 32px rgba(0,0,0,0.72), inset 0 1px 0 ${accentColor}22`,
          border: `1px solid ${accentColor}40`,
          minHeight,
          ...style,
        }}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => { setPressed(false); handleTap(); }}
        onPointerLeave={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
      >
        {/* Dynamic background layer (e.g. TimeAwareBackground) */}
        {backgroundLayer && (
          <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", borderRadius: 22 }}>
            {backgroundLayer}
          </div>
        )}

        {/* Watermark background image */}
        {watermarkSrc && (
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, borderRadius: 22,
            overflow: "hidden",
          }}>
            <img
              src={watermarkSrc}
              alt=""
              style={{
                position: "absolute",
                bottom: -10,
                right: -16,
                width: "82%",
                height: "140%",
                objectFit: "cover",
                objectPosition: "left center",
                opacity: 0.13,
                mixBlendMode: "luminosity",
                filter: "grayscale(30%) contrast(1.1)",
                transform: "scaleX(-1)",
                borderRadius: 12,
              }}
            />
            {/* Vignette to fade the image into the card edges */}
            <div style={{
              position: "absolute", inset: 0,
              background: `
                radial-gradient(ellipse at 20% 50%, transparent 30%, rgba(0,0,0,0.72) 75%),
                linear-gradient(to right, rgba(0,0,0,0.88) 0%, transparent 45%),
                linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)
              `,
            }} />
          </div>
        )}

        {/* Shimmer sweep */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, borderRadius: 22,
          background: `linear-gradient(105deg, transparent 28%, ${shimmer}1a 50%, transparent 72%)`,
          backgroundSize: "200% 100%",
          animation: "cc-feed-shimmer 5s linear infinite",
        }} />

        {/* Bottom gradient fade */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 70,
          background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
          pointerEvents: "none", zIndex: 1, borderRadius: "0 0 22px 22px",
        }} />

        {/* Card content */}
        <div style={{ position: "relative", zIndex: 2 }}>
          {/* Category + badge */}
          <div style={{ padding: "18px 18px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{
              fontSize: 9.5, fontWeight: 900, letterSpacing: "0.15em",
              color: accentColor, textTransform: "uppercase",
              background: `${accentColor}1e`, border: `1px solid ${accentColor}40`,
              padding: "3px 10px", borderRadius: 20,
            }}>{category}</span>
            {badge && <div>{badge}</div>}
          </div>

          {/* Icon + Title */}
          <div style={{ padding: "12px 18px 0" }}>
            <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 8, filter: "drop-shadow(0 2px 14px rgba(0,0,0,0.5))" }}>
              {icon}
            </div>
            <div style={{
              fontSize: 22, fontWeight: 900, color: "white", lineHeight: 1.15,
              letterSpacing: "-0.02em", marginBottom: subtitle ? 4 : 0,
              textShadow: "0 1px 8px rgba(0,0,0,0.55)",
            }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 500, lineHeight: 1.4 }}>{subtitle}</div>
            )}
          </div>

          {/* Preview content */}
          {previewContent && (
            <div style={{ padding: "10px 18px 0" }}>{previewContent}</div>
          )}

          {/* Explore indicator */}
          <div style={{
            padding: "12px 18px 16px",
            display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4,
          }}>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.38)", textTransform: "uppercase",
            }}>
              {onTap ? "Open" : "Read"}
            </span>
            <div className="cc-explore-chevron">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="rgba(255,255,255,0.42)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ── Centered Popup (Jerusalem Compass style) ── */}
      {children && (
        <CompassPopup
          open={open}
          onClose={() => setOpen(false)}
          accentColor={accentColor}
          gradient={gradient}
          category={category}
          title={expandedTitle ?? title}
          subtitle={expandedSubtitle ?? subtitle}
          icon={icon}
          maxWidth={popupMaxWidth}
        >
          {children}
        </CompassPopup>
      )}
    </>
  );
}
