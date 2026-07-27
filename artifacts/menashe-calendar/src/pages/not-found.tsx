import { useLanguage } from "../context/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div style={{
      minHeight: "100vh", width: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg-primary)", color: "var(--text-primary)",
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{t.notFoundTitle}</h1>
      <a
        href="/"
        style={{ color: "var(--gold)", fontSize: 15, textDecoration: "none", fontWeight: 600 }}
      >
        {t.notFoundHome}
      </a>
    </div>
  );
}
