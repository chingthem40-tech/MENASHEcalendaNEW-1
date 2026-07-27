import { useState, useEffect, useRef } from "react";
import {
  fetchCensusBranch, saveCensusBranch,
  fetchCensusSubmissions, submitCensusBranchForReview, reviewCensusSubmission,
  fetchCensusMemberSubmissions, submitCensusMemberEntry, reviewCensusMemberSubmission,
} from "../lib/userApi";
import type {
  AliyahStatus, Relation,
  CensusRow, FamilyMember, Family, Branch,
} from "@workspace/shared-core/census";
import { RELATION_LABELS, ALIYAH_LABELS } from "@workspace/shared-core/census";
import { useUpload } from "@workspace/object-storage-web";

interface Props { onClose: () => void; isAdmin?: boolean; }

type Tab = "dashboard" | "admin" | "localadmin";

/* ══════════════════════════════════════════════════════════════
   DATA TYPES
══════════════════════════════════════════════════════════════ */

interface StatEntry {
  id: string; label: string; value: string; icon: string;
  trend?: string; trendUp?: boolean;
}

interface CityEntry {
  id: string; name: string; pop: number;
  country: "israel" | "india"; region: string;
}

/* Canonical CensusRow/FamilyMember/Family/Branch/enums now live in
   @workspace/shared-core/census — imported above. There must be ONE
   Census model; this file only consumes it. */

type SubmissionStatus = "pending" | "approved" | "rejected";

interface Submission {
  id: string;
  branch: Branch;
  submittedAt: string;   /* ISO datetime */
  status: SubmissionStatus;
  reviewNote?: string;
  reviewedAt?: string;
}

/* Community member proposes their own census entry to a local admin's branch */
interface MemberSubmissionEntry {
  id: string;
  branchId: string;
  branchName: string;
  submittedAt: string;
  status: SubmissionStatus;
  reviewNote?: string;
  reviewedAt?: string;
  submitterName: string;
  submitterNote?: string;
  headCensus: CensusRow;
  members: Array<Omit<FamilyMember, "id"> & { id: string }>;
}

/* ══════════════════════════════════════════════════════════════
   STATIC DATA
══════════════════════════════════════════════════════════════ */

const DEFAULT_STATS: StatEntry[] = [
  { id: "total",     label: "Total Community Members",      value: "9,700+",            icon: "👥", trend: "+3.2%", trendUp: true },
  { id: "aliyah",    label: "Returned to Israel (Aliyah)",  value: "4,800+",            icon: "✈️", trend: "+5.1%", trendUp: true },
  { id: "india",     label: "Awaiting Aliyah in India",     value: "4,900+",            icon: "🇮🇳", trend: "−1.4%", trendUp: false },
  { id: "cities",    label: "Main Cities in Israel",        value: "12",                icon: "🏙️" },
  { id: "states",    label: "Indian States Represented",    value: "Manipur & Mizoram", icon: "📍" },
  { id: "rabbinate", label: "Recognized by Chief Rabbinate",value: "2005",              icon: "📜" },
];

const DEFAULT_CITIES: CityEntry[] = [
  { id: "c1", name: "Kiryat Arba",   pop: 450,  country: "israel", region: "Judea & Samaria" },
  { id: "c2", name: "Be'er Sheva",   pop: 380,  country: "israel", region: "Negev" },
  { id: "c3", name: "Natzrat Illit", pop: 320,  country: "israel", region: "Galilee" },
  { id: "c4", name: "Jerusalem",     pop: 280,  country: "israel", region: "Jerusalem District" },
  { id: "c5", name: "Rehovot",       pop: 220,  country: "israel", region: "Central District" },
  { id: "c6", name: "Haifa",         pop: 180,  country: "israel", region: "Northern District" },
  { id: "c7", name: "Imphal",        pop: 2100, country: "india",  region: "Manipur" },
  { id: "c8", name: "Aizawl",        pop: 1800, country: "india",  region: "Mizoram" },
  { id: "c9", name: "Churachandpur", pop: 650,  country: "india",  region: "Manipur" },
];

/* RELATION_LABELS / ALIYAH_LABELS now imported from @workspace/shared-core/census. */

/* ══════════════════════════════════════════════════════════════
   SHARED HELPERS
══════════════════════════════════════════════════════════════ */

const inputStyle: React.CSSProperties = {
  background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 10,
  padding: "9px 12px", fontSize: 13, color: "var(--text-primary)", width: "100%",
  boxSizing: "border-box", outline: "none",
};

const secHdr: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
  color: "var(--text-muted)", marginBottom: 6,
};

function Label({ children }: { children: string }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 3 }}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label>{children}</div>;
}

/* ══════════════════════════════════════════════════════════════
   IMAGE UPLOAD BOX — used for community logo / synagogue photo
══════════════════════════════════════════════════════════════ */
function ImageUploadBox({ label, imageUrl, isUploading, progress, inputRef, onPick, errorMessage }: {
  label: string;
  imageUrl?: string;
  isUploading: boolean;
  progress: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (file: File) => void;
  errorMessage?: string | null;
}) {
  return (
    <div style={{ flex: 1 }}>
      <div
        onClick={() => !isUploading && inputRef.current?.click()}
        style={{
          border: `2px dashed ${isUploading ? "#d4a843" : errorMessage ? "rgba(239,68,68,0.45)" : imageUrl ? "rgba(74,222,128,0.4)" : "var(--border)"}`,
          borderRadius: 10, padding: imageUrl ? 0 : "18px 10px", textAlign: "center",
          cursor: isUploading ? "default" : "pointer",
          background: isUploading ? "rgba(212,168,67,0.05)" : errorMessage ? "rgba(239,68,68,0.05)" : "var(--elevated)",
          overflow: "hidden", minHeight: 96, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", transition: "all 0.2s",
        }}
      >
        {isUploading ? (
          <>
            <div style={{ fontSize: 20, marginBottom: 6 }}>⏳</div>
            <div style={{ fontSize: 11, color: "#d4a843", fontWeight: 700, marginBottom: 6 }}>Uploading… {progress}%</div>
            <div style={{ height: 4, width: "80%", background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "#d4a843", borderRadius: 2, transition: "width 0.3s" }} />
            </div>
          </>
        ) : imageUrl ? (
          <div style={{ position: "relative", width: "100%" }}>
            <img src={imageUrl} alt={label} style={{ width: "100%", height: 96, objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "4px 6px", background: "rgba(0,0,0,0.55)", fontSize: 10, color: "#4ade80", fontWeight: 700 }}>✓ Tap to replace</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 22, marginBottom: 4 }}>🖼️</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>{label}</div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>Tap to upload</div>
          </>
        )}
      </div>
      {errorMessage && (
        <div style={{ display: "flex", gap: 5, alignItems: "flex-start", marginTop: 5, padding: "6px 8px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <span style={{ fontSize: 11, lineHeight: 1.4 }}>⚠️</span>
          <div style={{ fontSize: 10, color: "#ef4444", lineHeight: 1.4 }}>{errorMessage}</div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CENSUS ROW FORM — official BMC fields
══════════════════════════════════════════════════════════════ */

function CensusRowForm({
  data, onChange, showRelation, relation, onRelationChange, aliyah, onAliyahChange,
}: {
  data: CensusRow;
  onChange: (d: CensusRow) => void;
  showRelation?: boolean;
  relation?: Relation;
  onRelationChange?: (r: Relation) => void;
  aliyah?: AliyahStatus;
  onAliyahChange?: (a: AliyahStatus) => void;
}) {
  function set(k: keyof CensusRow, v: string) { onChange({ ...data, [k]: v }); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#d4a843", letterSpacing: "0.08em", borderBottom: "1px solid rgba(212,168,67,0.2)", paddingBottom: 4 }}>
        IDENTITY
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Label>SURNAME</Label>
          <input style={inputStyle} placeholder="Family surname" value={data.surname || ""} onChange={e => set("surname", e.target.value)} />
        </div>
        <div style={{ flex: 2 }}>
          <Label>NAME (ADHAAR / PASSPORT)</Label>
          <input style={inputStyle} placeholder="Exact name on ID" value={data.namePerPassport || ""} onChange={e => set("namePerPassport", e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Label>AADHAR / TEUDAT NUMBER</Label>
          <input style={inputStyle} placeholder="Aadhar No. or Teudat Zehut No." value={data.aadharNo || ""} onChange={e => set("aadharNo", e.target.value)} />
        </div>
      </div>
      <Field label="HEBREW NAME">
        <input style={inputStyle} placeholder="Hebrew/Jewish name" value={data.hebrewName || ""} onChange={e => set("hebrewName", e.target.value)} />
      </Field>

      <div style={{ fontSize: 10, fontWeight: 700, color: "#d4a843", letterSpacing: "0.08em", borderBottom: "1px solid rgba(212,168,67,0.2)", paddingBottom: 4, marginTop: 2 }}>
        PERSONAL DETAILS
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Label>MARITAL STATUS</Label>
          <select style={inputStyle} value={data.maritalStatus || ""} onChange={e => set("maritalStatus", e.target.value)}>
            <option value="">— Select —</option>
            {["Single", "Married", "Divorced", "Widowed"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <Label>SEX</Label>
          <select style={inputStyle} value={data.sex || ""} onChange={e => set("sex", e.target.value)}>
            <option value="">— Select —</option>
            <option value="M">Male (M)</option>
            <option value="F">Female (F)</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <Label>DATE OF BIRTH</Label>
          <input style={inputStyle} type="date" value={data.dob || ""} onChange={e => set("dob", e.target.value)} />
        </div>
      </div>
      {showRelation && onRelationChange && (
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Label>RELATION TO HEAD</Label>
            <select style={inputStyle} value={relation || "son"} onChange={e => onRelationChange(e.target.value as Relation)}>
              {(Object.entries(RELATION_LABELS) as [Relation, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <Label>ALIYAH STATUS</Label>
            <select style={inputStyle} value={aliyah || "unknown"} onChange={e => onAliyahChange?.(e.target.value as AliyahStatus)}>
              {(Object.entries(ALIYAH_LABELS) as [AliyahStatus, { label: string }][]).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, fontWeight: 700, color: "#d4a843", letterSpacing: "0.08em", borderBottom: "1px solid rgba(212,168,67,0.2)", paddingBottom: 4, marginTop: 2 }}>
        FAMILY LINEAGE
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Label>FATHER'S NAME</Label>
          <input style={inputStyle} placeholder="Father's full name" value={data.fatherName || ""} onChange={e => set("fatherName", e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <Label>MOTHER'S NAME</Label>
          <input style={inputStyle} placeholder="Mother's full name" value={data.motherName || ""} onChange={e => set("motherName", e.target.value)} />
        </div>
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, color: "#d4a843", letterSpacing: "0.08em", borderBottom: "1px solid rgba(212,168,67,0.2)", paddingBottom: 4, marginTop: 2 }}>
        RELIGIOUS &amp; TRAVEL DOCUMENT
      </div>
      <Field label="DATE OF JUDAISM PRACTICE">
        <input style={inputStyle} type="date" value={data.dateOfJudaismPractice || ""} onChange={e => set("dateOfJudaismPractice", e.target.value)} />
      </Field>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 2 }}>
          <Label>PASSPORT NUMBER</Label>
          <input style={inputStyle} placeholder="Passport / ID No." value={data.passportNo || ""} onChange={e => set("passportNo", e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <Label>ISSUE DATE</Label>
          <input style={inputStyle} type="date" value={data.passportIssueDate || ""} onChange={e => set("passportIssueDate", e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <Label>EXPIRY DATE</Label>
          <input style={inputStyle} type="date" value={data.passportExpiryDate || ""} onChange={e => set("passportExpiryDate", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   EXPORT — CSV
══════════════════════════════════════════════════════════════ */

function exportCSV(branch: Branch) {
  const esc = (s?: string) => `"${(s || "").replace(/"/g, '""')}"`;

  const header = [
    "Sl.No", "Surname", "Name (Adhaar/Passport)", "Aadhar/Teudat No.", "Hebrew Name",
    "Marital Status", "Sex", "Date of Birth", "Father's Name", "Mother's Name",
    "Date of Judaism Practice", "Passport No.", "Passport Date of Issue", "Passport Date of Expiry",
    "Relation to Head", "Aliyah Status",
  ].join(",");

  const rows: string[] = [
    "BNEI MENASHE COUNCIL INDIA CENSUS 2026 - 2027",
    "Regd. No. 23/SR/2010-CCP",
    "Head Office: Beith Shalom B.Vengnom Churachandpur Manipur India - 795128",
    `Name of Community: ${esc(branch.name)}    City: ${esc(branch.cityName)}`,
    `Local Administrator: ${esc(branch.adminName)}`,
    "",
    header,
  ];

  branch.families.forEach(fam => {
    const h = fam.headCensus;
    rows.push([
      1, esc(h.surname), esc(h.namePerPassport), esc(h.aadharNo), esc(h.hebrewName),
      esc(h.maritalStatus), esc(h.sex), esc(h.dob), esc(h.fatherName), esc(h.motherName),
      esc(h.dateOfJudaismPractice), esc(h.passportNo), esc(h.passportIssueDate), esc(h.passportExpiryDate),
      "Head of Family", esc(ALIYAH_LABELS[fam.headAliyah].label),
    ].join(","));
    fam.members.forEach((m, i) => {
      rows.push([
        i + 2, esc(m.surname), esc(m.namePerPassport), esc(m.aadharNo), esc(m.hebrewName),
        esc(m.maritalStatus), esc(m.sex), esc(m.dob), esc(m.fatherName), esc(m.motherName),
        esc(m.dateOfJudaismPractice), esc(m.passportNo), esc(m.passportIssueDate), esc(m.passportExpiryDate),
        esc(RELATION_LABELS[m.relation]), esc(ALIYAH_LABELS[m.aliyahStatus].label),
      ].join(","));
    });
    rows.push("");
  });

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${branch.name.replace(/\s+/g, "_")}_Census_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════════════════
   EXPORT — PDF DOWNLOAD (direct save, no print dialog)
══════════════════════════════════════════════════════════════ */

async function downloadPDF(branch: Branch) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const fmt = (s?: string) => s || "";
  const fmtDate = (s?: string) => {
    if (!s) return "";
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-GB");
  };

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 12;

  branch.families.forEach((fam, famIdx) => {
    if (famIdx > 0) doc.addPage();

    let y = 14;

    /* ── Header ── */
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.text("BNEI MENASHE COUNCIL INDIA CENSUS 2026 - 2027", pageW / 2, y, { align: "center" });
    y += 5.5;
    doc.setFont("times", "normal");
    doc.setFontSize(8.5);
    doc.text("Regd. No. 23/SR/2010-CCP", pageW / 2, y, { align: "center" });
    y += 4.5;
    doc.text("Head Office: Beith Shalom B.Vengnom, Churachandpur, Manipur, India - 795128", pageW / 2, y, { align: "center" });
    y += 9;

    /* ── Community / Head row ── */
    doc.setFont("times", "bold");
    doc.setFontSize(9.5);
    const leftLabel = "Name of the Community:";
    const rightLabel = "H Head of the Family:";
    doc.text(leftLabel, margin, y);
    const leftLabelW = doc.getTextWidth(leftLabel);
    const communityVal = fmt(branch.name);
    doc.setFont("times", "normal");
    doc.text(communityVal, margin + leftLabelW + 2, y);
    doc.line(margin + leftLabelW + 1, y + 0.8, margin + leftLabelW + 1 + 85, y + 0.8);

    const rightX = pageW / 2 + 8;
    doc.setFont("times", "bold");
    doc.text(rightLabel, rightX, y);
    const rightLabelW = doc.getTextWidth(rightLabel);
    doc.setFont("times", "normal");
    const headVal = fmt(fam.headCensus.namePerPassport || fam.headName);
    doc.text(headVal, rightX + rightLabelW + 2, y);
    doc.line(rightX + rightLabelW + 1, y + 0.8, rightX + rightLabelW + 1 + 72, y + 0.8);
    y += 8;

    /* ── Table rows ── */
    const dataRows: CensusRow[] = [
      fam.headCensus,
      ...fam.members.slice(0, 9).map(m => m as CensusRow),
    ];
    while (dataRows.length < 10) dataRows.push({});

    const body = dataRows.map((r, i) => [
      String(i + 1),
      fmt(r.surname),
      fmt(r.namePerPassport),
      fmt(r.aadharNo),
      fmt(r.hebrewName),
      fmt(r.maritalStatus),
      fmt(r.sex),
      fmtDate(r.dob),
      fmt(r.fatherName),
      fmt(r.motherName),
      fmtDate(r.dateOfJudaismPractice),
      fmt(r.passportNo),
      fmtDate(r.passportIssueDate),
      fmtDate(r.passportExpiryDate),
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [
        [
          { content: "Sl.\nNo",                            rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "Surname",                            rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "Name According to\nAdhaar/Passport", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "Aadhar /\nTeudat No.",               rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "Hebrew\nName",                       rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "Marital\nStatus",                    rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "Sex\nM/F",                           rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "Date of\nBirth",                     rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "Father's\nName",                     rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "Mother's\nName",                     rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "Date of\nJudaism\nPractice",         rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "Passport No.",                       rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "Passport",                           colSpan: 2, styles: { halign: "center" } },
        ],
        [
          { content: "Date of\nIssue",  styles: { halign: "center", valign: "middle" } },
          { content: "Date of\nExpiry", styles: { halign: "center", valign: "middle" } },
        ],
      ],
      body,
      styles: {
        font: "times",
        fontSize: 7,
        cellPadding: 2,
        halign: "center",
        valign: "middle",
        lineColor: [0, 0, 0] as [number, number, number],
        lineWidth: 0.3,
        textColor: [0, 0, 0] as [number, number, number],
        fillColor: false as unknown as [number, number, number],
      },
      headStyles: {
        fillColor: [255, 255, 255] as [number, number, number],
        textColor: [0, 0, 0] as [number, number, number],
        fontStyle: "bold",
        fontSize: 7,
      },
      bodyStyles: {
        fillColor: false as unknown as [number, number, number],
        minCellHeight: 8,
      },
      columnStyles: {
        0:  { cellWidth: 9 },
        3:  { cellWidth: 20 },
        5:  { cellWidth: 16 },
        6:  { cellWidth: 10 },
        7:  { cellWidth: 18 },
        10: { cellWidth: 18 },
        12: { cellWidth: 18 },
        13: { cellWidth: 18 },
      },
    });

    /* ── Signatures ── */
    const tableBottom = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    const sigY = tableBottom + 20;
    const third = (pageW - margin * 2) / 3;
    const sigLabels = [
      "Signature of head of the Family",
      "Community Chairman/Secretary",
      "BMC(I) Chairman/Secretary",
    ];
    sigLabels.forEach((label, i) => {
      const cx = margin + third * i + third / 2;
      const lineHalf = 30;
      doc.setDrawColor(0);
      doc.setLineWidth(0.4);
      doc.line(cx - lineHalf, sigY, cx + lineHalf, sigY);
      doc.setFont("times", "bold");
      doc.setFontSize(8);
      doc.text(label, cx, sigY + 5, { align: "center" });
    });
  });

  const fileName = `${branch.name.replace(/[^a-zA-Z0-9]+/g, "_")}_Census_2026-27.pdf`;
  doc.save(fileName);
}

/* ══════════════════════════════════════════════════════════════
   EXPORT — OFFICIAL BMC PRINT FORM
   Mirrors the official BNEI MENASHE COUNCIL INDIA CENSUS form
══════════════════════════════════════════════════════════════ */

function exportPrint(branch: Branch) {
  const fmt = (s?: string) => (s || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const fmtDate = (s?: string) => {
    if (!s) return "";
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-GB");
  };

  /* Build one form page per family — exactly 10 rows per official form */
  const pages = branch.families.map(fam => {
    const dataRows: { sl: number; data: CensusRow }[] = [
      { sl: 1, data: fam.headCensus },
      ...fam.members.slice(0, 9).map((m, i) => ({ sl: i + 2, data: m as CensusRow })),
    ];
    /* Pad with empty rows to always reach exactly 10 */
    while (dataRows.length < 10) {
      dataRows.push({ sl: dataRows.length + 1, data: {} });
    }

    const tableRows = dataRows.map(r => `
      <tr>
        <td class="c-sl">${r.sl}</td>
        <td>${fmt(r.data.surname)}</td>
        <td>${fmt(r.data.namePerPassport)}</td>
        <td>${fmt(r.data.hebrewName)}</td>
        <td class="c-sm">${fmt(r.data.maritalStatus)}</td>
        <td class="c-sm">${fmt(r.data.sex)}</td>
        <td class="c-sm">${fmtDate(r.data.dob)}</td>
        <td>${fmt(r.data.fatherName)}</td>
        <td>${fmt(r.data.motherName)}</td>
        <td class="c-sm">${fmtDate(r.data.dateOfJudaismPractice)}</td>
        <td>${fmt(r.data.passportNo)}</td>
        <td class="c-sm">${fmtDate(r.data.passportIssueDate)}</td>
        <td class="c-sm">${fmtDate(r.data.passportExpiryDate)}</td>
      </tr>`).join("");

    return `
    <div class="page">
      <div class="form-header">
        <div class="form-title">BNEI MENASHE COUNCIL INDIA CENSUS 2026 - 2027</div>
        <div class="form-regd">Regd. No. 23/SR/2010-CCP</div>
        <div class="form-addr">Head Office: Beith Shalom B.Vengnom, Churachandpur, Manipur, India - 795128</div>
      </div>

      <div class="top-fields">
        <div class="top-field">
          <span class="field-label">Name of the Community:</span>
          <span class="field-value">${fmt(branch.name)}</span>
        </div>
        <div class="top-field">
          <span class="field-label">H Head of the Family:</span>
          <span class="field-value">${fmt(fam.headCensus.namePerPassport || fam.headName)}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="c-sl" rowspan="2">Sl.<br/>No</th>
            <th rowspan="2">Surname</th>
            <th rowspan="2">Name<br/>According to<br/>Adhaar/Passport</th>
            <th rowspan="2">Hebrew<br/>Name</th>
            <th rowspan="2">Marital<br/>Status</th>
            <th rowspan="2">Sex<br/>M/F</th>
            <th rowspan="2">Date of<br/>Birth</th>
            <th rowspan="2">Father's<br/>Name</th>
            <th rowspan="2">Mother's<br/>Name</th>
            <th rowspan="2">Date of<br/>Judaism<br/>Practice</th>
            <th rowspan="2">Passport No.</th>
            <th colspan="2">Passport</th>
          </tr>
          <tr>
            <th>Date of<br/>Issue</th>
            <th>Date of<br/>Expiry</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>

      <div class="signatures">
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-label">Signature of head of the Family</div>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-label">Community Chairman/Secretary</div>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-label">BMC(I) Chairman/Secretary</div>
        </div>
      </div>
    </div>`;
  }).join('<div class="page-break"></div>');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>BMC Census 2026-27 — ${branch.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 9pt; color: #000; background: #fff; }
    .page { padding: 18mm 15mm 15mm; min-height: 297mm; }
    .page-break { page-break-after: always; }

    /* Header */
    .form-header { text-align: center; margin-bottom: 12px; }
    .form-title  { font-size: 13pt; font-weight: bold; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 4px; }
    .form-regd   { font-size: 8.5pt; margin-bottom: 2px; }
    .form-addr   { font-size: 8.5pt; }

    /* Top meta row — community name + head of family */
    .top-fields  { display: flex; gap: 40px; margin: 10px 0 10px; font-size: 9.5pt; }
    .top-field   { flex: 1; white-space: nowrap; }
    .field-label { font-weight: bold; margin-right: 4px; }
    .field-value { border-bottom: 1px solid #000; display: inline-block; min-width: 170px; padding: 0 4px; }

    /* Table — strict official layout */
    table  { width: 100%; border-collapse: collapse; font-size: 7.5pt; margin-top: 4px; }
    th, td { border: 1px solid #000; padding: 3px 2px; vertical-align: middle; text-align: center; }
    th     { background: #fff; font-weight: bold; font-size: 7pt; line-height: 1.25; }
    td     { height: 24px; font-size: 7.5pt; background: #fff; }
    .c-sl  { width: 22px; }
    .c-sm  { width: 42px; }

    /* Signature row */
    .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
    .sig-block  { flex: 1; text-align: center; padding: 0 12px; }
    .sig-line   { border-top: 1px solid #000; margin-bottom: 6px; margin-top: 36px; }
    .sig-label  { font-size: 8pt; font-weight: bold; }

    @media print {
      body  { margin: 0; }
      .page { padding: 14mm 12mm 12mm; }
      .page-break { page-break-after: always; }
    }
  </style>
</head>
<body>
  ${pages}
  <script>window.onload = () => setTimeout(() => window.print(), 300);<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

/* ══════════════════════════════════════════════════════════════
   ACCESS DENIED
══════════════════════════════════════════════════════════════ */
function AdminAccessDenied() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "36px 24px", gap: 18 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
        🔒
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
          Administrator Access Required
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 260, lineHeight: 1.55 }}>
          This panel is restricted to the Bnei Menashe Council administrator. Please sign in with an authorized account.
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMMUNITY MEMBER CENSUS SUBMISSION FORM
══════════════════════════════════════════════════════════════ */
function CommunitySubmitForm({
  allBranches,
  onSubmit,
  onCancel,
  prefill,
  defaultBranchId,
}: {
  allBranches: { id: string; name: string; cityName: string; logoUrl?: string; synagogueImageUrl?: string }[];
  onSubmit: (entry: Omit<MemberSubmissionEntry, "id" | "submittedAt" | "status">) => void;
  onCancel: () => void;
  prefill?: MemberSubmissionEntry;
  defaultBranchId?: string;
}) {
  const isResubmit = !!prefill;
  const [selectedBranchId, setSelectedBranchId] = useState(prefill?.branchId || defaultBranchId || allBranches[0]?.id || "");
  const [submitterName, setSubmitterName] = useState(prefill?.submitterName || "");
  const [headCensus, setHeadCensus] = useState<CensusRow>(prefill?.headCensus || {});
  const [members, setMembers] = useState<Array<Omit<FamilyMember, "id"> & { id: string }>>(prefill?.members || []);
  const [addingMember, setAddingMember] = useState(false);
  const [memberDraft, setMemberDraft] = useState<Omit<FamilyMember, "id">>({ relation: "son", aliyahStatus: "unknown" });
  const [submitterNote, setSubmitterNote] = useState(prefill?.submitterNote || "");
  const [submitted, setSubmitted] = useState(false);

  const selectedBranch = allBranches.find(b => b.id === selectedBranchId);

  function handleSubmit() {
    if (!submitterName.trim() || !selectedBranchId) return;
    onSubmit({
      branchId: selectedBranchId,
      branchName: selectedBranch?.name || "",
      submitterName: submitterName.trim(),
      submitterNote: submitterNote.trim() || undefined,
      headCensus,
      members,
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "28px 0", textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>{isResubmit ? "🔄" : "✅"}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#4ade80" }}>{isResubmit ? "Resubmission Sent!" : "Submission Received!"}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 280 }}>
          {isResubmit
            ? <>Your corrected details have been sent back to the Local Admin of <strong>{selectedBranch?.name}</strong>. You can check status again shortly.</>
            : <>Your census details have been sent to the Local Admin of <strong>{selectedBranch?.name}</strong>. They will review and confirm your entry.</>}
        </div>
        <button onClick={onCancel} style={{ padding: "12px 28px", borderRadius: 12, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", background: "var(--gold)", color: "#1a0f00" }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {isResubmit && prefill?.reviewNote && (
        <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 20 }}>📝</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 2 }}>Admin's rejection note</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic" }}>"{prefill.reviewNote}"</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Please correct the details below and resubmit.</div>
          </div>
        </div>
      )}
      <div style={{ padding: "12px 14px", borderRadius: 12, background: isResubmit ? "rgba(250,204,21,0.08)" : "rgba(79,142,247,0.08)", border: `1px solid ${isResubmit ? "rgba(250,204,21,0.3)" : "rgba(79,142,247,0.25)"}`, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>{isResubmit ? "✏️" : "📝"}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: isResubmit ? "#facc15" : "#4f8ef7" }}>{isResubmit ? "Correct & Resubmit" : "Submit Your Census Details"}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{isResubmit ? "Update the details below. Your Local Admin will review the corrected entry." : "Propose your family's official BMC census entry. Your Local Admin will review and approve it."}</div>
        </div>
      </div>

      {allBranches.length === 0 ? (
        <div style={{ padding: "20px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📍</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>No branches registered yet</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.55 }}>Contact your Local Admin to register your congregation first. Once their branch is registered, you will be able to submit your details here.</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#d4a843", letterSpacing: "0.08em", borderBottom: "1px solid rgba(212,168,67,0.2)", paddingBottom: 4 }}>
            YOUR COMMUNITY
          </div>

          <Field label="SELECT YOUR BRANCH / CONGREGATION">
            <select style={inputStyle} value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)}>
              {allBranches.map(b => <option key={b.id} value={b.id}>{b.name} · {b.cityName}</option>)}
            </select>
          </Field>

          {selectedBranch && (selectedBranch.logoUrl || selectedBranch.synagogueImageUrl) && (
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(74,222,128,0.3)" }}>
              {selectedBranch.synagogueImageUrl ? (
                /* Synagogue photo as banner with logo badge */
                <div style={{ position: "relative", height: 90, overflow: "hidden" }}>
                  <img src={selectedBranch.synagogueImageUrl} alt={`${selectedBranch.name} synagogue`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.62))" }} />
                  {selectedBranch.logoUrl && (
                    <img src={selectedBranch.logoUrl} alt={`${selectedBranch.name} logo`} style={{ position: "absolute", bottom: 9, left: 10, width: 34, height: 34, borderRadius: 8, objectFit: "cover", border: "2px solid rgba(255,255,255,0.88)", boxShadow: "0 1px 6px rgba(0,0,0,0.4)" }} />
                  )}
                  <div style={{ position: "absolute", bottom: 9, left: selectedBranch.logoUrl ? 52 : 10, right: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>{selectedBranch.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 1 }}>🇮🇳 {selectedBranch.cityName}</div>
                  </div>
                </div>
              ) : selectedBranch.logoUrl ? (
                /* Logo only — no photo */
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(74,222,128,0.06)" }}>
                  <img src={selectedBranch.logoUrl} alt={`${selectedBranch.name} logo`} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{selectedBranch.name}</div>
                </div>
              ) : null}
              <div style={{ padding: "7px 12px", background: "rgba(74,222,128,0.07)", fontSize: 11, color: "#4ade80", fontWeight: 600 }}>
                ✓ Is this your community? Confirm before submitting.
              </div>
            </div>
          )}

          <Field label="YOUR FULL NAME (for identification)">
            <input style={inputStyle} placeholder="Your full name as you'd like to be identified" value={submitterName} onChange={e => setSubmitterName(e.target.value)} />
          </Field>

          <div style={{ fontSize: 10, fontWeight: 700, color: "#d4a843", letterSpacing: "0.08em", borderBottom: "1px solid rgba(212,168,67,0.2)", paddingBottom: 4 }}>
            HEAD OF FAMILY — OFFICIAL CENSUS FIELDS
          </div>

          <CensusRowForm data={headCensus} onChange={setHeadCensus} />

          <div style={{ fontSize: 10, fontWeight: 700, color: "#d4a843", letterSpacing: "0.08em", borderBottom: "1px solid rgba(212,168,67,0.2)", paddingBottom: 4, marginTop: 4 }}>
            FAMILY MEMBERS ({members.length})
          </div>

          {members.map((m, idx) => (
            <div key={m.id} style={{ padding: "10px 12px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{m.namePerPassport || m.surname || "—"}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{RELATION_LABELS[m.relation]}{m.dob ? ` · DOB: ${m.dob}` : ""}</div>
              </div>
              <button onClick={() => setMembers(p => p.filter((_, i) => i !== idx))} style={{ fontSize: 11, color: "#ef4444", background: "transparent", border: "none", cursor: "pointer" }}>Remove</button>
            </div>
          ))}

          {addingMember ? (
            <div style={{ padding: "12px", borderRadius: 12, background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.25)", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#d4a843", letterSpacing: "0.06em" }}>ADD FAMILY MEMBER</div>
              <CensusRowForm
                data={memberDraft}
                onChange={d => setMemberDraft(prev => ({ ...prev, ...d }))}
                showRelation
                relation={memberDraft.relation}
                onRelationChange={r => setMemberDraft(p => ({ ...p, relation: r }))}
                aliyah={memberDraft.aliyahStatus}
                onAliyahChange={a => setMemberDraft(p => ({ ...p, aliyahStatus: a }))}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    if (!memberDraft.namePerPassport?.trim() && !memberDraft.surname?.trim()) return;
                    setMembers(p => [...p, { ...memberDraft, id: `cm${Date.now()}` }]);
                    setMemberDraft({ relation: "son", aliyahStatus: "unknown" });
                    setAddingMember(false);
                  }}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#d4a843", color: "#1a0f00", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
                >
                  Add Member
                </button>
                <button onClick={() => setAddingMember(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "var(--elevated)", color: "var(--text-muted)", fontWeight: 600, fontSize: 13, border: "1px solid var(--border)", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingMember(true)} style={{ padding: "10px", borderRadius: 10, background: "var(--elevated)", color: "var(--text-muted)", fontWeight: 600, fontSize: 13, border: "1px dashed var(--border)", cursor: "pointer" }}>
              + Add Family Member
            </button>
          )}

          <Field label="NOTE TO LOCAL ADMIN (optional)">
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "inherit", lineHeight: 1.4 } as React.CSSProperties}
              placeholder="Any additional information for your local admin…"
              value={submitterNote}
              onChange={e => setSubmitterNote(e.target.value)}
            />
          </Field>

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              onClick={handleSubmit}
              disabled={!submitterName.trim() || !selectedBranchId}
              style={{ flex: 2, padding: "14px", borderRadius: 12, fontWeight: 700, fontSize: 14, border: "none", cursor: submitterName.trim() && selectedBranchId ? "pointer" : "not-allowed", background: submitterName.trim() && selectedBranchId ? "linear-gradient(135deg, #4f8ef7, #2563eb)" : "var(--elevated)", color: submitterName.trim() && selectedBranchId ? "#fff" : "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <span style={{ fontSize: 16 }}>📤</span> Submit for Review
            </button>
            <button onClick={onCancel} style={{ flex: 1, padding: "14px", borderRadius: 12, fontWeight: 600, fontSize: 13, border: "1px solid var(--border)", background: "var(--elevated)", color: "var(--text-muted)", cursor: "pointer" }}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STATUS CHECK VIEW
══════════════════════════════════════════════════════════════ */
function StatusCheckView({ memberSubmissions, onBack, onResubmit, defaultName }: {
  memberSubmissions: MemberSubmissionEntry[];
  onBack: () => void;
  onResubmit: (ms: MemberSubmissionEntry) => void;
  defaultName?: string;
}) {
  const [query, setQuery] = useState(defaultName || "");
  const [searched, setSearched] = useState(!!defaultName);

  const results = searched && query.trim()
    ? memberSubmissions.filter(ms =>
        ms.submitterName.toLowerCase().includes(query.trim().toLowerCase()) ||
        (ms.headCensus.namePerPassport || "").toLowerCase().includes(query.trim().toLowerCase()) ||
        (ms.headCensus.surname || "").toLowerCase().includes(query.trim().toLowerCase())
      )
    : [];

  const statusConfig: Record<SubmissionStatus, { color: string; bg: string; border: string; icon: string; label: string; desc: string }> = {
    pending:  { color: "#facc15", bg: "rgba(250,204,21,0.08)",  border: "rgba(250,204,21,0.35)",  icon: "⏳", label: "Awaiting Review",  desc: "Your submission has been received and is waiting for Local Admin review." },
    approved: { color: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.3)",   icon: "✅", label: "Approved",          desc: "Your census entry has been approved and added to the community registry." },
    rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.3)",    icon: "❌", label: "Not Approved",      desc: "Your submission was not approved. Please review the admin note below and resubmit." },
  };

  const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.3)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>🔍</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>Check Submission Status</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Enter the name you used when submitting your census details.</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          placeholder="Your name or passport name…"
          value={query}
          onChange={e => { setQuery(e.target.value); setSearched(false); }}
          onKeyDown={e => { if (e.key === "Enter") setSearched(true); }}
        />
        <button
          onClick={() => setSearched(true)}
          disabled={!query.trim()}
          style={{ padding: "9px 18px", borderRadius: 10, fontWeight: 700, fontSize: 13, border: "none", cursor: query.trim() ? "pointer" : "not-allowed", background: query.trim() ? "#a78bfa" : "var(--elevated)", color: query.trim() ? "#fff" : "var(--text-muted)" }}
        >
          Search
        </button>
      </div>

      {searched && results.length === 0 && (
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🕵️</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>No submissions found</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.55, maxWidth: 240, margin: "0 auto" }}>
            No census submission was found matching <strong>"{query}"</strong>. Check the spelling, or submit your details using the button on the Dashboard.
          </div>
        </div>
      )}

      {results.map(ms => {
        const cfg = statusConfig[ms.status];
        return (
          <div key={ms.id} style={{ borderRadius: 14, background: cfg.bg, border: `1px solid ${cfg.border}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>{cfg.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>{ms.submitterName}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: `${cfg.bg}`, border: `1px solid ${cfg.border}`, borderRadius: 20, padding: "1px 10px" }}>{cfg.label}</div>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.55 }}>{cfg.desc}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                  Branch: <strong style={{ color: "var(--text-secondary)" }}>{ms.branchName}</strong>
                  {" · "}Submitted: {fmtDate(ms.submittedAt)}
                  {ms.reviewedAt && <> · Reviewed: {fmtDate(ms.reviewedAt)}</>}
                </div>
              </div>
            </div>

            {ms.reviewNote && (
              <div style={{ borderTop: `1px solid ${cfg.border}`, padding: "10px 16px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 14 }}>📝</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.07em", marginBottom: 2 }}>NOTE FROM LOCAL ADMIN</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic" }}>"{ms.reviewNote}"</div>
                </div>
              </div>
            )}

            {ms.headCensus.namePerPassport && (
              <div style={{ borderTop: `1px solid ${cfg.border}`, padding: "8px 16px", display: "flex", gap: 16 }}>
                {[
                  ["Passport Name", ms.headCensus.namePerPassport],
                  ms.headCensus.surname ? ["Surname", ms.headCensus.surname] : null,
                  ms.headCensus.hebrewName ? ["Hebrew Name", ms.headCensus.hebrewName] : null,
                ].filter((x): x is [string, string] => Boolean(x)).map(([k, v]) => (
                  <div key={k as string}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.07em" }}>{k}</div>
                    <div style={{ fontSize: 11, color: "var(--text-primary)", fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
                {ms.members.length > 0 && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.07em" }}>FAMILY MEMBERS</div>
                    <div style={{ fontSize: 11, color: "var(--text-primary)", fontWeight: 600 }}>{ms.members.length}</div>
                  </div>
                )}
              </div>
            )}

            {/* ── RESUBMIT BUTTON for rejected entries ── */}
            {ms.status === "rejected" && (
              <div style={{ borderTop: `1px solid ${cfg.border}`, padding: "10px 16px" }}>
                <button
                  onClick={() => onResubmit(ms)}
                  style={{ width: "100%", padding: "11px", borderRadius: 10, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #facc15, #d97706)", color: "#1a0f00", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
                >
                  <span style={{ fontSize: 15 }}>✏️</span> Correct &amp; Resubmit
                </button>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", marginTop: 5 }}>
                  Your previous details will be pre-filled — just fix what the admin flagged.
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button onClick={onBack} style={{ padding: "12px", borderRadius: 12, fontWeight: 600, fontSize: 13, border: "1px solid var(--border)", background: "var(--elevated)", color: "var(--text-muted)", cursor: "pointer" }}>
        ← Back to Dashboard
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DASHBOARD (public)
══════════════════════════════════════════════════════════════ */
function Dashboard({ stats, cities, approvedBranches = [], onSubmitRequest, onStatusCheckRequest }: { stats: StatEntry[]; cities: CityEntry[]; approvedBranches?: Branch[]; onSubmitRequest: () => void; onStatusCheckRequest: () => void }) {
  const israelCities = [...cities.filter(c => c.country === "israel")].sort((a, b) => b.pop - a.pop);
  const indiaCities  = [...cities.filter(c => c.country === "india")].sort((a, b) => b.pop - a.pop);
  const maxI = israelCities[0]?.pop || 1;
  const maxIn = indiaCities[0]?.pop || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ padding: "14px 16px", borderRadius: 14, background: "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))", border: "1px solid rgba(212,168,67,0.25)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#d4a843", letterSpacing: "0.08em", marginBottom: 6 }}>COMMUNITY OVERVIEW</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>
          The Bnei Menashe are one of the Lost Tribes of Israel, indigenous to Manipur and Mizoram in Northeast India, now returning to their ancestral homeland through Aliyah.
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {stats.map(s => (
          <div key={s.id} style={{ padding: "14px", borderRadius: 14, background: "var(--card)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--gold)", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.35 }}>{s.label}</div>
            {s.trend && <div style={{ fontSize: 11, fontWeight: 600, color: s.trendUp ? "#4ade80" : "#f87171" }}>{s.trendUp ? "▲" : "▼"} {s.trend}</div>}
          </div>
        ))}
      </div>
      {[
        { label: "DISTRIBUTION IN ISRAEL", list: israelCities, color: "#d4a843", max: maxI },
        { label: "DISTRIBUTION IN INDIA",  list: indiaCities,  color: "#4f8ef7", max: maxIn },
      ].map(({ label, list, color, max }) => (
        <div key={label}>
          <div style={secHdr}>{label} · {list.reduce((s, c) => s + c.pop, 0).toLocaleString()} documented</div>
          <div className="card" style={{ overflow: "hidden" }}>
            {list.map((c, i) => (
              <div key={c.id} style={{ padding: "11px 16px", borderBottom: i < list.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>{c.region}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}> ~{c.pop}</span>
                </div>
                <div style={{ height: 5, background: "var(--elevated)", borderRadius: 3 }}>
                  <div style={{ width: `${Math.round((c.pop / max) * 100)}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}aa)`, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {/* ── APPROVED BRANCHES ── */}
      {approvedBranches.length > 0 && (
        <div>
          <div style={secHdr}>REGISTERED BRANCHES — VERIFIED ✅ · {approvedBranches.length} branch{approvedBranches.length !== 1 ? "es" : ""}</div>
          <div className="card" style={{ overflow: "hidden" }}>
            {approvedBranches.map((b, i) => {
              const total = b.families.reduce((s, f) => s + 1 + f.members.length, 0);
              const inIsrael = b.families.reduce((s, f) =>
                s + (f.headAliyah === "in_israel" ? 1 : 0) + f.members.filter(m => m.aliyahStatus === "in_israel").length, 0);
              return (
                <div key={b.id} style={{ borderBottom: i < approvedBranches.length - 1 ? "1px solid var(--border)" : "none" }}>
                  {/* ── Synagogue photo banner with logo badge ── */}
                  {b.synagogueImageUrl ? (
                    <div style={{ position: "relative", height: 110, overflow: "hidden" }}>
                      <img src={b.synagogueImageUrl} alt={`${b.name} synagogue`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.68) 100%)" }} />
                      {b.logoUrl && (
                        <img src={b.logoUrl} alt={`${b.name} logo`} style={{ position: "absolute", bottom: 10, left: 12, width: 42, height: 42, borderRadius: 10, objectFit: "cover", border: "2px solid rgba(255,255,255,0.9)", boxShadow: "0 2px 8px rgba(0,0,0,0.45)" }} />
                      )}
                      <div style={{ position: "absolute", bottom: 10, left: b.logoUrl ? 64 : 12, right: 70 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.6)", lineHeight: 1.2 }}>{b.name}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.82)", marginTop: 2 }}>🇮🇳 {b.cityName}{b.adminName ? ` · ${b.adminName}` : ""}</div>
                      </div>
                      <div style={{ position: "absolute", top: 8, right: 10, background: "rgba(74,222,128,0.88)", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700, color: "#fff" }}>✅ VERIFIED</div>
                      <div style={{ position: "absolute", bottom: 10, right: 10, textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#4ade80", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{total}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)" }}>members</div>
                      </div>
                    </div>
                  ) : (
                    /* No photo — plain header with logo */
                    <div style={{ padding: "12px 14px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {b.logoUrl && (
                          <img src={b.logoUrl} alt={`${b.name} logo`} style={{ width: 36, height: 36, borderRadius: 9, objectFit: "cover", border: "1px solid rgba(74,222,128,0.35)" }} />
                        )}
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{b.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>🇮🇳 {b.cityName}{b.adminName ? ` · ${b.adminName}` : ""} · ✅ VERIFIED</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>{total}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>members</div>
                      </div>
                    </div>
                  )}
                  {/* ── Stats row ── */}
                  <div style={{ display: "flex", gap: 8, padding: "10px 12px 12px" }}>
                    <div style={{ flex: 1, padding: "5px 8px", borderRadius: 8, background: "rgba(79,142,247,0.08)", textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#4f8ef7" }}>{b.families.length}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Families</div>
                    </div>
                    <div style={{ flex: 1, padding: "5px 8px", borderRadius: 8, background: "rgba(74,222,128,0.08)", textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>{inIsrael}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>In Israel</div>
                    </div>
                    <div style={{ flex: 1, padding: "5px 8px", borderRadius: 8, background: "rgba(250,204,21,0.08)", textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#facc15" }}>{total - inIsrael}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Awaiting</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ padding: "12px 16px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>Data compiled from Shavei Israel, community registers, and field surveys. Last updated: Sivan 5785</div>
      </div>

      {/* ── COMMUNITY SUBMISSION CTA ── */}
      <div style={{ borderRadius: 14, background: "linear-gradient(135deg, rgba(79,142,247,0.12), rgba(79,142,247,0.04))", border: "1px solid rgba(79,142,247,0.35)", padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 24 }}>📝</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>Community Census</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Submit your family details or check whether your previous submission was reviewed.</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onSubmitRequest}
            style={{ flex: 2, padding: "13px", borderRadius: 12, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #4f8ef7, #2563eb)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <span style={{ fontSize: 15 }}>📤</span> Submit My Details
          </button>
          <button
            onClick={onStatusCheckRequest}
            style={{ flex: 1, padding: "13px", borderRadius: 12, fontWeight: 700, fontSize: 13, border: "1px solid rgba(167,139,250,0.4)", background: "rgba(167,139,250,0.08)", color: "#a78bfa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <span style={{ fontSize: 15 }}>🔍</span> Check Status
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ADMIN PANEL
══════════════════════════════════════════════════════════════ */
function AdminPanel({ stats, cities, onSave, submissions = [], onReview }: {
  stats: StatEntry[]; cities: CityEntry[];
  onSave: (s: StatEntry[], c: CityEntry[]) => void;
  submissions?: Submission[];
  onReview: (id: string, status: "approved" | "rejected", note?: string) => void;
}) {
  const [ls, setLs] = useState<StatEntry[]>(stats.map(s => ({ ...s })));
  const [lc, setLc] = useState<CityEntry[]>(cities.map(c => ({ ...c })));
  const [saved, setSaved] = useState(false);
  const [newCity, setNewCity] = useState({ name: "", pop: "", region: "", country: "israel" as "israel" | "india" });
  const [adding, setAdding] = useState(false);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  const pending  = submissions.filter(s => s.status === "pending");
  const reviewed = submissions.filter(s => s.status !== "pending");

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── PENDING SUBMISSIONS ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={secHdr}>BRANCH SUBMISSIONS</div>
          {pending.length > 0 && (
            <div style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: "#ef4444", borderRadius: 20, padding: "1px 8px", lineHeight: "18px" }}>{pending.length}</div>
          )}
        </div>

        {submissions.length === 0 && (
          <div style={{ padding: "18px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>No submissions received yet. Local Admins submit their branch registry from the Local Admin tab.</div>
        )}

        {pending.map(sub => {
          const totalMembers = sub.branch.families.reduce((s, f) => s + 1 + f.members.length, 0);
          const isOpen = expandedSub === sub.id;
          return (
            <div key={sub.id} style={{ borderRadius: 14, background: "var(--card)", border: "1px solid rgba(250,204,21,0.35)", marginBottom: 10, overflow: "hidden" }}>
              <div onClick={() => setExpandedSub(isOpen ? null : sub.id)} style={{ padding: "12px 14px", cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#facc15", marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{sub.branch.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    🇮🇳 {sub.branch.cityName} · {sub.branch.families.length} families · {totalMembers} members
                  </div>
                  {sub.branch.adminName && <div style={{ fontSize: 11, color: "#4f8ef7", marginTop: 1 }}>Submitted by: {sub.branch.adminName}</div>}
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>⏱ {fmtDate(sub.submittedAt)}</div>
                </div>
                <span style={{ fontSize: 12, color: "var(--text-muted)", transform: isOpen ? "rotate(90deg)" : "none", transition: "0.15s", display: "inline-block" }}>›</span>
              </div>

              {isOpen && (
                <div style={{ borderTop: "1px solid var(--border)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Family preview */}
                  {sub.branch.families.map((f, fi) => (
                    <div key={f.id} style={{ padding: "8px 10px", borderRadius: 10, background: "var(--elevated)", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                        #{fi + 1} — {f.headCensus.namePerPassport || f.headName}
                        {f.headCensus.surname && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> ({f.headCensus.surname})</span>}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                        {1 + f.members.length} members · {f.headCensus.passportNo ? `Passport: ${f.headCensus.passportNo}` : "No passport recorded"}
                      </div>
                      {f.members.length > 0 && (
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
                          {f.members.map(m => `${m.namePerPassport || "—"} (${RELATION_LABELS[m.relation]})`).join(" · ")}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Review note */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>REVIEW NOTE (optional)</div>
                    <textarea
                      style={{ ...inputStyle, minHeight: 56, resize: "vertical", fontFamily: "inherit", fontSize: 12, lineHeight: 1.4 } as React.CSSProperties}
                      placeholder="Add a note to the Local Admin (optional)…"
                      value={reviewNotes[sub.id] || ""}
                      onChange={e => setReviewNotes(p => ({ ...p, [sub.id]: e.target.value }))}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => { onReview(sub.id, "approved", reviewNotes[sub.id]); setExpandedSub(null); }}
                      style={{ flex: 1, padding: "11px", borderRadius: 10, background: "#4ade80", color: "#052e16", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => { onReview(sub.id, "rejected", reviewNotes[sub.id]); setExpandedSub(null); }}
                      style={{ flex: 1, padding: "11px", borderRadius: 10, background: "rgba(239,68,68,0.12)", color: "#ef4444", fontWeight: 700, fontSize: 13, border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer" }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {reviewed.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: 6 }}>REVIEWED</div>
            {reviewed.map(sub => (
              <div key={sub.id} style={{ padding: "10px 12px", borderRadius: 12, background: "var(--card)", border: `1px solid ${sub.status === "approved" ? "rgba(74,222,128,0.25)" : "rgba(239,68,68,0.2)"}`, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>{sub.status === "approved" ? "✅" : "❌"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{sub.branch.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    {sub.status === "approved" ? "Approved" : "Rejected"} · {sub.reviewedAt ? fmtDate(sub.reviewedAt) : ""}
                  </div>
                  {sub.reviewNote && <div style={{ fontSize: 10, color: "var(--text-muted)", fontStyle: "italic", marginTop: 1 }}>"{sub.reviewNote}"</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: "var(--border)" }} />

      <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.25)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>🏛️</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#d4a843" }}>Global Administrative Access</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Edit all statistics and city records across all regions.</div>
        </div>
      </div>
      <div>
        <div style={secHdr}>EDIT GLOBAL STATISTICS</div>
        {ls.map(s => (
          <div key={s.id} style={{ padding: "10px 12px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{s.icon} {s.label}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inputStyle, flex: 2 }} value={s.value} placeholder="Value" onChange={e => setLs(p => p.map(x => x.id === s.id ? { ...x, value: e.target.value } : x))} />
              <input style={{ ...inputStyle, flex: 1 }} value={s.trend || ""} placeholder="Trend" onChange={e => setLs(p => p.map(x => x.id === s.id ? { ...x, trend: e.target.value } : x))} />
            </div>
          </div>
        ))}
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={secHdr}>CITY RECORDS</div>
          <button onClick={() => setAdding(v => !v)} style={{ fontSize: 11, fontWeight: 700, color: "#d4a843", background: "transparent", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>+ Add</button>
        </div>
        {adding && (
          <div style={{ padding: 12, borderRadius: 12, background: "var(--card)", border: "1px solid rgba(212,168,67,0.3)", marginBottom: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            <input style={inputStyle} placeholder="City name" value={newCity.name} onChange={e => setNewCity(p => ({ ...p, name: e.target.value }))} />
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Population" type="number" value={newCity.pop} onChange={e => setNewCity(p => ({ ...p, pop: e.target.value }))} />
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Region" value={newCity.region} onChange={e => setNewCity(p => ({ ...p, region: e.target.value }))} />
            </div>
            <select style={inputStyle} value={newCity.country} onChange={e => setNewCity(p => ({ ...p, country: e.target.value as "israel" | "india" }))}>
              <option value="israel">🇮🇱 Israel</option><option value="india">🇮🇳 India</option>
            </select>
            <button onClick={() => { if (!newCity.name || !newCity.pop) return; setLc(p => [...p, { id: `c${Date.now()}`, name: newCity.name, pop: parseInt(newCity.pop) || 0, region: newCity.region || "—", country: newCity.country }]); setNewCity({ name: "", pop: "", region: "", country: "israel" }); setAdding(false); }} style={{ padding: 10, borderRadius: 10, background: "#d4a843", color: "#1a0f00", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>Add City</button>
          </div>
        )}
        {lc.map(c => (
          <div key={c.id} style={{ padding: "10px 12px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{c.country === "israel" ? "🇮🇱" : "🇮🇳"} {c.name}</span>
              <button onClick={() => setLc(p => p.filter(x => x.id !== c.id))} style={{ fontSize: 11, color: "#ef4444", background: "transparent", border: "none", cursor: "pointer" }}>Remove</button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inputStyle, flex: 1 }} type="number" value={c.pop} onChange={e => setLc(p => p.map(x => x.id === c.id ? { ...x, pop: parseInt(e.target.value) || 0 } : x))} />
              <input style={{ ...inputStyle, flex: 2 }} value={c.region} onChange={e => setLc(p => p.map(x => x.id === c.id ? { ...x, region: e.target.value } : x))} />
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => { onSave(ls, lc); setSaved(true); setTimeout(() => setSaved(false), 2500); }} style={{ padding: 14, borderRadius: 12, fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", background: saved ? "#4ade80" : "#d4a843", color: saved ? "#fff" : "#1a0f00", transition: "background 0.3s" }}>
        {saved ? "✓ Changes Saved" : "Save All Changes"}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SHARE / IMPORT HELPERS
══════════════════════════════════════════════════════════════ */

interface SharePayload {
  v: 1; branchName: string; cityName: string; familyId: string;
  headName: string; headCensus: CensusRow; members: FamilyMember[];
}

interface ReturnPayload {
  v: 1; familyId: string; headCensus: CensusRow; members: FamilyMember[];
  collaboratorName: string; submittedAt: string;
}

function encodeSharePayload(data: object): string {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function decodeSharePayload<T>(token: string): T | null {
  try {
    const pad = token.length % 4 === 0 ? "" : "=".repeat(4 - token.length % 4);
    const binary = atob(token.replace(/-/g, "+").replace(/_/g, "/") + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch { return null; }
}

function buildShareUrl(branch: { name: string; cityName: string }, family: Family): string {
  const payload: SharePayload = {
    v: 1, branchName: branch.name, cityName: branch.cityName,
    familyId: family.id, headName: family.headName,
    headCensus: family.headCensus, members: family.members,
  };
  return `${window.location.origin}${window.location.pathname}?share=${encodeSharePayload(payload)}`;
}

/* ══════════════════════════════════════════════════════════════
   FAMILY CARD
══════════════════════════════════════════════════════════════ */
function FamilyCard({ family, onUpdate, onDelete, branchInfo }: {
  family: Family; onUpdate: (f: Family) => void; onDelete: () => void;
  branchInfo: { name: string; cityName: string };
}) {
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState<"list" | "editHead" | "addMember" | "share" | "import" | number>("list");
  const [importCode, setImportCode] = useState("");
  const [importDecoded, setImportDecoded] = useState<ReturnPayload | null>(null);
  const [importError, setImportError] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const total = 1 + family.members.length;
  const ai = ALIYAH_LABELS[family.headAliyah];

  /* local census edits */
  const [headDraft, setHeadDraft] = useState<CensusRow>({ ...family.headCensus });
  const [memberDraft, setMemberDraft] = useState<Omit<FamilyMember, "id">>({ relation: "son", aliyahStatus: "unknown", surname: "", namePerPassport: "", hebrewName: "", maritalStatus: "", sex: "", dob: "", fatherName: "", motherName: "", dateOfJudaismPractice: "", passportNo: "", passportIssueDate: "", passportExpiryDate: "" });

  function saveHead() {
    onUpdate({ ...family, headCensus: headDraft });
    setView("list");
  }

  function saveMember() {
    if (!memberDraft.namePerPassport?.trim() && !memberDraft.surname?.trim()) return;
    const m: FamilyMember = { id: `m${Date.now()}`, ...memberDraft };
    onUpdate({ ...family, members: [...family.members, m] });
    setMemberDraft({ relation: "son", aliyahStatus: "unknown", surname: "", namePerPassport: "", hebrewName: "", maritalStatus: "", sex: "", dob: "", fatherName: "", motherName: "", dateOfJudaismPractice: "", passportNo: "", passportIssueDate: "", passportExpiryDate: "" });
    setView("list");
  }

  function startEditMember(idx: number) {
    setMemberDraft({ ...family.members[idx] });
    setView(idx);
  }

  function saveEditMember(idx: number) {
    const updated = family.members.map((m, i) => i === idx ? { ...m, ...memberDraft } : m);
    onUpdate({ ...family, members: updated });
    setView("list");
  }

  return (
    <div style={{ borderRadius: 14, background: "var(--card)", border: "1px solid var(--border)", overflow: "hidden", marginBottom: 8 }}>
      <div onClick={() => { setExpanded(v => !v); setView("list"); }} style={{ padding: "13px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>👨</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {family.headCensus.namePerPassport || family.headName}
            {family.headCensus.surname && <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 6 }}>({family.headCensus.surname})</span>}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
            Head of Family · {total} member{total !== 1 ? "s" : ""}
            <span style={{ marginLeft: 6, color: ai.color }}>{ai.dot} {ai.label}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#d4a843", background: "rgba(212,168,67,0.1)", padding: "3px 9px", borderRadius: 20 }}>{total}</div>
          <span style={{ color: "var(--text-muted)", fontSize: 14, transition: "transform 0.2s", display: "inline-block", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>›</span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "12px 14px 14px" }}>

          {/* ── LIST VIEW ── */}
          {view === "list" && (
            <>
              <div style={{ display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap" }}>
                <button onClick={() => { setHeadDraft({ ...family.headCensus }); setView("editHead"); }} style={{ fontSize: 11, fontWeight: 700, color: "#d4a843", background: "transparent", border: "1px solid rgba(212,168,67,0.35)", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>✏️ Edit Head</button>
                <button onClick={() => setView("addMember")} style={{ fontSize: 11, fontWeight: 700, color: "#4f8ef7", background: "transparent", border: "1px solid rgba(79,142,247,0.3)", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>+ Member</button>
                <button onClick={() => { setLinkCopied(false); setView("share"); }} style={{ fontSize: 11, fontWeight: 700, color: "#10b981", background: "transparent", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>📤 Share</button>
                <button onClick={() => { setImportCode(""); setImportDecoded(null); setImportError(""); setView("import"); }} style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", background: "transparent", border: "1px solid rgba(167,139,250,0.35)", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>📥 Import</button>
                <button onClick={onDelete} style={{ fontSize: 11, color: "#ef4444", background: "transparent", border: "none", cursor: "pointer", padding: "5px 6px", marginLeft: "auto" }}>✕</button>
              </div>

              {/* Head summary row */}
              <div style={{ padding: "8px 10px", borderRadius: 10, background: "rgba(212,168,67,0.07)", border: "1px solid rgba(212,168,67,0.2)", marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                  {family.headCensus.namePerPassport || family.headName}
                  {family.headCensus.hebrewName && <span style={{ fontSize: 11, color: "#d4a843", marginLeft: 6 }}>({family.headCensus.hebrewName})</span>}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.5 }}>
                  Head of Family
                  {family.headCensus.sex && <> · {family.headCensus.sex}</>}
                  {family.headCensus.dob && <> · b. {family.headCensus.dob}</>}
                  {family.headCensus.maritalStatus && <> · {family.headCensus.maritalStatus}</>}
                  {family.headCensus.passportNo && <> · Passport: {family.headCensus.passportNo}</>}
                </div>
              </div>

              {family.members.length === 0 && (
                <div style={{ textAlign: "center", padding: "12px 0", color: "var(--text-muted)", fontSize: 12 }}>No members yet — tap "+ Add Member" to register descendants.</div>
              )}

              {family.members.map((m, idx) => (
                <div key={m.id} onClick={() => startEditMember(idx)} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0", borderBottom: idx < family.members.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer" }}>
                  <div style={{ fontSize: 14, marginTop: 1 }}>
                    {m.relation === "spouse" ? "👩" : (m.sex === "F" || m.relation === "daughter" || m.relation === "granddaughter" || m.relation === "daughter_in_law") ? "👧" : "👦"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {m.namePerPassport || "—"}
                      {m.hebrewName && <span style={{ fontSize: 11, color: "#d4a843", marginLeft: 6 }}>({m.hebrewName})</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                      {RELATION_LABELS[m.relation]}
                      {m.sex && <> · {m.sex}</>}
                      {m.dob && <> · b. {m.dob}</>}
                      {m.passportNo && <> · {m.passportNo}</>}
                      <span style={{ marginLeft: 6, color: ALIYAH_LABELS[m.aliyahStatus].color }}>{ALIYAH_LABELS[m.aliyahStatus].dot}</span>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); onUpdate({ ...family, members: family.members.filter(x => x.id !== m.id) }); }} style={{ fontSize: 11, color: "#ef4444", background: "transparent", border: "none", cursor: "pointer", padding: "2px 4px", flexShrink: 0 }}>✕</button>
                </div>
              ))}
            </>
          )}

          {/* ── EDIT HEAD ── */}
          {view === "editHead" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#d4a843", letterSpacing: "0.06em" }}>CENSUS DETAILS — HEAD OF FAMILY</div>
              <CensusRowForm
                data={headDraft}
                onChange={setHeadDraft}
                showRelation={false}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveHead} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "#d4a843", color: "#1a0f00", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>Save Head Details</button>
                <button onClick={() => setView("list")} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "var(--elevated)", color: "var(--text-muted)", fontWeight: 600, fontSize: 13, border: "1px solid var(--border)", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}

          {/* ── ADD / EDIT MEMBER ── */}
          {(view === "addMember" || typeof view === "number") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#4f8ef7", letterSpacing: "0.06em" }}>
                {view === "addMember" ? "NEW FAMILY MEMBER — OFFICIAL CENSUS FIELDS" : `EDIT MEMBER — ${family.members[view as number]?.namePerPassport || ""}`}
              </div>
              <CensusRowForm
                data={memberDraft}
                onChange={d => setMemberDraft(prev => ({ ...prev, ...d }))}
                showRelation={true}
                relation={memberDraft.relation}
                onRelationChange={r => setMemberDraft(prev => ({ ...prev, relation: r }))}
                aliyah={memberDraft.aliyahStatus}
                onAliyahChange={a => setMemberDraft(prev => ({ ...prev, aliyahStatus: a }))}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => typeof view === "number" ? saveEditMember(view) : saveMember()}
                  style={{ flex: 1, padding: "11px", borderRadius: 10, background: "#4f8ef7", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
                >
                  {typeof view === "number" ? "Save Changes" : "Add to Family"}
                </button>
                <button onClick={() => setView("list")} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "var(--elevated)", color: "var(--text-muted)", fontWeight: 600, fontSize: 13, border: "1px solid var(--border)", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}

          {/* ── SHARE VIEW ── */}
          {view === "share" && (() => {
            const url = buildShareUrl(branchInfo, family);
            const wa = `https://wa.me/?text=${encodeURIComponent(`Hi! Please fill in your census details for the Bnei Menashe Council India Census 2026-2027.\n\nTap this link, complete the form, and send me the return code:\n${url}`)}`;
            const mailto = `mailto:?subject=${encodeURIComponent("BMC Census 2026-2027 — Please fill in your details")}&body=${encodeURIComponent(`Dear ${family.headCensus.namePerPassport || family.headName},\n\nPlease fill in your census details for the Bnei Menashe Council India Census 2026-2027.\n\nClick the link below, complete the official form, and send me the return code:\n\n${url}\n\nThank you.`)}`;
            const sms = `sms:?body=${encodeURIComponent(`Hi! Please fill your BMC Census 2026-2027 details using this link:\n${url}\nComplete the form and send me the return code. Thank you.`)}`;
            const qr = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}`;
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", letterSpacing: "0.06em" }}>📤 SHARE CENSUS FORM</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                  Send this link to <strong>{family.headCensus.namePerPassport || family.headName}</strong>. They can open it on their device, fill in the official BMC census fields, and send back a return code for you to import.
                </div>

                {/* URL box */}
                <div style={{ background: "var(--elevated)", borderRadius: 10, padding: "10px 12px", border: "1px solid var(--border)", fontSize: 11, wordBreak: "break-all", color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {url}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => { navigator.clipboard.writeText(url); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2500); }}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, background: linkCopied ? "#10b981" : "var(--elevated)", color: linkCopied ? "#fff" : "var(--text-primary)", fontWeight: 700, fontSize: 13, border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.2s" }}
                  >
                    {linkCopied ? "✓ Copied!" : "📋 Copy Link"}
                  </button>
                  <a href={wa} target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#25d366", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                  >
                    💬 WhatsApp
                  </a>
                  <a href={mailto}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#4f8ef7", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                  >
                    ✉️ Email
                  </a>
                  <a href={sms}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                  >
                    💬 SMS
                  </a>
                </div>

                {/* QR code */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em" }}>OR SCAN QR CODE</div>
                  <img src={qr} alt="QR code" style={{ width: 140, height: 140, borderRadius: 12, border: "1px solid var(--border)" }} />
                </div>

                <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.25)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  After the family fills in their details, they will receive a <strong>return code</strong>. Come back here and tap <strong>📥 Import</strong> to paste and apply their edits.
                </div>
                <button onClick={() => setView("list")} style={{ padding: "10px", borderRadius: 10, background: "var(--elevated)", color: "var(--text-muted)", fontWeight: 600, fontSize: 13, border: "1px solid var(--border)", cursor: "pointer" }}>← Back</button>
              </div>
            );
          })()}

          {/* ── IMPORT VIEW ── */}
          {view === "import" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.06em" }}>📥 IMPORT EDITS FROM FAMILY</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                Paste the return code sent by the family member to preview and apply their census edits.
              </div>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "monospace", fontSize: 11, lineHeight: 1.4 } as React.CSSProperties}
                placeholder="Paste return code here…"
                value={importCode}
                onChange={e => { setImportCode(e.target.value); setImportDecoded(null); setImportError(""); }}
              />
              {importError && <div style={{ fontSize: 11, color: "#ef4444" }}>{importError}</div>}

              {!importDecoded && (
                <button
                  onClick={() => {
                    const decoded = decodeSharePayload<ReturnPayload>(importCode.trim());
                    if (!decoded || decoded.v !== 1) { setImportError("Invalid return code — please check and try again."); return; }
                    if (decoded.familyId !== family.id) { setImportError("This code belongs to a different family. Please check you pasted the correct code."); return; }
                    setImportDecoded(decoded);
                    setImportError("");
                  }}
                  disabled={!importCode.trim()}
                  style={{ padding: "10px", borderRadius: 10, fontWeight: 700, fontSize: 13, border: "none", cursor: importCode.trim() ? "pointer" : "not-allowed", background: importCode.trim() ? "#a78bfa" : "var(--elevated)", color: importCode.trim() ? "#fff" : "var(--text-muted)" }}
                >
                  Decode &amp; Preview
                </button>
              )}

              {importDecoded && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.3)" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>Submitted by: {importDecoded.collaboratorName}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {new Date(importDecoded.submittedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  {/* Show changed fields */}
                  {(() => {
                    const fields: string[] = [];
                    const allKeys: (keyof CensusRow)[] = ["surname","namePerPassport","hebrewName","maritalStatus","sex","dob","fatherName","motherName","dateOfJudaismPractice","passportNo","passportIssueDate","passportExpiryDate"];
                    const labels: Record<string, string> = { surname:"Surname", namePerPassport:"Name (Passport)", hebrewName:"Hebrew Name", maritalStatus:"Marital Status", sex:"Sex", dob:"DOB", fatherName:"Father's Name", motherName:"Mother's Name", dateOfJudaismPractice:"Judaism Practice Date", passportNo:"Passport No.", passportIssueDate:"Passport Issue", passportExpiryDate:"Passport Expiry" };
                    allKeys.forEach(k => {
                      const nv = importDecoded.headCensus[k]; const ov = family.headCensus[k];
                      if (nv && nv !== ov) fields.push(`Head → ${labels[k]}: "${ov || "empty"}" → "${nv}"`);
                    });
                    importDecoded.members.forEach((nm, i) => {
                      const om = family.members[i];
                      if (!om) { fields.push(`Member ${i+2} (${RELATION_LABELS[nm.relation]}): new row`); return; }
                      allKeys.forEach(k => {
                        const nv = nm[k]; const ov = om[k];
                        if (nv && nv !== ov) fields.push(`${RELATION_LABELS[nm.relation]} → ${labels[k]}: "${ov || "empty"}" → "${nv}"`);
                      });
                    });
                    return fields.length > 0 ? (
                      <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--elevated)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, letterSpacing: "0.08em" }}>CHANGES TO APPLY ({fields.length})</div>
                        {fields.map((f, i) => <div key={i} style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.4 }}>• {f}</div>)}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 0" }}>No new changes detected (all fields already filled).</div>
                    );
                  })()}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => {
                        onUpdate({ ...family, headCensus: { ...family.headCensus, ...importDecoded.headCensus }, members: importDecoded.members.length > 0 ? importDecoded.members : family.members });
                        setView("list"); setImportCode(""); setImportDecoded(null);
                      }}
                      style={{ flex: 1, padding: "11px", borderRadius: 10, background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
                    >
                      ✓ Apply All Changes
                    </button>
                    <button onClick={() => { setImportDecoded(null); setImportCode(""); }} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "var(--elevated)", color: "var(--text-muted)", fontWeight: 600, fontSize: 13, border: "1px solid var(--border)", cursor: "pointer" }}>Clear</button>
                  </div>
                </div>
              )}
              <button onClick={() => setView("list")} style={{ padding: "10px", borderRadius: 10, background: "var(--elevated)", color: "var(--text-muted)", fontWeight: 600, fontSize: 13, border: "1px solid var(--border)", cursor: "pointer" }}>← Back</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MEMBER SUBMISSION CARD (used inside BranchRegistryPanel)
══════════════════════════════════════════════════════════════ */
function MemberSubmissionCard({ entry, onReview }: {
  entry: MemberSubmissionEntry;
  onReview: (id: string, status: "approved" | "rejected", note?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";

  return (
    <div style={{ borderRadius: 12, background: "var(--elevated)", border: "1px solid rgba(250,204,21,0.3)", overflow: "hidden" }}>
      <div onClick={() => setExpanded(v => !v)} style={{ padding: "10px 12px", cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#facc15", marginTop: 5, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{entry.submitterName}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
            {entry.headCensus.namePerPassport ? `Passport name: ${entry.headCensus.namePerPassport}` : "No passport name given"}
            {entry.members.length > 0 && ` · ${entry.members.length} family member${entry.members.length > 1 ? "s" : ""}`}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>⏱ {fmtDate(entry.submittedAt)}</div>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)", transform: expanded ? "rotate(90deg)" : "none", transition: "0.15s", display: "inline-block" }}>›</span>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Census fields preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              ["Surname", entry.headCensus.surname],
              ["Name (Passport)", entry.headCensus.namePerPassport],
              ["Hebrew Name", entry.headCensus.hebrewName],
              ["Sex", entry.headCensus.sex],
              ["DOB", entry.headCensus.dob ? fmtDate(entry.headCensus.dob) : undefined],
              ["Father's Name", entry.headCensus.fatherName],
              ["Mother's Name", entry.headCensus.motherName],
              ["Passport No.", entry.headCensus.passportNo],
              ["Judaism Practice", entry.headCensus.dateOfJudaismPractice ? fmtDate(entry.headCensus.dateOfJudaismPractice) : undefined],
            ].filter(([, v]) => v).map(([label, val]) => (
              <div key={label as string} style={{ display: "flex", gap: 8, fontSize: 11 }}>
                <span style={{ color: "var(--text-muted)", minWidth: 100 }}>{label}:</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{val}</span>
              </div>
            ))}
          </div>

          {entry.members.length > 0 && (
            <div style={{ padding: "8px 10px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, letterSpacing: "0.07em" }}>FAMILY MEMBERS</div>
              {entry.members.map((m, i) => (
                <div key={i} style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>
                  • {m.namePerPassport || m.surname || "—"} ({RELATION_LABELS[m.relation]})
                </div>
              ))}
            </div>
          )}

          {entry.submitterNote && (
            <div style={{ padding: "8px 10px", borderRadius: 10, background: "rgba(212,168,67,0.07)", border: "1px solid rgba(212,168,67,0.2)", fontSize: 11, color: "var(--text-secondary)", fontStyle: "italic" }}>
              Note: "{entry.submitterNote}"
            </div>
          )}

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>REVIEW NOTE (optional)</div>
            <textarea
              style={{ ...inputStyle, minHeight: 48, resize: "vertical", fontFamily: "inherit", fontSize: 12, lineHeight: 1.4 } as React.CSSProperties}
              placeholder="Add a note for the community member (optional)…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { onReview(entry.id, "approved", note || undefined); setExpanded(false); }}
              style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#4ade80", color: "#052e16", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
            >
              ✓ Approve
            </button>
            <button
              onClick={() => { onReview(entry.id, "rejected", note || undefined); setExpanded(false); }}
              style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(239,68,68,0.12)", color: "#ef4444", fontWeight: 700, fontSize: 13, border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer" }}
            >
              ✕ Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BRANCH REGISTRY PANEL
══════════════════════════════════════════════════════════════ */
function BranchRegistryPanel({ cities, submission, onSubmit, memberSubmissions = [], onMemberReview, initialBranch }: {
  cities: CityEntry[];
  submission?: Submission;
  onSubmit: (branch: Branch) => void;
  memberSubmissions?: MemberSubmissionEntry[];
  onMemberReview: (id: string, status: "approved" | "rejected", note?: string) => void;
  initialBranch?: Branch;
}) {
  /* If the admin has already submitted a branch (any status), restore it from initialBranch */
  const [branch, setBranch] = useState<Branch | null>(initialBranch || null);
  const [setupName, setSetupName] = useState("");
  const [setupCity, setSetupCity] = useState(cities[0]?.id || "");
  const [setupAdmin, setSetupAdmin] = useState("");
  const [setupDate, setSetupDate] = useState("");
  const [addingFamily, setAddingFamily] = useState(false);
  const [newHeadName, setNewHeadName] = useState("");
  const [newHeadAliyah, setNewHeadAliyah] = useState<AliyahStatus>("unknown");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const synagogueInputRef = useRef<HTMLInputElement>(null);
  const [logoSaveError, setLogoSaveError] = useState<string | null>(null);
  const [synagogueSaveError, setSynagogueSaveError] = useState<string | null>(null);
  const getClerkToken = () => (window as any).Clerk?.session?.getToken() ?? null;
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

  const { uploadFile: uploadLogo, isUploading: isLogoUploading, progress: logoProgress, error: logoUploadError } = useUpload({
    getAuthToken: getClerkToken,
    maxSizeBytes: MAX_IMAGE_BYTES,
    acceptedTypes: ["image/"],
    onSuccess: async (response) => {
      setLogoSaveError(null);
      const url = `/api/storage${response.objectPath}`;
      let updated: Branch | null = null;
      setBranch(b => {
        if (!b) return b;
        updated = { ...b, logoUrl: url };
        return updated;
      });
      if (!updated) return;
      try {
        await saveCensusBranch(updated as any);
      } catch {
        setLogoSaveError("Logo uploaded, but saving it to your branch failed. Check your connection and try again.");
      }
    },
  });
  const { uploadFile: uploadSynagogueImage, isUploading: isSynagogueUploading, progress: synagogueProgress, error: synagogueUploadError } = useUpload({
    getAuthToken: getClerkToken,
    maxSizeBytes: MAX_IMAGE_BYTES,
    acceptedTypes: ["image/"],
    onSuccess: async (response) => {
      setSynagogueSaveError(null);
      const url = `/api/storage${response.objectPath}`;
      let updated: Branch | null = null;
      setBranch(b => {
        if (!b) return b;
        updated = { ...b, synagogueImageUrl: url };
        return updated;
      });
      if (!updated) return;
      try {
        await saveCensusBranch(updated as any);
      } catch {
        setSynagogueSaveError("Photo uploaded, but saving it to your branch failed. Check your connection and try again.");
      }
    },
  });

  /* Load branch from DB on first open (if user is signed in) */
  useEffect(() => {
    if (initialBranch) return;
    fetchCensusBranch().then(b => {
      if (b) setBranch(b as any);
    });
  }, []);

  /* When a member submission is approved, also add the family into the local branch registry */
  function handleMemberReview(id: string, status: "approved" | "rejected", note?: string) {
    if (status === "approved" && branch) {
      const ms = memberSubmissions.find(m => m.id === id);
      if (ms) {
        const newFamily: Family = {
          id: `f${Date.now()}`,
          headName: ms.submitterName,
          headAliyah: "unknown",
          headCensus: { ...ms.headCensus, namePerPassport: ms.headCensus.namePerPassport || ms.submitterName },
          members: ms.members,
        };
        setBranch(b => b ? { ...b, families: [...b.families, newFamily] } : b);
      }
    }
    onMemberReview(id, status, note);
  }

  function createBranch() {
    if (!setupName.trim()) return;
    const city = cities.find(c => c.id === setupCity);
    const newBranch: Branch = { id: `br${Date.now()}`, name: setupName.trim(), cityId: setupCity, cityName: city?.name || "", established: setupDate, adminName: setupAdmin.trim(), families: [] };
    setBranch(newBranch);
    saveCensusBranch(newBranch as any);
  }

  function addFamily() {
    if (!newHeadName.trim() || !branch) return;
    const fam: Family = { id: `f${Date.now()}`, headName: newHeadName.trim(), headAliyah: newHeadAliyah, headCensus: { namePerPassport: newHeadName.trim() }, members: [] };
    setBranch(b => b ? { ...b, families: [...b.families, fam] } : b);
    setNewHeadName(""); setNewHeadAliyah("unknown"); setAddingFamily(false);
  }

  const totalMembers = branch ? branch.families.reduce((s, f) => s + 1 + f.members.length, 0) : 0;
  const inIsrael = branch ? branch.families.reduce((s, f) => s + (f.headAliyah === "in_israel" ? 1 : 0) + f.members.filter(m => m.aliyahStatus === "in_israel").length, 0) : 0;

  /* ── SETUP SCREEN ── */
  if (!branch) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(79,142,247,0.08)", border: "1px solid rgba(79,142,247,0.25)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>📍</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#4f8ef7" }}>Create Your Branch</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Register your congregation and begin the official BMC family census.</div>
          </div>
        </div>
        <Field label="BRANCH / CONGREGATION NAME">
          <input style={inputStyle} placeholder="e.g. Beithshalom K.Patlen" value={setupName} onChange={e => setSetupName(e.target.value)} />
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>Official congregation name as it will appear on the census form.</div>
        </Field>
        <Field label="CITY / LOCATION">
          <select style={inputStyle} value={setupCity} onChange={e => setSetupCity(e.target.value)}>
            {cities.map(c => <option key={c.id} value={c.id}>{c.country === "israel" ? "🇮🇱" : "🇮🇳"} {c.name} · {c.region}</option>)}
          </select>
        </Field>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><Field label="LOCAL ADMIN NAME"><input style={inputStyle} placeholder="Your full name" value={setupAdmin} onChange={e => setSetupAdmin(e.target.value)} /></Field></div>
          <div style={{ flex: 1 }}><Field label="ESTABLISHED DATE"><input style={inputStyle} type="date" value={setupDate} onChange={e => setSetupDate(e.target.value)} /></Field></div>
        </div>
        <button onClick={createBranch} disabled={!setupName.trim()} style={{ padding: "14px", borderRadius: 12, fontWeight: 700, fontSize: 14, border: "none", cursor: setupName.trim() ? "pointer" : "not-allowed", background: setupName.trim() ? "#4f8ef7" : "var(--elevated)", color: setupName.trim() ? "#fff" : "var(--text-muted)" }}>
          Register Branch
        </button>
      </div>
    );
  }

  function copyLink(url: string, label: string) {
    navigator.clipboard.writeText(url).then(() => alert(`✅ ${label} link copied!\n\n${url}`));
  }

  const baseUrl = `${window.location.origin}${window.location.pathname}`;

  /* ── REGISTRY SCREEN ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── ACTION BAR ── */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => copyLink(`${baseUrl}?census=submit&branch=${encodeURIComponent(branch.id)}`, "Submit form")}
          style={{ flex: 1, padding: "10px", borderRadius: 10, fontWeight: 700, fontSize: 12, border: "1px solid rgba(79,142,247,0.4)", background: "rgba(79,142,247,0.08)", color: "#4f8ef7", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
        >
          <span>📎</span> Copy Submit Link
        </button>
        <button
          onClick={() => exportPrint(branch)}
          style={{ flex: 1, padding: "10px", borderRadius: 10, fontWeight: 700, fontSize: 12, border: "1px solid rgba(212,168,67,0.4)", background: "rgba(212,168,67,0.08)", color: "#d4a843", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
        >
          <span>🖨️</span> Print Official Form
        </button>
      </div>

      <div style={{ borderRadius: 14, background: "linear-gradient(135deg, rgba(79,142,247,0.12), rgba(79,142,247,0.04))", border: "1px solid rgba(79,142,247,0.3)", overflow: "hidden" }}>
        {/* ── Synagogue photo banner (shown once uploaded) ── */}
        {branch.synagogueImageUrl ? (
          <div style={{ position: "relative", height: 120, overflow: "hidden" }}>
            <img src={branch.synagogueImageUrl} alt={`${branch.name} synagogue`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.72) 100%)" }} />
            {branch.logoUrl && (
              <img src={branch.logoUrl} alt={`${branch.name} logo`} style={{ position: "absolute", bottom: 12, left: 14, width: 44, height: 44, borderRadius: 11, objectFit: "cover", border: "2px solid rgba(255,255,255,0.92)", boxShadow: "0 2px 10px rgba(0,0,0,0.45)" }} />
            )}
            <div style={{ position: "absolute", bottom: 12, left: branch.logoUrl ? 68 : 14, right: 60 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.6)", lineHeight: 1.2 }}>{branch.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>🇮🇳 {branch.cityName}{branch.established ? ` · Est. ${branch.established}` : ""}</div>
              {branch.adminName && <div style={{ fontSize: 10, color: "rgba(79,142,247,0.95)", marginTop: 1 }}>Admin: {branch.adminName}</div>}
            </div>
            <button onClick={() => { if (confirm("Reset branch? All data will be lost.")) setBranch(null); }} style={{ position: "absolute", top: 8, right: 10, fontSize: 11, color: "#ef4444", background: "rgba(0,0,0,0.45)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 6, cursor: "pointer", padding: "3px 8px" }}>Reset</button>
          </div>
        ) : (
          /* No synagogue photo yet — plain header */
          <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {branch.logoUrl && (
                <img src={branch.logoUrl} alt={`${branch.name} logo`} style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover", border: "1px solid rgba(79,142,247,0.35)" }} />
              )}
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>{branch.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  🇮🇳 {branch.cityName}{branch.established && <span style={{ marginLeft: 6 }}>· Est. {branch.established}</span>}
                </div>
                {branch.adminName && <div style={{ fontSize: 11, color: "#4f8ef7", marginTop: 2 }}>Admin: {branch.adminName}</div>}
              </div>
            </div>
            <button onClick={() => { if (confirm("Reset branch? All data will be lost.")) setBranch(null); }} style={{ fontSize: 11, color: "#ef4444", background: "transparent", border: "none", cursor: "pointer" }}>Reset</button>
          </div>
        )}
        {/* ── Stats ── */}
        <div style={{ display: "flex", gap: 12, padding: "12px 16px" }}>
          {[{ label: "Families", value: branch.families.length }, { label: "Members", value: totalMembers }, { label: "In Israel", value: inIsrael }].map(s => (
            <div key={s.label} style={{ flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 10, background: "rgba(255,255,255,0.04)" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#4f8ef7" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── COMMUNITY IDENTITY (required before submitting for review) ── */}
      <div style={{ borderRadius: 14, background: "var(--card)", border: "1px solid rgba(212,168,67,0.3)", overflow: "hidden" }}>
        <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid var(--border)", background: "rgba(212,168,67,0.06)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#d4a843" }}>🖼️ COMMUNITY IDENTITY</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Upload your community logo and synagogue photo so members can easily recognise their branch when submitting their census. Both are required before you can submit your branch for review.</div>
        </div>
        <div style={{ display: "flex", gap: 10, padding: 12 }}>
          <ImageUploadBox
            label="Community Logo"
            imageUrl={branch.logoUrl}
            isUploading={isLogoUploading}
            progress={logoProgress}
            inputRef={logoInputRef}
            errorMessage={logoUploadError?.message || logoSaveError}
            onPick={file => { setLogoSaveError(null); uploadLogo(file); }}
          />
          <ImageUploadBox
            label="Synagogue Photo"
            imageUrl={branch.synagogueImageUrl}
            isUploading={isSynagogueUploading}
            progress={synagogueProgress}
            inputRef={synagogueInputRef}
            errorMessage={synagogueUploadError?.message || synagogueSaveError}
            onPick={file => { setSynagogueSaveError(null); uploadSynagogueImage(file); }}
          />
        </div>
      </div>

      <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(212,168,67,0.07)", border: "1px solid rgba(212,168,67,0.25)" }}>
        <div style={{ fontSize: 11, color: "#d4a843", fontWeight: 600 }}>📋 Official BMC Census Form 2026-2027</div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>Each family entry will print on the official Bnei Menashe Council India census form with all 12 official fields. Tap each family card to fill in census details.</div>
      </div>

      {/* ── MEMBER SUBMISSIONS ── */}
      {(() => {
        const branchSubmissions = memberSubmissions.filter(ms => ms.branchId === branch.id || ms.branchName === branch.name);
        const pendingMember = branchSubmissions.filter(ms => ms.status === "pending");
        const reviewedMember = branchSubmissions.filter(ms => ms.status !== "pending");
        if (branchSubmissions.length === 0) return null;
        return (
          <div style={{ borderRadius: 14, background: "var(--card)", border: "1px solid rgba(79,142,247,0.3)", overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", background: "rgba(79,142,247,0.08)", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#4f8ef7", letterSpacing: "0.07em" }}>MEMBER SUBMISSIONS</div>
              {pendingMember.length > 0 && (
                <div style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "#ef4444", borderRadius: 20, padding: "1px 7px", lineHeight: "16px" }}>{pendingMember.length} pending</div>
              )}
            </div>
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              {pendingMember.map(ms => (
                <MemberSubmissionCard key={ms.id} entry={ms} onReview={handleMemberReview} />
              ))}
              {reviewedMember.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: 6 }}>REVIEWED</div>
                  {reviewedMember.map(ms => (
                    <div key={ms.id} style={{ padding: "8px 10px", borderRadius: 10, background: "var(--elevated)", border: `1px solid ${ms.status === "approved" ? "rgba(74,222,128,0.25)" : "rgba(239,68,68,0.2)"}`, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{ms.status === "approved" ? "✅" : "❌"}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{ms.submitterName}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                          {ms.status === "approved" ? "Approved" : "Rejected"} · {ms.reviewedAt ? new Date(ms.reviewedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                        </div>
                        {ms.reviewNote && <div style={{ fontSize: 10, color: "var(--text-muted)", fontStyle: "italic" }}>"{ms.reviewNote}"</div>}
                      </div>
                      <button
                        title="Share status-check link for this member"
                        onClick={() => copyLink(`${baseUrl}?census=check&name=${encodeURIComponent(ms.submitterName)}`, ms.submitterName + "'s status")}
                        style={{ fontSize: 13, padding: "4px 8px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text-muted)", cursor: "pointer" }}
                      >🔗</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={secHdr}>FAMILY REGISTRY · {branch.families.length} families</div>
        <button onClick={() => setAddingFamily(v => !v)} style={{ fontSize: 12, fontWeight: 700, color: "#4f8ef7", background: "transparent", border: "1px solid rgba(79,142,247,0.35)", borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}>+ Add Family</button>
      </div>

      {addingFamily && (
        <div style={{ padding: "14px", borderRadius: 14, background: "rgba(79,142,247,0.07)", border: "1px solid rgba(79,142,247,0.3)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#4f8ef7", letterSpacing: "0.06em" }}>NEW FAMILY — HEAD OF HOUSEHOLD</div>
          <input style={inputStyle} placeholder="Father's Full Name" value={newHeadName} onChange={e => setNewHeadName(e.target.value)} />
          <div style={{ flex: 1 }}>
            <Label>ALIYAH STATUS</Label>
            <select style={inputStyle} value={newHeadAliyah} onChange={e => setNewHeadAliyah(e.target.value as AliyahStatus)}>
              {(Object.entries(ALIYAH_LABELS) as [AliyahStatus, { label: string }][]).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>After creating the family, tap the card to fill in the full official census fields (surname, Hebrew name, passport, etc.).</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addFamily} disabled={!newHeadName.trim()} style={{ flex: 1, padding: "10px", borderRadius: 10, background: newHeadName.trim() ? "#4f8ef7" : "var(--elevated)", color: newHeadName.trim() ? "#fff" : "var(--text-muted)", fontWeight: 700, fontSize: 13, border: "none", cursor: newHeadName.trim() ? "pointer" : "not-allowed" }}>Register Family Head</button>
            <button onClick={() => setAddingFamily(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "var(--elevated)", color: "var(--text-muted)", fontWeight: 600, fontSize: 13, border: "1px solid var(--border)", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {branch.families.length === 0 && !addingFamily && (
        <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🏠</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>No families registered yet</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Tap "+ Add Family" to begin the official census.</div>
        </div>
      )}

      {branch.families.map(f => (
        <FamilyCard
          key={f.id}
          family={f}
          branchInfo={{ name: branch.name, cityName: branch.cityName }}
          onUpdate={updated => setBranch(b => b ? { ...b, families: b.families.map(x => x.id === updated.id ? updated : x) } : b)}
          onDelete={() => setBranch(b => b ? { ...b, families: b.families.filter(x => x.id !== f.id) } : b)}
        />
      ))}

      {(
        <>
          <button onClick={async () => {
            if (!branch || saving) return;
            setSaving(true);
            await saveCensusBranch(branch as any);
            setSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
          }} style={{ padding: "13px", borderRadius: 12, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", background: saved ? "#4ade80" : "#4f8ef7", color: "#fff", transition: "background 0.3s" }}>
            {saving ? "Saving…" : saved ? "✓ Registry Saved" : "Save Branch Registry"}
          </button>

          <div style={{ borderRadius: 14, background: "var(--card)", border: "1px solid rgba(212,168,67,0.3)", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid var(--border)", background: "rgba(212,168,67,0.06)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#d4a843" }}>📋 EXPORT OFFICIAL CENSUS</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Output matches the official BNEI MENASHE COUNCIL INDIA CENSUS 2026-2027 form · Regd. No. 23/SR/2010-CCP</div>
            </div>
            <div style={{ display: "flex" }}>
              <button onClick={() => exportCSV(branch)} style={{ flex: 1, padding: "16px 10px", background: "transparent", border: "none", borderRight: "1px solid var(--border)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 24 }}>📥</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>Download CSV</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>All census fields · Excel/Sheets</span>
              </button>
              <button onClick={() => downloadPDF(branch)} style={{ flex: 1, padding: "16px 10px", background: "transparent", border: "none", borderRight: "1px solid var(--border)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 24 }}>📄</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>Download PDF</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Official form · saves directly</span>
              </button>
              <button onClick={() => exportPrint(branch)} style={{ flex: 1, padding: "16px 10px", background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 24 }}>🖨️</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>Print Official Form</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>BMC Census 2026-27 layout · PDF</span>
              </button>
            </div>
          </div>

          {/* ── SUBMIT FOR REVIEW ── */}
          {(() => {
            const st = submission?.status;
            const identityComplete = Boolean(branch.logoUrl && branch.synagogueImageUrl);
            if (!identityComplete && st !== "pending" && st !== "approved") return (
              <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.3)", display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 22 }}>🖼️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#d4a843" }}>Community Identity Required</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    Upload your {!branch.logoUrl && !branch.synagogueImageUrl ? "community logo and synagogue photo" : !branch.logoUrl ? "community logo" : "synagogue photo"} above before submitting your branch for review.
                  </div>
                </div>
              </div>
            );
            if (st === "pending") return (
              <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.35)", display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 22 }}>⏳</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#facc15" }}>Awaiting Review</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    Submitted {new Date(submission!.submittedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}. The Global Admin will review and approve your registry.
                  </div>
                </div>
              </div>
            );
            if (st === "approved") return (
              <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)", display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 22 }}>✅</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>Registry Approved</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    Approved {submission!.reviewedAt ? new Date(submission!.reviewedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}. Your branch is now visible on the public Dashboard.
                    {submission!.reviewNote && <> Note: "{submission!.reviewNote}"</>}
                  </div>
                </div>
              </div>
            );
            if (st === "rejected") return (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 22 }}>❌</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>Submission Rejected</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {submission!.reviewNote ? `Reason: "${submission!.reviewNote}"` : "No reason given."} Please correct your data and resubmit.
                    </div>
                  </div>
                </div>
                <button onClick={() => onSubmit(branch)} style={{ padding: "13px", borderRadius: 12, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", background: "#4f8ef7", color: "#fff" }}>
                  Resubmit for Review
                </button>
              </div>
            );
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(79,142,247,0.07)", border: "1px solid rgba(79,142,247,0.25)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#4f8ef7" }}>Ready to submit?</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Send your branch registry to the Global Admin for review. Once approved, it will appear on the public Dashboard.</div>
                </div>
                <button onClick={() => onSubmit(branch)} style={{ padding: "14px", borderRadius: 12, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #4f8ef7, #2563eb)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📤</span> Submit for Review
                </button>
              </div>
            );
          })()}
        </>
      )}

      <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Completed forms must be signed by: (1) Head of Family, (2) Community Chairman/Secretary, and (3) BMC(I) Chairman/Secretary before official submission.
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROOT MODAL
══════════════════════════════════════════════════════════════ */
export default function CensusModal({ onClose, isAdmin = false }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<StatEntry[]>(DEFAULT_STATS);
  const [cities, setCities] = useState<CityEntry[]>(DEFAULT_CITIES);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [memberSubmissions, setMemberSubmissions] = useState<MemberSubmissionEntry[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [showStatusCheck, setShowStatusCheck] = useState(false);
  const [resubmitEntry, setResubmitEntry] = useState<MemberSubmissionEntry | null>(null);
  const [deepLinkBranchId, setDeepLinkBranchId] = useState<string | undefined>();
  const [deepLinkName, setDeepLinkName] = useState<string | undefined>();
  /* we track one submission per local admin session (single branch per session) */
  const [localSubmissionId, setLocalSubmissionId] = useState<string | null>(null);

  /* ── Deep-link: read URL params on mount ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("census");
    if (mode === "submit") {
      const branchId = params.get("branch") || undefined;
      setDeepLinkBranchId(branchId);
      setShowSubmitForm(true);
    } else if (mode === "check") {
      const name = params.get("name") || undefined;
      setDeepLinkName(name);
      setShowStatusCheck(true);
    }
  }, []);

  /* ── Load persisted census data from DB on mount ── */
  useEffect(() => {
    fetchCensusSubmissions().then(subs => {
      if (subs.length > 0) setSubmissions(subs as any);
    });
    fetchCensusMemberSubmissions().then(msubs => {
      if (msubs.length > 0) setMemberSubmissions(msubs as any);
    });
  }, []);

  const pendingCount = submissions.filter(s => s.status === "pending").length;
  const pendingMemberCount = memberSubmissions.filter(ms => ms.status === "pending").length;
  const localSubmission = submissions.find(s => s.id === localSubmissionId);

  /* all submitted branches (any status) — community members pick from these */
  const allSubmittedBranches = submissions.map(s => ({ id: s.branch.id, name: s.branch.name, cityName: s.branch.cityName, logoUrl: s.branch.logoUrl, synagogueImageUrl: s.branch.synagogueImageUrl }));

  async function handleSubmit(branch: Branch) {
    try {
      const sub = await submitCensusBranchForReview(branch as any) as any;
      setSubmissions(prev => {
        const filtered = prev.filter(s => s.id !== sub.id);
        return [...filtered, sub];
      });
      setLocalSubmissionId(sub.id);
    } catch {
      /* Optimistic fallback if not signed in or network error */
      const existing = submissions.find(s => s.id === localSubmissionId);
      if (existing) {
        setSubmissions(prev => prev.map(s => s.id === existing.id
          ? { ...s, branch, status: "pending", submittedAt: new Date().toISOString(), reviewNote: undefined, reviewedAt: undefined }
          : s));
      } else {
        const sub: Submission = { id: `sub${Date.now()}`, branch, submittedAt: new Date().toISOString(), status: "pending" };
        setSubmissions(prev => [...prev, sub]);
        setLocalSubmissionId(sub.id);
      }
    }
  }

  function handleReview(id: string, status: "approved" | "rejected", note?: string) {
    reviewCensusSubmission(id, status, note);
    setSubmissions(prev => prev.map(s => s.id === id
      ? { ...s, status, reviewNote: note || undefined, reviewedAt: new Date().toISOString() }
      : s));
  }

  async function handleMemberSubmit(entry: Omit<MemberSubmissionEntry, "id" | "submittedAt" | "status">, replaceId?: string) {
    if (replaceId) {
      /* Resubmission — update back to pending */
      reviewCensusMemberSubmission(replaceId, "pending");
      setMemberSubmissions(prev => prev.map(ms => ms.id === replaceId
        ? { ...ms, ...entry, status: "pending", submittedAt: new Date().toISOString(), reviewNote: undefined, reviewedAt: undefined }
        : ms));
    } else {
      try {
        const newEntry = await submitCensusMemberEntry(entry as any) as any;
        setMemberSubmissions(prev => [...prev, newEntry]);
      } catch {
        /* Optimistic fallback */
        const newEntry: MemberSubmissionEntry = {
          ...entry,
          id: `msub${Date.now()}`,
          submittedAt: new Date().toISOString(),
          status: "pending",
        };
        setMemberSubmissions(prev => [...prev, newEntry]);
      }
    }
  }

  function handleMemberReview(id: string, status: "approved" | "rejected", note?: string) {
    reviewCensusMemberSubmission(id, status, note);
    setMemberSubmissions(prev => prev.map(ms => ms.id === id
      ? { ...ms, status, reviewNote: note || undefined, reviewedAt: new Date().toISOString() }
      : ms));
  }

  /* approved branches shown on Dashboard */
  const approvedBranches = submissions.filter(s => s.status === "approved").map(s => s.branch);

  const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: "dashboard",  label: "Dashboard",  icon: "📊" },
    { id: "admin",      label: "Admin",       icon: "🏛️", badge: pendingCount },
    { id: "localadmin", label: "Local Admin", icon: "📍", badge: pendingMemberCount || undefined },
  ];

  function renderTab() {
    switch (activeTab) {
      case "dashboard":
        if (resubmitEntry) {
          return (
            <CommunitySubmitForm
              allBranches={allSubmittedBranches}
              prefill={resubmitEntry}
              onSubmit={entry => {
                handleMemberSubmit(entry, resubmitEntry.id);
                setResubmitEntry(null);
                setShowStatusCheck(true);
              }}
              onCancel={() => { setResubmitEntry(null); setShowStatusCheck(true); }}
            />
          );
        }
        if (showSubmitForm) {
          return (
            <CommunitySubmitForm
              allBranches={allSubmittedBranches}
              defaultBranchId={deepLinkBranchId}
              onSubmit={entry => { handleMemberSubmit(entry); setShowSubmitForm(false); }}
              onCancel={() => setShowSubmitForm(false)}
            />
          );
        }
        if (showStatusCheck) {
          return (
            <StatusCheckView
              memberSubmissions={memberSubmissions}
              onBack={() => setShowStatusCheck(false)}
              onResubmit={ms => { setResubmitEntry(ms); setShowStatusCheck(false); }}
              defaultName={deepLinkName}
            />
          );
        }
        return <Dashboard stats={stats} cities={cities} approvedBranches={approvedBranches} onSubmitRequest={() => setShowSubmitForm(true)} onStatusCheckRequest={() => setShowStatusCheck(true)} />;
      case "admin":      return isAdmin
        ? <AdminPanel stats={stats} cities={cities} onSave={(s, c) => { setStats(s); setCities(c); }} submissions={submissions} onReview={handleReview} />
        : <AdminAccessDenied />;
      case "localadmin": return (
        <BranchRegistryPanel cities={cities} submission={localSubmission} onSubmit={handleSubmit} memberSubmissions={memberSubmissions} onMemberReview={handleMemberReview} initialBranch={localSubmission?.branch} />
      );
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div className="modal-handle" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 14px" }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, color: "var(--text-primary)" }}>Census & Demographics</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>Bnei Menashe Council India · Census 2026-2027</div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 6, padding: "0 16px 16px" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: "9px 4px", borderRadius: 10, fontSize: 11, fontWeight: 700, border: `1px solid ${activeTab === t.id ? "var(--gold)" : "var(--border)"}`, background: activeTab === t.id ? "rgba(212,168,67,0.15)" : "var(--elevated)", color: activeTab === t.id ? "#d4a843" : "var(--text-muted)", cursor: "pointer", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              {t.label}
              {t.badge ? (
                <span style={{ position: "absolute", top: 4, right: 6, fontSize: 9, fontWeight: 800, color: "#fff", background: "#ef4444", borderRadius: 20, padding: "1px 5px", lineHeight: "14px" }}>{t.badge}</span>
              ) : null}
            </button>
          ))}
        </div>
        <div style={{ padding: "0 16px 20px", flex: 1 }}>
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
