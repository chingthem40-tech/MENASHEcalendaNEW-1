import { useOnlineStatus } from "../hooks/useOnlineStatus";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: "#1a1a1a",
      borderBottom: "1px solid rgba(212,168,67,0.35)",
      padding: "7px 16px",
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12,
      fontWeight: 600,
      color: "#d4a843",
      fontFamily: "inherit",
    }}>
      <span style={{ fontSize: 14 }}>📵</span>
      <span>You&rsquo;re offline &mdash; Calendar, Zmanim &amp; Siddur still work.</span>
    </div>
  );
}
