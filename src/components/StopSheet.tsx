import { useEffect, useRef } from "react";
import { MapPin, Heart, Clock, X } from "lucide-react";
import clsx from "clsx";
import { type BusStop } from "@/data/tfiApi";
import { useFavorites } from "@/hooks/useFavorites";
import { useTfiRealtime } from "@/hooks/useTfiRealtime";

interface Props {
  stop: BusStop | null;
  open: boolean;
  onClose: () => void;
}

function operatorColor(op: string) {
  if (op === "Go-Ahead") return "bg-tfi-blue";
  if (op === "Bus Éireann") return "bg-tfi-orange";
  return "bg-tfi-green";
}

export default function StopSheet({ stop, open, onClose }: Props) {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { getArrivalsForStop } = useTfiRealtime();
  const ref = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!stop) return null;
  const arrivals = getArrivalsForStop(stop.id);
  const faved = isFavorite(stop.id, "stop");

  const toggleFav = () => {
    if (faved) {
      removeFavorite(stop.id, "stop");
    } else {
      addFavorite({ id: stop.id, type: "stop", name: stop.name, subtitle: `${stop.routes.length} routes` });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          "absolute inset-0 z-[1500] bg-black/30 transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Sheet */}
      <div
        ref={ref}
        className={clsx(
          "absolute bottom-0 left-0 right-0 z-[2000] bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out max-h-[72vh] flex flex-col",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center gap-3 border-b border-gray-100 shrink-0">
          <div className="h-9 w-9 rounded-full bg-tfi-green/10 flex items-center justify-center shrink-0">
            <MapPin size={16} className="text-tfi-green" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 truncate">{stop.name}</h2>
            <p className="text-[11px] text-gray-500">Routes: {stop.routes.join(", ")}</p>
          </div>
          <button
            onClick={toggleFav}
            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors ml-auto"
            aria-label="Favourite"
          >
            <Heart
              size={18}
              className={faved ? "fill-red-500 text-red-500" : "text-gray-400"}
            />
          </button>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Arrivals */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 pb-safe no-scrollbar">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <Clock size={11} /> Upcoming arrivals
          </p>

          {arrivals.map((a, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
              <div className={clsx(
                "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
                operatorColor(a.operator)
              )}>
                <span className="text-white text-xs font-bold">{a.routeNumber}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{a.fullTrip}</p>
                <p className="text-[11px] text-gray-500">{a.operator} · {a.scheduled}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-gray-900 leading-none">{a.minutesAway}</p>
                <p className="text-[10px] text-gray-400">min</p>
              </div>
              <div className={clsx(
                "w-2 h-2 rounded-full shrink-0",
                a.delay > 2 ? "bg-tfi-red" : a.delay > 0 ? "bg-tfi-orange" : "bg-tfi-green"
              )} />
            </div>
          ))}

          {arrivals.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No live arrivals for this stop</p>
          )}
        </div>
      </div>
    </>
  );
}
