import { useState, useEffect, useRef } from "react";
import { haversineDistKm, getBearingToJerusalem } from "../pages/home/utils/geoUtils";
import { useLanguage } from "../context/LanguageContext";
import type { Location } from "../lib/locations";

interface Props {
  location: Location;
  onClose: () => void;
}

interface Synagogue {
  id: number;
  name: string;
  lat: number;
  lng: number;
  distKm: number;
}

export default function LocationMapModal({ location, onClose }: Props) {
  const { t } = useLanguage();

  const [synMap, setSynMap] = useState({ lat: location.lat, lng: location.lng });
  const [synSelected, setSynSelected] = useState<Synagogue | null>(null);
  const [synagogues, setSynagogues] = useState<Synagogue[]>([]);
  const [synLoading, setSynLoading] = useState(false);
  const [synError, setSynError] = useState(false);
  const synFetchedRef = useRef("");

  useEffect(() => {
    const key = `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`;
    if (synFetchedRef.current === key) return;
    synFetchedRef.current = key;
    setSynLoading(true);
    setSynError(false);
    setSynagogues([]);
    setSynSelected(null);
    setSynMap({ lat: location.lat, lng: location.lng });

    const query = `[out:json][timeout:15];(node["amenity"="place_of_worship"]["religion"="jewish"](around:10000,${location.lat},${location.lng});way["amenity"="place_of_worship"]["religion"="jewish"](around:10000,${location.lat},${location.lng}););out center 12;`;
    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        const results: Synagogue[] = (data.elements ?? [])
          .map((el: any) => ({
            id: el.id,
            name: el.tags?.name || el.tags?.["name:en"] || "Synagogue",
            lat: el.lat ?? el.center?.lat,
            lng: el.lon ?? el.center?.lon,
            distKm: haversineDistKm(location.lat, location.lng, el.lat ?? el.center?.lat, el.lon ?? el.center?.lon),
          }))
          .filter((s: Synagogue) => s.lat && s.lng)
          .sort((a: Synagogue, b: Synagogue) => a.distKm - b.distKm)
          .slice(0, 8);
        setSynagogues(results);
        setSynLoading(false);
      })
      .catch(() => {
        setSynError(true);
        setSynLoading(false);
      });
  }, [location.lat, location.lng]);

  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${synMap.lng - 0.06},${synMap.lat - 0.06},${synMap.lng + 0.06},${synMap.lat + 0.06}&layer=mapnik&marker=${synMap.lat},${synMap.lng}`;
  const bearingToJerusalem = getBearingToJerusalem(location.lat, location.lng);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%", maxWidth: 480, maxHeight: "90dvh",
          background: "linear-gradient(160deg,#0e1020 0%,#0a0e1a 50%,#10090a 100%)",
          border: "1px solid rgba(212,168,67,0.3)",
          borderRadius: "20px 20px 0 0",
          overflow: "hidden", display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 14px",
          borderBottom: "1px solid rgba(212,168,67,0.12)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🗺️</span>
            <span style={{
              fontSize: 11, fontWeight: 800, letterSpacing: "0.14em",
              color: "rgba(212,168,67,0.8)", textTransform: "uppercase",
            }}>
              {t.fabLocationMap}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, padding: "4px 10px", cursor: "pointer",
              fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", padding: "14px 16px 24px", flex: 1 }}>

          {/* Location name */}
          <div style={{
            marginBottom: 12, padding: "10px 14px", borderRadius: 12,
            background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.16)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>📍</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#d4a843" }}>
              {location.name}
            </span>
          </div>

          {/* Map iframe */}
          <div style={{
            borderRadius: 13, overflow: "hidden",
            border: `1px solid ${synSelected ? "rgba(212,168,67,0.35)" : "rgba(212,168,67,0.2)"}`,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)", position: "relative",
            transition: "border-color 0.2s", marginBottom: 12,
          }}>
            <iframe
              key={mapSrc}
              title={synSelected ? synSelected.name : `Map of ${location.name}`}
              src={mapSrc}
              style={{
                width: "100%", height: 200, border: "none", display: "block",
                filter: "brightness(0.88) saturate(0.85) hue-rotate(185deg)",
              }}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(10,14,28,0.15)", pointerEvents: "none", borderRadius: 13,
            }} />

            {/* Jerusalem Compass */}
            <div style={{
              position: "absolute", top: 8, left: 8,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              pointerEvents: "none",
            }}>
              <div style={{
                width: 50, height: 50,
                background: "rgba(8,11,24,0.88)", border: "1.5px solid rgba(212,168,67,0.55)",
                borderRadius: "50%", backdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
                boxShadow: "0 2px 14px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,168,67,0.1)",
              }}>
                <svg width="50" height="50" style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}>
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                    const rad = ((angle - 90) * Math.PI) / 180;
                    const major = angle % 90 === 0;
                    const r1 = major ? 19 : 20, r2 = 23;
                    return (
                      <line key={angle}
                        x1={25 + r1 * Math.cos(rad)} y1={25 + r1 * Math.sin(rad)}
                        x2={25 + r2 * Math.cos(rad)} y2={25 + r2 * Math.sin(rad)}
                        stroke={major ? "rgba(212,168,67,0.55)" : "rgba(212,168,67,0.2)"}
                        strokeWidth={major ? 1.5 : 0.8}
                      />
                    );
                  })}
                </svg>
                <div style={{
                  width: "100%", height: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transform: `rotate(${bearingToJerusalem}deg)`, position: "absolute",
                }}>
                  <svg width="34" height="34" viewBox="0 0 34 34">
                    <polygon points="17,3 20.5,17 17,15 13.5,17" fill="#f0c050" />
                    <polygon points="17,31 20.5,17 17,19 13.5,17" fill="rgba(255,255,255,0.18)" />
                    <circle cx="17" cy="17" r="2.5" fill="#d4a843" stroke="rgba(10,14,28,0.8)" strokeWidth="1" />
                  </svg>
                </div>
                <span style={{ position: "absolute", fontSize: 7, color: "rgba(212,168,67,0.25)", userSelect: "none" }}>✡</span>
              </div>
              <div style={{
                background: "rgba(8,11,24,0.88)", border: "1px solid rgba(212,168,67,0.35)",
                borderRadius: 5, padding: "2px 7px", backdropFilter: "blur(6px)",
              }}>
                <span style={{ fontSize: 8, color: "#d4a843", fontWeight: 800, letterSpacing: "0.1em" }}>
                  {t.compassJerusalem.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Pin label */}
            <div style={{
              position: "absolute", bottom: 8, left: 8,
              background: "rgba(10,14,28,0.85)", border: "1px solid rgba(212,168,67,0.3)",
              borderRadius: 8, padding: "4px 9px",
              display: "flex", alignItems: "center", gap: 5, backdropFilter: "blur(6px)",
            }}>
              <span style={{ fontSize: 10 }}>{synSelected ? "🕍" : "📍"}</span>
              <span style={{
                fontSize: 10, color: "#d4a843", fontWeight: 700,
                maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {synSelected ? synSelected.name : location.name}
              </span>
            </div>

            {/* Synagogue distance badge */}
            {synSelected && (
              <div style={{
                position: "absolute", top: 8, right: 8,
                background: "rgba(212,168,67,0.18)", border: "1px solid rgba(212,168,67,0.4)",
                borderRadius: 8, padding: "3px 8px",
                fontSize: 9, color: "#f0c050", fontWeight: 800, letterSpacing: "0.08em",
                backdropFilter: "blur(6px)",
              }}>
                {synSelected.distKm < 1 ? `${Math.round(synSelected.distKm * 1000)}m away` : `${synSelected.distKm.toFixed(1)} km away`}
              </div>
            )}

            {/* Reset to my location */}
            {synSelected && (
              <button
                onClick={() => { setSynSelected(null); setSynMap({ lat: location.lat, lng: location.lng }); }}
                style={{
                  position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
                  background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.25)",
                  borderRadius: 6, padding: "3px 8px", color: "#d4a843",
                  fontSize: 9, fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em",
                  backdropFilter: "blur(6px)",
                }}
              >
                ← MY LOCATION
              </button>
            )}
          </div>

          {/* Nearby Synagogues */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 11 }}>🕍</span>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(212,168,67,0.6)" }}>
                NEARBY SYNAGOGUES
              </span>
              {!synLoading && synagogues.length > 0 && (
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 600, marginLeft: 2 }}>
                  within 10 km
                </span>
              )}
            </div>

            {synLoading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "16px 0" }}>
                <div style={{
                  width: 16, height: 16, border: "2px solid rgba(212,168,67,0.2)",
                  borderTop: "2px solid #d4a843", borderRadius: "50%",
                  animation: "locmap-spin 0.8s linear infinite",
                }} />
                <style>{`@keyframes locmap-spin { to { transform: rotate(360deg); } }`}</style>
                <span style={{ fontSize: 11, color: "rgba(212,168,67,0.5)" }}>Searching nearby…</span>
              </div>
            )}

            {synError && (
              <div style={{
                padding: "10px 12px", borderRadius: 10,
                background: "rgba(255,100,100,0.06)", border: "1px solid rgba(255,100,100,0.15)",
                fontSize: 11, color: "rgba(255,150,150,0.7)", textAlign: "center",
              }}>
                Could not load nearby synagogues. Check your connection.
              </div>
            )}

            {!synLoading && !synError && synagogues.length === 0 && synFetchedRef.current && (
              <div style={{
                padding: "10px 12px", borderRadius: 10,
                background: "rgba(212,168,67,0.04)", border: "1px solid rgba(212,168,67,0.1)",
                fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center",
              }}>
                No synagogues found within 10 km of {location.name}.
              </div>
            )}

            {!synLoading && synagogues.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {synagogues.map((syn) => {
                  const isActive = synSelected?.id === syn.id;
                  return (
                    <button
                      key={syn.id}
                      onClick={() => {
                        setSynSelected(isActive ? null : syn);
                        setSynMap(isActive ? { lat: location.lat, lng: location.lng } : { lat: syn.lat, lng: syn.lng });
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 12px", borderRadius: 11,
                        background: isActive ? "rgba(212,168,67,0.13)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isActive ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.07)"}`,
                        cursor: "pointer", textAlign: "left",
                        transition: "background 0.15s, border-color 0.15s", width: "100%",
                      }}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                        background: isActive ? "rgba(212,168,67,0.2)" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${isActive ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.1)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                      }}>🕍</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: 700,
                          color: isActive ? "#f0c050" : "rgba(255,255,255,0.85)",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {syn.name}
                        </div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1, fontWeight: 600 }}>
                          {syn.distKm < 1 ? `${Math.round(syn.distKm * 1000)} m away` : `${syn.distKm.toFixed(1)} km away`}
                        </div>
                      </div>
                      {isActive && (
                        <div style={{
                          fontSize: 9, color: "#d4a843", fontWeight: 800, letterSpacing: "0.08em",
                          background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.25)",
                          borderRadius: 5, padding: "2px 6px", flexShrink: 0,
                        }}>ON MAP</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
