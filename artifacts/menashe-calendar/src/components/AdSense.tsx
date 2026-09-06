import { useEffect, useRef } from "react";

interface AdSenseProps {
  slot?: string;
  format?: string;
  responsive?: boolean;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdSense({
  slot = "2958007223",
  format = "auto",
  responsive = true,
  className = "",
}: AdSenseProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      if (
        adRef.current &&
        !adRef.current.getAttribute("data-adsbygoogle-status")
      ) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error("AdSense initialization error:", error);
    }
  }, []);

  return (
    <div
      className={`adsense-container w-full overflow-hidden ${className}`}
      aria-label="Advertisement"
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: "block",
          width: "100%",
          minHeight: "90px",
        }}
        data-ad-client="ca-pub-2540195924859072"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
