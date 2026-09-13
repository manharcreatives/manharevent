import type { Event, EventNight, Venue, Zone, Gate, GateZone, Artist, NightLineup } from "@manhar-garba/domain";
import { TENANT_ID } from "./tenant";

export const EVENT_ID = "ev-navratri-2026-ahmedabad";
export const VENUE_ID = "venue-sardar-patel-ground";

export const ZONE_VIP_ID = "zone-vip-001";
export const ZONE_GOLD_ID = "zone-gold-001";
export const ZONE_GENERAL_ID = "zone-general-001";

export const GATE_G1_ID = "gate-g1";
export const GATE_G2_ID = "gate-g2";
export const GATE_G3_ID = "gate-g3";
export const GATE_G4_ID = "gate-g4";

// Night IDs — night_number 1..9, dates 2–10 Oct 2026
export const NIGHT_IDS = [
  "night-01", "night-02", "night-03", "night-04", "night-05",
  "night-06", "night-07", "night-08", "night-09",
];

export const venue: Venue = {
  id: VENUE_ID,
  tenant_id: TENANT_ID,
  name: "Sardar Patel Ground",
  address: "Near Law Garden, Ellisbridge",
  city: "Ahmedabad",
  state: "Gujarat",
  pincode: "380006",
  lat: 23.0225,
  lng: 72.5714,
  google_maps_url: "https://maps.google.com/?q=Sardar+Patel+Ground+Ahmedabad",
  map_image_url: null,
  total_capacity: 25000,
  created_at: "2026-01-15T10:00:00Z",
  updated_at: "2026-01-15T10:00:00Z",
};

export const event: Event = {
  id: EVENT_ID,
  tenant_id: TENANT_ID,
  venue_id: VENUE_ID,
  slug: "manhar-navratri-2026",
  title: "Manhar Navratri 2026",
  subtitle: "Nine nights. Three zones. One ground.",
  description:
    "Nine nights of Garba and Dandiya Raas on the open lawns of Sardar Patel Ground, with a live folk orchestra every night and a new theme and dress code each evening. Passes are sold by zone and by the nights they cover — a Couple pass admits two on one QR code.",
  status: "published",
  starts_on: "2026-10-02",
  ends_on: "2026-10-10",
  timezone: "Asia/Kolkata",
  cover_url: null,
  og_image_url: null,
  category: "garba",
  reentry_policy: "unlimited",
  reentry_window_minutes: null,
  published_at: "2026-08-15T10:00:00Z",
  created_at: "2026-01-15T10:00:00Z",
  updated_at: "2026-08-15T10:00:00Z",
};

const THEMES = [
  { theme: "White Night", theme_color: "#F5F5F5", dress_code: "White" },
  { theme: "Red & Gold", theme_color: "#C41E3A", dress_code: "Red" },
  { theme: "Royal Blue", theme_color: "#1E3A8A", dress_code: "Blue" },
  { theme: "Peacock Night", theme_color: "#2D8B57", dress_code: "Peacock Green" },
  { theme: "Sunrise", theme_color: "#FF8C00", dress_code: "Orange & Yellow" },
  { theme: "Neon Festival", theme_color: "#9B30FF", dress_code: "Neon" },
  { theme: "Retro Garba", theme_color: "#FF69B4", dress_code: "Retro" },
  { theme: "Silver Night", theme_color: "#C0C0C0", dress_code: "Silver" },
  { theme: "Grand Finale", theme_color: "#FFD700", dress_code: "Traditional" },
];

export const eventNights: EventNight[] = NIGHT_IDS.map((id, i) => ({
  id,
  tenant_id: TENANT_ID,
  event_id: EVENT_ID,
  night_number: i + 1,
  date: `2026-10-0${i + 2}`,
  gates_open_at: `2026-10-0${i + 2}T17:00:00+05:30`,
  starts_at: `2026-10-0${i + 2}T19:00:00+05:30`,
  ends_at: `2026-10-0${i + 2}T23:59:00+05:30`,
  theme: THEMES[i]?.theme ?? null,
  theme_color: THEMES[i]?.theme_color ?? null,
  dress_code: THEMES[i]?.dress_code ?? null,
  notes: null,
  status: "scheduled",
  created_at: "2026-01-15T10:00:00Z",
  updated_at: "2026-01-15T10:00:00Z",
}));

export const zones: Zone[] = [
  {
    id: ZONE_VIP_ID,
    tenant_id: TENANT_ID,
    event_id: EVENT_ID,
    code: "VIP",
    name: "VIP Zone",
    description: "Exclusive front zone with premium view and seating.",
    capacity: 2000,
    color: "hsl(282 74% 62%)",
    sort_order: 0,
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
  },
  {
    id: ZONE_GOLD_ID,
    tenant_id: TENANT_ID,
    event_id: EVENT_ID,
    code: "GOLD",
    name: "Gold Zone",
    description: "Premium standing zone with unobstructed stage view.",
    capacity: 8000,
    color: "hsl(42 96% 58%)",
    sort_order: 1,
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
  },
  {
    id: ZONE_GENERAL_ID,
    tenant_id: TENANT_ID,
    event_id: EVENT_ID,
    code: "GENERAL",
    name: "General Zone",
    description: "Standing zone. Dress code enforced at gate.",
    capacity: 15000,
    color: "hsl(14 92% 56%)",
    sort_order: 2,
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
  },
];

export const gates: Gate[] = [
  { id: GATE_G1_ID, tenant_id: TENANT_ID, event_id: EVENT_ID, code: "G1", name: "Gate 1 — VIP Entrance", direction: "entry", created_at: "2026-01-15T10:00:00Z", updated_at: "2026-01-15T10:00:00Z" },
  { id: GATE_G2_ID, tenant_id: TENANT_ID, event_id: EVENT_ID, code: "G2", name: "Gate 2 — Gold North", direction: "both", created_at: "2026-01-15T10:00:00Z", updated_at: "2026-01-15T10:00:00Z" },
  { id: GATE_G3_ID, tenant_id: TENANT_ID, event_id: EVENT_ID, code: "G3", name: "Gate 3 — Gold South", direction: "both", created_at: "2026-01-15T10:00:00Z", updated_at: "2026-01-15T10:00:00Z" },
  { id: GATE_G4_ID, tenant_id: TENANT_ID, event_id: EVENT_ID, code: "G4", name: "Gate 4 — General", direction: "both", created_at: "2026-01-15T10:00:00Z", updated_at: "2026-01-15T10:00:00Z" },
];

export const gateZones: GateZone[] = [
  { gate_id: GATE_G1_ID, zone_id: ZONE_VIP_ID },
  { gate_id: GATE_G2_ID, zone_id: ZONE_GOLD_ID },
  { gate_id: GATE_G3_ID, zone_id: ZONE_GOLD_ID },
  { gate_id: GATE_G4_ID, zone_id: ZONE_GENERAL_ID },
];

export const artists: Artist[] = [
  { id: "artist-kirtidan-gadhvi", tenant_id: TENANT_ID, slug: "kirtidan-gadhvi", name: "Kirtidan Gadhvi", bio: "Legendary Gujarati folk artist.", photo_url: null, instagram: "@kirtidangadhvi", youtube: null, created_at: "2026-01-15T10:00:00Z", updated_at: "2026-01-15T10:00:00Z" },
  { id: "artist-osman-mir", tenant_id: TENANT_ID, slug: "osman-mir", name: "Osman Mir", bio: "Soulful classical Garba vocalist.", photo_url: null, instagram: "@osmanmir", youtube: null, created_at: "2026-01-15T10:00:00Z", updated_at: "2026-01-15T10:00:00Z" },
  { id: "artist-aishwarya-majmudar", tenant_id: TENANT_ID, slug: "aishwarya-majmudar", name: "Aishwarya Majmudar", bio: "Popular Gujarati singer.", photo_url: null, instagram: "@aishwaryamajmudar", youtube: null, created_at: "2026-01-15T10:00:00Z", updated_at: "2026-01-15T10:00:00Z" },
];

export const nightLineup: NightLineup[] = [
  { id: "lineup-1", tenant_id: TENANT_ID, night_id: "night-01", artist_id: "artist-kirtidan-gadhvi", slot_start: null, slot_end: null, billing: 0, created_at: "2026-01-15T10:00:00Z", updated_at: "2026-01-15T10:00:00Z" },
  { id: "lineup-2", tenant_id: TENANT_ID, night_id: "night-05", artist_id: "artist-osman-mir", slot_start: null, slot_end: null, billing: 0, created_at: "2026-01-15T10:00:00Z", updated_at: "2026-01-15T10:00:00Z" },
  { id: "lineup-3", tenant_id: TENANT_ID, night_id: "night-09", artist_id: "artist-aishwarya-majmudar", slot_start: null, slot_end: null, billing: 0, created_at: "2026-01-15T10:00:00Z", updated_at: "2026-01-15T10:00:00Z" },
];
