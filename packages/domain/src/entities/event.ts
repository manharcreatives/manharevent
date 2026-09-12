export type EventStatus = "draft" | "published" | "live" | "ended" | "cancelled";
export type ReentryPolicy = "none" | "once" | "unlimited";
export type GateDirection = "entry" | "exit" | "both";

export interface Venue {
  id: string;
  tenant_id: string;
  name: string;
  address: string | null;
  city: string;
  state: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  google_maps_url: string | null;
  map_image_url: string | null;
  total_capacity: number | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  tenant_id: string;
  venue_id: string | null;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  status: EventStatus;
  starts_on: string;
  ends_on: string;
  timezone: string;
  cover_url: string | null;
  og_image_url: string | null;
  category: string;
  reentry_policy: ReentryPolicy;
  reentry_window_minutes: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventNight {
  id: string;
  tenant_id: string;
  event_id: string;
  night_number: number;
  date: string;
  gates_open_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  theme: string | null;
  theme_color: string | null;
  dress_code: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Zone {
  id: string;
  tenant_id: string;
  event_id: string;
  code: string;
  name: string;
  description: string | null;
  capacity: number;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Gate {
  id: string;
  tenant_id: string;
  event_id: string;
  code: string;
  name: string;
  direction: GateDirection;
  created_at: string;
  updated_at: string;
}

export interface GateZone {
  gate_id: string;
  zone_id: string;
}

export interface Artist {
  id: string;
  tenant_id: string;
  slug: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  instagram: string | null;
  youtube: string | null;
  created_at: string;
  updated_at: string;
}

export interface NightLineup {
  id: string;
  tenant_id: string;
  night_id: string;
  artist_id: string;
  slot_start: string | null;
  slot_end: string | null;
  billing: number;
  created_at: string;
  updated_at: string;
}
