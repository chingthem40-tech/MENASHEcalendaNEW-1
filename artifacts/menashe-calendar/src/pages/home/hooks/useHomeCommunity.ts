import { useState, useEffect, useRef } from "react";
import { HDate } from "@hebcal/core";
import { fetchCommunityYahrzeit } from "../../../lib/userApi";
import { FAB_POS_KEY, FAB_HINT_KEY } from "../data";

export function useHomeCommunity() {
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const s = localStorage.getItem(FAB_POS_KEY);
      if (s) {
        const p = JSON.parse(s);
        if (typeof p.x === "number" && typeof p.y === "number") return p;
      }
    } catch {}
    /* Default: top-right area, safely above the 70px bottom nav + safe area */
    return { x: window.innerWidth - 92, y: window.innerHeight - 280 };
  });
  const drag = useRef({
    active: false, startX: 0, startY: 0, initX: 0, initY: 0, moved: false,
  });

  const [showHint, setShowHint] = useState(() => {
    try { return !localStorage.getItem(FAB_HINT_KEY); } catch { return false; }
  });

  const [upcomingEventCount, setUpcomingEventCount] = useState(0);
  const [upcomingYahrzeitCount, setUpcomingYahrzeitCount] = useState(0);

  // Auto-dismiss hint after 3.5s
  useEffect(() => {
    if (!showHint) return;
    const timer = setTimeout(() => setShowHint(false), 3500);
    return () => clearTimeout(timer);
  }, [showHint]);

  // Load upcoming community yahrzeit count
  useEffect(() => {
    fetchCommunityYahrzeit().then(entries => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const in30 = new Date(today);
      in30.setDate(in30.getDate() + 30);
      const curHYear = new HDate(today).getFullYear();

      let count = 0;
      for (const e of entries) {
        for (const yr of [curHYear, curHYear + 1]) {
          try {
            const greg = new HDate(e.hebrewDay, e.hebrewMonth, yr).greg();
            greg.setHours(0, 0, 0, 0);
            if (greg >= today && greg <= in30) { count++; break; }
            if (greg > in30) break;
          } catch { /* skip invalid hebrew dates */ }
        }
      }
      setUpcomingYahrzeitCount(count);
    }).catch(() => {});
  }, []);

  // Count upcoming community events from localStorage
  useEffect(() => {
    function countUpcoming() {
      try {
        const raw = localStorage.getItem("menashe-community-events");
        const events: Array<{ date: string }> = raw ? JSON.parse(raw) : [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const count = events.filter(e => {
          const d = new Date(e.date + "T00:00:00");
          return d >= today;
        }).length;
        setUpcomingEventCount(count);
      } catch {
        setUpcomingEventCount(0);
      }
    }
    countUpcoming();
    window.addEventListener("storage", countUpcoming);
    return () => window.removeEventListener("storage", countUpcoming);
  }, []);

  function triggerClose() {
    setIsClosing(true);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    // 8 items × 70ms stagger + 400ms animation = 960ms; wait 990ms
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 990);
  }

  function handleMainClick() {
    if (drag.current.moved) return;
    if (open && !isClosing) triggerClose();
    else if (!isClosing) setOpen(true);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (open) return;
    drag.current = {
      active: true,
      startX: e.clientX, startY: e.clientY,
      initX: pos.x, initY: pos.y,
      moved: false,
    };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) drag.current.moved = true;
    if (!drag.current.moved) return;
    if (showHint) {
      setShowHint(false);
      try { localStorage.setItem(FAB_HINT_KEY, "1"); } catch {}
    }
    /* Clamp x within screen, clamp y so FAB can't be dragged into the bottom nav zone
       (70px nav + ~34px safe area + 10px buffer = ~114px from bottom = innerHeight - 214) */
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 80, drag.current.initX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 214, drag.current.initY + dy)),
    });
  }

  function onPointerUp() {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (drag.current.moved) {
      try { localStorage.setItem(FAB_HINT_KEY, "1"); } catch {}
      setPos(p => {
        try { localStorage.setItem(FAB_POS_KEY, JSON.stringify(p)); } catch {}
        return p;
      });
    }
  }

  function handleItem(action: () => void) {
    triggerClose();
    action();
  }

  return {
    open, setOpen,
    isClosing,
    pos,
    showHint,
    upcomingEventCount,
    upcomingYahrzeitCount,
    drag,
    triggerClose,
    handleMainClick,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    handleItem,
  };
}
