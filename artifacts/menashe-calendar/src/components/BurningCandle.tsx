import { memo, useEffect, useState } from "react";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

interface LearnerInfo {
  id: string;
  learnerName: string;
  studySubject: string;
}

interface BurningCandleProps {
  deceasedName: string;
  yahrzeitNumber?: number;
  donorName?: string;
  learners?: LearnerInfo[];
  isLit?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

const BurningCandle = memo(function BurningCandle({
  deceasedName,
  yahrzeitNumber,
  donorName,
  learners = [],
  isLit = true,
  onClick,
  compact = false,
}: BurningCandleProps) {
  const [activeLearnerIdx, setActiveLearnerIdx] = useState(0);
  const [showLearner, setShowLearner] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (learners.length === 0) return;
    let i = 0;
    const show = () => {
      setActiveLearnerIdx(i % learners.length);
      setAnimKey(k => k + 1);
      setShowLearner(true);
      i++;
      setTimeout(() => setShowLearner(false), 3800);
    };
    show();
    const iv = setInterval(show, 5500);
    return () => clearInterval(iv);
  }, [learners.length]);

  const W = compact ? 110 : 140;
  const activeLearner = learners[activeLearnerIdx];

  return (
    <>
      <style>{`
        @keyframes bc-outer {
          0%,100% { transform: scaleX(1) scaleY(1) rotate(-3deg); }
          20%  { transform: scaleX(1.12) scaleY(0.93) rotate(4deg); }
          50%  { transform: scaleX(0.92) scaleY(1.06) rotate(-2deg); }
          75%  { transform: scaleX(1.07) scaleY(0.96) rotate(3deg); }
        }
        @keyframes bc-mid {
          0%,100% { transform: scaleX(1) scaleY(1) rotate(2deg); }
          33%  { transform: scaleX(0.86) scaleY(1.14) rotate(-4deg); }
          66%  { transform: scaleX(1.12) scaleY(0.9) rotate(2deg); }
        }
        @keyframes bc-inner {
          0%,100% { transform: scaleX(1) scaleY(1) rotate(-1deg); }
          40%  { transform: scaleX(0.8) scaleY(1.2) rotate(3deg); }
          80%  { transform: scaleX(1.16) scaleY(0.86) rotate(-2deg); }
        }
        @keyframes bc-glow-pulse {
          0%,100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
          50%     { opacity: 0.75; transform: translateX(-50%) scale(1.12); }
        }
        @keyframes bc-halo {
          0%,100% { opacity: 0.18; transform: translateX(-50%) scaleX(1); }
          50%     { opacity: 0.28; transform: translateX(-50%) scaleX(1.1); }
        }
        @keyframes bc-float {
          0%   { opacity: 0;    transform: translateX(-50%) translateY(4px) scale(0.7); }
          15%  { opacity: 1;    transform: translateX(-50%) translateY(-10px) scale(1); }
          72%  { opacity: 0.85; transform: translateX(-50%) translateY(-52px) scale(0.96); }
          100% { opacity: 0;    transform: translateX(-50%) translateY(-72px) scale(0.8); }
        }
        @keyframes bc-drip1 {
          0%   { height: 0; }
          100% { height: 22px; }
        }
        @keyframes bc-drip2 {
          0%   { height: 0; }
          100% { height: 16px; }
        }
        @keyframes bc-smoke {
          0%   { opacity: 0.4; transform: translateX(-50%) translateY(0) scaleX(1); }
          100% { opacity: 0;   transform: translateX(-50%) translateY(-28px) scaleX(1.6); }
        }
      `}</style>

      <div
        onClick={onClick}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          cursor: onClick ? "pointer" : "default",
          width: W,
          transition: "transform 0.2s",
          userSelect: "none",
        }}
      >
        {/* ── Flame + smoke area ── */}
        <div style={{ position: "relative", height: compact ? 70 : 88, width: 60, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
          {isLit ? (
            <>
              {/* Wide orange glow halo */}
              <div style={{
                position: "absolute", bottom: -4, left: "50%",
                width: compact ? 54 : 68, height: compact ? 68 : 84,
                background: "radial-gradient(ellipse, rgba(255,130,0,0.22) 0%, rgba(255,80,0,0.08) 50%, transparent 75%)",
                borderRadius: "50%",
                animation: "bc-glow-pulse 2.2s ease-in-out infinite",
                pointerEvents: "none",
              }} />

              {/* Outer flame */}
              <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", transformOrigin: "bottom center" }}>
                <div style={{
                  width: compact ? 30 : 38, height: compact ? 50 : 62,
                  background: "linear-gradient(to top, rgba(255,60,0,0.92) 0%, rgba(255,130,0,0.95) 38%, rgba(255,175,20,0.7) 68%, transparent 100%)",
                  borderRadius: "50% 50% 28% 28% / 44% 44% 56% 56%",
                  transformOrigin: "bottom center",
                  animation: "bc-outer 2.1s ease-in-out infinite",
                  filter: "blur(1.5px)",
                }} />
              </div>

              {/* Mid flame */}
              <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", transformOrigin: "bottom center" }}>
                <div style={{
                  width: compact ? 20 : 26, height: compact ? 38 : 48,
                  background: "linear-gradient(to top, rgba(255,175,0,0.97) 0%, rgba(255,215,30,0.97) 48%, rgba(255,240,110,0.75) 78%, transparent 100%)",
                  borderRadius: "50% 50% 28% 28% / 44% 44% 56% 56%",
                  transformOrigin: "bottom center",
                  animation: "bc-mid 1.45s ease-in-out infinite",
                }} />
              </div>

              {/* Inner flame */}
              <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", transformOrigin: "bottom center" }}>
                <div style={{
                  width: compact ? 12 : 15, height: compact ? 28 : 35,
                  background: "linear-gradient(to top, rgba(255,225,100,1) 0%, rgba(255,248,190,1) 56%, rgba(255,255,230,0.85) 100%)",
                  borderRadius: "50% 50% 28% 28% / 44% 44% 56% 56%",
                  transformOrigin: "bottom center",
                  animation: "bc-inner 0.92s ease-in-out infinite",
                }} />
              </div>

              {/* White-blue core */}
              <div style={{
                position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)",
                width: compact ? 6 : 8, height: compact ? 15 : 20,
                background: "linear-gradient(to top, rgba(190,215,255,0.88) 0%, rgba(255,255,255,1) 55%, transparent 100%)",
                borderRadius: "50% 50% 28% 28% / 44% 44% 56% 56%",
              }} />

              {/* Floating learner text */}
              {showLearner && activeLearner && (
                <div
                  key={animKey}
                  style={{
                    position: "absolute", bottom: 8, left: "50%",
                    width: 150,
                    textAlign: "center",
                    fontSize: 9,
                    fontWeight: 800,
                    color: "rgba(255,245,160,0.97)",
                    textShadow: "0 0 10px rgba(255,180,0,1), 0 0 20px rgba(255,100,0,0.8)",
                    pointerEvents: "none",
                    lineHeight: 1.35,
                    animation: "bc-float 4.5s ease-in-out forwards",
                    zIndex: 10,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {activeLearner.learnerName}
                  <br />
                  <span style={{ fontSize: 8, opacity: 0.88 }}>📖 {activeLearner.studySubject}</span>
                </div>
              )}
            </>
          ) : (
            /* Unlit: show smoke wisps */
            <>
              <div style={{
                position: "absolute", bottom: 10, left: "50%",
                width: 3, height: 24,
                background: "linear-gradient(to top, rgba(150,140,180,0.5), transparent)",
                borderRadius: 2,
                animation: "bc-smoke 2.5s ease-in-out infinite",
              }} />
              <div style={{
                position: "absolute", bottom: 10, left: "calc(50% - 5px)",
                width: 2, height: 18,
                background: "linear-gradient(to top, rgba(140,130,170,0.35), transparent)",
                borderRadius: 2,
                animation: "bc-smoke 3s ease-in-out infinite",
                animationDelay: "0.8s",
              }} />
            </>
          )}
        </div>

        {/* ── Wick ── */}
        <div style={{
          width: 2.5, height: 10,
          background: isLit ? "linear-gradient(to bottom, #180800, #3d1a06)" : "#2a2038",
          borderRadius: "2px 2px 0 0",
          zIndex: 2,
          position: "relative",
        }}>
          {/* Ember tip when lit */}
          {isLit && (
            <div style={{
              position: "absolute", top: -3, left: "50%", transform: "translateX(-50%)",
              width: 4, height: 4, borderRadius: "50%",
              background: "radial-gradient(#ff6000, rgba(255,80,0,0.3))",
              boxShadow: "0 0 4px 2px rgba(255,100,0,0.5)",
            }} />
          )}
        </div>

        {/* ── Wax body ── */}
        <div style={{
          position: "relative",
          width: compact ? 42 : 50,
          height: compact ? 72 : 88,
          background: isLit
            ? "linear-gradient(140deg, #f9f0da 0%, #f2e3bb 35%, #e9d09e 65%, #dfc08a 100%)"
            : "linear-gradient(140deg, #3a3455 0%, #2e2948 40%, #231e3c 100%)",
          borderRadius: "8px 8px 5px 5px",
          boxShadow: isLit
            ? "inset -9px 0 18px rgba(0,0,0,0.13), inset 5px 0 10px rgba(255,255,255,0.28), 0 6px 24px rgba(0,0,0,0.45), 0 0 40px rgba(255,150,40,0.18)"
            : "inset -7px 0 14px rgba(0,0,0,0.28), 0 5px 18px rgba(0,0,0,0.45)",
          overflow: "visible",
        }}>
          {/* Wax pool glow at top */}
          {isLit && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 20,
              background: "radial-gradient(ellipse at 50% 0%, rgba(255,240,190,0.75) 0%, transparent 65%)",
              borderRadius: "8px 8px 0 0",
            }} />
          )}
          {/* Highlight stripe */}
          <div style={{
            position: "absolute", top: 10, left: 7, width: 6, bottom: 12,
            background: isLit
              ? "linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,0.1))"
              : "rgba(255,255,255,0.04)",
            borderRadius: 3,
          }} />
          {/* Wax drip 1 */}
          <div style={{
            position: "absolute", top: 0, left: 7,
            width: 8, height: compact ? 16 : 22,
            background: isLit ? "linear-gradient(to bottom, #f2e3bb, #e9d09e)" : "#2e2948",
            borderRadius: "0 0 7px 7px",
            animation: "bc-drip1 1.2s ease-out both",
            animationDelay: "0.3s",
          }} />
          {/* Wax drip 2 */}
          <div style={{
            position: "absolute", top: 0, right: 9,
            width: 6, height: compact ? 12 : 16,
            background: isLit ? "linear-gradient(to bottom, #f2e3bb, #e9d09e)" : "#2e2948",
            borderRadius: "0 0 5px 5px",
            animation: "bc-drip2 1.5s ease-out both",
            animationDelay: "0.8s",
          }} />
          {/* Drip 3 */}
          <div style={{
            position: "absolute", top: 0, left: "36%",
            width: 5, height: compact ? 9 : 12,
            background: isLit ? "#f2e3bb" : "#2e2948",
            borderRadius: "0 0 4px 4px",
          }} />
        </div>

        {/* ── Candle holder ── */}
        <div style={{
          width: compact ? 52 : 62,
          height: 9,
          background: isLit
            ? "linear-gradient(180deg, #c8a030 0%, #a07820 55%, #806010 100%)"
            : "linear-gradient(180deg, #3e3558 0%, #2c2445 100%)",
          borderRadius: "3px 3px 6px 6px",
          boxShadow: isLit ? "0 3px 10px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,220,100,0.3)" : "0 3px 10px rgba(0,0,0,0.45)",
        }} />

        {/* ── Ground halo when lit ── */}
        {isLit && (
          <div style={{
            position: "relative",
            width: compact ? 70 : 90, height: 14,
            background: "radial-gradient(ellipse, rgba(255,170,50,0.32) 0%, transparent 70%)",
            marginTop: -3,
            animation: "bc-halo 2.2s ease-in-out infinite",
          }} />
        )}

        {/* ── Name & info ── */}
        <div style={{ marginTop: isLit ? 2 : 10, textAlign: "center", width: "100%", padding: "0 6px" }}>
          <div style={{
            fontSize: compact ? 11 : 13,
            fontWeight: 800,
            color: isLit ? "#F5D982" : "#8a7aaa",
            letterSpacing: "0.02em",
            lineHeight: 1.2,
            textShadow: isLit ? "0 0 14px rgba(212,175,55,0.55)" : "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {deceasedName}
          </div>

          {yahrzeitNumber !== undefined && yahrzeitNumber > 0 && (
            <div style={{
              fontSize: 8,
              color: isLit ? "rgba(212,175,55,0.8)" : "rgba(120,110,160,0.65)",
              fontWeight: 700,
              letterSpacing: "0.07em",
              marginTop: 3,
              textTransform: "uppercase",
            }}>
              {ordinal(yahrzeitNumber)} Yahrzeit
            </div>
          )}

          {donorName && (
            <div style={{
              fontSize: 8,
              color: isLit ? "rgba(255,230,140,0.55)" : "rgba(90,82,120,0.5)",
              marginTop: 2,
              fontStyle: "italic",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              lit by {donorName}
            </div>
          )}

          {learners.length > 0 && (
            <div style={{
              fontSize: 8,
              color: isLit ? "rgba(255,200,100,0.7)" : "rgba(100,90,140,0.5)",
              marginTop: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
            }}>
              <span>📖</span>
              <span>{learners.length} learning</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

export default BurningCandle;
