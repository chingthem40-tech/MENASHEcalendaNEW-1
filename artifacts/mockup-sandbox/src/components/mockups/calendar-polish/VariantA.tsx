export function VariantA() {
  return (
    <div style={{ minHeight: "100vh", background: "#060c18", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Serif+Hebrew:wght@700&display=swap');
        @keyframes goldShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes softPulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .va-glow { animation: softPulse 4s ease infinite; }
        .va-fade1 { animation: fadeUp .5s ease both .1s; }
        .va-fade2 { animation: fadeUp .5s ease both .2s; }
        .va-fade3 { animation: fadeUp .5s ease both .3s; }
        .va-fade4 { animation: fadeUp .5s ease both .4s; }
        .va-btn:hover { transform: scale(1.03); }
        .va-card:hover { border-color: rgba(212,175,55,0.35) !important; transform: translateY(-2px); }
      `}</style>

      <div style={{ width: 390, borderRadius: 40, overflow: "hidden", background: "#08111f", boxShadow: "0 40px 120px rgba(0,0,0,0.9), 0 0 0 1px rgba(212,175,55,0.15)", position: "relative" }}>

        {/* Status bar */}
        <div style={{ height: 44, background: "#08111f", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderBottom: "1px solid rgba(212,175,55,0.06)" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#D4AF37" }}>9:41</span>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <div style={{ width: 16, height: 8, border: "1.5px solid #D4AF37", borderRadius: 2, opacity: 0.7, position: "relative" }}>
              <div style={{ position: "absolute", top: 1.5, left: 1.5, right: 3.5, bottom: 1.5, background: "#D4AF37", borderRadius: 1 }} />
              <div style={{ position: "absolute", top: 2, right: -4, width: 3, height: 4, background: "#D4AF37", borderRadius: "0 1px 1px 0", opacity: 0.6 }} />
            </div>
          </div>
        </div>

        {/* Top bar */}
        <div style={{ padding: "12px 20px 12px", background: "#08111f", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #D4AF37, #b8860b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 4px 12px rgba(212,175,55,0.4)" }}>✡</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#D4AF37", letterSpacing: "0.1em" }}>BNEI MENASHE</div>
              <div style={{ fontSize: 9, color: "rgba(212,175,55,0.5)", letterSpacing: "0.15em" }}>SACRED CALENDAR</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔔</div>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📍</div>
          </div>
        </div>

        {/* Hero Hebrew Date Card */}
        <div className="va-fade1" style={{ margin: "0 16px 14px", borderRadius: 24, overflow: "hidden", position: "relative", background: "linear-gradient(145deg, #0f1f3d 0%, #0a1628 60%, #081120 100%)", border: "1px solid rgba(212,175,55,0.2)" }}>
          {/* Gold ambient glow */}
          <div className="va-glow" style={{ position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)", width: 280, height: 200, background: "radial-gradient(ellipse, rgba(212,175,55,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ padding: "22px 22px 18px", position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(212,175,55,0.6)", letterSpacing: "0.18em", marginBottom: 8, textTransform: "uppercase" }}>Today</div>
                <div style={{ fontFamily: "'Noto Serif Hebrew', serif", fontSize: 28, color: "#D4AF37", direction: "rtl", fontWeight: 700, lineHeight: 1.1, textShadow: "0 0 30px rgba(212,175,55,0.4)", marginBottom: 6 }}>
                  כ׳ סִיוָן תשפ״ה
                </div>
                <div style={{ fontSize: 14, color: "#8fa8c8", fontWeight: 500 }}>June 17, 2025 · Tuesday</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.06))", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#D4AF37", lineHeight: 1 }}>17</div>
                  <div style={{ fontSize: 9, color: "rgba(212,175,55,0.6)", letterSpacing: "0.1em" }}>JUN</div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)", margin: "14px 0" }} />

            {/* Status pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { icon: "🕯", label: "Candle-lighting 7:43 PM", color: "rgba(255,180,50,0.15)", border: "rgba(255,180,50,0.3)", text: "#FFB432" },
                { icon: "✡", label: "Shabbat Approaching", color: "rgba(212,175,55,0.1)", border: "rgba(212,175,55,0.25)", text: "#D4AF37" },
              ].map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, background: p.color, border: `1px solid ${p.border}`, borderRadius: 99, padding: "5px 10px" }}>
                  <span style={{ fontSize: 11 }}>{p.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: p.text }}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Zmanim Quick Row */}
        <div className="va-fade2" style={{ margin: "0 16px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "Sunrise", time: "5:32", icon: "🌅" },
            { label: "Next Zman", time: "8:44", icon: "⏱" },
            { label: "Sunset", time: "19:43", icon: "🌇" },
          ].map((z, i) => (
            <div key={i} style={{ background: "#0d1a2e", border: "1px solid rgba(212,175,55,0.1)", borderRadius: 16, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{z.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#F5F0E8", lineHeight: 1 }}>{z.time}</div>
              <div style={{ fontSize: 9, color: "#6b7fa0", marginTop: 3, fontWeight: 500, letterSpacing: "0.05em" }}>{z.label}</div>
            </div>
          ))}
        </div>

        {/* Today's Parasha Card */}
        <div className="va-fade3 va-card" style={{ margin: "0 16px 14px", borderRadius: 20, background: "linear-gradient(135deg, #12224a 0%, #0c1832 100%)", border: "1px solid rgba(100,140,255,0.2)", padding: "16px 18px", transition: "all 0.2s", cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(100,140,255,0.15)", border: "1px solid rgba(100,140,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📜</div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(100,140,255,0.8)", letterSpacing: "0.12em" }}>WEEKLY PARASHA</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#F5F0E8" }}>Korach</div>
              </div>
            </div>
            <div style={{ fontSize: 18, color: "rgba(100,140,255,0.5)" }}>›</div>
          </div>
          <div style={{ fontSize: 12, color: "#8fa8c8", lineHeight: 1.5, borderTop: "1px solid rgba(100,140,255,0.1)", paddingTop: 10 }}>
            Numbers 16:1–18:32 · Korah's rebellion and the primacy of Aharon's priesthood
          </div>
        </div>

        {/* Quick Actions */}
        <div className="va-fade4" style={{ margin: "0 16px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(212,175,55,0.5)", letterSpacing: "0.15em", marginBottom: 10, textTransform: "uppercase" }}>Quick Access</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {[
              { icon: "📅", label: "Calendar" },
              { icon: "⏰", label: "Zmanim" },
              { icon: "📖", label: "Siddur" },
              { icon: "⭐", label: "Premium" },
            ].map((a, i) => (
              <div key={i} style={{ background: "#0d1a2e", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 14, padding: "12px 8px", textAlign: "center", cursor: "pointer" }}>
                <div style={{ fontSize: 22, marginBottom: 5 }}>{a.icon}</div>
                <div style={{ fontSize: 9, color: "#8fa8c8", fontWeight: 600 }}>{a.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Torah Quote */}
        <div style={{ margin: "0 16px 16px", borderRadius: 20, background: "linear-gradient(135deg, #1a1008 0%, #120c04 100%)", border: "1px solid rgba(212,175,55,0.15)", padding: "16px 18px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(212,175,55,0.6)", letterSpacing: "0.15em", marginBottom: 8 }}>DAILY TORAH THOUGHT</div>
          <div style={{ fontSize: 13, color: "#c8b890", lineHeight: 1.6, fontStyle: "italic" }}>
            "A person is obligated to say: The world was created for my sake."
          </div>
          <div style={{ fontSize: 10, color: "rgba(212,175,55,0.45)", marginTop: 6 }}>— Sanhedrin 37a</div>
        </div>

        {/* Bottom Navigation */}
        <div style={{ background: "#08111f", borderTop: "1px solid rgba(212,175,55,0.1)", padding: "10px 0 20px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)" }}>
          {[
            { icon: "🏠", label: "Home", active: true },
            { icon: "📅", label: "Calendar", active: false },
            { icon: "⏰", label: "Zmanim", active: false },
            { icon: "📖", label: "Siddur", active: false },
            { icon: "⚙️", label: "Settings", active: false },
          ].map((n, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 0", position: "relative" }}>
              {n.active && <div style={{ position: "absolute", top: 0, width: 30, height: 2, background: "linear-gradient(90deg, transparent, #D4AF37, transparent)", borderRadius: 99 }} />}
              <span style={{ fontSize: 20 }}>{n.icon}</span>
              <span style={{ fontSize: 9, fontWeight: n.active ? 700 : 500, color: n.active ? "#D4AF37" : "#4a5568", letterSpacing: "0.05em" }}>{n.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
