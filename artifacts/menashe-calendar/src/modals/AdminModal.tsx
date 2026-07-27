import { useState, useEffect, useRef } from "react";
import { useUser, useOrganization } from "@clerk/react";
import type { Book } from "../pages/SiddurPage";
import { useUpload } from "@workspace/object-storage-web";
import {
  fetchAnnouncements,
  broadcastAnnouncement,
  patchAnnouncement,
  deleteAnnouncementServer,
  type ServerAnnouncement,
} from "../lib/announcementsApi";

interface Props {
  onClose: () => void;
  onRefresh: () => void;
}

const API_BASE = "/api";

async function adminFetch(path: string, options: RequestInit = {}) {
  const token: string | null = await (window as any).Clerk?.session?.getToken() ?? null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

const CATEGORIES = [
  "Siddur", "Tehillim", "Torah Portions", "Kuki Christian Books",
  "Hebrew Learning", "Prayer Books", "Daily Study", "Custom Community Books",
];

const COVER_EMOJIS = ["📖","📜","🕍","🌟","📚","🙏","🎵","🔤","✡","🕎","🌿","💎"];
const COVER_COLORS = ["#1a3050","#2a1a40","#1a2a20","#30200a","#1a1a30","#0a2030","#2a1030","#1a2a10","#301020","#0f2030"];

type FormMode = "list" | "add" | "edit";
type FileMode = "url" | "upload";
type PanelTab = "books" | "users" | "payments" | "broadcast" | "census" | "yahrzeit" | "announce" | "dir";

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  "Rabbi":            { bg: "rgba(212,168,67,0.18)",  color: "#d4a843" },
  "Cantor":           { bg: "rgba(212,168,67,0.12)",  color: "#c9a03a" },
  "Community Leader": { bg: "rgba(139,92,246,0.18)",  color: "#a78bfa" },
  "Youth Leader":     { bg: "rgba(59,130,246,0.18)",  color: "#60a5fa" },
  "Women's Group":    { bg: "rgba(236,72,153,0.15)",  color: "#f472b6" },
  "Student":          { bg: "rgba(74,222,128,0.12)",  color: "#4ade80" },
  "Elder":            { bg: "rgba(255,180,50,0.15)",  color: "#fbbf24" },
  "Member":           { bg: "rgba(100,116,139,0.15)", color: "#94a3b8" },
};

const ANN_EMOJIS = ["📢","📣","🔔","✡","🕍","🌟","📜","🙏","🎯","🫂","📌","🗓","🎉","🕎","🌿","💎","🏛","📚","🕯","✨","📖","🌾"];
const defaultAnnForm = { emoji: "📢", title: "", body: "", pinned: false, scheduleMode: "now" as "now" | "later", scheduledAt: "" };

interface CensusSubmission {
  id: string;
  branch: { id: string; name: string; cityName: string; adminName?: string; established?: string; logoUrl?: string; synagogueImageUrl?: string; families: unknown[] };
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  reviewNote?: string;
  reviewedAt?: string;
}

interface MemberSubmission {
  id: string;
  branchId: string;
  branchName: string;
  submitterName: string;
  submitterNote?: string;
  headCensus: Record<string, unknown>;
  members: unknown[];
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

interface YahrzeitEntry {
  id: string;
  userId: string;
  deceasedName: string;
  hebrewDay: number;
  hebrewMonth: number;
  displayDate: string;
  passingYear?: number;
  message?: string;
  candleLit: boolean;
  candleLitAt?: string;
  donorDisplayName: string;
  createdAt: string;
  activeLearners: number;
}

interface UserRow {
  userId: string;
  isPremium: boolean;
  updatedAt: string;
  displayName: string | null;
  congregation: string | null;
  bio: string | null;
  role: string | null;
  city: string | null;
  country: string | null;
  avatarEmoji: string;
}

interface PremiumRequest {
  id: string;
  userId: string;
  status: string;
  note: string;
  displayName: string | null;
  avatarEmoji: string;
  congregation: string | null;
  city: string | null;
  country: string | null;
  requestedAt: string;
}

interface PaymentRecord {
  id: number;
  userId: string;
  orderId: string;
  paymentId: string;
  plan: string;
  amount: number;
  status: string;
  createdAt: string;
  displayName: string | null;
  avatarEmoji: string;
  congregation: string | null;
  city: string | null;
  country: string | null;
}

const defaultForm = {
  title: "",
  language: "English",
  category: "Siddur",
  description: "",
  coverEmoji: "📖",
  coverColor: "#1a3050",
  coverImageUrl: "",
  fileUrl: "",
  isPremium: false,
  published: true,
  sortOrder: 0,
};

export default function AdminModal({ onClose, onRefresh }: Props) {
  const { user } = useUser();
  const { membership } = useOrganization();
  const isAdmin = membership?.role === "org:admin";
  const [panelTab, setPanelTab] = useState<PanelTab>("books");
  const [mode, setMode] = useState<FormMode>("list");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [fileMode, setFileMode] = useState<FileMode>("url");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const [coverImageUploaded, setCoverImageUploaded] = useState<string | null>(null);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [togglingUser, setTogglingUser] = useState<string | null>(null);
  const [dirSearch, setDirSearch] = useState("");
  const [expandedDir, setExpandedDir] = useState<string | null>(null);

  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [actingRequest, setActingRequest] = useState<string | null>(null);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState("");

  const [subCount, setSubCount] = useState<{ web: number; expo: number } | null>(null);
  const [broadcastForm, setBroadcastForm] = useState({ emoji: "📢", title: "", body: "" });
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ webSent: number; expoSent: number; webFailed: number; expoFailed: number } | null>(null);

  type ScheduleMode = "now" | "later";
  interface ScheduledBroadcast { id: number; emoji: string; title: string; body: string; fire_at: string; sent_at: string | null; }
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduledList, setScheduledList] = useState<ScheduledBroadcast[]>([]);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const [censusSubmissions, setCensusSubmissions] = useState<CensusSubmission[]>([]);
  const [memberSubmissions, setMemberSubmissions] = useState<MemberSubmission[]>([]);
  const [censusLoading, setCensusLoading] = useState(false);
  const [reviewingCensus, setReviewingCensus] = useState<string | null>(null);

  const [yahrzeitEntries, setYahrzeitEntries] = useState<YahrzeitEntry[]>([]);
  const [yahrzeitLoading, setYahrzeitLoading] = useState(false);
  const [deletingYahrzeit, setDeletingYahrzeit] = useState<string | null>(null);
  const [yahrzeitSearch, setYahrzeitSearch] = useState("");

  const [announcements, setAnnouncements] = useState<ServerAnnouncement[]>([]);
  const [annLoading, setAnnLoading] = useState(false);
  const [annForm, setAnnForm] = useState(defaultAnnForm);
  const [annEditId, setAnnEditId] = useState<string | null>(null);
  const [annView, setAnnView] = useState<"list" | "compose">("list");
  const [annSaving, setAnnSaving] = useState(false);
  const [annDeleteId, setAnnDeleteId] = useState<string | null>(null);
  const [annPinning, setAnnPinning] = useState<string | null>(null);

  const getClerkToken = () => (window as any).Clerk?.session?.getToken() ?? null;

  const { uploadFile, isUploading, progress, error: uploadFileError } = useUpload({
    getAuthToken: getClerkToken,
    maxSizeBytes: 50 * 1024 * 1024,
    onSuccess: (response: { uploadURL: string; objectPath: string; metadata: { name: string; size: number; contentType: string } }) => {
      const servingUrl = `/api/storage${response.objectPath}`;
      setF({ fileUrl: servingUrl });
      setUploadedFileName(response.metadata.name);
    },
  });

  const { uploadFile: uploadCoverImage, isUploading: isCoverUploading, progress: coverProgress, error: coverUploadError } = useUpload({
    getAuthToken: getClerkToken,
    maxSizeBytes: 5 * 1024 * 1024,
    acceptedTypes: ["image/"],
    onSuccess: (response: { uploadURL: string; objectPath: string; metadata: { name: string; size: number; contentType: string } }) => {
      const servingUrl = `/api/storage${response.objectPath}`;
      setF({ coverImageUrl: servingUrl });
      setCoverImageUploaded(response.metadata.name);
    },
  });

  async function fetchSubCount() {
    try {
      const data = await adminFetch("/push/subscriber-count");
      setSubCount(data);
    } catch {}
  }

  async function sendBroadcast() {
    if (!broadcastForm.title.trim() || !broadcastForm.body.trim()) return;
    setBroadcasting(true);
    setBroadcastResult(null);
    setScheduleResult(null);
    try {
      const data = await adminFetch("/push/broadcast", {
        method: "POST",
        body: JSON.stringify(broadcastForm),
      });
      setBroadcastResult(data);
      setBroadcastForm(f => ({ ...f, title: "", body: "" }));
      fetchSubCount();
    } catch {}
    finally { setBroadcasting(false); }
  }

  async function fetchScheduled() {
    try {
      const data = await adminFetch("/push/broadcast/scheduled");
      setScheduledList(data);
    } catch {}
  }

  async function scheduleBroadcast() {
    if (!broadcastForm.title.trim() || !broadcastForm.body.trim() || !scheduledAt) return;
    setScheduling(true);
    setScheduleResult(null);
    setBroadcastResult(null);
    try {
      await adminFetch("/push/broadcast/scheduled", {
        method: "POST",
        body: JSON.stringify({ ...broadcastForm, fireAt: scheduledAt }),
      });
      setScheduleResult("scheduled");
      setBroadcastForm(f => ({ ...f, title: "", body: "" }));
      setScheduledAt("");
      await fetchScheduled();
    } catch (err: any) {
      setScheduleResult(err?.message ?? "error");
    }
    finally { setScheduling(false); }
  }

  async function cancelScheduled(id: number) {
    setCancellingId(id);
    try {
      await adminFetch(`/push/broadcast/scheduled/${id}`, { method: "DELETE" });
      await fetchScheduled();
    } catch {}
    finally { setCancellingId(null); }
  }

  async function fetchCensus() {
    setCensusLoading(true);
    try {
      const [subs, mems] = await Promise.all([
        adminFetch("/census/submissions"),
        adminFetch("/census/member-submissions"),
      ]);
      setCensusSubmissions(subs);
      setMemberSubmissions(mems);
    } catch {} finally { setCensusLoading(false); }
  }

  async function reviewCensus(id: string, type: "branch" | "member", status: "approved" | "rejected", reviewNote?: string) {
    setReviewingCensus(id);
    try {
      const endpoint = type === "branch"
        ? `/census/submissions/${id}`
        : `/census/member-submissions/${id}`;
      await adminFetch(endpoint, {
        method: "PATCH",
        body: JSON.stringify({ status, reviewNote: reviewNote || undefined }),
      });
      await fetchCensus();
    } catch {} finally { setReviewingCensus(null); }
  }

  async function loadAnnouncements() {
    setAnnLoading(true);
    try { setAnnouncements(await fetchAnnouncements()); } finally { setAnnLoading(false); }
  }

  function openAnnCompose(ann?: ServerAnnouncement) {
    if (ann) {
      setAnnForm({
        emoji: ann.emoji, title: ann.title, body: ann.body, pinned: ann.pinned,
        scheduleMode: ann.scheduledAt ? "later" : "now",
        scheduledAt: ann.scheduledAt ? new Date(ann.scheduledAt).toISOString().slice(0, 16) : "",
      });
      setAnnEditId(ann.id);
    } else {
      setAnnForm({ ...defaultAnnForm });
      setAnnEditId(null);
    }
    setAnnView("compose");
  }

  async function saveAnnouncement() {
    if (!annForm.title.trim()) return;
    setAnnSaving(true);
    try {
      const scheduledAt = annForm.scheduleMode === "later" && annForm.scheduledAt
        ? new Date(annForm.scheduledAt).toISOString() : null;
      if (annEditId) {
        await patchAnnouncement(annEditId, {
          emoji: annForm.emoji, title: annForm.title, body: annForm.body,
          pinned: annForm.pinned,
        });
      } else {
        await broadcastAnnouncement({
          emoji: annForm.emoji, title: annForm.title, body: annForm.body,
          pinned: annForm.pinned, scheduledAt,
        });
      }
      await loadAnnouncements();
      setAnnView("list");
    } finally { setAnnSaving(false); }
  }

  async function sendAnnNow(id: string) {
    setAnnPinning(id);
    try {
      await patchAnnouncement(id, { sendNow: true });
      await loadAnnouncements();
    } finally { setAnnPinning(null); }
  }

  async function toggleAnnPin(ann: ServerAnnouncement) {
    setAnnPinning(ann.id);
    try {
      await patchAnnouncement(ann.id, { pinned: !ann.pinned });
      await loadAnnouncements();
    } finally { setAnnPinning(null); }
  }

  async function deleteAnn(id: string) {
    setAnnDeleteId(id);
    try {
      await deleteAnnouncementServer(id);
      await loadAnnouncements();
    } finally { setAnnDeleteId(null); }
  }

  async function fetchYahrzeit() {
    setYahrzeitLoading(true);
    try {
      const data = await adminFetch("/community/admin/yahrzeit");
      setYahrzeitEntries(data);
    } catch {} finally { setYahrzeitLoading(false); }
  }

  async function deleteYahrzeit(id: string) {
    if (!confirm("Delete this yahrzeit entry? This cannot be undone.")) return;
    setDeletingYahrzeit(id);
    try {
      await adminFetch(`/community/admin/yahrzeit/${id}`, { method: "DELETE" });
      await fetchYahrzeit();
    } catch {} finally { setDeletingYahrzeit(null); }
  }

  async function fetchAll() {
    setLoading(true);
    try {
      const data = await adminFetch("/books");
      setBooks(data);
    } catch {} finally { setLoading(false); }
  }

  async function fetchUsers() {
    setUsersLoading(true);
    try {
      const data = await adminFetch("/admin/users");
      setUsers(data);
    } catch {} finally { setUsersLoading(false); }
  }

  async function fetchRequests() {
    try {
      const data = await adminFetch("/admin/premium-requests");
      setRequests(data);
    } catch { /* silent */ }
  }

  async function fetchPayments() {
    setPaymentsLoading(true);
    try {
      const data = await adminFetch("/admin/payments");
      setPayments(data);
    } catch {} finally { setPaymentsLoading(false); }
  }

  async function actOnRequest(userId: string, action: "approve" | "deny") {
    setActingRequest(userId);
    try {
      await adminFetch(`/admin/premium-requests/${encodeURIComponent(userId)}/${action}`, { method: "PUT" });
      await Promise.all([fetchRequests(), fetchUsers()]);
    } catch {} finally { setActingRequest(null); }
  }

  async function toggleUserPremium(user: UserRow) {
    setTogglingUser(user.userId);
    try {
      await adminFetch(`/admin/users/${encodeURIComponent(user.userId)}/premium`, {
        method: "PUT",
        body: JSON.stringify({ isPremium: !user.isPremium }),
      });
      await fetchUsers();
    } catch {} finally { setTogglingUser(null); }
  }

  async function seed() {
    setSeeding(true);
    try {
      await adminFetch("/books/seed", { method: "POST", body: JSON.stringify({}) });
      await fetchAll();
      onRefresh();
    } catch {} finally { setSeeding(false); }
  }

  async function save() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const body = { ...form, fileUrl: form.fileUrl || null, coverImageUrl: form.coverImageUrl || null };
      if (editId !== null) {
        await adminFetch(`/books/${editId}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await adminFetch("/books", { method: "POST", body: JSON.stringify(body) });
      }
      await fetchAll();
      onRefresh();
      setMode("list");
      setForm(defaultForm);
      setEditId(null);
      setUploadedFileName(null);
      setCoverImageUploaded(null);
      setFileMode("url");
    } catch {} finally { setSaving(false); }
  }

  async function deleteBook(id: number) {
    if (!confirm("Delete this book? This cannot be undone.")) return;
    try { await adminFetch(`/books/${id}`, { method: "DELETE" }); } catch {}
    await fetchAll();
    onRefresh();
  }

  async function togglePublished(book: Book) {
    try {
      await adminFetch(`/books/${book.id}`, {
        method: "PUT",
        body: JSON.stringify({ published: !book.published }),
      });
    } catch {}
    await fetchAll();
    onRefresh();
  }

  function editBook(book: Book) {
    setForm({ title: book.title, language: book.language, category: book.category, description: book.description, coverEmoji: book.coverEmoji, coverColor: book.coverColor, coverImageUrl: book.coverImageUrl || "", fileUrl: book.fileUrl || "", isPremium: book.isPremium, published: book.published, sortOrder: book.sortOrder });
    setEditId(book.id);
    setUploadedFileName(null);
    setCoverImageUploaded(null);
    setFileMode(book.fileUrl ? "url" : "url");
    setMode("edit");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      alert("Please select a PDF file.");
      return;
    }
    await uploadFile(file);
  }

  async function handleCoverImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      alert("Please select a JPG, PNG, or WebP image.");
      return;
    }
    await uploadCoverImage(file);
  }

  const F = form;
  const setF = (patch: Partial<typeof defaultForm>) => setForm(f => ({ ...f, ...patch }));

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    background: "var(--elevated)", border: "1px solid var(--border)",
    color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
    letterSpacing: "0.06em", marginBottom: 4, display: "block",
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAll(); fetchUsers(); fetchRequests(); fetchPayments();
      fetchSubCount(); fetchScheduled(); fetchCensus(); fetchYahrzeit(); loadAnnouncements();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-sheet" onClick={e => e.stopPropagation()}>
          <div className="modal-handle" />
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>Admin Only</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>You don't have access to this panel.</div>
            <button onClick={onClose} className="btn-close-full">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--background)", zIndex: 200, display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div className="app-header" style={{ borderBottom: "1px solid var(--border)" }}>
        {mode !== "list" || (panelTab === "announce" && annView === "compose") ? (
          <button
            onClick={() => {
              if (panelTab === "announce" && annView === "compose") { setAnnView("list"); }
              else { setMode("list"); setForm(defaultForm); setEditId(null); setUploadedFileName(null); setCoverImageUploaded(null); setFileMode("url"); }
            }}
            style={{ fontSize: 14, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
          >
            ← Back
          </button>
        ) : (
          <button onClick={onClose} style={{ fontSize: 14, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
            ✕ Close
          </button>
        )}
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>
          {panelTab === "books"
            ? (mode === "list" ? "📚 Library Admin" : mode === "add" ? "➕ Add Book" : "✏️ Edit Book")
            : panelTab === "users" ? "👥 Premium Users"
            : panelTab === "broadcast" ? "📣 Broadcast Notification"
            : panelTab === "census" ? "📋 Census Review"
            : panelTab === "yahrzeit" ? "🕯️ Yahrzeit Entries"
            : panelTab === "announce" ? (annView === "compose" ? (annEditId ? "✏️ Edit Announcement" : "📢 New Announcement") : "📢 Announcements")
            : panelTab === "dir" ? "👥 Member Directory"
            : "💳 Payments"}
        </div>
        {panelTab === "books" && mode === "list" && (
          <button
            className="btn-gold"
            style={{ padding: "8px 16px", fontSize: 13, fontWeight: 700, borderRadius: 10, display: "flex", alignItems: "center", gap: 5 }}
            onClick={() => { setMode("add"); setForm(defaultForm); setEditId(null); setUploadedFileName(null); setFileMode("url"); }}
          >
            + Add Book
          </button>
        )}
        {panelTab === "books" && mode !== "list" && (
          <button
            className="btn-gold"
            style={{ padding: "8px 16px", fontSize: 13, fontWeight: 700, borderRadius: 10, opacity: saving ? 0.6 : 1 }}
            onClick={save}
            disabled={saving || isUploading || isCoverUploading}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        )}
        {panelTab === "users" && (
          <button
            onClick={fetchUsers}
            style={{ padding: "7px 14px", borderRadius: 8, background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            {usersLoading ? "…" : "↻ Refresh"}
          </button>
        )}
        {panelTab === "payments" && (
          <button
            onClick={fetchPayments}
            style={{ padding: "7px 14px", borderRadius: 8, background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            {paymentsLoading ? "…" : "↻ Refresh"}
          </button>
        )}
        {panelTab === "census" && (
          <button onClick={fetchCensus} style={{ padding: "7px 14px", borderRadius: 8, background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {censusLoading ? "…" : "↻ Refresh"}
          </button>
        )}
        {panelTab === "yahrzeit" && (
          <button onClick={fetchYahrzeit} style={{ padding: "7px 14px", borderRadius: 8, background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {yahrzeitLoading ? "…" : "↻ Refresh"}
          </button>
        )}
        {panelTab === "announce" && annView === "list" && (
          <button className="btn-gold" style={{ padding: "8px 14px", fontSize: 13, fontWeight: 700, borderRadius: 10 }} onClick={() => openAnnCompose()}>
            + New
          </button>
        )}
        {panelTab === "announce" && annView === "compose" && (
          <button className="btn-gold" style={{ padding: "8px 14px", fontSize: 13, fontWeight: 700, borderRadius: 10, opacity: annSaving || !annForm.title.trim() ? 0.5 : 1 }} onClick={saveAnnouncement} disabled={annSaving || !annForm.title.trim()}>
            {annSaving ? "Saving…" : annEditId ? "Save" : "Send"}
          </button>
        )}
        {panelTab === "dir" && (
          <button onClick={fetchUsers} style={{ padding: "7px 14px", borderRadius: 8, background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {usersLoading ? "…" : "↻ Refresh"}
          </button>
        )}
      </div>

      {/* ── Tab switcher ── */}
      {mode === "list" && (
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          {(["books", "users", "payments", "broadcast", "census", "yahrzeit", "announce", "dir"] as PanelTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setPanelTab(tab)}
              style={{
                flex: 1, padding: "10px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
                background: panelTab === tab ? "rgba(212,168,67,0.1)" : "transparent",
                color: panelTab === tab ? "#d4a843" : "var(--text-muted)",
                borderBottom: panelTab === tab ? "2px solid #d4a843" : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              {tab === "books" ? "📚"
                : tab === "payments" ? "💳"
                : tab === "broadcast" ? "📣"
                : tab === "announce" ? "📢"
                : tab === "census" ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                    📋
                    {censusSubmissions.filter(s => s.status === "pending").length + memberSubmissions.filter(s => s.status === "pending").length > 0 && (
                      <span style={{ background: "#f59e0b", color: "#1a0f00", borderRadius: 8, fontSize: 9, fontWeight: 900, padding: "1px 4px", lineHeight: 1.4 }}>
                        {censusSubmissions.filter(s => s.status === "pending").length + memberSubmissions.filter(s => s.status === "pending").length}
                      </span>
                    )}
                  </span>
                ) : tab === "yahrzeit" ? "🕯️"
                : tab === "dir" ? "🔍"
                : (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  👥
                  {requests.length > 0 && (
                    <span style={{
                      background: "#ef4444", color: "#fff", borderRadius: 8,
                      fontSize: 9, fontWeight: 900, padding: "1px 5px", lineHeight: 1.4,
                    }}>
                      {requests.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {/* ANNOUNCE PANEL */}
        {panelTab === "announce" && mode === "list" && (
          <>
            {/* COMPOSE FORM */}
            {annView === "compose" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Emoji picker */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 6 }}>EMOJI</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {ANN_EMOJIS.map(e => (
                      <button key={e} onClick={() => setAnnForm(f => ({ ...f, emoji: e }))}
                        style={{ width: 34, height: 34, borderRadius: 8, fontSize: 18, border: annForm.emoji === e ? "2px solid #d4a843" : "1px solid var(--border)", background: annForm.emoji === e ? "rgba(212,168,67,0.15)" : "var(--elevated)", cursor: "pointer" }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 5 }}>TITLE <span style={{ color: "#ef4444" }}>*</span></div>
                  <input
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 14, fontWeight: 600, outline: "none", boxSizing: "border-box" }}
                    value={annForm.title}
                    onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Announcement headline…"
                    autoFocus
                  />
                </div>

                {/* Body */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 5 }}>BODY</div>
                  <textarea
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box", minHeight: 90, resize: "vertical", lineHeight: 1.5 }}
                    value={annForm.body}
                    onChange={e => setAnnForm(f => ({ ...f, body: e.target.value }))}
                    placeholder="Optional message body…"
                  />
                </div>

                {/* Pin toggle */}
                <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--card)", border: `1px solid ${annForm.pinned ? "rgba(212,168,67,0.4)" : "var(--border)"}`, borderRadius: 12, cursor: "pointer" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>📌 Pin to home screen</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Shows as a banner strip at the top of the community home</div>
                  </div>
                  <div onClick={() => setAnnForm(f => ({ ...f, pinned: !f.pinned }))} style={{ width: 44, height: 24, borderRadius: 12, background: annForm.pinned ? "#d4a843" : "var(--elevated)", border: "1px solid var(--border)", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                    <div style={{ position: "absolute", top: 3, left: annForm.pinned ? 22 : 3, width: 16, height: 16, borderRadius: "50%", background: annForm.pinned ? "#1a0f00" : "var(--text-muted)", transition: "left 0.2s" }} />
                  </div>
                </label>

                {/* Schedule (only for new) */}
                {!annEditId && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 8 }}>WHEN</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: annForm.scheduleMode === "later" ? 10 : 0 }}>
                      {(["now", "later"] as const).map(m => (
                        <button key={m} onClick={() => setAnnForm(f => ({ ...f, scheduleMode: m }))}
                          style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: annForm.scheduleMode === m ? "none" : "1px solid var(--border)", background: annForm.scheduleMode === m ? "linear-gradient(90deg, #b8860b, #d4a843)" : "var(--elevated)", color: annForm.scheduleMode === m ? "#1a0f00" : "var(--text-muted)", cursor: "pointer" }}>
                          {m === "now" ? "📣 Send now" : "🗓 Schedule"}
                        </button>
                      ))}
                    </div>
                    {annForm.scheduleMode === "later" && (
                      <input
                        type="datetime-local"
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                        value={annForm.scheduledAt}
                        onChange={e => setAnnForm(f => ({ ...f, scheduledAt: e.target.value }))}
                      />
                    )}
                  </div>
                )}

                {/* Preview */}
                {annForm.title.trim() && (
                  <div style={{ borderRadius: 12, padding: "12px 14px", background: "rgba(212,168,67,0.07)", border: "1px solid rgba(212,168,67,0.25)" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#d4a843", letterSpacing: "0.08em", marginBottom: 6 }}>PREVIEW</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{annForm.emoji} {annForm.title}</div>
                    {annForm.body && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>{annForm.body}</div>}
                    {annForm.pinned && <div style={{ fontSize: 10, color: "#d4a843", marginTop: 6, fontWeight: 700 }}>📌 Will appear as pinned banner</div>}
                  </div>
                )}

                {/* Send button */}
                <button
                  className="btn-gold"
                  style={{ padding: 14, fontSize: 15, fontWeight: 800, borderRadius: 12, opacity: annSaving || !annForm.title.trim() ? 0.6 : 1 }}
                  onClick={saveAnnouncement}
                  disabled={annSaving || !annForm.title.trim()}
                >
                  {annSaving ? "Saving…"
                    : annEditId ? "✅ Save Changes"
                    : annForm.scheduleMode === "later" ? "🗓 Schedule Announcement"
                    : "📣 Send Now"}
                </button>
                <div style={{ height: 8 }} />
              </div>
            )}

            {/* LIST VIEW */}
            {annView === "list" && (
              <>
                {annLoading ? (
                  <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>
                ) : announcements.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 16px" }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>📢</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>No announcements yet</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Create your first community announcement</div>
                    <button className="btn-gold" style={{ padding: "12px 24px", fontSize: 14, fontWeight: 700, borderRadius: 12 }} onClick={() => openAnnCompose()}>
                      + New Announcement
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[...announcements].sort((a, b) => {
                      const ta = new Date(a.sentAt ?? a.scheduledAt ?? a.createdAt).getTime();
                      const tb = new Date(b.sentAt ?? b.scheduledAt ?? b.createdAt).getTime();
                      return tb - ta;
                    }).map(ann => {
                      const isDeleting = annDeleteId === ann.id;
                      const isActing = annPinning === ann.id;
                      const statusColor = ann.status === "sent" ? "#4ade80" : ann.status === "scheduled" ? "#d4a843" : "#94a3b8";
                      const statusLabel = ann.status === "sent" ? "SENT" : ann.status === "scheduled" ? "SCHEDULED" : "DRAFT";
                      const sentTime = ann.sentAt ?? ann.scheduledAt ?? ann.createdAt;
                      const timeLabel = new Date(sentTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
                      return (
                        <div key={ann.id} style={{ borderRadius: 12, background: "var(--card)", border: `1px solid ${ann.pinned ? "rgba(212,168,67,0.3)" : "var(--border)"}`, padding: "12px 14px" }}>
                          {/* Header row */}
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                            <div style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{ann.emoji}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>{ann.title}</div>
                              {ann.body && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.4 }}>{ann.body}</div>}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                              <span style={{ fontSize: 9, fontWeight: 900, padding: "2px 7px", borderRadius: 5, background: `${statusColor}22`, color: statusColor }}>
                                {statusLabel}
                              </span>
                              {ann.pinned && <span style={{ fontSize: 9, color: "#d4a843", fontWeight: 800 }}>📌 PINNED</span>}
                            </div>
                          </div>

                          {/* Time */}
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 10 }}>{timeLabel}</div>

                          {/* Actions */}
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {ann.status !== "sent" && (
                              <button
                                onClick={() => sendAnnNow(ann.id)}
                                disabled={isActing}
                                style={{ flex: "1 1 auto", padding: "8px 10px", borderRadius: 8, border: "none", background: isActing ? "rgba(74,222,128,0.3)" : "linear-gradient(90deg, #166534, #4ade80)", color: "#fff", fontSize: 11, fontWeight: 800, cursor: isActing ? "default" : "pointer" }}
                              >
                                {isActing ? "…" : "📣 Send Now"}
                              </button>
                            )}
                            <button
                              onClick={() => toggleAnnPin(ann)}
                              disabled={isActing}
                              style={{ flex: "1 1 auto", padding: "8px 10px", borderRadius: 8, border: `1px solid ${ann.pinned ? "rgba(212,168,67,0.4)" : "var(--border)"}`, background: ann.pinned ? "rgba(212,168,67,0.1)" : "var(--elevated)", color: ann.pinned ? "#d4a843" : "var(--text-muted)", fontSize: 11, fontWeight: 700, cursor: isActing ? "default" : "pointer", opacity: isActing ? 0.5 : 1 }}
                            >
                              {ann.pinned ? "📌 Unpin" : "📌 Pin"}
                            </button>
                            <button
                              onClick={() => openAnnCompose(ann)}
                              style={{ flex: "0 0 auto", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--elevated)", color: "var(--text-muted)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => { if (confirm("Delete this announcement?")) deleteAnn(ann.id); }}
                              disabled={isDeleting}
                              style={{ flex: "0 0 auto", padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: isDeleting ? "default" : "pointer", opacity: isDeleting ? 0.5 : 1 }}
                            >
                              {isDeleting ? "…" : "🗑"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* CENSUS PANEL */}
        {panelTab === "census" && mode === "list" && (
          <>
            {censusLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>
            ) : (
              <>
                {/* Branch submissions */}
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.07em", marginBottom: 8 }}>
                  BRANCH SUBMISSIONS ({censusSubmissions.length})
                </div>
                {censusSubmissions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>No branch submissions yet</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {censusSubmissions.map(sub => {
                      const isPending = sub.status === "pending";
                      const reviewing = reviewingCensus === sub.id;
                      const statusColor = sub.status === "approved" ? "#4ade80" : sub.status === "rejected" ? "#ef4444" : "#f59e0b";
                      return (
                        <div key={sub.id} style={{
                          borderRadius: 12, background: "var(--card)", border: `1px solid ${isPending ? "rgba(245,158,11,0.3)" : "var(--border)"}`,
                          padding: "12px 14px",
                        }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                            {sub.branch.logoUrl ? (
                              <img src={sub.branch.logoUrl} alt={`${sub.branch.name} logo`} style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                            ) : (
                              <div style={{ fontSize: 22, lineHeight: 1 }}>🏛️</div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{sub.branch.name}</div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                {sub.branch.cityName}{sub.branch.adminName ? ` · Admin: ${sub.branch.adminName}` : ""}
                                {" · "}{sub.branch.families.length} families
                              </div>
                            </div>
                            <span style={{
                              fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6,
                              background: `${statusColor}22`, color: statusColor,
                            }}>
                              {sub.status.toUpperCase()}
                            </span>
                          </div>
                          {sub.branch.synagogueImageUrl && (
                            <img src={sub.branch.synagogueImageUrl} alt={`${sub.branch.name} synagogue`} style={{ width: "100%", height: 90, borderRadius: 8, objectFit: "cover", marginBottom: 8 }} />
                          )}
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: isPending ? 10 : 0 }}>
                            Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                            {sub.reviewNote && <span style={{ marginLeft: 8, color: "var(--text-muted)", fontStyle: "italic" }}>· "{sub.reviewNote}"</span>}
                          </div>
                          {isPending && (
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() => reviewCensus(sub.id, "branch", "rejected")}
                                disabled={reviewing}
                                style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: reviewing ? "default" : "pointer", opacity: reviewing ? 0.5 : 1 }}
                              >
                                ✗ Reject
                              </button>
                              <button
                                onClick={() => reviewCensus(sub.id, "branch", "approved")}
                                disabled={reviewing}
                                style={{ flex: 2, padding: "8px", borderRadius: 8, border: "none", background: reviewing ? "rgba(74,222,128,0.3)" : "linear-gradient(90deg, #166534, #4ade80)", color: "#fff", fontSize: 12, fontWeight: 800, cursor: reviewing ? "default" : "pointer" }}
                              >
                                ✓ Approve
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Member submissions */}
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.07em", marginBottom: 8, marginTop: 4 }}>
                  FAMILY CENSUS SUBMISSIONS ({memberSubmissions.length})
                </div>
                {memberSubmissions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>No family submissions yet</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {memberSubmissions.map(sub => {
                      const isPending = sub.status === "pending";
                      const reviewing = reviewingCensus === sub.id;
                      const statusColor = sub.status === "approved" ? "#4ade80" : sub.status === "rejected" ? "#ef4444" : "#f59e0b";
                      const head = sub.headCensus as Record<string, string>;
                      return (
                        <div key={sub.id} style={{
                          borderRadius: 12, background: "var(--card)", border: `1px solid ${isPending ? "rgba(245,158,11,0.3)" : "var(--border)"}`,
                          padding: "12px 14px",
                        }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                            <div style={{ fontSize: 22, lineHeight: 1 }}>👨‍👩‍👧‍👦</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                                {head.namePerPassport || sub.submitterName}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                {sub.branchName}{" · "}{sub.members.length} members
                              </div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: `${statusColor}22`, color: statusColor }}>
                              {sub.status.toUpperCase()}
                            </span>
                          </div>
                          {sub.submitterNote && (
                            <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", marginBottom: 8, padding: "5px 8px", background: "rgba(255,255,255,0.04)", borderRadius: 7 }}>
                              "{sub.submitterNote}"
                            </div>
                          )}
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: isPending ? 10 : 0 }}>
                            Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                          </div>
                          {isPending && (
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() => reviewCensus(sub.id, "member", "rejected")}
                                disabled={reviewing}
                                style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: reviewing ? "default" : "pointer", opacity: reviewing ? 0.5 : 1 }}
                              >
                                ✗ Reject
                              </button>
                              <button
                                onClick={() => reviewCensus(sub.id, "member", "approved")}
                                disabled={reviewing}
                                style={{ flex: 2, padding: "8px", borderRadius: 8, border: "none", background: reviewing ? "rgba(74,222,128,0.3)" : "linear-gradient(90deg, #166534, #4ade80)", color: "#fff", fontSize: 12, fontWeight: 800, cursor: reviewing ? "default" : "pointer" }}
                              >
                                ✓ Approve
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* YAHRZEIT PANEL */}
        {panelTab === "yahrzeit" && mode === "list" && (
          <>
            {/* Search */}
            <div style={{ marginBottom: 12 }}>
              <input
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                placeholder="Search by name or donor…"
                value={yahrzeitSearch}
                onChange={e => setYahrzeitSearch(e.target.value)}
              />
            </div>
            {yahrzeitLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>
            ) : yahrzeitEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 13 }}>No yahrzeit entries yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {yahrzeitEntries
                  .filter(e => !yahrzeitSearch || e.deceasedName.toLowerCase().includes(yahrzeitSearch.toLowerCase()) || e.donorDisplayName?.toLowerCase().includes(yahrzeitSearch.toLowerCase()))
                  .map(entry => {
                    const deleting = deletingYahrzeit === entry.id;
                    return (
                      <div key={entry.id} style={{ borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)", padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ fontSize: 22, lineHeight: 1 }}>{entry.candleLit ? "🕯️" : "🌑"}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                              {entry.deceasedName}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: entry.message ? 4 : 0 }}>
                              {entry.displayDate}{entry.passingYear ? ` · ${entry.passingYear}` : ""}
                              {" · "} by {entry.donorDisplayName || "Anonymous"}
                            </div>
                            {entry.message && (
                              <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", marginBottom: 4 }}>
                                "{entry.message}"
                              </div>
                            )}
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                                {new Date(entry.createdAt).toLocaleDateString()}
                              </span>
                              {entry.activeLearners > 0 && (
                                <span style={{ fontSize: 10, background: "rgba(212,168,67,0.15)", color: "#d4a843", borderRadius: 6, padding: "2px 6px", fontWeight: 700 }}>
                                  {entry.activeLearners} learning now
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteYahrzeit(entry.id)}
                            disabled={deleting}
                            style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: deleting ? "default" : "pointer", opacity: deleting ? 0.5 : 1, flexShrink: 0 }}
                          >
                            {deleting ? "…" : "Delete"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}
          </>
        )}

        {/* DIRECTORY PANEL */}
        {panelTab === "dir" && mode === "list" && (
          <>
            {/* Search bar */}
            <div style={{ position: "relative", marginBottom: 14 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none" }}>🔍</span>
              <input
                placeholder="Search by name, role, congregation, or city…"
                value={dirSearch}
                onChange={e => setDirSearch(e.target.value)}
                style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: 10, background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
              {dirSearch && (
                <button onClick={() => setDirSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", fontSize: 16, cursor: "pointer", lineHeight: 1 }}>×</button>
              )}
            </div>

            {/* Stats bar */}
            {!usersLoading && (
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                {[
                  { label: "Total", value: users.filter(u => u.displayName).length, color: "var(--text-muted)" },
                  { label: "With profile", value: users.filter(u => u.displayName && u.bio).length, color: "#60a5fa" },
                  { label: "Premium", value: users.filter(u => u.isPremium && u.displayName).length, color: "#d4a843" },
                ].map(s => (
                  <div key={s.label} style={{ background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 10px", display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            )}

            {usersLoading ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40, fontSize: 13 }}>Loading members…</div>
            ) : (() => {
              const q = dirSearch.toLowerCase().trim();
              const filtered = users.filter(u => {
                if (!u.displayName) return false;
                if (!q) return true;
                return (u.displayName ?? "").toLowerCase().includes(q)
                  || (u.role ?? "").toLowerCase().includes(q)
                  || (u.congregation ?? "").toLowerCase().includes(q)
                  || (u.city ?? "").toLowerCase().includes(q)
                  || (u.country ?? "").toLowerCase().includes(q);
              });
              if (filtered.length === 0) return (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40, fontSize: 13 }}>
                  {q ? `No members match "${dirSearch}"` : "No members with profiles yet."}
                </div>
              );
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filtered.map(u => {
                    const roleStyle = ROLE_COLORS[u.role ?? ""] ?? ROLE_COLORS["Member"];
                    const isExpanded = expandedDir === u.userId;
                    return (
                      <div
                        key={u.userId}
                        style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s" }}
                        onClick={() => setExpandedDir(isExpanded ? null : u.userId)}
                      >
                        {/* Collapsed row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
                          {/* Avatar */}
                          <div style={{
                            width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                            background: "var(--elevated)", border: "1px solid var(--border)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                          }}>
                            {u.avatarEmoji || "👤"}
                          </div>
                          {/* Name + tags */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {u.displayName}
                              </span>
                              {u.isPremium && (
                                <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(212,168,67,0.18)", color: "#d4a843", borderRadius: 6, padding: "2px 6px" }}>✦ PREMIUM</span>
                              )}
                              {u.role && (
                                <span style={{ fontSize: 9, fontWeight: 800, background: roleStyle.bg, color: roleStyle.color, borderRadius: 6, padding: "2px 6px" }}>{u.role.toUpperCase()}</span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {u.congregation && <span>🕍 {u.congregation}</span>}
                              {u.city && <span>📍 {u.city}{u.country ? `, ${u.country}` : ""}</span>}
                            </div>
                          </div>
                          <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{isExpanded ? "▲" : "▼"}</span>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div style={{ borderTop: "1px solid var(--border)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                            {u.bio && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 4 }}>BIO</div>
                                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{u.bio}</div>
                              </div>
                            )}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
                              {u.congregation && (
                                <div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em" }}>CONGREGATION</div>
                                  <div style={{ fontSize: 12, color: "var(--text-primary)", marginTop: 2 }}>{u.congregation}</div>
                                </div>
                              )}
                              {u.city && (
                                <div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em" }}>CITY / COUNTRY</div>
                                  <div style={{ fontSize: 12, color: "var(--text-primary)", marginTop: 2 }}>{u.city}{u.country ? `, ${u.country}` : ""}</div>
                                </div>
                              )}
                              {u.role && (
                                <div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em" }}>ROLE</div>
                                  <div style={{ fontSize: 12, marginTop: 2 }}>
                                    <span style={{ background: roleStyle.bg, color: roleStyle.color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{u.role}</span>
                                  </div>
                                </div>
                              )}
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em" }}>MEMBER SINCE</div>
                                <div style={{ fontSize: 12, color: "var(--text-primary)", marginTop: 2 }}>{new Date(u.updatedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </>
        )}

        {/* USERS PANEL */}
        {panelTab === "users" && mode === "list" && (
          <>
            {/* Pending Requests */}
            {requests.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", letterSpacing: "0.06em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "pulse 2s infinite" }} />
                  PENDING REQUESTS ({requests.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {requests.map(req => {
                    const acting = actingRequest === req.userId;
                    return (
                      <div key={req.id} style={{
                        borderRadius: 12, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)",
                        padding: "12px 14px",
                      }}>
                        {/* Header row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: req.note ? 8 : 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
                          }}>
                            {req.avatarEmoji}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {req.displayName ?? "Unknown User"}
                            </div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                              {[req.congregation, req.city, req.country].filter(Boolean).join(" · ") || "No profile set"}
                            </div>
                          </div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>
                            {new Date(req.requestedAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Note */}
                        {req.note && (
                          <div style={{
                            fontSize: 12, color: "var(--text-muted)", fontStyle: "italic",
                            marginBottom: 10, padding: "6px 10px", borderRadius: 7,
                            background: "rgba(255,255,255,0.04)", lineHeight: 1.5,
                          }}>
                            "{req.note}"
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => actOnRequest(req.userId, "deny")}
                            disabled={acting}
                            style={{
                              flex: 1, padding: "9px", borderRadius: 9, border: "1px solid rgba(239,68,68,0.35)",
                              background: "rgba(239,68,68,0.08)", color: "#ef4444",
                              fontSize: 12, fontWeight: 700, cursor: acting ? "default" : "pointer",
                              opacity: acting ? 0.5 : 1,
                            }}
                          >
                            ✗ Deny
                          </button>
                          <button
                            onClick={() => actOnRequest(req.userId, "approve")}
                            disabled={acting}
                            style={{
                              flex: 2, padding: "9px", borderRadius: 9, border: "none",
                              background: acting ? "rgba(212,168,67,0.3)" : "linear-gradient(90deg, #b8860b, #d4a843)",
                              color: "#1a0f00", fontSize: 12, fontWeight: 800,
                              cursor: acting ? "default" : "pointer",
                            }}
                          >
                            {acting ? "Processing…" : "👑 Approve Premium"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ height: 1, background: "var(--border)", margin: "14px 0" }} />
              </div>
            )}

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 12 }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--text-muted)" }}>🔍</span>
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search by name, city…"
                style={{
                  width: "100%", padding: "9px 12px 9px 32px", borderRadius: 9,
                  background: "var(--elevated)", border: "1px solid var(--border)",
                  color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" as const,
                }}
              />
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[
                { label: "Total Users", value: users.length, color: "#60a5fa" },
                { label: "Premium", value: users.filter(u => u.isPremium).length, color: "#d4a843" },
              ].map(stat => (
                <div key={stat.label} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.06em", marginTop: 2 }}>{stat.label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {usersLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Loading users…</div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>👤</div>
                <div style={{ fontSize: 13 }}>No users registered yet</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {users
                  .filter(u => {
                    if (!userSearch.trim()) return true;
                    const q = userSearch.toLowerCase();
                    return (
                      (u.displayName ?? "").toLowerCase().includes(q) ||
                      (u.city ?? "").toLowerCase().includes(q) ||
                      (u.congregation ?? "").toLowerCase().includes(q) ||
                      u.userId.toLowerCase().includes(q)
                    );
                  })
                  .map(user => {
                    const toggling = togglingUser === user.userId;
                    return (
                      <div key={user.userId} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        background: user.isPremium ? "rgba(212,168,67,0.06)" : "var(--card)",
                        border: `1px solid ${user.isPremium ? "rgba(212,168,67,0.25)" : "var(--border)"}`,
                        borderRadius: 12, padding: "12px 14px",
                      }}>
                        {/* Avatar */}
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: user.isPremium ? "rgba(212,168,67,0.15)" : "var(--elevated)",
                          border: user.isPremium ? "1px solid rgba(212,168,67,0.3)" : "1px solid var(--border)",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                        }}>
                          {user.avatarEmoji}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: user.isPremium ? "#d4a843" : "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {user.displayName ?? "Unknown User"}
                            </span>
                            {user.isPremium && (
                              <span style={{ fontSize: 8, fontWeight: 900, color: "#b8860b", background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>
                                👑 PRO
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                            {[user.congregation, user.city, user.country].filter(Boolean).join(" · ") || user.userId.slice(0, 20) + "…"}
                          </div>
                        </div>

                        {/* Premium toggle */}
                        <button
                          onClick={() => toggleUserPremium(user)}
                          disabled={toggling}
                          style={{
                            width: 44, height: 24, borderRadius: 12, border: "none", cursor: toggling ? "default" : "pointer",
                            background: user.isPremium ? "linear-gradient(90deg, #b8860b, #d4a843)" : "rgba(255,255,255,0.1)",
                            position: "relative", flexShrink: 0, transition: "background 0.25s",
                            opacity: toggling ? 0.5 : 1,
                          }}
                          aria-label={user.isPremium ? "Revoke premium" : "Grant premium"}
                          title={user.isPremium ? "Click to revoke Premium" : "Click to grant Premium"}
                        >
                          <span style={{
                            position: "absolute", top: 2,
                            left: user.isPremium ? 22 : 2,
                            width: 20, height: 20, borderRadius: "50%",
                            background: "white", transition: "left 0.2s",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                          }} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}

        {/* PAYMENTS PANEL */}
        {panelTab === "payments" && mode === "list" && (() => {
          const filtered = payments.filter(p => {
            if (!paymentSearch.trim()) return true;
            const q = paymentSearch.toLowerCase();
            return (
              (p.displayName ?? "").toLowerCase().includes(q) ||
              (p.city ?? "").toLowerCase().includes(q) ||
              (p.plan ?? "").toLowerCase().includes(q) ||
              p.paymentId.toLowerCase().includes(q) ||
              p.orderId.toLowerCase().includes(q)
            );
          });

          const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
          const monthlyCount = payments.filter(p => p.plan === "monthly").length;
          const annualCount = payments.filter(p => p.plan === "annual").length;

          function formatAmount(paise: number) {
            return "₹" + (paise / 100).toLocaleString("en-IN");
          }

          function timeAgo(dateStr: string) {
            const diff = Date.now() - new Date(dateStr).getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return "just now";
            if (mins < 60) return `${mins}m ago`;
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return `${hrs}h ago`;
            const days = Math.floor(hrs / 24);
            if (days < 7) return `${days}d ago`;
            return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
          }

          return (
            <>
              {/* Revenue stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[
                  { label: "Total Revenue", value: formatAmount(totalRevenue), color: "#d4a843", icon: "₹" },
                  { label: "Monthly Plans", value: monthlyCount, color: "#60a5fa", icon: "📅" },
                  { label: "Annual Plans", value: annualCount, color: "#4ade80", icon: "🗓" },
                ].map(stat => (
                  <div key={stat.label} style={{ padding: "10px 8px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em", marginTop: 2 }}>{stat.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>

              {/* Search */}
              <div style={{ position: "relative", marginBottom: 12 }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--text-muted)" }}>🔍</span>
                <input
                  value={paymentSearch}
                  onChange={e => setPaymentSearch(e.target.value)}
                  placeholder="Search by name, payment ID, plan…"
                  style={{ width: "100%", padding: "9px 12px 9px 32px", borderRadius: 9, background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" as const }}
                />
              </div>

              {paymentsLoading ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Loading transactions…</div>
              ) : payments.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💳</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>No payments yet</div>
                  <div style={{ fontSize: 12 }}>Razorpay transactions will appear here</div>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: "var(--text-muted)", fontSize: 13 }}>No results for "{paymentSearch}"</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filtered.map(payment => (
                    <div key={payment.id} style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 14, padding: "12px 14px",
                    }}>
                      {/* Top row: avatar + name + plan badge + amount */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                          {payment.avatarEmoji}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {payment.displayName ?? "Unknown User"}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                            {[payment.congregation, payment.city, payment.country].filter(Boolean).join(" · ") || payment.userId.slice(0, 20) + "…"}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 900, color: "#d4a843" }}>{formatAmount(payment.amount)}</div>
                          <div style={{ fontSize: 9, marginTop: 2 }}>
                            <span style={{
                              padding: "2px 7px", borderRadius: 99, fontWeight: 800,
                              fontSize: 9, letterSpacing: "0.04em",
                              background: payment.plan === "annual" ? "rgba(74,222,128,0.15)" : "rgba(96,165,250,0.15)",
                              color: payment.plan === "annual" ? "#4ade80" : "#60a5fa",
                              border: `1px solid ${payment.plan === "annual" ? "rgba(74,222,128,0.3)" : "rgba(96,165,250,0.3)"}`,
                            }}>
                              {payment.plan === "annual" ? "ANNUAL" : "MONTHLY"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom row: payment IDs + status + time */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                          <span style={{ fontSize: 9, color: "var(--text-muted)", flexShrink: 0 }}>ID</span>
                          <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{payment.paymentId}</span>
                        </div>
                        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span style={{
                            fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 99,
                            background: payment.status === "captured" ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)",
                            color: payment.status === "captured" ? "#4ade80" : "#ef4444",
                            border: `1px solid ${payment.status === "captured" ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)"}`,
                          }}>
                            {payment.status.toUpperCase()}
                          </span>
                          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{timeAgo(payment.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {/* BROADCAST PANEL */}
        {panelTab === "broadcast" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Subscriber count */}
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { label: "Web Subscribers", value: subCount?.web ?? "—", icon: "🌐" },
                { label: "Mobile Subscribers", value: subCount?.expo ?? "—", icon: "📱" },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#d4a843" }}>{value}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.06em", marginTop: 2 }}>{label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* Result banners */}
            {broadcastResult && (
              <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>✅</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>Broadcast sent!</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    Web: {broadcastResult.webSent} sent{broadcastResult.webFailed > 0 ? `, ${broadcastResult.webFailed} failed` : ""}
                    {" · "}
                    Mobile: {broadcastResult.expoSent} sent{broadcastResult.expoFailed > 0 ? `, ${broadcastResult.expoFailed} failed` : ""}
                  </div>
                </div>
              </div>
            )}
            {scheduleResult === "scheduled" && (
              <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>🗓</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>Broadcast scheduled! It will fire automatically.</div>
              </div>
            )}
            {scheduleResult && scheduleResult !== "scheduled" && (
              <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 13, color: "#ef4444" }}>
                ⚠️ {scheduleResult}
              </div>
            )}

            {/* Emoji picker */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 8 }}>EMOJI</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["📢","📣","🔔","✡","🕍","🌟","📜","🙏","🎯","🫂","⚡","💬","📌","🗓","🌐","🎉","🕎","🌿","💎","🏛","📚","🕯","✨","🇮🇱","📖","🌾","⭐","🔥"].map(e => (
                  <button
                    key={e}
                    onClick={() => setBroadcastForm(f => ({ ...f, emoji: e }))}
                    style={{
                      width: 36, height: 36, borderRadius: 8, fontSize: 18, cursor: "pointer", border: "none",
                      background: broadcastForm.emoji === e ? "rgba(212,168,67,0.2)" : "var(--elevated)",
                      outline: broadcastForm.emoji === e ? "2px solid #d4a843" : "none",
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 6 }}>TITLE</div>
              <input
                value={broadcastForm.title}
                onChange={e => setBroadcastForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Shabbat Shalom"
                maxLength={80}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Body */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 6 }}>MESSAGE</div>
              <textarea
                value={broadcastForm.body}
                onChange={e => setBroadcastForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Write your message to all subscribers…"
                maxLength={300}
                rows={3}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box", resize: "vertical" }}
              />
              <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "right", marginTop: 4 }}>{broadcastForm.body.length}/300</div>
            </div>

            {/* Preview */}
            {(broadcastForm.title || broadcastForm.body) && (
              <div style={{ padding: "12px 16px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 8 }}>PREVIEW</div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#0f1829", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {broadcastForm.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                      {broadcastForm.emoji} {broadcastForm.title || "Title…"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {broadcastForm.body || "Message…"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Send button */}
            <button
              className="btn-gold"
              onClick={sendBroadcast}
              disabled={broadcasting || !broadcastForm.title.trim() || !broadcastForm.body.trim()}
              style={{ padding: "14px", fontSize: 14, fontWeight: 800, borderRadius: 14, opacity: (broadcasting || !broadcastForm.title.trim() || !broadcastForm.body.trim()) ? 0.5 : 1, width: "100%" }}
            >
              {broadcasting ? "Sending…" : `📣 Send to All ${subCount ? `(${(subCount.web + subCount.expo)} subscribers)` : "Subscribers"}`}
            </button>
          </div>
        )}

        {/* LIST MODE */}
        {panelTab === "books" && mode === "list" && (
          <>
            {books.length === 0 && !loading && (
              <div style={{ padding: 18, background: "rgba(212,168,67,0.08)", borderRadius: 14, border: "1px solid rgba(212,168,67,0.2)", marginBottom: 16, textAlign: "center" }}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>🌱</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Library is empty. Seed with default books?</div>
                <button className="btn-gold" style={{ padding: "9px 22px", fontSize: 13, fontWeight: 700, opacity: seeding ? 0.6 : 1 }} onClick={seed} disabled={seeding}>
                  {seeding ? "Seeding…" : "Seed Default Books"}
                </button>
              </div>
            )}
            {loading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Loading…</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {books.map(book => (
                  <div key={book.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 58, borderRadius: 8, overflow: "hidden", background: book.coverImageUrl ? "transparent" : `linear-gradient(135deg, ${book.coverColor}, ${book.coverColor}aa)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, boxShadow: "2px 3px 10px rgba(0,0,0,0.3)" }}>
                      {book.coverImageUrl ? (
                        <img src={book.coverImageUrl} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : book.coverEmoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{book.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{book.category} · {book.language}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 5, alignItems: "center" }}>
                        {book.isPremium && <span className="tag tag-gold" style={{ fontSize: 9 }}>PREMIUM</span>}
                        <span className={`tag ${book.published ? "tag-green" : "tag-orange"}`} style={{ fontSize: 9 }}>{book.published ? "LIVE" : "HIDDEN"}</span>
                        {book.fileUrl && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>📎 {book.fileUrl.includes("/api/storage") ? "PDF" : "URL"}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <button
                        onClick={() => togglePublished(book)}
                        style={{ padding: "4px 8px", borderRadius: 6, background: book.published ? "rgba(22,163,74,0.15)" : "rgba(255,140,50,0.15)", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, color: book.published ? "#4ade80" : "#ff8a5c" }}
                      >
                        {book.published ? "LIVE" : "SHOW"}
                      </button>
                      <button
                        onClick={() => editBook(book)}
                        style={{ padding: "4px 8px", borderRadius: 6, background: "var(--elevated)", border: "1px solid var(--border)", cursor: "pointer", fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => deleteBook(book.id)}
                        style={{ padding: "4px 8px", borderRadius: 6, background: "rgba(239,68,68,0.15)", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, color: "#ef4444" }}
                      >
                        DEL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ADD / EDIT MODE */}
        {(mode === "add" || mode === "edit") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Cover Preview */}
            <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid var(--border)", padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 12 }}>COVER</div>

              {/* Preview thumbnail + upload zone side by side */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                {/* Thumbnail */}
                <div style={{
                  width: 64, height: 84, borderRadius: 10, flexShrink: 0, overflow: "hidden",
                  background: F.coverImageUrl ? "transparent" : `linear-gradient(135deg, ${F.coverColor}, ${F.coverColor}88)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 30, boxShadow: "3px 4px 16px rgba(0,0,0,0.4)",
                  border: F.coverImageUrl ? "2px solid #d4a843" : "1px solid rgba(255,255,255,0.1)",
                }}>
                  {F.coverImageUrl ? (
                    <img src={F.coverImageUrl} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : F.coverEmoji}
                </div>

                {/* Cover image upload */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>COVER IMAGE (optional)</div>
                  <div
                    onClick={() => !isCoverUploading && coverImageInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${isCoverUploading ? "#d4a843" : F.coverImageUrl ? "rgba(212,168,67,0.5)" : "var(--border)"}`,
                      borderRadius: 10, padding: "14px 10px", textAlign: "center",
                      cursor: isCoverUploading ? "default" : "pointer",
                      background: F.coverImageUrl ? "rgba(212,168,67,0.05)" : "var(--elevated)",
                      transition: "all 0.2s",
                    }}
                  >
                    {isCoverUploading ? (
                      <>
                        <div style={{ fontSize: 18, marginBottom: 4 }}>⏳</div>
                        <div style={{ fontSize: 11, color: "#d4a843", fontWeight: 700, marginBottom: 6 }}>{coverProgress}%</div>
                        <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${coverProgress}%`, background: "#d4a843", borderRadius: 2, transition: "width 0.3s" }} />
                        </div>
                      </>
                    ) : F.coverImageUrl ? (
                      <>
                        <div style={{ fontSize: 18, marginBottom: 3 }}>🖼️</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#4ade80" }}>Image set</div>
                        <div style={{ fontSize: 10, color: "#d4a843", marginTop: 4 }}>Tap to replace</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 22, marginBottom: 4 }}>🖼️</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>Upload cover</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>JPG · PNG · WebP</div>
                      </>
                    )}
                  </div>
                  {coverUploadError && (
                    <div style={{ marginTop: 6, fontSize: 10, color: "#ef4444", lineHeight: 1.4 }}>⚠️ {coverUploadError.message}</div>
                  )}
                  {F.coverImageUrl && (
                    <button
                      onClick={() => { setF({ coverImageUrl: "" }); setCoverImageUploaded(null); }}
                      style={{ marginTop: 6, fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      ✕ Remove image
                    </button>
                  )}
                  <input
                    ref={coverImageInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={handleCoverImageChange}
                  />
                </div>
              </div>

              {/* Emoji + Color pickers (shown when no cover image) */}
              {!F.coverImageUrl && (
                <>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Or choose emoji + color</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                    {COVER_EMOJIS.map(e => (
                      <button key={e} onClick={() => setF({ coverEmoji: e })} style={{ width: 32, height: 32, borderRadius: 7, background: F.coverEmoji === e ? "rgba(212,168,67,0.25)" : "var(--elevated)", border: F.coverEmoji === e ? "2px solid #d4a843" : "1px solid var(--border)", cursor: "pointer", fontSize: 17, transition: "all 0.15s" }}>
                        {e}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {COVER_COLORS.map(c => (
                      <button key={c} onClick={() => setF({ coverColor: c })} style={{ width: 26, height: 26, borderRadius: 6, background: c, border: F.coverColor === c ? "2px solid #d4a843" : "2px solid transparent", cursor: "pointer", transition: "border 0.15s" }} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Title */}
            <div>
              <label style={labelStyle}>TITLE <span style={{ color: "#ef4444" }}>*</span></label>
              <input style={inputStyle} value={F.title} onChange={e => setF({ title: e.target.value })} placeholder="Book title" />
            </div>

            {/* Language + Category row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>LANGUAGE</label>
                <input style={inputStyle} value={F.language} onChange={e => setF({ language: e.target.value })} placeholder="e.g. Hebrew / English" />
              </div>
              <div>
                <label style={labelStyle}>CATEGORY</label>
                <select style={{ ...inputStyle, appearance: "none" }} value={F.category} onChange={e => setF({ category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>DESCRIPTION</label>
              <textarea
                style={{ ...inputStyle, minHeight: 76, resize: "vertical", lineHeight: 1.5 }}
                value={F.description}
                onChange={e => setF({ description: e.target.value })}
                placeholder="Short description of this book…"
              />
            </div>

            {/* File / URL section */}
            <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
              {/* Tab switcher */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid var(--border)" }}>
                <button
                  onClick={() => setFileMode("url")}
                  style={{ padding: "12px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", background: fileMode === "url" ? "rgba(212,168,67,0.12)" : "transparent", color: fileMode === "url" ? "#d4a843" : "var(--text-muted)", borderBottom: fileMode === "url" ? "2px solid #d4a843" : "2px solid transparent", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  🔗 Book URL
                </button>
                <button
                  onClick={() => setFileMode("upload")}
                  style={{ padding: "12px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", background: fileMode === "upload" ? "rgba(212,168,67,0.12)" : "transparent", color: fileMode === "upload" ? "#d4a843" : "var(--text-muted)", borderBottom: fileMode === "upload" ? "2px solid #d4a843" : "2px solid transparent", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  📤 Upload PDF
                </button>
              </div>

              <div style={{ padding: 14 }}>
                {fileMode === "url" ? (
                  <div>
                    <label style={labelStyle}>URL (PDF, EPUB or external link)</label>
                    <input
                      style={inputStyle}
                      value={F.fileUrl}
                      onChange={e => setF({ fileUrl: e.target.value })}
                      placeholder="https://example.com/book.pdf"
                    />
                    {F.fileUrl && (
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: "#4ade80" }}>✓</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", wordBreak: "break-all" }}>{F.fileUrl}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label style={labelStyle}>PDF FILE</label>

                    {/* Upload zone */}
                    <div
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${isUploading ? "#d4a843" : "var(--border)"}`,
                        borderRadius: 10, padding: "24px 16px", textAlign: "center",
                        cursor: isUploading ? "default" : "pointer",
                        background: isUploading ? "rgba(212,168,67,0.05)" : "var(--elevated)",
                        transition: "all 0.2s",
                      }}
                    >
                      {isUploading ? (
                        <>
                          <div style={{ fontSize: 26, marginBottom: 8 }}>⏳</div>
                          <div style={{ fontSize: 13, color: "#d4a843", fontWeight: 700, marginBottom: 10 }}>Uploading… {progress}%</div>
                          <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${progress}%`, background: "#d4a843", borderRadius: 2, transition: "width 0.3s" }} />
                          </div>
                        </>
                      ) : uploadedFileName || F.fileUrl?.includes("/api/storage") ? (
                        <>
                          <div style={{ fontSize: 26, marginBottom: 6 }}>✅</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", marginBottom: 4 }}>PDF Uploaded</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{uploadedFileName || "File ready"}</div>
                          <div style={{ marginTop: 10, fontSize: 11, color: "#d4a843", cursor: "pointer" }}>Click to replace</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Tap to select PDF</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>PDF files only · Max 50MB</div>
                        </>
                      )}
                    </div>

                    {uploadFileError && (
                      <div style={{ marginTop: 8, fontSize: 11, color: "#ef4444", lineHeight: 1.4 }}>⚠️ {uploadFileError.message}</div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />

                    {F.fileUrl && F.fileUrl.includes("/api/storage") && (
                      <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(74,222,128,0.08)", borderRadius: 8, border: "1px solid rgba(74,222,128,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16 }}>📎</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#4ade80" }}>File stored</div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", wordBreak: "break-all" }}>{F.fileUrl}</div>
                        </div>
                        <button
                          onClick={() => { setF({ fileUrl: "" }); setUploadedFileName(null); }}
                          style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sort order + flags */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, alignItems: "center" }}>
              <div>
                <label style={labelStyle}>SORT ORDER</label>
                <input type="number" style={inputStyle} value={F.sortOrder} onChange={e => setF({ sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", padding: "10px 8px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10 }}>
                <input type="checkbox" checked={F.isPremium} onChange={e => setF({ isPremium: e.target.checked })} style={{ accentColor: "#d4a843", width: 16, height: 16 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: F.isPremium ? "#d4a843" : "var(--text-muted)" }}>⭐ Premium</span>
              </label>
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", padding: "10px 8px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10 }}>
                <input type="checkbox" checked={F.published} onChange={e => setF({ published: e.target.checked })} style={{ accentColor: "#4ade80", width: 16, height: 16 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: F.published ? "#4ade80" : "var(--text-muted)" }}>🟢 Published</span>
              </label>
            </div>

            {/* Save button (bottom) */}
            <button
              className="btn-gold"
              style={{ padding: "14px", fontSize: 15, fontWeight: 800, borderRadius: 12, opacity: saving || isUploading || isCoverUploading ? 0.6 : 1, marginTop: 4 }}
              onClick={save}
              disabled={saving || isUploading || isCoverUploading || !form.title.trim()}
            >
              {saving ? "Saving…" : isUploading ? "Uploading PDF…" : isCoverUploading ? "Uploading Cover…" : mode === "add" ? "➕ Add Book" : "✅ Save Changes"}
            </button>

            <div style={{ height: 16 }} />
          </div>
        )}
      </div>
    </div>
  );
}
