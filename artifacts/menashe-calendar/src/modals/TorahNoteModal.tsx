import { useState } from "react";
import { getCurrentParasha } from "../lib/parasha";

interface Props { onClose: () => void; }

export default function TorahNoteModal({ onClose }: Props) {
  const parasha = getCurrentParasha(new Date());
  const [note, setNote] = useState(() => {
    return localStorage.getItem(`torah-note-${parasha?.name}`) || "";
  });
  const [saved, setSaved] = useState(false);

  function save() {
    if (parasha) localStorage.setItem(`torah-note-${parasha.name}`, note);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>📝 Torah Notes</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{parasha ? `Parashat ${parasha.name}` : "This week's portion"}</div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Write your thoughts, insights, or questions about this week's parasha..."
          style={{
            width: "100%", minHeight: 160, padding: "14px", borderRadius: 12,
            background: "var(--elevated)", border: "1px solid var(--border)",
            color: "var(--text-primary)", fontSize: 14, lineHeight: 1.6,
            outline: "none", resize: "vertical", fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button
            className="btn-gold"
            style={{ flex: 1, padding: "13px", fontSize: 15, fontWeight: 700 }}
            onClick={save}
          >
            {saved ? "Saved ✓" : "Save Note"}
          </button>
          <button onClick={onClose} style={{
            padding: "13px 20px", background: "var(--elevated)", border: "1px solid var(--border)",
            borderRadius: 12, color: "var(--text-primary)", fontSize: 15, cursor: "pointer", fontWeight: 600,
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
