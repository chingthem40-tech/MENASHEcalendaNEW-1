import { useState, useMemo, useEffect, useCallback } from "react";
import {
  type DirectoryMember, type DirectoryRegistration,
  fetchDirectory, registerDirectoryMember,
  fetchAllDirectoryMembers, approveDirectoryMember, hideDirectoryMember, deleteDirectoryMember,
} from "../lib/directoryApi";

interface Props {
  onClose: () => void;
  isAdmin?: boolean;
  userProfile?: { name: string; city: string; country: string; role: string; bio: string } | null;
}

export type Member = DirectoryMember;

const ROLES = ["Member", "Avrekh", "Community Leader", "Rabbi", "Cantor", "Youth Leader", "Women's Group", "Student", "Elder"];
const COUNTRIES = ["India", "Israel", "United States", "United Kingdom", "Australia", "Canada", "Other"];

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  "Rabbi":             { bg: "rgba(212,168,67,0.18)", color: "#d4a843" },
  "Avrekh":            { bg: "rgba(20,184,166,0.16)",  color: "#2dd4bf" },
  "Cantor":            { bg: "rgba(212,168,67,0.12)", color: "#c9a03a" },
  "Community Leader":  { bg: "rgba(139,92,246,0.18)", color: "#a78bfa" },
  "Youth Leader":      { bg: "rgba(59,130,246,0.18)", color: "#60a5fa" },
  "Women's Group":     { bg: "rgba(236,72,153,0.15)", color: "#f472b6" },
  "Student":           { bg: "rgba(74,222,128,0.12)", color: "#4ade80" },
  "Elder":             { bg: "rgba(255,180,50,0.15)", color: "#fbbf24" },
  "Member":            { bg: "rgba(100,116,139,0.15)", color: "#94a3b8" },
};

const FLAG: Record<string, string> = {
  "India": "🇮🇳", "Israel": "🇮🇱", "United States": "🇺🇸",
  "United Kingdom": "🇬🇧", "Australia": "🇦🇺", "Canada": "🇨🇦", "Other": "🌐",
};

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");
}

function avatarBg(name: string): string {
  const colors = ["#1a3050","#2a1a40","#1a2a20","#30200a","#1a1a30","#2a1030","#0f2030","#301020"];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

function MemberAvatar({ member, size = 48, radius = 14 }: { member: Member; size?: number; radius?: number }) {
  const hasPhoto = !!member.profilePhotoUrl;
  const hasEmoji = member.avatarEmoji && member.avatarEmoji !== "👤";
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: hasPhoto || hasEmoji ? "transparent" : avatarBg(member.name),
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)",
    }}>
      {hasPhoto ? (
        <img src={member.profilePhotoUrl!} alt={member.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : hasEmoji ? (
        <span style={{ fontSize: size * 0.5 }}>{member.avatarEmoji}</span>
      ) : (
        <span style={{ fontSize: size * 0.33, fontWeight: 800, color: "rgba(255,255,255,0.85)", fontFamily: "serif" }}>
          {initials(member.name)}
        </span>
      )}
    </div>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  background: "var(--elevated)", border: "1px solid var(--border)",
  color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
  letterSpacing: "0.06em", marginBottom: 5, display: "block",
};

function emptyReg(): Omit<Member, "id" | "status" | "joinedAt"> {
  return { name: "", city: "", country: "India", role: "Member", bio: "", whatsapp: "", phone: "", email: "", otherContact: "", birthday: "", aliyahDate: "" };
}

export default function MemberDirectoryModal({ onClose, isAdmin = false, userProfile }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState<"directory" | "register" | "admin">("directory");
  const [reg, setReg] = useState(() => {
    if (userProfile) {
      return {
        name: userProfile.name,
        city: userProfile.city,
        country: COUNTRIES.includes(userProfile.country) ? userProfile.country : "India",
        role: ROLES.includes(userProfile.role) ? userProfile.role : "Member",
        bio: userProfile.bio,
      };
    }
    return emptyReg();
  });
  const [regSent, setRegSent] = useState(false);
  const [regError, setRegError] = useState("");
  const [regBusy, setRegBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterCountry, setFilterCountry] = useState("All");
  const [adminFilter, setAdminFilter] = useState<"all" | "pending" | "approved" | "hidden">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [connectOpen, setConnectOpen] = useState<string | null>(null);
  const [introMsg, setIntroMsg] = useState("Shalom! I found you in the Bnei Menashe Member Directory and would love to connect. 🕍");

  const loadDirectory = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const list = isAdmin && view === "admin" ? await fetchAllDirectoryMembers() : await fetchDirectory();
      setMembers(list);
    } catch {
      setLoadError("Couldn't load the directory. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, view]);

  useEffect(() => { loadDirectory(); }, [loadDirectory]);

  async function submitReg() {
    if (!reg.name.trim()) { setRegError("Please enter your name."); return; }
    if (!reg.city.trim()) { setRegError("Please enter your city."); return; }
    setRegError("");
    setRegBusy(true);
    try {
      const data: DirectoryRegistration = { ...reg, whatsapp: reg.whatsapp || undefined, phone: reg.phone || undefined, email: reg.email || undefined, otherContact: reg.otherContact || undefined, birthday: reg.birthday || undefined, aliyahDate: reg.aliyahDate || undefined };
      await registerDirectoryMember(data);
      setRegSent(true);
    } catch (err: any) {
      setRegError(err?.message || "Failed to submit — please try again.");
    } finally {
      setRegBusy(false);
    }
  }

  async function approve(id: string) {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, status: "approved" } : m));
    try { await approveDirectoryMember(id); } catch { loadDirectory(); }
  }
  async function hide(id: string) {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, status: "hidden" } : m));
    try { await hideDirectoryMember(id); } catch { loadDirectory(); }
  }
  async function deleteMember(id: string) {
    setDeleteConfirm(null);
    setMembers(prev => prev.filter(m => m.id !== id));
    try { await deleteDirectoryMember(id); } catch { loadDirectory(); }
  }

  const approved = useMemo(() => {
    let list = members.filter(m => m.status === "approved");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.city.toLowerCase().includes(q));
    }
    if (filterRole !== "All") list = list.filter(m => m.role === filterRole);
    if (filterCountry !== "All") list = list.filter(m => m.country === filterCountry);
    return list;
  }, [members, search, filterRole, filterCountry]);

  const pending  = members.filter(m => m.status === "pending");
  const adminList = adminFilter === "all" ? members : members.filter(m => m.status === adminFilter);


  // ── Register form ──────────────────────────────────────────────────────────
  if (view === "register") return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <div className="modal-handle" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <button onClick={() => { setView("directory"); setRegSent(false); setReg(emptyReg()); setRegError(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted)" }}>← Back</button>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>👤 Join the Directory</div>
          <div />
        </div>

        {regSent ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>Registration Submitted!</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 24 }}>
              Your profile is now <strong style={{ color: "#d4a843" }}>pending review</strong>.<br />
              The admin will approve your listing shortly.
            </div>
            <button className="btn-gold" style={{ padding: "12px 32px", fontSize: 14, fontWeight: 700 }}
              onClick={() => { setView("directory"); setRegSent(false); setReg(emptyReg()); }}>
              Back to Directory
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 18, padding: "10px 14px", borderRadius: 12, background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.2)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
              Your profile will be <strong style={{ color: "#d4a843" }}>reviewed by the admin</strong> before appearing in the directory.
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>FULL NAME <span style={{ color: "#ef4444" }}>*</span></label>
              <input style={inputStyle} value={reg.name} onChange={e => setReg(r => ({ ...r, name: e.target.value }))} placeholder="Your full name" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>CITY <span style={{ color: "#ef4444" }}>*</span></label>
                <input style={inputStyle} value={reg.city} onChange={e => setReg(r => ({ ...r, city: e.target.value }))} placeholder="Your city" />
              </div>
              <div>
                <label style={labelStyle}>COUNTRY</label>
                <select style={{ ...inputStyle, appearance: "none" }} value={reg.country} onChange={e => setReg(r => ({ ...r, country: e.target.value }))}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{FLAG[c]} {c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>ROLE IN COMMUNITY</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ROLES.map(role => {
                  const rc = ROLE_COLORS[role] || ROLE_COLORS["Member"];
                  return (
                    <button key={role} onClick={() => setReg(r => ({ ...r, role }))}
                      style={{
                        padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
                        background: reg.role === role ? rc.bg : "var(--elevated)",
                        border: reg.role === role ? `1px solid ${rc.color}` : "1px solid var(--border)",
                        color: reg.role === role ? rc.color : "var(--text-muted)", transition: "all 0.15s",
                      }}>{role}</button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>SHORT BIO (optional)</label>
              <textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical", lineHeight: 1.5 }}
                value={reg.bio} onChange={e => setReg(r => ({ ...r, bio: e.target.value }))}
                placeholder="A few words about yourself and your connection to the community…" />
            </div>

            {/* Contact Information */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <label style={{ ...labelStyle, marginBottom: 0, whiteSpace: "nowrap" }}>📡 CONTACT INFO (optional)</label>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(212,168,67,0.05)", border: "1px solid rgba(212,168,67,0.15)", fontSize: 11, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.5 }}>
                Only visible to other approved members. Leave blank if you prefer privacy.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: "center", flexShrink: 0 }}>📱</span>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>WHATSAPP NUMBER</label>
                    <input style={inputStyle} value={reg.whatsapp || ""} onChange={e => setReg(r => ({ ...r, whatsapp: e.target.value }))} placeholder="+91 98765 43210" inputMode="tel" />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: "center", flexShrink: 0 }}>📞</span>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>PHONE NUMBER</label>
                    <input style={inputStyle} value={reg.phone || ""} onChange={e => setReg(r => ({ ...r, phone: e.target.value }))} placeholder="+91 98765 43210" inputMode="tel" />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: "center", flexShrink: 0 }}>✉️</span>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>EMAIL ADDRESS</label>
                    <input style={inputStyle} value={reg.email || ""} onChange={e => setReg(r => ({ ...r, email: e.target.value }))} placeholder="you@example.com" inputMode="email" type="email" />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: "center", flexShrink: 0 }}>💬</span>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>OTHER (Telegram, Facebook, etc.)</label>
                    <input style={inputStyle} value={reg.otherContact || ""} onChange={e => setReg(r => ({ ...r, otherContact: e.target.value }))} placeholder="e.g. @username on Telegram" />
                  </div>
                </div>
              </div>
            </div>

            {/* Celebration Dates */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <label style={{ ...labelStyle, marginBottom: 0, whiteSpace: "nowrap" }}>🎉 CELEBRATION DATES (optional)</label>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(212,168,67,0.05)", border: "1px solid rgba(212,168,67,0.15)", fontSize: 11, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.5 }}>
                Let the community wish you on your special days! Only approved members are notified.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: "center", flexShrink: 0 }}>🎂</span>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>BIRTHDAY (Gregorian)</label>
                    <input type="date" style={inputStyle} value={reg.birthday || ""} onChange={e => setReg(r => ({ ...r, birthday: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: "center", flexShrink: 0 }}>✈️</span>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>ALIYAH DATE (if applicable)</label>
                    <input type="date" style={inputStyle} value={reg.aliyahDate || ""} onChange={e => setReg(r => ({ ...r, aliyahDate: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>

            {regError && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>⚠️ {regError}</div>}

            <button className="btn-gold" style={{ width: "100%", padding: 14, fontSize: 15, fontWeight: 800, marginBottom: 10, opacity: regBusy ? 0.6 : 1 }}
              onClick={submitReg} disabled={regBusy}>
              {regBusy ? "Submitting…" : "Submit for Review"}
            </button>
            <button onClick={() => setView("directory")} className="btn-close-full">Cancel</button>
          </>
        )}
      </div>
    </div>
  );

  // ── Admin panel ────────────────────────────────────────────────────────────
  if (view === "admin") return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <div className="modal-handle" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={() => setView("directory")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted)" }}>← Directory</button>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>👥 Moderate Members</div>
          <div />
        </div>

        <div style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.15)", marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#d4a843", fontWeight: 600 }}>
            ⚡ Admin Mode — {members.length} total · {pending.length} pending
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Approve or hide member registrations</div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4, marginBottom: 14 }}>
          {(["all", "pending", "approved", "hidden"] as const).map(f => (
            <button key={f} onClick={() => setAdminFilter(f)}
              style={{
                padding: "8px 0", borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: "pointer",
                background: adminFilter === f ? "rgba(212,168,67,0.15)" : "var(--elevated)",
                border: adminFilter === f ? "1px solid rgba(212,168,67,0.4)" : "1px solid var(--border)",
                color: adminFilter === f ? "#d4a843" : "var(--text-muted)", transition: "all 0.15s",
                textTransform: "uppercase", letterSpacing: ".05em",
              }}>
              {f === "all" ? `All ${members.length}` : f === "pending" ? `⏳ ${pending.length}` : f === "approved" ? `✅ ${members.filter(m => m.status === "approved").length}` : `🙈 ${members.filter(m => m.status === "hidden").length}`}
            </button>
          ))}
        </div>

        {adminList.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)", fontSize: 13 }}>No members in this filter.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {adminList.map(m => {
              const rc = ROLE_COLORS[m.role] || ROLE_COLORS["Member"];
              const statusColor = m.status === "approved" ? "#4ade80" : m.status === "pending" ? "#d4a843" : "#94a3b8";
              return (
                <div key={m.id} style={{ padding: 12, borderRadius: 14, background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <MemberAvatar member={m} size={40} radius={12} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                        <span style={{ fontSize: 9, fontWeight: 900, color: statusColor, letterSpacing: ".08em" }}>{m.status.toUpperCase()}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: rc.color, background: rc.bg, borderRadius: 4, padding: "1px 5px" }}>{m.role}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                        {FLAG[m.country] || "🌐"} {m.city}, {m.country} · Joined {fmtDate(m.joinedAt)}
                      </div>
                      {m.bio && <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.4 }}>{m.bio}</div>}
                      {(m.whatsapp || m.phone || m.email || m.otherContact) && (
                        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                          {m.whatsapp && <div style={{ fontSize: 10, color: "#25d366" }}>📱 WA: {m.whatsapp}</div>}
                          {m.phone && <div style={{ fontSize: 10, color: "#60a5fa" }}>📞 Tel: {m.phone}</div>}
                          {m.email && <div style={{ fontSize: 10, color: "#d4a843" }}>✉️ {m.email}</div>}
                          {m.otherContact && <div style={{ fontSize: 10, color: "#a78bfa" }}>💬 {m.otherContact}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    {m.status !== "approved" && (
                      <button onClick={() => approve(m.id)} style={{ flex: 1, padding: "7px", borderRadius: 8, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#4ade80" }}>✓ Approve</button>
                    )}
                    {m.status !== "hidden" && (
                      <button onClick={() => hide(m.id)} style={{ flex: 1, padding: "7px", borderRadius: 8, background: "rgba(100,116,139,0.12)", border: "1px solid rgba(100,116,139,0.3)", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>🙈 Hide</button>
                    )}
                    {deleteConfirm === m.id ? (
                      <button onClick={() => deleteMember(m.id)} style={{ flex: 1, padding: "7px", borderRadius: 8, background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#ef4444" }}>CONFIRM DEL</button>
                    ) : (
                      <button onClick={() => setDeleteConfirm(m.id)} style={{ padding: "7px 10px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "none", cursor: "pointer", fontSize: 11, color: "#ef4444", fontWeight: 700 }}>DEL</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={() => setView("directory")} className="btn-close-full">Done</button>
      </div>
    </div>
  );

  // ── Public directory ───────────────────────────────────────────────────────
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
              👥 Member Directory
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{approved.length} approved member{approved.length !== 1 ? "s" : ""} worldwide</div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 14 }}>🔍</span>
          <input
            style={{ ...inputStyle, paddingLeft: 34 }}
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or city…"
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16 }}>✕</button>
          )}
        </div>

        {/* Role filter chips */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 8, scrollbarWidth: "none" }}>
          {["All", ...ROLES].map(r => {
            const rc = ROLE_COLORS[r];
            const active = filterRole === r;
            return (
              <button key={r} onClick={() => setFilterRole(r)}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                  whiteSpace: "nowrap", cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
                  background: active ? (rc?.bg || "rgba(212,168,67,0.15)") : "var(--elevated)",
                  border: active ? `1px solid ${rc?.color || "#d4a843"}` : "1px solid var(--border)",
                  color: active ? (rc?.color || "#d4a843") : "var(--text-muted)",
                }}>{r}</button>
            );
          })}
        </div>

        {/* Country filter chips */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 14, scrollbarWidth: "none" }}>
          {["All", ...COUNTRIES].map(c => (
            <button key={c} onClick={() => setFilterCountry(c)}
              style={{
                padding: "5px 11px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                whiteSpace: "nowrap", cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
                background: filterCountry === c ? "rgba(212,168,67,0.12)" : "var(--elevated)",
                border: filterCountry === c ? "1px solid rgba(212,168,67,0.4)" : "1px solid var(--border)",
                color: filterCountry === c ? "#d4a843" : "var(--text-muted)",
              }}>{c !== "All" ? `${FLAG[c] || "🌐"} ` : ""}{c}</button>
          ))}
        </div>

        {/* Member cards */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-muted)", fontSize: 13 }}>Loading directory…</div>
        ) : loadError ? (
          <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 10 }}>⚠️ {loadError}</div>
            <button onClick={loadDirectory} className="btn-gold" style={{ padding: "8px 20px", fontSize: 12, fontWeight: 700 }}>Retry</button>
          </div>
        ) : approved.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
              {search || filterRole !== "All" || filterCountry !== "All" ? "No members match your search" : "No approved members yet"}
            </div>
            <div style={{ fontSize: 13 }}>
              {search ? "Try a different name or city." : "Be the first to register!"}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {approved.map(m => {
              const rc = ROLE_COLORS[m.role] || ROLE_COLORS["Member"];
              const hasContact = !!(m.whatsapp || m.phone || m.email || m.otherContact);
              const isOpen = connectOpen === m.id;
              const waLink = m.whatsapp
                ? `https://wa.me/${m.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(introMsg)}`
                : null;
              const mailLink = m.email
                ? `mailto:${m.email}?subject=${encodeURIComponent("Bnei Menashe Community — Hello!")}&body=${encodeURIComponent(introMsg)}`
                : null;
              return (
                <div key={m.id} style={{
                  borderRadius: 16, background: "var(--card)", border: isOpen ? "1px solid rgba(212,168,67,0.35)" : "1px solid var(--border)",
                  overflow: "hidden", transition: "border-color 0.2s",
                }}>
                  {/* Card header */}
                  <div style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <MemberAvatar member={m} size={48} radius={14} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 800, letterSpacing: ".06em",
                          color: rc.color, background: rc.bg, borderRadius: 5, padding: "2px 7px",
                        }}>{m.role}</span>
                        {hasContact && (
                          <button
                            onClick={() => { setConnectOpen(isOpen ? null : m.id); }}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 800,
                              cursor: "pointer", border: "none", transition: "all 0.18s",
                              background: isOpen ? "rgba(212,168,67,0.18)" : "rgba(212,168,67,0.10)",
                              color: "#d4a843",
                            }}>
                            {isOpen ? "✕ Close" : "💬 Connect"}
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", marginBottom: 3 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: m.bio ? 6 : 0, display: "flex", alignItems: "center", gap: 4 }}>
                        <span>{FLAG[m.country] || "🌐"}</span>
                        <span>{m.city}, {m.country}</span>
                        <span style={{ color: "var(--border)" }}>·</span>
                        <span>Member since {fmtDate(m.joinedAt)}</span>
                      </div>
                      {m.bio && (
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{m.bio}</div>
                      )}
                    </div>
                  </div>

                  {/* Expandable Connect panel */}
                  {isOpen && hasContact && (
                    <div style={{
                      borderTop: "1px solid rgba(212,168,67,0.15)",
                      background: "rgba(212,168,67,0.04)",
                      padding: "14px 16px",
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: ".06em", marginBottom: 8 }}>
                        ✍️ YOUR MESSAGE TO {m.name.split(" ")[0].toUpperCase()}
                      </div>
                      <textarea
                        value={introMsg}
                        onChange={e => setIntroMsg(e.target.value)}
                        rows={3}
                        style={{
                          ...inputStyle, resize: "none", lineHeight: 1.5,
                          fontSize: 12, marginBottom: 10,
                        }}
                      />
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {waLink && (
                          <a href={waLink} target="_blank" rel="noreferrer"
                            style={{
                              flex: 1, minWidth: 120, display: "inline-flex", alignItems: "center", justifyContent: "center",
                              gap: 6, padding: "10px 14px", borderRadius: 12, fontSize: 13, fontWeight: 800,
                              background: "rgba(37,211,102,0.14)", border: "1px solid rgba(37,211,102,0.35)",
                              color: "#25d366", textDecoration: "none",
                            }}>
                            📱 WhatsApp
                          </a>
                        )}
                        {mailLink && (
                          <a href={mailLink}
                            style={{
                              flex: 1, minWidth: 120, display: "inline-flex", alignItems: "center", justifyContent: "center",
                              gap: 6, padding: "10px 14px", borderRadius: 12, fontSize: 13, fontWeight: 800,
                              background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.3)",
                              color: "#d4a843", textDecoration: "none",
                            }}>
                            ✉️ Email
                          </a>
                        )}
                        {m.phone && (
                          <a href={`tel:${m.phone.replace(/\s/g, "")}`}
                            style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              gap: 6, padding: "10px 14px", borderRadius: 12, fontSize: 13, fontWeight: 800,
                              background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.3)",
                              color: "#60a5fa", textDecoration: "none",
                            }}>
                            📞 Call
                          </a>
                        )}
                      </div>
                      {m.otherContact && (
                        <div style={{
                          marginTop: 10, padding: "8px 12px", borderRadius: 10,
                          background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)",
                          fontSize: 12, color: "#a78bfa", display: "flex", alignItems: "center", gap: 6,
                        }}>
                          <span>💬</span>
                          <span style={{ flex: 1 }}>{m.otherContact}</span>
                          <button
                            onClick={() => navigator.clipboard?.writeText(m.otherContact!)}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#a78bfa", fontWeight: 700, padding: "2px 6px" }}>
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Register CTA */}
        <div style={{ marginBottom: 12, padding: "14px 16px", borderRadius: 16, background: "linear-gradient(135deg, #0f1e38, #1a2a1a)", border: "1px solid rgba(212,168,67,0.2)", textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Are you a Bnei Menashe member?</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>Add yourself to the community directory</div>
          <button className="btn-gold" style={{ padding: "10px 28px", fontSize: 13, fontWeight: 800 }}
            onClick={() => { setRegSent(false); setReg(emptyReg()); setView("register"); }}>
            + Join the Directory
          </button>
        </div>

        {/* Footer admin — only visible to administrator */}
        {isAdmin && (
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <button onClick={() => setView("admin")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--text-muted)", opacity: 0.5, padding: "6px 12px" }}>⚙ Admin</button>
          </div>
        )}
        <button onClick={onClose} className="btn-close-full">Close</button>
      </div>
    </div>
  );
}
