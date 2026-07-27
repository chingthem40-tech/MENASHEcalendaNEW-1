import { useState, useEffect, useRef } from "react";
import { calculateZmanim } from "../../../lib/zmanim";
import type { ZmanimTimes } from "../../../lib/zmanim";
import { sendNotification, isNotifSupported } from "../../../hooks/useNotifications";
import type { Location } from "../../../lib/locations";

interface UseHomeNotificationsOptions {
  isPremium: boolean;
  candleEnabled: boolean;
  location: Location;
  zmanim: ZmanimTimes;
}

export function useHomeNotifications({
  isPremium,
  candleEnabled,
  location,
  zmanim,
}: UseHomeNotificationsOptions) {
  const [candleCountdown, setCandleCountdown] = useState("");
  const [showShabbatBanner, setShowShabbatBanner] = useState(false);
  const candleNotifFiredRef = useRef<string>("");

  useEffect(() => {
    if (!isPremium || !candleEnabled) return;

    // Request notification permission silently for premium users
    if (isNotifSupported() && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    function getNextCandleLighting(): Date | null {
      const now = new Date();
      let daysUntilFriday = (5 - now.getDay() + 7) % 7;
      if (daysUntilFriday === 0 && zmanim.candleLighting && now >= zmanim.candleLighting) {
        daysUntilFriday = 7;
      }
      const fridayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilFriday);
      const fridayZmanim = calculateZmanim(fridayDate, location.lat, location.lng, location.candleLightingMinutes);
      return fridayZmanim.candleLighting;
    }

    function tick() {
      const target = getNextCandleLighting();
      if (!target) { setCandleCountdown(""); return; }
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setCandleCountdown("Now!");
        // Fire once per candle lighting time
        const key = target.toISOString();
        if (candleNotifFiredRef.current !== key) {
          candleNotifFiredRef.current = key;
          // In-app banner (always)
          setShowShabbatBanner(true);
          // Push notification (if permission granted)
          sendNotification(
            "🕯 Shabbat Candle Lighting",
            `It's time to light candles in ${location.name}! Shabbat Shalom — שַׁבָּת שָׁלוֹם`,
            "candle-lighting-premium"
          );
        }
        return;
      }
      const totalSecs = Math.floor(diff / 1000);
      const d = Math.floor(totalSecs / 86400);
      const h = Math.floor((totalSecs % 86400) / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;
      if (d > 0) {
        setCandleCountdown(`${d}d ${h}h`);
      } else if (h > 0) {
        setCandleCountdown(`${h}h ${m}m`);
      } else {
        setCandleCountdown(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      }
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isPremium, candleEnabled, location]);

  return {
    candleCountdown,
    showShabbatBanner,
    setShowShabbatBanner,
  };
}
