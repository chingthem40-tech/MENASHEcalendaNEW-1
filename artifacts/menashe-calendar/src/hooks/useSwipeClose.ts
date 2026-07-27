import { useRef } from "react";

export function useSwipeClose(onClose: () => void, threshold = 88) {
  const startY = useRef<number | null>(null);

  return {
    onTouchStart: (e: React.TouchEvent) => {
      startY.current = e.touches[0].clientY;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (startY.current === null) return;
      const dy = e.changedTouches[0].clientY - startY.current;
      if (dy > threshold) onClose();
      startY.current = null;
    },
  };
}
