import { GOLD } from "../../../lib/theme";

interface PortraitCardProps {
  name?: string;
  hebrewName?: string | null;
  deathDate?: string;
  candleCount?: number;
  onClick?: () => void;
  shimmer?: boolean;
  compact?: boolean;
}

export function PortraitCard({
  name,
  hebrewName,
  deathDate,
  candleCount,
  onClick,
  shimmer = false,
  compact = false,
}: PortraitCardProps) {
  const w = compact ? 118 : 140;
  const avatarH = compact ? 64 : 80;
  const nameFontSize = compact ? 11 : 13;
  const subFontSize = compact ? 10 : 11;

  if (shimmer) {
    return (
      <div
        style={{
          flexShrink: 0,
          width: w,
          borderRadius: 14,
          overflow: "hidden",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            height: avatarH,
            background: "rgba(255,255,255,0.04)",
          }}
        />
        <div style={{ padding: "10px 10px 12px" }}>
          <div
            style={{
              height: 11,
              width: "70%",
              background: "rgba(255,255,255,0.05)",
              borderRadius: 6,
              marginBottom: 7,
            }}
          />
          <div
            style={{
              height: 9,
              width: "45%",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 4,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
      style={{
        flexShrink: 0,
        width: w,
        borderRadius: 14,
        overflow: "hidden",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.12s ease, border-color 0.15s",
      }}
    >
      {/* Portrait / avatar area */}
      <div
        style={{
          height: avatarH,
          position: "relative",
          background:
            "linear-gradient(180deg, #040a16 0%, #081420 50%, rgba(212,168,67,0.08) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: compact ? 22 : 26,
        }}
      >
        🕯
        {/* warm glow under flame */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 60,
            height: 28,
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(212,168,67,0.32) 0%, transparent 70%)",
            filter: "blur(5px)",
          }}
        />
        {/* subtle top vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 50%)",
          }}
        />
      </div>

      {/* Info area */}
      <div style={{ padding: compact ? "8px 10px 10px" : "10px 12px 12px" }}>
        <div
          style={{
            fontSize: nameFontSize,
            fontWeight: 700,
            color: "rgba(255,255,255,0.9)",
            lineHeight: 1.35,
            marginBottom: 4,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          } as React.CSSProperties}
        >
          {name ?? "In Loving Memory"}
        </div>

        {hebrewName && (
          <div
            style={{
              fontSize: subFontSize,
              color: `rgba(212,168,67,0.65)`,
              fontFamily: "Georgia, serif",
              lineHeight: 1.3,
              marginBottom: 3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {hebrewName}
          </div>
        )}

        {deathDate && (
          <div
            style={{
              fontSize: subFontSize,
              color: "rgba(255,255,255,0.3)",
              lineHeight: 1.3,
            }}
          >
            {deathDate}
          </div>
        )}

        {typeof candleCount === "number" && candleCount > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              marginTop: 6,
            }}
          >
            <span style={{ fontSize: subFontSize }}>🕯</span>
            <span
              style={{
                fontSize: subFontSize,
                color: GOLD,
                fontWeight: 700,
              }}
            >
              {candleCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
