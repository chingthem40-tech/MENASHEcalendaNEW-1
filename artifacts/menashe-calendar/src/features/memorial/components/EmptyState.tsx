interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = "🕊", title, subtitle, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 16px",
        gap: 8,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 4, opacity: 0.6 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
          {subtitle}
        </div>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
