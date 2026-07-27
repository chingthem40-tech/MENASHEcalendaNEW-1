export const JERUSALEM_LAT = 31.7767;
export const JERUSALEM_LNG = 35.2345;

export function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getBearingToJerusalem(lat: number, lng: number): number {
  const r1 = toRad(lat);
  const r2 = toRad(JERUSALEM_LAT);
  const dLng = toRad(JERUSALEM_LNG - lng);
  const y = Math.sin(dLng) * Math.cos(r2);
  const x = Math.cos(r1) * Math.sin(r2) - Math.sin(r1) * Math.cos(r2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export function getDistToJerusalemKm(lat: number, lng: number): number {
  return Math.round(haversineDistKm(lat, lng, JERUSALEM_LAT, JERUSALEM_LNG));
}
