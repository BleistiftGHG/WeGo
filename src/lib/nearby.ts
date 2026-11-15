export type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: number;
};

type Point = { latitude: number; longitude: number };

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const NOMINATIM_HEADERS = {
  'User-Agent': 'WeGo/1.0 (school project)',
  Accept: 'application/json',
};

export function distanceMeters(a: Point, b: { lat: number; lng: number }) {
  const R = 6371000;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.latitude);
  const dLng = rad(b.lng - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters: number, metric: boolean) {
  if (metric) {
    return meters < 1000
      ? `${Math.round(meters / 10) * 10} m`
      : `${(meters / 1000).toFixed(1)} km`;
  }
  return `${(meters / 1609.34).toFixed(1)} mi`;
}

async function overpass(query: string): Promise<{ elements: any[] }> {
  for (const url of ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(url, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) return (await res.json()) as { elements: any[] };
    } catch {}
  }
  return { elements: [] };
}

function toPlaces(elements: any[], origin: Point, limit: number): Place[] {
  const seen = new Set<string>();
  const places: Place[] = [];
  for (const el of elements) {
    const name: string | undefined = el.tags?.name;
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (!name || lat == null || lng == null) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    places.push({
      id: `${el.type}-${el.id}`,
      name,
      lat,
      lng,
      distance: distanceMeters(origin, { lat, lng }),
    });
  }
  return places.sort((a, b) => a.distance - b.distance).slice(0, limit);
}

export async function fetchNearbySchools(origin: Point, radius = 15000) {
  const { latitude: lat, longitude: lng } = origin;
  const data = await overpass(
    `[out:json][timeout:12];(node["amenity"="school"](around:${radius},${lat},${lng});way["amenity"="school"](around:${radius},${lat},${lng}););out center tags 60;`,
  );
  return toPlaces(data.elements, origin, 8);
}

export async function fetchNearbyTowns(origin: Point, radius = 12000) {
  const { latitude: lat, longitude: lng } = origin;
  const data = await overpass(
    `[out:json][timeout:12];node["place"~"^(city|town|village|suburb)$"](around:${radius},${lat},${lng});out tags 60;`,
  );
  return toPlaces(data.elements, origin, 8);
}

async function nominatim(
  query: string,
  near: Point | null | undefined,
  delta: number,
  extra = '',
): Promise<{ lat: number; lng: number } | null> {
  try {
    let url = `https://nominatim.openstreetmap.org/search?format=json&limit=1${extra}&q=${encodeURIComponent(query)}`;
    if (near) {
      url += `&viewbox=${near.longitude - delta},${near.latitude + delta},${near.longitude + delta},${near.latitude - delta}&bounded=1`;
    }
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) return null;
    const [hit] = (await res.json()) as { lat: string; lon: string }[];
    return hit ? { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) } : null;
  } catch {
    return null;
  }
}

export function geocodeTown(town: string, near?: Point | null) {
  return nominatim(town, near, 0.3, '&featuretype=settlement');
}

export function geocodeMeetingPoint(query: string, near?: Point | null) {
  return nominatim(query, near, 0.1);
}