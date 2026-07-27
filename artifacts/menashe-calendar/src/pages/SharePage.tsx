import { useState } from "react";
import type { CensusRow, FamilyMember } from "@workspace/shared-core/census";
import { RELATION_LABELS } from "@workspace/shared-core/census";

/* Canonical CensusRow/FamilyMember/Relation/AliyahStatus now live in
   @workspace/shared-core/census — imported above. There must be ONE
   Census model; this file only consumes it. */

interface SharePayload {
  v: 1;
  branchName: string;
  cityName: string;
  familyId: string;
  headName: string;
  headCensus: CensusRow;
  members: FamilyMember[];
}

interface ReturnPayload {
  v: 1;
  familyId: string;
  headCensus: CensusRow;
  members: FamilyMember[];
  collaboratorName: string;
  submittedAt: string;
}

/* RELATION_LABELS now imported from @workspace/shared-core/census. */

/* ── Codec ────────────────────────────────────────────────── */
function encodePayload(data: object): string {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function decodePayload<T>(token: string): T | null {
  try {
    const pad = token.length % 4 === 0 ? "" : "=".repeat(4 - token.length % 4);
    const binary = atob(token.replace(/-/g, "+").replace(/_/g, "/") + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch { return null; }
}

/* ── Styles ───────────────────────────────────────────────── */
const inp: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", border: "1px solid #d1d5db",
  borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none",
  background: "#fff", fontFamily: "inherit",
};

const emptyInp: React.CSSProperties = { ...inp, background: "rgba(251,191,36,0.15)", borderColor: "#f59e0b" };

function isEmpty(v?: string) { return !v || v.trim() === ""; }

/* ── Member form section ──────────────────────────────────── */
function MemberForm({
  title, emoji, data, onChange, isHead,
}: {
  title: string; emoji: string; data: CensusRow;
  onChange: (d: CensusRow) => void; isHead?: boolean;
}) {
  function set(k: keyof CensusRow, v: string) { onChange({ ...data, [k]: v }); }

  const s = (k: keyof CensusRow) => isEmpty(data[k]) ? emptyInp : inp;

  return (
    <div style={{ borderRadius: 14, border: `2px solid ${isHead ? "#d4a843" : "#e5e7eb"}`, overflow: "hidden", marginBottom: 14 }}>
      <div style={{ background: isHead ? "rgba(212,168,67,0.1)" : "#f9fafb", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #e5e7eb" }}>
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: isHead ? "#92400e" : "#374151" }}>{title}</span>
        {Object.values(data).filter(v => !v || v === "").length > 0 && (
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#f59e0b", fontWeight: 700, background: "rgba(251,191,36,0.15)", padding: "2px 8px", borderRadius: 10 }}>
            ★ FIELDS TO FILL
          </span>
        )}
      </div>
      <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 3 }}>SURNAME</div>
            <input style={s("surname")} placeholder="Family surname" value={data.surname || ""} onChange={e => set("surname", e.target.value)} />
          </div>
          <div style={{ flex: 2 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 3 }}>NAME (ADHAAR / PASSPORT)</div>
            <input style={s("namePerPassport")} placeholder="Exact name on ID document" value={data.namePerPassport || ""} onChange={e => set("namePerPassport", e.target.value)} />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 3 }}>HEBREW NAME</div>
          <input style={s("hebrewName")} placeholder="Hebrew / Jewish name" value={data.hebrewName || ""} onChange={e => set("hebrewName", e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 3 }}>MARITAL STATUS</div>
            <select style={s("maritalStatus")} value={data.maritalStatus || ""} onChange={e => set("maritalStatus", e.target.value)}>
              <option value="">— Select —</option>
              {["Single", "Married", "Divorced", "Widowed"].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 3 }}>SEX</div>
            <select style={s("sex")} value={data.sex || ""} onChange={e => set("sex", e.target.value)}>
              <option value="">—</option>
              <option value="M">Male (M)</option>
              <option value="F">Female (F)</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 3 }}>DATE OF BIRTH</div>
            <input style={s("dob")} type="date" value={data.dob || ""} onChange={e => set("dob", e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 3 }}>FATHER'S NAME</div>
            <input style={s("fatherName")} placeholder="Father's full name" value={data.fatherName || ""} onChange={e => set("fatherName", e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 3 }}>MOTHER'S NAME</div>
            <input style={s("motherName")} placeholder="Mother's full name" value={data.motherName || ""} onChange={e => set("motherName", e.target.value)} />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 3 }}>DATE OF JUDAISM PRACTICE</div>
          <input style={s("dateOfJudaismPractice")} type="date" value={data.dateOfJudaismPractice || ""} onChange={e => set("dateOfJudaismPractice", e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 2 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 3 }}>PASSPORT NUMBER</div>
            <input style={s("passportNo")} placeholder="Passport / Adhaar No." value={data.passportNo || ""} onChange={e => set("passportNo", e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 3 }}>ISSUE DATE</div>
            <input style={s("passportIssueDate")} type="date" value={data.passportIssueDate || ""} onChange={e => set("passportIssueDate", e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 3 }}>EXPIRY DATE</div>
            <input style={s("passportExpiryDate")} type="date" value={data.passportExpiryDate || ""} onChange={e => set("passportExpiryDate", e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Success state ────────────────────────────────────────── */
function SuccessView({ returnCode, branchName, familyName, collaboratorName }: {
  returnCode: string; branchName: string; familyName: string; collaboratorName: string;
}) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(returnCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const whatsappMsg = `Hi, I've filled in the census details for *${familyName}* (${branchName} congregation).\n\nPlease import my edits using the code below 👇\n\n${returnCode}`;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontFamily: "'Times New Roman', serif", fontSize: 22, fontWeight: 700, marginBottom: 8, color: "#111827" }}>Edits Submitted!</h2>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 32, lineHeight: 1.6 }}>
          Thank you, <strong>{collaboratorName}</strong>. Your census details have been prepared.
          Send the return code below to your Local Administrator so they can apply your edits.
        </p>

        {/* Return code card */}
        <div style={{ borderRadius: 16, border: "1px solid #e5e7eb", background: "#fff", padding: 20, marginBottom: 20, textAlign: "left" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.08em", marginBottom: 10 }}>YOUR RETURN CODE</div>
          <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px", border: "1px solid #e5e7eb", wordBreak: "break-all", fontSize: 11, fontFamily: "monospace", color: "#374151", maxHeight: 140, overflowY: "auto", lineHeight: 1.6 }}>
            {returnCode}
          </div>
          <button
            onClick={copyCode}
            style={{ marginTop: 12, width: "100%", padding: "12px", borderRadius: 10, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", background: copied ? "#10b981" : "#1d4ed8", color: "#fff", transition: "background 0.2s" }}
          >
            {copied ? "✓ Copied!" : "📋 Copy Return Code"}
          </button>
        </div>

        {/* WhatsApp share */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px", borderRadius: 12, background: "#25d366", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none", marginBottom: 16 }}
        >
          <span style={{ fontSize: 20 }}>💬</span> Share via WhatsApp
        </a>

        <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>
          Ask your Local Administrator to open the family record in the Menashe Calendar app and tap <strong>"Import Edits"</strong> to paste your code.
        </p>
      </div>
    </div>
  );
}

/* ── Main SharePage ───────────────────────────────────────── */
export default function SharePage({ token }: { token: string }) {
  const payload = decodePayload<SharePayload>(token);

  const [headCensus, setHeadCensus] = useState<CensusRow>(payload?.headCensus || {});
  const [members, setMembers] = useState<FamilyMember[]>(payload?.members || []);
  const [collaboratorName, setCollaboratorName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [returnCode, setReturnCode] = useState("");
  const [nameError, setNameError] = useState(false);

  function updateMember(i: number, data: CensusRow) {
    setMembers(prev => prev.map((m, idx) => idx === i ? { ...m, ...data } : m));
  }

  function handleSubmit() {
    if (!collaboratorName.trim()) { setNameError(true); return; }
    setNameError(false);
    const ret: ReturnPayload = {
      v: 1,
      familyId: payload!.familyId,
      headCensus,
      members,
      collaboratorName: collaboratorName.trim(),
      submittedAt: new Date().toISOString(),
    };
    setReturnCode(encodePayload(ret));
    setSubmitted(true);
  }

  /* ── Error states ── */
  if (!payload || payload.v !== 1) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "#f8fafc", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
        <h2 style={{ fontFamily: "'Times New Roman', serif", fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#111827" }}>Invalid Share Link</h2>
        <p style={{ fontSize: 14, color: "#6b7280", maxWidth: 300 }}>This link may be expired or invalid. Please ask your Local Administrator to generate a new share link.</p>
      </div>
    );
  }

  /* ── Success state ── */
  if (submitted) {
    return (
      <SuccessView
        returnCode={returnCode}
        branchName={payload.branchName}
        familyName={payload.headCensus.namePerPassport || payload.headName}
        collaboratorName={collaboratorName}
      />
    );
  }

  const emptyCount = [headCensus, ...members].reduce((n, m) => {
    return n + Object.entries(m).filter(([k, v]) => k !== "id" && k !== "relation" && k !== "aliyahStatus" && (!v || v === "")).length;
  }, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#e5e7eb", fontFamily: "system-ui, sans-serif" }}>

      {/* ── Sticky invitation banner ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "#1e40af", color: "#fff", padding: "12px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
            📋 You've been invited to fill in census details
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, opacity: 0.85, flex: 1 }}>
              {payload.branchName} · {payload.cityName} — Your edits will be sent to the Local Administrator for review.
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 12, opacity: 0.9 }}>Your name:</span>
              <input
                style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${nameError ? "#fca5a5" : "rgba(255,255,255,0.4)"}`, background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 13, outline: "none", width: 160 }}
                placeholder="e.g. Lalmuanzuala"
                value={collaboratorName}
                onChange={e => { setCollaboratorName(e.target.value); setNameError(false); }}
              />
            </div>
          </div>
          {nameError && <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 4 }}>Please enter your name before submitting.</div>}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px 40px" }}>

        {/* ── BMC Form header ── */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "20px 20px 14px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", textAlign: "center", fontFamily: "'Times New Roman', Times, serif" }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.02em", textTransform: "uppercase", color: "#111827", marginBottom: 3 }}>
            BNEI MENASHE COUNCIL INDIA CENSUS 2026 - 2027
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 2 }}>Regd. No. 23/SR/2010-CCP</div>
          <div style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic", marginBottom: 14 }}>
            Head Office: Beith Shalom B.Vengnom, Churachandpur, Manipur, India - 795128
          </div>
          <div style={{ height: 2, background: "#111827", marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", fontSize: 13 }}>
            <div><span style={{ fontWeight: 700 }}>Community:</span> <span style={{ borderBottom: "1px solid #374151", paddingBottom: 1 }}>{payload.branchName}</span></div>
            <div><span style={{ fontWeight: 700 }}>Head of Family:</span> <span style={{ borderBottom: "1px solid #374151", paddingBottom: 1 }}>{payload.headCensus.namePerPassport || payload.headName}</span></div>
          </div>
        </div>

        {/* ── Empty fields notice ── */}
        {emptyCount > 0 && (
          <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(251,191,36,0.15)", border: "1px solid rgba(245,158,11,0.4)", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div style={{ fontSize: 12, color: "#92400e" }}>
              <strong>{emptyCount} field{emptyCount !== 1 ? "s" : ""}</strong> need to be filled in. Fields with an amber border are empty — please complete them.
            </div>
          </div>
        )}

        {/* ── Head of Family ── */}
        <MemberForm
          title="Head of Family"
          emoji="👨"
          data={headCensus}
          onChange={setHeadCensus}
          isHead
        />

        {/* ── Family members ── */}
        {members.map((m, i) => (
          <MemberForm
            key={m.id}
            title={RELATION_LABELS[m.relation]}
            emoji={m.sex === "F" || m.relation === "spouse" || m.relation === "daughter" || m.relation === "granddaughter" || m.relation === "daughter_in_law" ? "👩" : "👦"}
            data={m}
            onChange={d => updateMember(i, d)}
          />
        ))}

        {/* ── Submit section ── */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginTop: 8 }}>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, lineHeight: 1.55 }}>
            By submitting, you confirm that the information provided is accurate to the best of your knowledge.
            Your submission will be reviewed by the Local Administrator before any changes are finalized.
          </div>
          <button
            onClick={handleSubmit}
            style={{ width: "100%", padding: "15px", borderRadius: 12, fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #1d4ed8, #1e40af)", color: "#fff", letterSpacing: "0.02em" }}
          >
            Submit Edits for Review →
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#9ca3af" }}>
          Bnei Menashe Council India Census 2026-2027 · Regd. No. 23/SR/2010-CCP
        </div>
      </div>
    </div>
  );
}
