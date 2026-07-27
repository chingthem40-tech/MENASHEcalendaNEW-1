const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export interface Book {
  id: number;
  title: string;
  language: string;
  category: string;
  description: string;
  coverEmoji: string;
  coverColor: string;
  fileUrl: string | null;
  coverImageUrl: string | null;
  isPremium: boolean;
  published: boolean;
  sortOrder: number;
}

export async function fetchBooks(): Promise<Book[]> {
  try {
    const res = await fetch(`${API_BASE}/books`);
    if (res.ok) return res.json();
    return [];
  } catch {
    return [];
  }
}
