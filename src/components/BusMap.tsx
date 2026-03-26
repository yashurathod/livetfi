import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { mockBusPositions, mockStops, type BusPosition, type BusStop } from "@/data/mockBusData";
import { LocateFixed, Bus } from "lucide-react";
import StopSheet from "./StopSheet";

function operatorClass(op: string) {
  if (op === "Go-Ahead") return "go-ahead";
  if (op === "Bus Éireann") return "bus-eireann";
  return "";
}

function busIcon(bus: BusPosition) {
  return L.divIcon({
    className: "",
    html: `<div class="bus-pin ${operatorClass(bus.operator)}">${bus.routeNumber}</div>`,
    iconSize: [44, 24],
    iconAnchor: [22, 12],
  });
}

function stopIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="stop-pin"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

function LocateBtn() {
  const map = useMap();
  return (
    <div className="absolute bottom-24 right-4 z-[1000]">
      <button
        onClick={() => map.locate({ setView: true, maxZoom: 16 })}
        className="h-11 w-11 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
        aria-label="Locate me"
      >
        <LocateFixed size={18} />
      </button>
    </div>
  );
}

export default function BusMap() {
  const [buses, setBuses] = useState<BusPosition[]>(mockBusPositions);
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBuses((prev) =>
        prev.map((b) => ({
          ...b,
          lat: b.lat + (Math.random() - 0.5) * 0.0008,
          lng: b.lng + (Math.random() - 0.5) * 0.0008,
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full w-full">
      {/* Floating header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-safe">
        <div className="mt-1 bg-white/95 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-tfi-green flex items-center justify-center shrink-0">
            <Bus size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-tight">TFI Live Tracker</p>
            <p className="text-[11px] text-gray-500">{buses.length} buses active · Dublin</p>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 rounded-full px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-tfi-green-light animate-pulse-dot" />
            <span className="text-[10px] font-semibold text-tfi-green">LIVE</span>
          </div>
        </div>
      </div>

      <MapContainer
        center={[53.3498, -6.2603]}
        zoom={14}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OSM &copy; CARTO'
        />

        {buses.map((bus) => (
          <Marker key={bus.id} position={[bus.lat, bus.lng]} icon={busIcon(bus)}>
            <Popup className="tfi-popup">
              <div className="p-1 min-w-[140px]">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-block bg-tfi-green text-white text-xs font-bold px-2 py-0.5 rounded">
                    {bus.routeNumber}
                  </span>
                  <span className="text-xs text-gray-500">{bus.operator}</span>
                </div>
                <p className="text-xs font-medium text-gray-800">→ {bus.direction}</p>
                <p className="text-xs text-gray-500 mt-0.5">Next: {bus.nextStop}</p>
                <p className={`text-xs font-semibold mt-1 ${
                  bus.delay > 0 ? "text-red-500" : bus.delay < 0 ? "text-emerald-600" : "text-gray-500"
                }`}>
                  {bus.delay > 0
                    ? `${bus.delay} min late`
                    : bus.delay < 0
                    ? `${Math.abs(bus.delay)} min early`
                    : "On time"}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {mockStops.map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={stopIcon()}
            eventHandlers={{ click: () => { setSelectedStop(stop); setSheetOpen(true); } }}
          />
        ))}

        <LocateBtn />
      </MapContainer>

      <StopSheet stop={selectedStop} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
