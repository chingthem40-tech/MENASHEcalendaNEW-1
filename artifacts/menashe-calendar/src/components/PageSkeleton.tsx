export default function PageSkeleton() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg-primary, #0F1829)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid rgba(212,175,55,0.15)",
          borderTopColor: "#D4AF37",
          borderRadius: "50%",
          animation: "page-spin 0.7s linear infinite",
        }}
      />
      <style>{`
        @keyframes page-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
