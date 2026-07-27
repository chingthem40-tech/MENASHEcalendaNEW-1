import { useState } from "react";
import { LOCATIONS, Location } from "../lib/locations";

interface Props {
  current: Location;
  onSelect: (loc: Location) => void;
  onClose: () => void;
}

export default function LocationModal({ current, onSelect, onClose }: Props) {
  const [geoState, setGeoState] = useState<"idle" | "loading" | "error">("idle");
  const [geoError, setGeoError] = useState("");

  const byCountry: Record<string, Location[]> = {};
  for (const loc of LOCATIONS) {
    if (!byCountry[loc.country]) byCountry[loc.country] = [];
    byCountry[loc.country].push(loc);
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      setGeoState("error");
      return;
    }
    setGeoState("loading");
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let name = "My Location";
        let country = "Custom";
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            name = addr.city || addr.town || addr.village || addr.county || addr.state || "My Location";
            country = addr.country || "Custom";
          }
        } catch {
        }
        const detectedLoc: Location = { name, country, lat, lng, tz, candleLightingMinutes: 18 };
        setGeoState("idle");
        onSelect(detectedLoc);
      },
      (err) => {
        setGeoState("error");
        if (err.code === 1) {
          setGeoError("Location access denied. Please allow location permission and try again.");
        } else if (err.code === 2) {
          setGeoError("Location unavailable. Try selecting a city manually.");
        } else {
          setGeoError("Could not determine your location. Try selecting a city manually.");
        }
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "82vh", overflowY: "auto" }}>
        <div className="modal-handle" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>Choose Location</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Used for Zmanim calculations</div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Auto-detect button */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={detectLocation}
            disabled={geoState === "loading"}
            style={{
              width: "100%",
              padding: "13px 16px",
              borderRadius: 12,
              border: "1px solid rgba(212,168,67,0.35)",
              background: geoState === "loading" ? "rgba(212,168,67,0.06)" : "rgba(212,168,67,0.1)",
              cursor: geoState === "loading" ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              transition: "background 0.2s",
            }}
          >
            <span style={{ fontSize: 20 }}>{geoState === "loading" ? "⏳" : "🎯"}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#d4a843" }}>
                {geoState === "loading" ? "Detecting your location…" : "Use My Current Location"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {geoState === "loading"
                  ? "Please allow location access if prompted"
                  : "Auto-detect via GPS for precise Zmanim"}
              </div>
            </div>
            {current.name === "My Location" && geoState !== "loading" && (
              <span style={{ marginLeft: "auto", color: "#d4a843", fontSize: 16 }}>✓</span>
            )}
          </button>
          {geoState === "error" && (
            <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.2)", fontSize: 12, color: "#e07070" }}>
              {geoError}
            </div>
          )}
        </div>

        <div className="section-header" style={{ marginBottom: 8 }}>OR SELECT A CITY</div>

        {Object.entries(byCountry).map(([country, locs]) => (
          <div key={country} style={{ marginBottom: 12 }}>
            <div className="section-header">{country.toUpperCase()}</div>
            <div className="card" style={{ overflow: "hidden" }}>
              {locs.map((loc, i) => (
                <div
                  key={loc.name}
                  onClick={() => onSelect(loc)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "13px 16px",
                    borderBottom: i < locs.length - 1 ? "1px solid var(--border)" : "none",
                    cursor: "pointer",
                    background: current.name === loc.name ? "rgba(212,168,67,0.08)" : "transparent",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16 }}>📍</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{loc.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{loc.tz}</div>
                    </div>
                  </div>
                  {current.name === loc.name && (
                    <span style={{ color: "#d4a843", fontSize: 16 }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
