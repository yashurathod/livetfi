export type Operator = "Dublin Bus" | "Bus Éireann" | "Go-Ahead";

export interface BusPosition {
  id: string;
  routeNumber: string;
  operator: Operator;
  direction: string;
  origin: string;
  fullTrip: string;
  lat: number;
  lng: number;
  nextStop: string;
  delay: number;
}

export interface BusRoute {
  id: string;
  number: string;
  name: string;
  operator: Operator;
}

export interface Arrival {
  routeNumber: string;
  destination: string;
  origin: string;
  fullTrip: string;
  operator: Operator;
  minutesAway: number;
  delay: number;
  scheduled: string;
  stopId: string;
}

export interface BusStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  routes: string[];
}

interface ParsedFeed {
  buses: BusPosition[];
  routes: BusRoute[];
  arrivals: Arrival[];
  stops: BusStop[];
  allStops: BusStop[];
}

interface StaticRouteMeta {
  shortName: string;
  longName: string;
  agencyId: string;
}

interface StaticStopMeta {
  name: string;
  lat: number;
  lng: number;
}

interface StaticIndex {
  routesById: Record<string, StaticRouteMeta>;
  routesByRealtimeId: Record<string, StaticRouteMeta>;
  stopsById: Record<string, StaticStopMeta>;
  stopsByCode: Record<string, StaticStopMeta>;
  stopsByRealtimeId: Record<string, StaticStopMeta>;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toKey(value: unknown): string {
  return asString(value).trim();
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function guessOperator(routeNumber: string): Operator {
  if (routeNumber.startsWith("X") || routeNumber.startsWith("10")) return "Bus Éireann";
  if (routeNumber.startsWith("7") || routeNumber.startsWith("17")) return "Go-Ahead";
  return "Dublin Bus";
}

function operatorFromAgency(agencyId: string, routeNumber: string): Operator {
  const normalized = agencyId.toLowerCase();
  if (normalized.includes("bus eireann") || normalized.includes("be")) return "Bus Éireann";
  if (normalized.includes("go ahead") || normalized.includes("go-ahead") || normalized.includes("ga")) {
    return "Go-Ahead";
  }
  return guessOperator(routeNumber);
}

function parseDirection(directionId: unknown): string {
  const parsed = asNumber(directionId);
  if (parsed === 1) return "Outbound";
  if (parsed === 0) return "Inbound";
  return "In service";
}

function toScheduledTime(epochSeconds: number): string {
  const dt = new Date(epochSeconds * 1000);
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function toMinutesAway(epochSeconds: number): number {
  const nowSec = Math.floor(Date.now() / 1000);
  return Math.max(0, Math.round((epochSeconds - nowSec) / 60));
}

function getHeaderMap(): HeadersInit {
  return { Accept: "application/json" };
}

function stopMetaFor(staticIndex: StaticIndex, stopId: string): StaticStopMeta | undefined {
  return (
    staticIndex.stopsById[stopId] ??
    staticIndex.stopsByCode[stopId] ??
    staticIndex.stopsByRealtimeId[stopId]
  );
}

function routeMetaFor(staticIndex: StaticIndex, routeId: string): StaticRouteMeta | undefined {
  return staticIndex.routesById[routeId] ?? staticIndex.routesByRealtimeId[routeId];
}

function destinationFromRouteLongName(routeLongName: string, directionId: number | null): string {
  const parts = routeLongName
    .split("-")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return "City Centre";
  if (parts.length === 1) return parts[0];
  if (directionId === 0) return parts[0];
  if (directionId === 1) return parts[parts.length - 1];
  return parts[parts.length - 1];
}

function extractOriginFromRouteLongName(routeLongName: string, directionId: number | null): string {
  const parts = routeLongName
    .split("-")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return "";
  if (parts.length === 1) return "";
  // directionId 0 = normal direction (A → B), 1 = reverse (B → A)
  if (directionId === 0) return parts[0];
  if (directionId === 1) return parts[parts.length - 1];
  return parts[0];
}

function buildFullTrip(origin: string, destination: string): string {
  if (origin && destination) return `from ${origin} → ${destination}`;
  if (destination) return `towards ${destination}`;
  if (origin) return `from ${origin}`;
  return "In service";
}

function isLikelyStopId(value: string): boolean {
  return /^\d{4,}$/.test(value.trim());
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: getHeaderMap() });
  if (!response.ok) {
    throw new Error(`TFI request failed: ${response.status}`);
  }
  return response.json();
}

let staticIndexPromise: Promise<StaticIndex> | null = null;

async function loadStaticIndex(): Promise<StaticIndex> {
  if (!staticIndexPromise) {
    staticIndexPromise = fetch("/tfi-static.json", { headers: getHeaderMap() })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load static GTFS index");
        const payload = (await response.json()) as Partial<StaticIndex>;
        return {
          routesById: payload.routesById ?? {},
          routesByRealtimeId: payload.routesByRealtimeId ?? {},
          stopsById: payload.stopsById ?? {},
          stopsByCode: payload.stopsByCode ?? {},
          stopsByRealtimeId: payload.stopsByRealtimeId ?? {},
        };
      })
      .catch(() => ({
        routesById: {},
        routesByRealtimeId: {},
        stopsById: {},
        stopsByCode: {},
        stopsByRealtimeId: {},
      }));
  }

  return staticIndexPromise;
}

export async function fetchTfiFeed(): Promise<ParsedFeed> {
  const [tripJson, vehicleJson, staticIndex] = await Promise.all([
    fetchJson("/api/tfi/TripUpdates?format=json"),
    fetchJson("/api/tfi/Vehicles?format=json"),
    loadStaticIndex(),
  ]);

  const tripEntities = asArray<Record<string, unknown>>((tripJson as Record<string, unknown>).entity);
  const vehicleEntities = asArray<Record<string, unknown>>((vehicleJson as Record<string, unknown>).entity);

  const tripById = new Map<
    string,
    {
      routeNumber: string;
      destination: string;
      origin: string;
      nextStop: string;
      nextStopName: string;
      delay: number;
      directionId: number | null;
      operator: Operator;
    }
  >();

  const routeMap = new Map<string, BusRoute>();
  const stopMap = new Map<string, BusStop>();
  const stopRouteMap = new Map<string, Set<string>>();
  const arrivals: Arrival[] = [];

  for (const entity of tripEntities) {
    const tripUpdate = (entity.tripUpdate ?? entity.trip_update) as Record<string, unknown> | undefined;
    if (!tripUpdate) continue;

    const trip = (tripUpdate.trip ?? {}) as Record<string, unknown>;
    const tripId = toKey(trip.tripId ?? trip.trip_id);
    const routeId = toKey(trip.routeId ?? trip.route_id);
    const routeMeta = routeMetaFor(staticIndex, routeId);
    const routeNumber = routeMeta?.shortName || routeId || "Unknown";
    const directionId = asNumber(trip.directionId ?? trip.direction_id);

    const stopUpdates = asArray<Record<string, unknown>>(tripUpdate.stopTimeUpdate ?? tripUpdate.stop_time_update);
    const nextStopUpdate = stopUpdates[0] ?? {};
    const nextStopId = toKey(nextStopUpdate.stopId ?? nextStopUpdate.stop_id);
    const nextStopName = stopMetaFor(staticIndex, nextStopId)?.name || nextStopId || "Unknown stop";

    const tripHeadsign = asString(trip.tripHeadsign ?? trip.trip_headsign);
    const lastStopUpdate = stopUpdates[stopUpdates.length - 1] ?? {};
    const lastStopId = toKey(lastStopUpdate.stopId ?? lastStopUpdate.stop_id);
    const lastStopName = stopMetaFor(staticIndex, lastStopId)?.name || lastStopId;

    const destination =
      (tripHeadsign && !isLikelyStopId(tripHeadsign) ? tripHeadsign : "") ||
      (lastStopName && !isLikelyStopId(lastStopName) ? lastStopName : "") ||
      destinationFromRouteLongName(routeMeta?.longName ?? "", directionId);

    const origin = extractOriginFromRouteLongName(routeMeta?.longName ?? "", directionId);

    const firstArrival = (nextStopUpdate.arrival ?? {}) as Record<string, unknown>;
    const delay = asNumber(firstArrival.delay) ?? 0;
    const operator = operatorFromAgency(routeMeta?.agencyId ?? "", routeNumber);

    if (tripId) {
      tripById.set(tripId, {
        routeNumber,
        destination,
        origin,
        nextStop: nextStopId,
        nextStopName,
        delay,
        directionId,
        operator,
      });
    }

    const routeKey = routeId || routeNumber;
    if (!routeMap.has(routeKey)) {
      routeMap.set(routeKey, {
        id: routeKey,
        number: routeNumber,
        name: routeMeta?.longName || `${routeNumber} service`,
        operator,
      });
    }

    for (const stopUpdate of stopUpdates) {
      const stopId = toKey(stopUpdate.stopId ?? stopUpdate.stop_id);
      const stopMeta = stopMetaFor(staticIndex, stopId);

      if (stopMeta) {
        if (!stopMap.has(stopId)) {
          stopMap.set(stopId, {
            id: stopId,
            name: stopMeta.name,
            lat: stopMeta.lat,
            lng: stopMeta.lng,
            routes: [],
          });
        }

        const routeSet = stopRouteMap.get(stopId) ?? new Set<string>();
        routeSet.add(routeNumber);
        stopRouteMap.set(stopId, routeSet);
      }

      const arrival = (stopUpdate.arrival ?? {}) as Record<string, unknown>;
      const departure = (stopUpdate.departure ?? {}) as Record<string, unknown>;
      const arrivalEpoch = asNumber(arrival.time) ?? asNumber(departure.time) ?? 0;
      const arrivalDelay = asNumber(arrival.delay) ?? asNumber(departure.delay) ?? delay;

      if (!stopId || arrivalEpoch <= 0) continue;

      arrivals.push({
        routeNumber,
        destination,
        origin,
        fullTrip: buildFullTrip(origin, destination),
        operator,
        minutesAway: toMinutesAway(arrivalEpoch),
        delay: arrivalDelay,
        scheduled: toScheduledTime(arrivalEpoch),
        stopId,
      });
    }
  }

  const buses: BusPosition[] = [];

  for (const entity of vehicleEntities) {
    const vehicle = (entity.vehicle ?? {}) as Record<string, unknown>;
    const trip = (vehicle.trip ?? {}) as Record<string, unknown>;
    const position = (vehicle.position ?? {}) as Record<string, unknown>;
    const vehicleInfo = (vehicle.vehicle ?? {}) as Record<string, unknown>;

    const lat = asNumber(position.latitude);
    const lng = asNumber(position.longitude);
    if (lat === null || lng === null) continue;

    const tripId = toKey(trip.tripId ?? trip.trip_id);
    const routeId = toKey(trip.routeId ?? trip.route_id);
    const routeMeta = routeMetaFor(staticIndex, routeId);
    const tripData = tripById.get(tripId);

    const routeNumber = tripData?.routeNumber || routeMeta?.shortName || routeId || "?";
    const operator = tripData?.operator || operatorFromAgency(routeMeta?.agencyId ?? "", routeNumber);

    const directionId = tripData?.directionId ?? asNumber(trip.directionId ?? trip.direction_id);
    const destination =
      tripData?.destination ||
      destinationFromRouteLongName(routeMeta?.longName ?? "", directionId);

    const origin = extractOriginFromRouteLongName(routeMeta?.longName ?? "", directionId);
    const fullTrip = buildFullTrip(origin, destination);

    const nextStop =
      tripData?.nextStopName ||
      stopMetaFor(staticIndex, tripData?.nextStop ?? "")?.name ||
      "Unknown stop";

    const id =
      asString(vehicleInfo.id) ||
      asString(vehicleInfo.label) ||
      asString(entity.id) ||
      `${routeNumber}-${lat}-${lng}`;

    buses.push({
      id,
      routeNumber,
      operator,
      direction: destination ? `towards ${destination}` : "In service",
      origin,
      fullTrip,
      lat,
      lng,
      nextStop,
      delay: tripData?.delay ?? 0,
    });

    const routeKey = routeId || routeNumber;
    if (!routeMap.has(routeKey)) {
      routeMap.set(routeKey, {
        id: routeKey,
        number: routeNumber,
        name: routeMeta?.longName || `${routeNumber} service`,
        operator,
      });
    }
  }

  const stops = Array.from(stopMap.values())
    .map((stop) => {
      const routes = Array.from(stopRouteMap.get(stop.id) ?? []).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      );
      return { ...stop, routes };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const allStops = Object.entries(staticIndex.stopsByCode)
    .map(([stopCode, meta]) => ({
      id: stopCode,
      name: meta.name,
      lat: meta.lat,
      lng: meta.lng,
      routes: [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  arrivals.sort((a, b) => a.minutesAway - b.minutesAway);

  const routes = Array.from(routeMap.values()).sort((a, b) =>
    a.number.localeCompare(b.number, undefined, { numeric: true })
  );

  // Debug log
  console.log(
    `[TFI Parser] buses=${buses.length}, routes=${routes.length}, arrivals=${arrivals.length}, stops=${stops.length}, allStops=${allStops.length}`
  );
  if (arrivals.length > 0) {
    console.log(`[TFI Parser] Sample arrival:`, arrivals[0]);
    // Show unique stop IDs in arrivals
    const uniqueStopIds = new Set(arrivals.map(a => a.stopId));
    console.log(`[TFI Parser] Sample arrival stop IDs:`, Array.from(uniqueStopIds).slice(0, 10));
  }

  return {
    buses,
    routes,
    arrivals,
    stops,
    allStops,
  };
}
