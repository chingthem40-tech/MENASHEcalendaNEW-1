export interface Location {
  name: string;
  country: string;
  lat: number;
  lng: number;
  tz: string;
  candleLightingMinutes: number;
}

export const LOCATIONS: Location[] = [
  { name: "Jerusalem",     country: "Israel",    lat: 31.7683,   lng: 35.2137,   tz: "Asia/Jerusalem",      candleLightingMinutes: 40 },
  { name: "Tel Aviv",      country: "Israel",    lat: 32.0853,   lng: 34.7818,   tz: "Asia/Jerusalem",      candleLightingMinutes: 20 },
  { name: "Haifa",         country: "Israel",    lat: 32.7940,   lng: 34.9896,   tz: "Asia/Jerusalem",      candleLightingMinutes: 22 },
  { name: "Be'er Sheva",   country: "Israel",    lat: 31.2530,   lng: 34.7915,   tz: "Asia/Jerusalem",      candleLightingMinutes: 20 },
  { name: "Bnei Brak",     country: "Israel",    lat: 32.0841,   lng: 34.8333,   tz: "Asia/Jerusalem",      candleLightingMinutes: 20 },
  { name: "Tzfat",         country: "Israel",    lat: 32.9650,   lng: 35.4958,   tz: "Asia/Jerusalem",      candleLightingMinutes: 22 },
  { name: "Churachandpur", country: "India",     lat: 24.3333,   lng: 93.6833,   tz: "Asia/Kolkata",        candleLightingMinutes: 18 },
  { name: "Imphal",        country: "India",     lat: 24.8170,   lng: 93.9368,   tz: "Asia/Kolkata",        candleLightingMinutes: 18 },
  { name: "Aizawl",        country: "India",     lat: 23.7307,   lng: 92.7173,   tz: "Asia/Kolkata",        candleLightingMinutes: 18 },
  { name: "Lunglei",       country: "India",     lat: 22.8867,   lng: 92.7340,   tz: "Asia/Kolkata",        candleLightingMinutes: 18 },
  { name: "New York",      country: "USA",       lat: 40.7128,   lng: -74.0060,  tz: "America/New_York",    candleLightingMinutes: 18 },
  { name: "Los Angeles",   country: "USA",       lat: 34.0522,   lng: -118.2437, tz: "America/Los_Angeles", candleLightingMinutes: 18 },
  { name: "Toronto",       country: "Canada",    lat: 43.6532,   lng: -79.3832,  tz: "America/Toronto",     candleLightingMinutes: 18 },
  { name: "London",        country: "UK",        lat: 51.5074,   lng: -0.1278,   tz: "Europe/London",       candleLightingMinutes: 20 },
  { name: "Paris",         country: "France",    lat: 48.8566,   lng: 2.3522,    tz: "Europe/Paris",        candleLightingMinutes: 20 },
  { name: "Melbourne",     country: "Australia", lat: -37.8136,  lng: 144.9631,  tz: "Australia/Melbourne", candleLightingMinutes: 18 },
];

export const DEFAULT_LOCATION: Location = LOCATIONS[0];
