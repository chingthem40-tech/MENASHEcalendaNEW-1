interface Props { onClose: () => void; }

const INFO = [
  { term: "Netz HaChama", hebrew: "נֵץ הַחַמָּה", def: "Sunrise — the preferred time to pray Shacharit (morning prayers)." },
  { term: "Sof Zman Shema", hebrew: "סוֹף זְמַן שְׁמַע", def: "Latest time to recite the Shema. Per Magen Avraham: 3 halachic hours after sunrise." },
  { term: "Mincha Gedolah", hebrew: "מִנְחָה גְּדוֹלָה", def: "Earliest time for Mincha (afternoon prayers). Half a halachic hour after midday." },
  { term: "Mincha Ketana", hebrew: "מִנְחָה קְטַנָּה", def: "Preferred time for Mincha. 9.5 halachic hours after sunrise." },
  { term: "Plag HaMincha", hebrew: "פְּלַג הַמִּנְחָה", def: "1.25 halachic hours before nightfall. Earliest time to accept Shabbat and daven Ma'ariv." },
  { term: "Shkia", hebrew: "שְׁקִיעָה", def: "Sunset — Shabbat and holidays begin at this point (or 18–40 min before, depending on custom)." },
  { term: "Tzais HaKochavim", hebrew: "צֵאת הַכּוֹכָבִים", def: "Nightfall — when three medium stars are visible. Shabbat and holidays end." },
  { term: "Shaah Zmanit", hebrew: "שָׁעָה זְמַנִּית", def: "A halachic (proportional) hour — 1/12 of the daytime from sunrise to sunset." },
];

export default function ZmanimInfoModal({ onClose }: Props) {
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={e => e.stopPropagation()} style={{ maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>About Zmanim</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Halachic time glossary</div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {INFO.map((item, i) => (
            <div key={i} className="card" style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{item.term}</div>
                <div style={{ fontFamily: "'Noto Serif Hebrew', serif", fontSize: 14, color: "#d4a843", direction: "rtl" }}>{item.hebrew}</div>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{item.def}</div>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="btn-close-full" style={{ marginTop: 16 }}>Close</button>
      </div>
    </div>
  );
}
