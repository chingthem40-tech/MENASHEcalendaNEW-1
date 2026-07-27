import { useState, useEffect, useRef, useCallback } from "react";

// ─── Israel daylight scenes (verified working URLs) ───────────────────────────
const DAY_IMAGES = [
  // Dome of the Rock / Temple Mount — Jerusalem holy city
  "https://p1.hippopx.com/preview/477/140/925/israel-jerusalem-holy-city-city-royalty-free-thumbnail.jpg",
  // Jerusalem Old City — panoramic view from above
  "https://p1.hippopx.com/preview/626/67/758/jerusalem-holy-land-old-city-religion-royalty-free-thumbnail.jpg",
  // Jerusalem stone walls and cityscape
  "https://p1.hippopx.com/preview/830/624/915/city-landscape-wall-cityscape-royalty-free-thumbnail.jpg",
  // Golden hour over Jerusalem
  "https://t4.ftcdn.net/jpg/02/67/24/77/360_F_267247778_tnDQ73R9yHwkDOEYZxKeGbmmPSCNFQpz.jpg",
];

// ─── Israel religious night scenes (verified working URLs) ────────────────────
const NIGHT_IMAGES = [
  // Western Wall & Dome of the Rock — night (Wikimedia Commons)
  "https://upload.wikimedia.org/wikipedia/commons/2/2b/The_Western_Wall_and_Dome_of_the_rock_in_the_old_city_of_Jerusalem.jpg",
  // Western Wall close-up — Britannica CDN
  "https://cdn.britannica.com/59/91859-004-7439A10F/Western-Wall-Old-City-of-Jerusalem-Second.jpg",
  // Jerusalem night panorama from hills
  "https://thumbs.dreamstime.com/b/night-city-lights-over-jerusalem-hills-park-overlooking-city-israel-jerusalem-israel-december-night-panorama-lit-428151388.jpg",
  // Jerusalem night skyline — Old City
  "https://thumbs.dreamstime.com/b/night-jerusalem-israel-skyline-jerusalem-night-old-sity-132290102.jpg",
];

// ─── Future theme overrides (plug in image sets as needed) ───────────────────
const THEME_IMAGES: Partial<Record<BackgroundTheme, string[]>> = {
  shabbat:  [],
  holiday:  [],
  memorial: [],
  parasha:  [],
};

export type BackgroundTheme = "auto" | "day" | "night" | "shabbat" | "holiday" | "memorial" | "parasha";

interface Slot { src: string; kb: "a" | "b" | "c" | "d"; }

interface Props {
  sunrise?: Date | null;
  sunset?: Date | null;
  theme?: BackgroundTheme;
}

// ─── Ken Burns keyframe variants ──────────────────────────────────────────────
const KB_CSS = `
@keyframes tab-kb-a {
  0%   { transform: scale(1.05) translate(0%, 0%); }
  100% { transform: scale(1.18) translate(-2.5%, -1.5%); }
}
@keyframes tab-kb-b {
  0%   { transform: scale(1.05) translate(0%, 0%); }
  100% { transform: scale(1.18) translate(2.5%, -1%); }
}
@keyframes tab-kb-c {
  0%   { transform: scale(1.05) translate(0%, 0%); }
  100% { transform: scale(1.18) translate(-1.5%, 2%); }
}
@keyframes tab-kb-d {
  0%   { transform: scale(1.05) translate(0%, 0%); }
  100% { transform: scale(1.18) translate(1.5%, 1.5%); }
}
`;

const KB_VARIANTS: Array<"a" | "b" | "c" | "d"> = ["a", "b", "c", "d"];

function pickKb(exclude?: Slot["kb"]): Slot["kb"] {
  const choices = exclude ? KB_VARIANTS.filter(v => v !== exclude) : KB_VARIANTS;
  return choices[Math.floor(Math.random() * choices.length)];
}

function isDaytime(sunrise: Date | null | undefined, sunset: Date | null | undefined, now: Date): boolean {
  if (sunrise && sunset && !isNaN(sunrise.getTime()) && !isNaN(sunset.getTime())) {
    return now >= sunrise && now < sunset;
  }
  const h = now.getHours();
  return h >= 6 && h < 19;
}

function pickImages(theme: BackgroundTheme, daytime: boolean): string[] {
  if (theme !== "auto" && THEME_IMAGES[theme]?.length) return THEME_IMAGES[theme]!;
  return daytime ? DAY_IMAGES : NIGHT_IMAGES;
}

const ROTATE_MS = 6000;
const FADE_MS   = 900;

export default function TimeAwareBackground({ sunrise, sunset, theme = "auto" }: Props) {
  const now     = new Date();
  const daytime = theme === "auto" ? isDaytime(sunrise, sunset, now) : theme === "day";
  const images  = pickImages(theme, daytime);

  const idxRef  = useRef(0);
  const [activeSlot, setActiveSlot] = useState<"A" | "B">("A");
  const [slotA, setSlotA] = useState<Slot>({ src: images[0], kb: pickKb() });
  const [slotB, setSlotB] = useState<Slot>({ src: images[1 % images.length], kb: pickKb("a") });
  const [aOpacity, setAOpacity] = useState(1);
  const [bOpacity, setBOpacity] = useState(0);

  const intervalRef    = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const timeoutRef     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Preload an image without blocking render
  const preload = useCallback((src: string) => {
    const img = new Image();
    img.src = src;
  }, []);

  // Advance to the next image
  const advance = useCallback(() => {
    idxRef.current = (idxRef.current + 1) % images.length;
    const nextSrc = images[idxRef.current];
    const nextNextSrc = images[(idxRef.current + 1) % images.length];

    setActiveSlot(prev => {
      if (prev === "A") {
        // B is currently hidden — load next into B, then fade A→B
        setSlotB({ src: nextSrc, kb: pickKb() });
        requestAnimationFrame(() => {
          setAOpacity(0);
          setBOpacity(1);
        });
        preload(nextNextSrc);
        return "B";
      } else {
        // A is currently hidden — load next into A, then fade B→A
        setSlotA({ src: nextSrc, kb: pickKb() });
        requestAnimationFrame(() => {
          setBOpacity(0);
          setAOpacity(1);
        });
        preload(nextNextSrc);
        return "A";
      }
    });
  }, [images, preload]);

  useEffect(() => {
    intervalRef.current = setInterval(advance, ROTATE_MS);
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [advance]);

  // Preload first two on mount
  useEffect(() => {
    preload(images[0]);
    preload(images[1 % images.length]);
  }, []);

  const overlayDay   = "linear-gradient(to bottom, rgba(15,8,0,0.42) 0%, rgba(30,15,0,0.52) 55%, rgba(0,0,0,0.78) 100%)";
  const overlayNight = "linear-gradient(to bottom, rgba(0,4,18,0.52) 0%, rgba(0,8,28,0.62) 55%, rgba(0,0,0,0.82) 100%)";
  const overlay = daytime ? overlayDay : overlayNight;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: "inherit" }}>
      <style>{KB_CSS}</style>

      {/* Slot A */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: aOpacity,
        transition: `opacity ${FADE_MS}ms ease-in-out`,
        willChange: "opacity",
      }}>
        <img
          src={slotA.src}
          alt=""
          draggable={false}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            animationName: `tab-kb-${slotA.kb}`,
            animationDuration: `${ROTATE_MS * 2}ms`,
            animationTimingFunction: "ease-in-out",
            animationFillMode: "forwards",
            animationIterationCount: 1,
            willChange: "transform",
          }}
        />
      </div>

      {/* Slot B */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: bOpacity,
        transition: `opacity ${FADE_MS}ms ease-in-out`,
        willChange: "opacity",
      }}>
        <img
          src={slotB.src}
          alt=""
          draggable={false}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            animationName: `tab-kb-${slotB.kb}`,
            animationDuration: `${ROTATE_MS * 2}ms`,
            animationTimingFunction: "ease-in-out",
            animationFillMode: "forwards",
            animationIterationCount: 1,
            willChange: "transform",
          }}
        />
      </div>

      {/* Gradient overlay for readability */}
      <div style={{
        position: "absolute", inset: 0,
        background: overlay,
        pointerEvents: "none",
      }} />

      {/* Subtle vignette edges */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)",
        pointerEvents: "none",
      }} />
    </div>
  );
}
