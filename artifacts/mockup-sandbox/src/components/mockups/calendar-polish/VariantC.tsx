export function VariantC() {
  return (
    <div style={{ minHeight: "100vh", background: "#050810", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Serif+Hebrew:wght@700&display=swap');
        @keyframes aurora { 0%,100% { opacity:0.5; transform:scale(1); } 50% { opacity:1; transform:scale(1.08); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .vc-aurora { animation: aurora 6s ease infinite; }
        .vc-fade1 { animation: fadeUp .5s ease both .1s; }
        .vc-fade2 { animation: fadeUp .5s ease both .2s; }
        .vc-fade3 { animation: fadeUp .5s ease both .3s; }
        .vc-fade4 { animation: fadeUp .5s ease both .4s; }
        .vc-card:hover { border-color: rgba(99,130,255,0.4) !important; transform: translateY(-2px); }
      `}</style>

      <div style={{ width: 390, borderRadius: 40, overflow: "hidden", background: "#070d1e", boxShadow: "0 40px 120px rgba(0,0,0,0.95), 0 0 0 1px rgba(99,130,255,0.15), 0 0 80px rgba(99,130,255,0.05)", position: "relative" }}>

        {/* Aurora background blobs */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div className="vc-aurora" style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 350, height: 350, background: "radial-gradient(ellipse, rgba(60,90,220,0.12) 0%, transparent 70%)", borderRadius: "50%" }} />
          <div className="vc-aurora" style={{ position: "absolute", top: 100, right: -80, width: 280, height: 280, background: "radial-gradient(ellipse, rgba(212,175,55,0.07) 0%, transparent 70%)", borderRadius: "50%", animationDelay: "2s" }} />
        </div>

        {/* Status bar */}
        <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "relative", zIndex: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#6382FF" }}>9:41</span>
          <div style={{ width: 16, height: 8, border: "1.5px solid #6382FF", borderRadius: 2, opacity: 0.6, position: "relative" }}>
            <div style={{ position: "absolute", top: 1.5, left: 1.5, right: 3.5, bottom: 1.5, background: "#6382FF", borderRadius: 1 }} />
          </div>
        </div>

        {/* Top bar */}
        <div style={{ padding: "8px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg, #4060E0, #2040C0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, boxShadow: "0 4px 14px rgba(64,96,224,0.5), 0 0 0 1px rgba(99,130,255,0.3)" }}>✡</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#8aaeff", letterSpacing: "0.1em" }}>BNEI MENASHE</div>
              <div style={{ fontSize: 9, color: "rgba(99,130,255,0.45)", letterSpacing: "0.15em" }}>SACRED CALENDAR</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(99,130,255,0.1)", border: "1px solid rgba(99,130,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔔</div>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(99,130,255,0.1)", border: "1px solid rgba(99,130,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📍</div>
          </div>
        </div>

        {/* Hero Date Card — deep sapphire glass */}
        <div className="vc-fade1" style={{ margin: "0 16px 14px", borderRadius: 24, overflow: "hidden", position: "relative", background: "linear-gradient(145deg, rgba(30,50,140,0.6) 0%, rgba(10,20,70,0.8) 100%)", border: "1px solid rgba(99,130,255,0.25)", backdropFilter: "blur(20px)", zIndex: 2 }}>
          {/* Shimmer top edge */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(99,130,255,0.8), rgba(212,175,55,0.5), rgba(99,130,255,0.8), transparent)" }} />

          <div style={{ padding: "22px 22px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(99,130,255,0.7)", letterSpacing: "0.18em", marginBottom: 8, textTransform: "uppercase" }}>Today</div>
                <div style={{ fontFamily: "'Noto Serif Hebrew', serif", fontSize: 28, color: "#D4AF37", direction: "rtl", fontWeight: 700, lineHeight: 1.1, marginBottom: 6, textShadow: "0 0 30px rgba(212,175,55,0.5)" }}>
                  כ׳ סִיוָן תשפ״ה
                </div>
                <div style={{ fontSize: 14, color: "rgba(180,200,255,0.7)", fontWeight: 500 }}>June 17, 2025 · Tuesday</div>
              </div>
              <div>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, rgba(99,130,255,0.2), rgba(40,70,200,0.15))", border: "1px solid rgba(99,130,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#8aaeff", lineHeight: 1 }}>17</div>
                  <div style={{ fontSize: 9, color: "rgba(99,130,255,0.5)", letterSpacing: "0.1em" }}>JUN</div>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(99,130,255,0.3), rgba(212,175,55,0.2), rgba(99,130,255,0.3), transparent)", margin: "14px 0" }} />

            <div style={{ display: "flex", gap: 8 }}>
              {[
                { icon: "🕯", label: "Candle-lighting 7:43 PM", color: "rgba(255,180,50,0.12)", border: "rgba(255,180,50,0.3)", text: "#FFB432" },
                { icon: "✡", label: "Shabbat Eve", color: "rgba(99,130,255,0.1)", border: "rgba(99,130,255,0.3)", text: "#8aaeff" },
              ].map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, background: p.color, border: `1px solid ${p.border}`, borderRadius: 99, padding: "5px 10px" }}>
                  <span style={{ fontSize: 11 }}>{p.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: p.text }}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Zmanim Row */}
        <div className="vc-fade2" style={{ margin: "0 16px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, position: "relative", zIndex: 2 }}>
          {[
            { label: "Sunrise", time: "5:32", icon: "🌅", grad: "rgba(255,180,50,0.12)", border: "rgba(255,180,50,0.2)" },
            { label: "Next Zman", time: "8:44", icon: "⏱", grad: "rgba(99,130,255,0.12)", border: "rgba(99,130,255,0.2)" },
            { label: "Sunset", time: "19:43", icon: "🌇", grad: "rgba(212,175,55,0.1)", border: "rgba(212,175,55,0.2)" },
          ].map((z, i) => (
            <div key={i} style={{ background: `linear-gradient(135deg, ${z.grad}, rgba(7,13,30,0.6))`, border: `1px solid ${z.border}`, borderRadius: 16, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{z.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#e8f0ff", lineHeight: 1 }}>{z.time}</div>
              <div style={{ fontSize: 9, color: "#5070a8", marginTop: 3, fontWeight: 500, letterSpacing: "0.05em" }}>{z.label}</div>
            </div>
          ))}
        </div>

        {/* Parasha Card */}
        <div className="vc-fade3 vc-card" style={{ margin: "0 16px 14px", borderRadius: 20, background: "linear-gradient(135deg, rgba(30,50,140,0.4), rgba(10,20,70,0.6))", border: "1px solid rgba(99,130,255,0.2)", padding: "16px 18px", transition: "all 0.2s", cursor: "pointer", position: "relative", zIndex: 2, backdropFilter: "blur(12px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #4060E0, #2040C0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 4px 12px rgba(64,96,224,0.4)" }}>📜</div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(99,130,255,0.7)", letterSpacing: "0.12em" }}>WEEKLY PARASHA</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#e8f0ff" }}>Korach</div>
              </div>
            </div>
            <div style={{ fontSize: 18, color: "rgba(99,130,255,0.5)" }}>›</div>
          </div>
          <div style={{ fontSize: 12, color: "#5070a8", lineHeight: 1.5, borderTop: "1px solid rgba(99,130,255,0.1)", paddingTop: 10 }}>
            Numbers 16:1–18:32 · Korah's rebellion and the primacy of Aharon's priesthood
          </div>
        </div>

        {/* Quick Actions */}
        <div className="vc-fade4" style={{ margin: "0 16px 14px", position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(99,130,255,0.5)", letterSpacing: "0.15em", marginBottom: 10, textTransform: "uppercase" }}>Quick Access</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {[
              { icon: "📅", label: "Calendar", color: "rgba(99,130,255,0.12)", border: "rgba(99,130,255,0.2)" },
              { icon: "⏰", label: "Zmanim", color: "rgba(99,130,255,0.12)", border: "rgba(99,130,255,0.2)" },
              { icon: "📖", label: "Siddur", color: "rgba(99,130,255,0.12)", border: "rgba(99,130,255,0.2)" },
              { icon: "⭐", label: "Premium", color: "rgba(212,175,55,0.12)", border: "rgba(212,175,55,0.25)" },
            ].map((a, i) => (
              <div key={i} style={{ background: a.color, border: `1px solid ${a.border}`, borderRadius: 14, padding: "12px 8px", textAlign: "center", cursor: "pointer" }}>
                <div style={{ fontSize: 22, marginBottom: 5 }}>{a.icon}</div>
                <div style={{ fontSize: 9, color: "#5070a8", fontWeight: 600 }}>{a.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Torah Quote */}
        <div style={{ margin: "0 16px 16px", borderRadius: 20, background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(180,140,20,0.05))", border: "1px solid rgba(212,175,55,0.15)", padding: "16px 18px", position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(212,175,55,0.6)", letterSpacing: "0.15em", marginBottom: 8 }}>DAILY TORAH THOUGHT</div>
          <div style={{ fontSize: 13, color: "#c8b890", lineHeight: 1.6, fontStyle: "italic" }}>
            "A person is obligated to say: The world was created for my sake."
          </div>
          <div style={{ fontSize: 10, color: "rgba(212,175,55,0.4)", marginTop: 6 }}>— Sanhedrin 37a</div>
        </div>

        {/* Bottom Nav — glass */}
        <div style={{ background: "rgba(7,13,30,0.95)", borderTop: "1px solid rgba(99,130,255,0.12)", backdropFilter: "blur(20px)", padding: "10px 0 20px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", position: "relative", zIndex: 2 }}>
          {[
            { icon: "🏠", label: "Home", active: true },
            { icon: "📅", label: "Calendar", active: false },
            { icon: "⏰", label: "Zmanim", active: false },
            { icon: "📖", label: "Siddur", active: false },
            { icon: "⚙️", label: "Settings", active: false },
          ].map((n, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 0", position: "relative" }}>
              {n.active && <div style={{ position: "absolute", top: 0, width: 30, height: 2, background: "linear-gradient(90deg, transparent, #6382FF, transparent)", borderRadius: 99, boxShadow: "0 0 8px rgba(99,130,255,0.8)" }} />}
              <span style={{ fontSize: 20 }}>{n.icon}</span>
              <span style={{ fontSize: 9, fontWeight: n.active ? 700 : 500, color: n.active ? "#6382FF" : "#2a3a58", letterSpacing: "0.05em" }}>{n.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
