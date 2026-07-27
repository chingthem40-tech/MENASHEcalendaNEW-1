# illustrationGuide.md
### Menashe Experience Language — Phase 5: Illustration Language

---

Illustration in Menashe Calendar evokes Jewish heritage through warmth, natural beauty,
and cultural authenticity. It does not decorate. It contextualises.

---

## Core Aesthetic

The visual world of Menashe Calendar is:

**Warm. Ancient. Alive.**

It draws from the landscape of Eretz Yisrael as experienced by the Benei Menashe —
the hills of Manipur where they prayed toward Jerusalem, the golden light of the
Holy Land they return to, the candlelight of Shabbat in their communities.

---

## Approved Subject Matter

### Nature & Landscape
- **Sunrise / sunrise horizon** — warm orange, amber, and pink sky at first light
- **Golden hour** — late afternoon light casting long shadows on stone
- **Rolling hills** — the Judean hills, Galilee landscape, mountain silhouettes
- **Olive groves** — ancient trees, gnarled trunks, silver-green leaves
- **Night sky** — stars over Jerusalem, moon above the Temple Mount (silhouette only)
- **Desert light** — Negev tones, ochre earth, haze

### Architecture & Material
- **Jerusalem limestone** — the pale cream-gold stone that defines the city
- **Ancient doorways** — arched gates, weathered wood, ironwork
- **Temple / sanctuary** — silhouette only; respectful, never reconstructionist
- **Menorah** — stylised, minimal; never kitsch
- **Stone walls** — texture, not detail; warmth, not ruin

### Light & Material Texture
- **Candlelight** — warm amber glow, soft halos, no hard shadows
- **Parchment** — aged cream texture evoked through color (`#F5EFE0`, `#EDE0CC`)
- **Linen** — rough-woven warmth; evoked through subtle gradients
- **Gold leaf** — used as light, not as decoration; thin, not heavy

### Cultural / Ritual Objects
- **Shabbat candles** — flame and wax, warm and calm
- **Torah scroll** — suggested by curves, not illustrated in full
- **Kiddush cup** — silhouette only in illustration contexts

---

## Forbidden Patterns

These elements must never appear in Menashe Calendar illustration:

| Forbidden | Why |
|---|---|
| Generic stock art | Destroys authenticity and cultural specificity |
| Cartoon characters | Inconsistent with the premium, respectful tone |
| Clip art | Always feels cheap; signals low quality |
| Realistic faces | Personal likeness — pastoral faces open consent issues |
| Busy scene collages | Too much visual noise; violates "White space is a feature" |
| Generic "Jewish symbols" scatter | Stars of David as decoration, generic menorahs scattered — kitsch |
| Neon or electric colors | Outside the warm, natural palette |
| Photorealistic 3D renders | Uncanny valley effect; use gradients or flat illustration instead |
| Religious iconography of other faiths | Cultural respect |
| AI-generated faces | Until a cultural approval process is established |

---

## Palette for Illustration

All illustration color must stay within the warm, earthy palette derived from the design system:

```
Primary Warmth (Gold)
  Light theme:  #8b6914 → #c8852a → #f5c36a
  Dark theme:   #d4a843 → #f5c36a → #fde9b4

Stone (Jerusalem Limestone)
  #e8dcc8   #d4c4a0   #c0ab78

Earth / Parchment
  #f5efe0   #ede0cc   #c8a87a

Night (Dark sky, deep blue)
  #060e1e   #0c1830   #0a2040   #1a3060

Candlelight
  #ff8c00   #ffb347   #ffd27d

Olive / Green (accent only)
  #6b7c4a   #8a9e5c   (max 10% of any illustration)
```

**Cool tones (blues, purples, greys)** are only used for the Sapphire theme hero artwork and night-sky contexts. They are never the dominant illustration hue.

---

## Emoji Usage in UI Illustration

Until native illustration assets are built, emoji serve as lightweight illustration anchors.

**Approved list:**

| Emoji | Context |
|---|---|
| ⛩ | Sanctuary / Temple (right panel of hero, Memorial feature card) |
| 🕯 | Memorial Sanctuary card, yahrzeit |
| 🔮 | AI / Rav Menashe card |
| 🌅 | Calendar / Zmanim (sunrise time) |
| 🌄 | Golden hour, holiday context |
| 🌙 | Havdalah, nighttime zmanim |
| ✡️ | Used sparingly — section titles only, never decoration |
| 📜 | Torah, Parashah |
| 🕍 | Community / Synagogue context |
| 🐦 | Decorative birds in hero artwork column (max 3, small) |

**Rules:**
- Emoji are rendered at specific sizes: 38–42dp (Feature Card), 80–90dp (Hero artwork), 9–12dp (decorative birds)
- Opacity for decorative emoji: 0.60–0.80. Never full opacity.
- Never mix more than 2 emoji types in a single card.
- Emoji are not labels. They supplement text — they never replace it.

---

## Gradient Illustration System

Until native artwork is available, LinearGradient compositions serve as illustration.

**Hero artwork column (warm):**
```
Light:   ["#fde9b4", "#f5c36a", "#d4780a", "#7a3200"]  start x:0.4 y:0  end x:0.6 y:1
Dark:    ["#2a1500", "#7a3d08", "#d4840a", "#f5c36a"]  start x:0.4 y:0  end x:0.6 y:1
```

**Memorial Sanctuary (amber night):**
```
["#2d1a0e", "#1a0f00", "#3d2410"]  start x:0 y:0  end x:1 y:1
```

**AI / Torah (sapphire night):**
```
["#060e1e", "#0c1830", "#0a1428"]  start x:0 y:0  end x:1 y:1
```

**Parchment (light theme surfaces):**
```
["#f5efe0", "#ede0cc"]  start x:0 y:0  end x:0.5 y:1
```

---

## Illustration Sizing Rules

1. **Decorative illustration never exceeds 30% of a card's visible area.**
2. **Illustration is never the only content in a card.** Text always accompanies it.
3. **Illustration is always behind text** in the z-order.
4. **Illustration opacity in the background: 0.08–0.20** on dark themes, never on light themes (too muddy).
5. **The central artwork emoji** (⛩, 🕯, 🔮) has no opacity reduction — it is the focal point.

---

## Future: Native Illustration Assets

When native vector/raster illustrations are commissioned:
- Format: SVG or WebP with transparency
- Size: provided at 2× and 3×
- Color mode: designed to work on both dark and light themes
- Cultural review: every illustration reviewed by a Benei Menashe community representative before shipping
