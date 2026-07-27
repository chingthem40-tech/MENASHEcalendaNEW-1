/**
 * MinimapOverlay.tsx — PUBG-style circular minimap for the Memorial Sanctuary.
 *
 * Reads camera position + OrbitControls target from a shared ref that
 * the R3F scene updates every frame (zero React re-renders, pure RAF loop).
 *
 * World bounds shown: ±38 units on X and Z.
 * Scene north = negative Z (sanctuary architecture is at z≈-12 to -28).
 */
import { useRef, useEffect } from "react";

export interface CameraState {
  px: number; py: number; pz: number;   // camera world position
  tx: number; ty: number; tz: number;   // OrbitControls target
}

interface MinimapOverlayProps {
  cameraRef: React.MutableRefObject<CameraState | null>;
  hidden?: boolean;
}

const SIZE      = 112;      // canvas pixels
const WORLD_R   = 38;       // world units from centre to minimap edge
const SCALE     = SIZE / (WORLD_R * 2);
const CX        = SIZE / 2;
const CY        = SIZE / 2;

/* Convert world (x, z) → canvas pixel (px, py).
   World +Z = "south" on the minimap (bottom), -Z = "north" (top). */
function toMap(wx: number, wz: number) {
  return { px: CX + wx * SCALE, py: CY + wz * SCALE };
}

/* Static landmark data — matches scene geometry in MemorialValley3D.tsx */
const WATERFALLS : [number,number][] = [[-18,-8],[16,14],[-4,-20]];
const BRIDGES    : [number,number][] = [[-4.5,12],[4.5,-6]];
const TREE_RING  : [number,number][] = [
  [-20,-18],[-10,-26],[6,-28],[20,-18],[26,-4],[20,16],[4,24],[-14,20],[-24,4],
];
const LAVENDER   : [number,number][] = [[-9,-8],[9,12],[-14,10],[14,-8],[0,-16]];

export function MinimapOverlay({ cameraRef, hidden = false }: MinimapOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function draw() {
      ctx.clearRect(0, 0, SIZE, SIZE);

      /* ── clip everything to circle ── */
      ctx.save();
      ctx.beginPath();
      ctx.arc(CX, CY, CX - 1, 0, Math.PI * 2);
      ctx.clip();

      /* ── Background — dark terrain ── */
      const bg = ctx.createRadialGradient(CX, CY, 0, CX, CY, CX);
      bg.addColorStop(0,   "#0e1e0c");
      bg.addColorStop(0.5, "#0a1609");
      bg.addColorStop(1,   "#070e06");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, SIZE, SIZE);

      /* ── Subtle water/path shape in centre (valley floor) ── */
      ctx.fillStyle = "rgba(18,30,14,0.8)";
      ctx.beginPath();
      ctx.ellipse(CX, CY + 2, 22 * SCALE, 28 * SCALE, 0, 0, Math.PI * 2);
      ctx.fill();

      /* ── Stone path strip (running north–south through centre) ── */
      ctx.fillStyle = "rgba(50,42,30,0.55)";
      const pathW = 3.5 * SCALE;
      ctx.beginPath();
      const p1 = toMap(-pathW / SCALE, -WORLD_R);
      const p2 = toMap( pathW / SCALE, -WORLD_R);
      const p3 = toMap( pathW * 1.6 / SCALE,  WORLD_R);
      const p4 = toMap(-pathW * 1.6 / SCALE,  WORLD_R);
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.lineTo(p3.px, p3.py);
      ctx.lineTo(p4.px, p4.py);
      ctx.closePath();
      ctx.fill();

      /* ── Tree ring dots (olive/cypress canopy) ── */
      for (const [wx, wz] of TREE_RING) {
        const { px, py } = toMap(wx, wz);
        ctx.fillStyle = "rgba(24,46,18,0.85)";
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(38,68,24,0.6)";
        ctx.beginPath();
        ctx.arc(px - 1, py - 1, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      /* ── Lavender bed patches ── */
      for (const [wx, wz] of LAVENDER) {
        const { px, py } = toMap(wx, wz);
        ctx.fillStyle = "rgba(80,60,120,0.30)";
        ctx.beginPath();
        ctx.ellipse(px, py, 3.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      /* ── Waterfall dots (cyan-blue) ── */
      for (const [wx, wz] of WATERFALLS) {
        const { px, py } = toMap(wx, wz);
        ctx.fillStyle = "rgba(80,170,215,0.75)";
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(130,210,240,0.55)";
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      /* ── Bridge markers ── */
      for (const [wx, wz] of BRIDGES) {
        const { px, py } = toMap(wx, wz);
        ctx.fillStyle = "rgba(150,130,90,0.60)";
        ctx.fillRect(px - 3.5, py - 1.2, 7, 2.4);
      }

      /* ── Sanctuary / altar (gold rectangle north of centre) ── */
      const { px: sax, py: say } = toMap(0, -18);
      ctx.fillStyle = "rgba(212,168,67,0.28)";
      ctx.fillRect(sax - 6, say - 4, 12, 8);
      ctx.strokeStyle = "rgba(212,168,67,0.50)";
      ctx.lineWidth = 0.8;
      ctx.strokeRect(sax - 6, say - 4, 12, 8);

      /* ── Altar (eternal flame) at scene centre ── */
      const { px: ax, py: ay } = toMap(0, 0);
      ctx.fillStyle = "rgba(255,180,60,0.55)";
      ctx.beginPath();
      ctx.arc(ax, ay, 2.2, 0, Math.PI * 2);
      ctx.fill();

      /* ── Camera state ── */
      const cs = cameraRef.current;
      if (cs) {
        const camMX = toMap(cs.px, cs.pz);
        const dx = cs.tx - cs.px;
        const dz = cs.tz - cs.pz;

        /* Horizontal facing angle in minimap space.
           atan2(dx, dz) gives angle from +Z axis (south) clockwise. */
        const angle = Math.atan2(dx, dz);

        /* View cone — FOV 65°, cone length ~18 world units shown */
        const fovHalf  = (68 * Math.PI / 180) / 2;
        const coneLen  = 18 * SCALE;

        ctx.save();
        ctx.globalAlpha = 0.16;
        ctx.fillStyle   = "#D4AF37";
        ctx.beginPath();
        ctx.moveTo(camMX.px, camMX.py);
        ctx.arc(camMX.px, camMX.py, coneLen, angle - Math.PI / 2 - fovHalf, angle - Math.PI / 2 + fovHalf);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        /* Direction line (centre of cone) */
        ctx.strokeStyle = "rgba(212,168,67,0.50)";
        ctx.lineWidth   = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(camMX.px, camMX.py);
        const dirLen = coneLen * 0.72;
        ctx.lineTo(
          camMX.px + Math.sin(angle - Math.PI / 2) * dirLen,
          camMX.py + Math.cos(angle - Math.PI / 2) * dirLen,
        );
        ctx.stroke();
        ctx.setLineDash([]);

        /* Camera dot — bright gold with glow */
        ctx.fillStyle   = "#D4AF37";
        ctx.shadowColor = "rgba(212,168,67,0.95)";
        ctx.shadowBlur  = 7;
        ctx.beginPath();
        ctx.arc(camMX.px, camMX.py, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        /* White centre pip */
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.beginPath();
        ctx.arc(camMX.px, camMX.py, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore(); /* end circle clip */

      /* ── Outer border ring ── */
      ctx.strokeStyle = "rgba(212,168,67,0.32)";
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(CX, CY, CX - 1, 0, Math.PI * 2);
      ctx.stroke();

      /* ── Cardinal compass labels ── */
      ctx.font      = "bold 7.5px system-ui,sans-serif";
      ctx.textAlign = "center";

      ctx.fillStyle = "rgba(212,168,67,0.75)";
      ctx.fillText("N", CX, 10);

      ctx.fillStyle = "rgba(180,180,180,0.35)";
      ctx.fillText("S", CX, SIZE - 3);
      ctx.fillText("W", 8,  CY + 3);
      ctx.fillText("E", SIZE - 5, CY + 3);
    }

    function loop() {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cameraRef]);

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      style={{
        position:      "absolute",
        bottom:        72,       /* above bottom nav bar */
        right:         14,
        width:         SIZE,
        height:        SIZE,
        borderRadius:  "50%",
        pointerEvents: "none",
        zIndex:        30,
        opacity:       hidden ? 0 : 0.90,
        transition:    "opacity 0.3s ease",
        boxShadow:     "0 4px 20px rgba(0,0,0,0.75), 0 0 0 1px rgba(212,168,67,0.22)",
      }}
    />
  );
}
