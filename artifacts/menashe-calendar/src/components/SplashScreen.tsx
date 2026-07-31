import { useEffect, useState } from "react";

interface SplashScreenProps {
  onFinished: () => void;
}

export default function SplashScreen({ onFinished }: SplashScreenProps) {
  const [phase, setPhase] = useState<"visible" | "fading" | "done">("visible");

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase("fading"), 2400);
    const doneTimer = setTimeout(() => {
      setPhase("done");
      onFinished();
    }, 3100);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinished]);

  if (phase === "done") return null;

  return (
    <div
      role="status"
      aria-label="Loading Bnei Menashe Calendar"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        background: "#060a12",
        transition: "opacity 0.7s ease",
        opacity: phase === "fading" ? 0 : 1,
        pointerEvents: phase === "fading" ? "none" : "all",
        overflow: "hidden",
      }}
    >
      {/* Full-screen splash image */}
      <img
        src="/splash.png"
        alt="Bnei Menashe — The Lost Tribe of Menashe"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top center",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />

      {/* Subtle bottom vignette so loading dots sit on dark */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 140,
          background:
            "linear-gradient(to bottom, transparent, rgba(6,10,18,0.85) 60%, rgba(6,10,18,0.97) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Animated loading dots — decorative, hidden from AT */}
      <div
        aria-hidden="true"
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 44,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#D4AF37",
              animation: `splashDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splashDot {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.7); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
