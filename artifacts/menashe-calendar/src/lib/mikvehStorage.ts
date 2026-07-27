export interface MikvehEntry {
  id: string;
  lastPeriodDate: string;
  hefsekDate: string;
  mikvehDate: string;
  hebrewMikvehDate: string;
  hebrewHefsekDate: string;
  note: string;
  completed: boolean;
  createdAt: string;
}

const STORAGE_KEY = "mikveh_calendar_entries";

export function loadMikvehEntries(): MikvehEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}

export function saveMikvehEntry(entry: MikvehEntry) {
  const entries = loadMikvehEntries();
  const idx = entries.findIndex(e => e.id === entry.id);
  if (idx >= 0) entries[idx] = entry; else entries.push(entry);
  entries.sort((a, b) => a.mikvehDate.localeCompare(b.mikvehDate));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
