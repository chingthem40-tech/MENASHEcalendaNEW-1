export function daysUntilAnniversary(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let ann = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (ann < today) ann = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
  return Math.round((ann.getTime() - today.getTime()) / 86400000);
}
