import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/react";
import {
  fetchPublicProfile,
  savePublicProfile,
  type PublicProfile,
} from "../lib/userApi";
import { useLanguage } from "../context/LanguageContext";

interface Props {
  onClose: () => void;
  onSaved?: (profile: PublicProfile) => void;
}

const ROLES = ["Member", "Community Leader", "Rabbi", "Cantor", "Youth Leader", "Women's Group", "Student", "Elder", "Admin"];
const COUNTRIES = ["India", "Israel", "United States", "United Kingdom", "Australia", "Canada", "Other"];
const AVATAR_EMOJIS = ["👤","🧑","👨","👩","🧔","👴","👵","🧕","👳","🎓","✡","🌟","🙏","📖","🕍","🌿"];

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB raw file limit

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  background: "var(--elevated)", border: "1px solid var(--border)",
  color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
  letterSpacing: "0.06em", marginBottom: 6, display: "block",
};
const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: "pointer", appearance: "none" as any,
};

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("") || "?";
}

function avatarBg(name: string): string {
  const colors = ["#1a3050","#2a1a40","#1a2a20","#30200a","#1a1a30","#2a1030","#0f2030","#301020"];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 400;
      let { width, height } = img;
      if (width > height) {
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
      } else {
        if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function ProfileModal({ onClose, onSaved }: Props) {
  const { user } = useUser();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<PublicProfile>({
    displayName: "",
    congregation: "",
    bio: "",
    role: "Member",
    city: "",
    country: "India",
    avatarEmoji: "👤",
    profilePhotoUrl: null,
  });

  useEffect(() => {
    fetchPublicProfile().then((profile) => {
      if (profile) {
        setForm(profile);
      } else if (user) {
        setForm(f => ({
          ...f,
          displayName: user.fullName || user.firstName || "",
        }));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.id]);

  function set(key: keyof PublicProfile, val: string | null) {
    setForm(f => ({ ...f, [key]: val }));
    setSaved(false);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      setError(t.profilePhotoTooBig);
      return;
    }
    setError("");
    setPhotoUploading(true);
    try {
      const dataUrl = await compressImage(file);
      set("profilePhotoUrl", dataUrl);
    } catch {
      setError("Failed to process image. Please try another.");
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemovePhoto() {
    set("profilePhotoUrl", null);
    setShowEmojiPicker(false);
  }

  async function handleSave() {
    if (!form.displayName.trim()) { setError("Please enter your name."); return; }
    setError("");
    setSaving(true);
    try {
      await savePublicProfile(form);
      setSaved(true);
      onSaved?.(form);
      setTimeout(onClose, 1000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const avatarName = form.displayName || "?";
  const hasPhoto = !!form.profilePhotoUrl;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <div className="modal-handle" />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1 }}>👤 My Profile</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Visible in the Member Directory & Prayer Board
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>
        ) : (
          <>
            {/* Avatar / Photo section */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 22, gap: 10 }}>
              {/* Avatar circle */}
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: 88, height: 88, borderRadius: "50%",
                    background: hasPhoto ? "transparent" : avatarBg(avatarName),
                    border: "2.5px solid rgba(212,168,67,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", cursor: "pointer",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.35)",
                  }}
                  onClick={() => hasPhoto ? setShowEmojiPicker(v => !v) : fileInputRef.current?.click()}
                  title={hasPhoto ? "Change avatar" : t.profileUploadPhoto}
                >
                  {photoUploading ? (
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>…</div>
                  ) : hasPhoto ? (
                    <img
                      src={form.profilePhotoUrl!}
                      alt="Profile"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : form.avatarEmoji === "👤" ? (
                    <span style={{ fontSize: 30, fontWeight: 800, color: "var(--text-primary)" }}>{initials(avatarName)}</span>
                  ) : (
                    <span style={{ fontSize: 40 }}>{form.avatarEmoji}</span>
                  )}
                </div>

                {/* Edit badge */}
                <div style={{
                  position: "absolute", bottom: 2, right: 2,
                  width: 26, height: 26, borderRadius: "50%",
                  background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, cursor: "pointer", border: "2px solid var(--bg-primary)",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.4)",
                }} onClick={() => hasPhoto ? setShowEmojiPicker(v => !v) : fileInputRef.current?.click()}>
                  {hasPhoto ? "✏️" : "📷"}
                </div>
              </div>

              {/* Upload / action buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  style={{
                    fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 20,
                    background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.3)",
                    color: "var(--gold)", cursor: "pointer", opacity: photoUploading ? 0.6 : 1,
                  }}
                >
                  {photoUploading ? "Processing…" : hasPhoto ? t.profileChangePhoto : t.profileUploadPhoto}
                </button>
                {hasPhoto && (
                  <button
                    onClick={handleRemovePhoto}
                    style={{
                      fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 20,
                      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                      color: "#ef4444", cursor: "pointer",
                    }}
                  >
                    {t.profileRemovePhoto}
                  </button>
                )}
              </div>

              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.profilePhotoHint}</div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePhotoChange}
              />
            </div>

            {/* Emoji picker (only shown when no photo or clicking edit on photo) */}
            {!hasPhoto && showEmojiPicker && (
              <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: "var(--elevated)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 8 }}>CHOOSE AVATAR EMOJI</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {AVATAR_EMOJIS.map(e => (
                    <button key={e} onClick={() => { set("avatarEmoji", e); setShowEmojiPicker(false); }}
                      style={{
                        fontSize: 24, width: 42, height: 42, borderRadius: 10, cursor: "pointer",
                        background: form.avatarEmoji === e ? "rgba(212,168,67,0.15)" : "var(--card)",
                        border: form.avatarEmoji === e ? "1.5px solid rgba(212,168,67,0.5)" : "1px solid var(--border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{e}</button>
                  ))}
                  <button onClick={() => { set("avatarEmoji", "👤"); setShowEmojiPicker(false); }}
                    style={{
                      fontSize: 11, fontWeight: 700, padding: "0 10px", height: 42, borderRadius: 10, cursor: "pointer",
                      background: form.avatarEmoji === "👤" ? "rgba(212,168,67,0.15)" : "var(--card)",
                      border: form.avatarEmoji === "👤" ? "1.5px solid rgba(212,168,67,0.5)" : "1px solid var(--border)",
                      color: "var(--text-muted)",
                    }}>Initials</button>
                </div>
              </div>
            )}

            {hasPhoto && showEmojiPicker && (
              <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: "var(--elevated)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                  Remove your photo to use an emoji avatar instead.
                </div>
                <button onClick={handleRemovePhoto}
                  style={{
                    fontSize: 12, fontWeight: 600, padding: "7px 16px", borderRadius: 20,
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    color: "#ef4444", cursor: "pointer",
                  }}>
                  {t.profileRemovePhoto}
                </button>
              </div>
            )}

            {/* Form fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>DISPLAY NAME *</label>
                <input value={form.displayName} onChange={e => set("displayName", e.target.value)}
                  placeholder="Your full name" maxLength={60} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>CONGREGATION / COMMUNITY</label>
                <input value={form.congregation} onChange={e => set("congregation", e.target.value)}
                  placeholder="e.g. Bnei Menashe Jerusalem" maxLength={80} style={inputStyle} />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>ROLE</label>
                  <select value={form.role} onChange={e => set("role", e.target.value)} style={selectStyle}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>COUNTRY</label>
                  <select value={form.country} onChange={e => set("country", e.target.value)} style={selectStyle}>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>CITY</label>
                <input value={form.city} onChange={e => set("city", e.target.value)}
                  placeholder="Your city" maxLength={60} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>BIO</label>
                <textarea value={form.bio} onChange={e => set("bio", e.target.value)}
                  placeholder="A short description about yourself (optional)"
                  maxLength={200} rows={3}
                  style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }} />
                <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "right", marginTop: 3 }}>{form.bio.length}/200</div>
              </div>
            </div>

            {error && (
              <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 9, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#ef4444" }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-gold"
              style={{ width: "100%", padding: 14, fontSize: 15, fontWeight: 700, marginTop: 18, opacity: saving ? 0.7 : 1 }}
            >
              {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Profile"}
            </button>

            <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
              Your profile is visible to other community members
            </div>
          </>
        )}
      </div>
    </div>
  );
}
