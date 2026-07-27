import { useState } from "react";

export function useHomeLocation() {
  const [mapForceExpand, setMapForceExpand] = useState(false);
  const [showCompassCard, setShowCompassCard] = useState(false);

  function onShowMap() {
    setMapForceExpand(true);
    setTimeout(() => setMapForceExpand(false), 200);
  }

  function onShowCompass() {
    setShowCompassCard(true);
  }

  return {
    mapForceExpand,
    showCompassCard,
    setShowCompassCard,
    onShowMap,
    onShowCompass,
  };
}
