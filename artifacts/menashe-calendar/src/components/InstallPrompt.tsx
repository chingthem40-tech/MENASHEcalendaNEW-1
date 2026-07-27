import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "menashe-pwa-install-dismissed";
const VISIT_COUNT_KEY = "menashe-pwa-visit-count";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export default function InstallPrompt() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(count));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (count >= 2) setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler as EventListener);

    if (count >= 2 && (window as any).__cachedInstallPrompt) {
      setDeferredPrompt((window as any).__cachedInstallPrompt);
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).__cachedInstallPrompt = e;
      const count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10);
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (count >= 2 && !localStorage.getItem(DISMISSED_KEY)) setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(DISMISSED_KEY, "1");
    }
    setVisible(false);
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: 420,
        zIndex: 8500,
        borderRadius: 18,
        overflow: "hidden",
        background: "linear-gradient(145deg, #0d1a2e, #162040)",
        border: "1.5px solid rgba(212,175,55,0.45)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.1)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(24px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <img
        src="/icon-192.png"
        alt="Menashe"
        style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, border: "1px solid rgba(212,175,55,0.3)" }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#F5D982", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {t.installTitle}
        </div>
        <div style={{ fontSize: 12, color: "rgba(245,240,232,0.65)", lineHeight: 1.4 }}>
          {t.installBody}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        <button
          onClick={handleInstall}
          style={{
            padding: "7px 14px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg, #b8860b, #d4a843)",
            color: "#0d0800",
            fontSize: 13,
            fontWeight: 800,
            whiteSpace: "nowrap",
            boxShadow: "0 3px 12px rgba(212,168,67,0.4)",
          }}
        >
          {t.installBtn}
        </button>
        <button
          onClick={handleDismiss}
          style={{
            padding: "5px 14px",
            borderRadius: 10,
            border: "1px solid rgba(212,175,55,0.2)",
            background: "transparent",
            color: "rgba(245,240,232,0.45)",
            fontSize: 12,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {t.installDismiss}
        </button>
      </div>
    </div>
  );
}
