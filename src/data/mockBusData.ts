export type Operator = "Dublin Bus" | "Bus Éireann" | "Go-Ahead";

export interface BusPosition {
  id: string;
  routeNumber: string;
  operator: Operator;
  direction: string;
  lat: number;
  lng: number;
  nextStop: string;
  delay: number;
}

export interface BusStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  routes: string[];
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
  operator: Operator;
  minutesAway: number;
  delay: number;
  scheduled: string;
}

export const mockStops: BusStop[] = [
  { id: "s1", name: "O'Connell Street", lat: 53.3498, lng: -6.2603, routes: ["39A", "16", "46A", "145"] },
  { id: "s2", name: "Dame Street", lat: 53.3441, lng: -6.2637, routes: ["46A", "15", "27"] },
  { id: "s3", name: "College Green", lat: 53.3445, lng: -6.2591, routes: ["15", "46A", "39A"] },
  { id: "s4", name: "Pearse Street", lat: 53.3420, lng: -6.2510, routes: ["27", "7", "175"] },
  { id: "s5", name: "Merrion Square", lat: 53.3395, lng: -6.2490, routes: ["7", "175", "27"] },
  { id: "s6", name: "Heuston Station", lat: 53.3463, lng: -6.2926, routes: ["145", "X27"] },
  { id: "s7", name: "Parnell Square", lat: 53.3535, lng: -6.2639, routes: ["16", "39A"] },
  { id: "s8", name: "Drumcondra", lat: 53.3643, lng: -6.2561, routes: ["16", "101"] },
  { id: "s9", name: "Ballsbridge", lat: 53.3310, lng: -6.2340, routes: ["7", "175"] },
  { id: "s10", name: "Thomas Street", lat: 53.3430, lng: -6.2810, routes: ["145", "X27"] },
];

export const mockBusPositions: BusPosition[] = [
  { id: "b1", routeNumber: "39A", operator: "Dublin Bus", direction: "UCD Belfield", lat: 53.3498, lng: -6.2603, nextStop: "O'Connell Street", delay: 2 },
  { id: "b2", routeNumber: "46A", operator: "Dublin Bus", direction: "Phoenix Park", lat: 53.3382, lng: -6.2591, nextStop: "Dame Street", delay: -1 },
  { id: "b3", routeNumber: "16", operator: "Dublin Bus", direction: "Dublin Airport", lat: 53.3558, lng: -6.2648, nextStop: "Parnell Square", delay: 0 },
  { id: "b4", routeNumber: "15", operator: "Dublin Bus", direction: "Ballycullen", lat: 53.3441, lng: -6.2675, nextStop: "College Green", delay: 5 },
  { id: "b5", routeNumber: "145", operator: "Dublin Bus", direction: "Heuston Station", lat: 53.3465, lng: -6.2810, nextStop: "Thomas Street", delay: 0 },
  { id: "b6", routeNumber: "27", operator: "Dublin Bus", direction: "Jobstown", lat: 53.3320, lng: -6.2490, nextStop: "Pearse Street", delay: 3 },
  { id: "b7", routeNumber: "7", operator: "Go-Ahead", direction: "Bride's Glen", lat: 53.3410, lng: -6.2530, nextStop: "Merrion Square", delay: -2 },
  { id: "b8", routeNumber: "175", operator: "Go-Ahead", direction: "UCD", lat: 53.3350, lng: -6.2400, nextStop: "Ballsbridge", delay: 1 },
  { id: "b9", routeNumber: "X27", operator: "Bus Éireann", direction: "Kildare", lat: 53.3480, lng: -6.2950, nextStop: "Heuston Station", delay: 0 },
  { id: "b10", routeNumber: "101", operator: "Bus Éireann", direction: "Drogheda", lat: 53.3600, lng: -6.2500, nextStop: "Drumcondra", delay: 4 },
];

export const mockRoutes: BusRoute[] = [
  { id: "r1", number: "39A", name: "UCD Belfield – Ongar", operator: "Dublin Bus" },
  { id: "r2", number: "46A", name: "Phoenix Park – Dún Laoghaire", operator: "Dublin Bus" },
  { id: "r3", number: "16", name: "Dublin Airport – Ballinteer", operator: "Dublin Bus" },
  { id: "r4", number: "15", name: "Ballycullen – Clongriffin", operator: "Dublin Bus" },
  { id: "r5", number: "145", name: "Heuston – Ballywaltrim", operator: "Dublin Bus" },
  { id: "r6", number: "27", name: "Jobstown – City Centre", operator: "Dublin Bus" },
  { id: "r7", number: "7", name: "Mountjoy Sq – Bride's Glen", operator: "Go-Ahead" },
  { id: "r8", number: "175", name: "UCD – City Centre", operator: "Go-Ahead" },
  { id: "r9", number: "X27", name: "Dublin – Kildare", operator: "Bus Éireann" },
  { id: "r10", number: "101", name: "Dublin – Drogheda", operator: "Bus Éireann" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function getArrivalsForStop(stopId: string): Arrival[] {
  const stop = mockStops.find((s) => s.id === stopId);
  if (!stop) return [];
  const now = new Date();
  return stop.routes
    .map((routeNum, i) => {
      const route = mockRoutes.find((r) => r.number === routeNum);
      const mins = Math.floor(Math.random() * 14) + 1;
      const scheduled = new Date(now.getTime() + (mins + i * 5) * 60000);
      return {
        routeNumber: routeNum,
        destination: route?.name.split("–")[1]?.trim() ?? "City Centre",
        operator: (route?.operator ?? "Dublin Bus") as Operator,
        minutesAway: mins,
        delay: Math.floor(Math.random() * 6) - 2,
        scheduled: `${pad(scheduled.getHours())}:${pad(scheduled.getMinutes())}`,
      };
    })
    .sort((a, b) => a.minutesAway - b.minutesAway);
}
