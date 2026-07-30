export default function PageSkeleton() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--background, #080e1a)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      {/* Logo glow ring */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "linear-gradient(135deg, #1a2540, #2a3a60)",
          border: "1px solid rgba(212,168,67,0.25)",
          boxShadow: "0 0 32px rgba(212,168,67,0.12), inset 0 1px 0 rgba(212,168,67,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          animation: "pageSkelPulse 2s ease-in-out infinite",
        }}
      >
        ✡
      </div>

      {/* Spinning arc */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "2.5px solid rgba(212,168,67,0.12)",
          borderTopColor: "rgba(212,168,67,0.7)",
          animation: "pageSkelSpin 0.8s linear infinite",
        }}
      />

      <style>{`
        @keyframes pageSkelSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes pageSkelPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(212,168,67,0.08), inset 0 1px 0 rgba(212,168,67,0.1); }
          50%       { box-shadow: 0 0 40px rgba(212,168,67,0.22), inset 0 1px 0 rgba(212,168,67,0.15); }
        }
      `}</style>
    </div>
  );
}
