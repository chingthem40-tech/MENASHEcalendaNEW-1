import { useEffect, useState } from "react";
import { usePWAUpdate } from "../hooks/usePWAUpdate";
import { useLanguage } from "../context/LanguageContext";

/**
 * UpdateToast
 *
 * Appears at the bottom of the screen (above the BottomNav) whenever
 * Workbox detects that a new service worker has installed and is waiting.
 * The user can tap "Update" to activate it immediately, or "Later" to
 * dismiss the banner until the next page load.
 *
 * Animates in from below and slides out when dismissed.
 */
export default function UpdateToast() {
  const { needRefresh, applyUpdate, dismiss } = usePWAUpdate();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  // Delay appearance slightly so the splash/onboarding doesn't compete
  useEffect(() => {
    if (!needRefresh) {
      setVisible(false);
      return;
    }
    const id = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(id);
  }, [needRefresh]);

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "110%"})`,
        transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#14120a",
        border: "1px solid rgba(212,168,67,0.45)",
        borderRadius: 14,
        boxShadow: "0 4px 24px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,168,67,0.08)",
        padding: "10px 14px",
        maxWidth: "calc(100vw - 32px)",
        minWidth: 220,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: 18, flexShrink: 0 }}>✨</span>

      {/* Label */}
      <span
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 600,
          color: "#e8d5a3",
          lineHeight: 1.3,
          letterSpacing: 0.1,
        }}
      >
        {t.updateAvailable}
      </span>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        style={{
          background: "none",
          border: "none",
          padding: "4px 8px",
          fontSize: 12,
          color: "rgba(255,255,255,0.45)",
          cursor: "pointer",
          borderRadius: 6,
          flexShrink: 0,
        }}
      >
        {t.updateDismiss}
      </button>

      {/* Update */}
      <button
        onClick={applyUpdate}
        style={{
          background: "linear-gradient(135deg,#d4a843,#b8892a)",
          border: "none",
          padding: "6px 14px",
          fontSize: 12,
          fontWeight: 700,
          color: "#0a0800",
          cursor: "pointer",
          borderRadius: 8,
          flexShrink: 0,
          letterSpacing: 0.2,
        }}
      >
        {t.updateRefresh}
      </button>
    </div>
  );
}
