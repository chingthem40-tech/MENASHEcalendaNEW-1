export const HOLIDAY_EMOJI: Record<string, string> = {
  "Rosh Hashana": "🍎", "Yom Kippur": "📖", "Sukkot": "🌿",
  "Shemini Atzeret": "✡", "Simchat Torah": "📜", "Chanukah": "🕎",
  "Tu BiShvat": "🌳", "Purim": "🎭", "Pesach": "🍷",
  "Yom HaShoah": "🕯", "Yom HaZikaron": "🪖", "Yom HaAtzmaut": "🇮🇱",
  "Lag BaOmer": "🔥", "Shavuot": "📜", "Tisha B'Av": "😢",
};

export function getHolidayEmoji(name: string): string {
  for (const [key, emoji] of Object.entries(HOLIDAY_EMOJI)) {
    if (name.includes(key)) return emoji;
  }
  return "✡";
}
