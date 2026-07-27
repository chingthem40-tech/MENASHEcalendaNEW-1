import { useState, useEffect, useCallback, useRef } from "react";
import { fetchAnnouncements, type ServerAnnouncement } from "../lib/announcementsApi";

const SEEN_KEY = "menashe-seen-announcements";
const POLL_INTERVAL_MS = 5 * 60 * 1000;

function loadSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}

function saveSeenIds(ids: Set<string>) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...ids])); } catch {}
}

export function useUnreadAnnouncements() {
  const [sentAnnouncements, setSentAnnouncements] = useState<ServerAnnouncement[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(loadSeenIds);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const list = await fetchAnnouncements();
      setSentAnnouncements(list.filter(a => a.status === "sent"));
    } catch {}
  }, []);

  useEffect(() => {
    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [poll]);

  const unreadAnnouncements = sentAnnouncements.filter(a => !seenIds.has(a.id));
  const unreadCount = unreadAnnouncements.length;

  const markAllRead = useCallback(() => {
    setSeenIds(prev => {
      const next = new Set([...prev, ...sentAnnouncements.map(a => a.id)]);
      saveSeenIds(next);
      return next;
    });
  }, [sentAnnouncements]);

  return { unreadCount, unreadAnnouncements, markAllRead };
}
