interface GlassPanelProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  gold?: boolean;
}

export function GlassPanel({ children, style, onClick, gold }: GlassPanelProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        background: gold
          ? "linear-gradient(135deg, rgba(212,168,67,0.1) 0%, rgba(212,168,67,0.04) 100%)"
          : "rgba(255,255,255,0.04)",
        border: gold
          ? "1px solid rgba(212,168,67,0.26)"
          : "1px solid rgba(255,255,255,0.06)",
        borderRadius: 18,
        padding: "18px",
        cursor: onClick ? "pointer" : undefined,
        transition: onClick ? "background 0.15s, border-color 0.15s" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
