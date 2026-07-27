import { useState, useEffect, useRef, useCallback } from "react";
import { sendNotification, isNotifSupported } from "./useNotifications";
import { broadcastAnnouncement, deleteAnnouncementServer, patchAnnouncement } from "../lib/announcementsApi";

export type AnnouncementStatus = "draft" | "scheduled" | "sent";

export interface Announcement {
  id: string;
  emoji: string;
  title: string;
  body: string;
  scheduledAt: string | null;
  sentAt: string | null;
  status: AnnouncementStatus;
  pinned: boolean;
}

const STORAGE_KEY = "menashe-announcements";

export function loadAnnouncements(): Announcement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Announcement[];
  } catch {}
  return [];
}

export function saveAnnouncements(list: Announcement[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(loadAnnouncements);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const persist = useCallback((list: Announcement[]) => {
    setAnnouncements(list);
    saveAnnouncements(list);
  }, []);

  const scheduleOne = useCallback((ann: Announcement) => {
    if (ann.status !== "scheduled" || !ann.scheduledAt) return;
    const ms = new Date(ann.scheduledAt).getTime() - Date.now();
    if (ms <= 0) return;

    const existing = timersRef.current.get(ann.id);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      if (isNotifSupported() && Notification.permission === "granted") {
        sendNotification(`${ann.emoji} ${ann.title}`, ann.body, `announcement-${ann.id}`);
      }
      setAnnouncements(prev => {
        const updated = prev.map(a =>
          a.id === ann.id
            ? { ...a, status: "sent" as AnnouncementStatus, sentAt: new Date().toISOString() }
            : a
        );
        saveAnnouncements(updated);
        return updated;
      });
      patchAnnouncement(ann.id, { sendNow: true }).catch(() => {});
      timersRef.current.delete(ann.id);
    }, ms);

    timersRef.current.set(ann.id, timer);
  }, []);

  useEffect(() => {
    const current = loadAnnouncements();
    setAnnouncements(current);
    current.forEach(ann => scheduleOne(ann));
    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  const sendNow = useCallback((ann: Announcement) => {
    if (isNotifSupported() && Notification.permission === "granted") {
      sendNotification(`${ann.emoji} ${ann.title}`, ann.body, `announcement-${ann.id}`);
    }
    setAnnouncements(prev => {
      const updated = prev.map(a =>
        a.id === ann.id
          ? { ...a, status: "sent" as AnnouncementStatus, sentAt: new Date().toISOString(), scheduledAt: null }
          : a
      );
      saveAnnouncements(updated);
      return updated;
    });
    broadcastAnnouncement({
      emoji: ann.emoji, title: ann.title, body: ann.body, pinned: ann.pinned,
    }).catch(() => {});
  }, []);

  const addAnnouncement = useCallback((data: Omit<Announcement, "id" | "sentAt">) => {
    const ann: Announcement = { ...data, id: `ann-${Date.now()}`, sentAt: null };
    setAnnouncements(prev => {
      const updated = [ann, ...prev];
      saveAnnouncements(updated);
      return updated;
    });
    if (ann.status === "scheduled") scheduleOne(ann);
    return ann;
  }, [scheduleOne]);

  const updateAnnouncement = useCallback((id: string, patch: Partial<Announcement>) => {
    setAnnouncements(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, ...patch } : a);
      saveAnnouncements(updated);
      const fresh = updated.find(a => a.id === id);
      if (fresh && fresh.status === "scheduled") {
        const existing = timersRef.current.get(id);
        if (existing) clearTimeout(existing);
        scheduleOne(fresh);
      }
      return updated;
    });
  }, [scheduleOne]);

  const deleteAnnouncement = useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t) { clearTimeout(t); timersRef.current.delete(id); }
    setAnnouncements(prev => {
      const updated = prev.filter(a => a.id !== id);
      saveAnnouncements(updated);
      return updated;
    });
    deleteAnnouncementServer(id).catch(() => {});
  }, []);

  const unreadCount = announcements.filter(a => a.status === "sent").length;

  return { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement, sendNow, unreadCount };
}
