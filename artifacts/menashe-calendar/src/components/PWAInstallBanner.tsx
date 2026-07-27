import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DISMISSED_KEY = "pwa-install-dismissed-v1";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallBanner() {
  const [prompt, setPrompt]     = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible]   = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  const install = async () => {
    if (!prompt) return;
    setInstalling(true);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
      }
    } finally {
      setInstalling(false);
      setPrompt(null);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
          style={{
            position: "fixed",
            bottom: "max(env(safe-area-inset-bottom), 16px)",
            left: 16,
            right: 16,
            zIndex: 10000,
            background: "linear-gradient(135deg,#0d0a1c 0%,#130e28 100%)",
            border: "1px solid rgba(212,175,55,0.35)",
            borderRadius: 20,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.1)",
            fontFamily: "Inter,-apple-system,sans-serif",
          }}
        >
          {/* Icon */}
          <img
            src="/icon-192.png"
            alt="Menashe Calendar"
            style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }}
          />

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
              Install Menashe Calendar
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.48)", lineHeight: 1.4 }}>
              Add to your home screen for fast, offline access
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            <button
              onClick={install}
              disabled={installing}
              style={{
                padding: "7px 14px",
                background: "linear-gradient(135deg,#D4AF37,#a07828)",
                border: "none",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
                cursor: installing ? "default" : "pointer",
                opacity: installing ? 0.7 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {installing ? "Installing…" : "Install"}
            </button>
            <button
              onClick={dismiss}
              style={{
                padding: "5px 14px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                fontSize: 11,
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Not now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
