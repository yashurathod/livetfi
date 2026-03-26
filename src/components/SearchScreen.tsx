import { useState } from "react";
import { Search, Bus, MapPin, Heart } from "lucide-react";
import clsx from "clsx";
import { type Operator } from "@/data/tfiApi";
import { useTfiRealtime } from "@/hooks/useTfiRealtime";
import { useFavorites } from "@/hooks/useFavorites";

type Filter = "all" | Operator;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all",          label: "All" },
  { id: "Dublin Bus",   label: "Dublin Bus" },
  { id: "Bus Éireann",  label: "Bus Éireann" },
  { id: "Go-Ahead",     label: "Go-Ahead" },
];

function operatorBadgeColor(op: Operator) {
  if (op === "Go-Ahead")     return "bg-tfi-blue/10 text-tfi-blue";
  if (op === "Bus Éireann")  return "bg-tfi-orange/10 text-tfi-orange";
  return "bg-tfi-green/10 text-tfi-green";
}

function operatorDotColor(op: Operator) {
  if (op === "Go-Ahead")     return "bg-tfi-blue";
  if (op === "Bus Éireann")  return "bg-tfi-orange";
  return "bg-tfi-green";
}

interface SearchScreenProps {
  onRouteSelect: (routeNumber: string) => void;
}

export default function SearchScreen({ onRouteSelect }: SearchScreenProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const { routes: liveRoutes, stops: liveStops, isLoading } = useTfiRealtime();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const q = query.toLowerCase();

  const routes = liveRoutes.filter((r) => {
    const matchQ = !q || r.number.toLowerCase().includes(q) || r.name.toLowerCase().includes(q);
    const matchF = filter === "all" || r.operator === filter;
    return matchQ && matchF;
  });

  const stops = query
    ? liveStops
        .filter((s) =>
          s.name.toLowerCase().includes(q) ||
          s.routes.some((route) => route.toLowerCase().includes(q))
        )
        .slice(0, 80)
    : [];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-safe pb-0 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 pt-3 mb-3">Search</h1>

        {/* Search box */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search routes or stops…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-gray-100 text-sm text-gray-900 placeholder-gray-400 border-0 outline-none focus:ring-2 focus:ring-tfi-green/30 transition"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={clsx(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                filter === id
                  ? "bg-tfi-green text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-safe no-scrollbar space-y-5">

        {/* Routes */}
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <Bus size={11} /> Routes ({routes.length})
          </p>
          <div className="space-y-2">
            {isLoading && (
              <p className="text-sm text-gray-400 text-center py-4">Loading live routes...</p>
            )}
            {routes.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 cursor-pointer hover:border-tfi-green/40"
                onClick={() => onRouteSelect(r.number)}
              >
                <div className="h-11 w-11 rounded-xl bg-tfi-green flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">{r.number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{r.name}</p>
                  <span className={clsx(
                    "inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5",
                    operatorBadgeColor(r.operator)
                  )}>
                    {r.operator}
                  </span>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    if (isFavorite(r.number, "route")) {
                      removeFavorite(r.number, "route");
                      return;
                    }
                    addFavorite({
                      id: r.number,
                      type: "route",
                      name: `Route ${r.number}`,
                      subtitle: r.name,
                    });
                  }}
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  aria-label={`Save route ${r.number}`}
                >
                  <Heart
                    size={16}
                    className={isFavorite(r.number, "route") ? "fill-red-500 text-red-500" : "text-gray-400"}
                  />
                </button>
                <div className={clsx("h-2 w-2 rounded-full shrink-0", operatorDotColor(r.operator))} />
              </div>
            ))}
            {routes.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No live routes found</p>
            )}
          </div>
        </div>

        {/* Stops — only shown when searching */}
        {query && (
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <MapPin size={11} /> Stops ({stops.length})
            </p>
            <div className="space-y-2">
              {stops.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100"
                >
                  <div className="h-11 w-11 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-tfi-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Routes: {s.routes.join(", ")}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (isFavorite(s.id, "stop")) {
                        removeFavorite(s.id, "stop");
                        return;
                      }
                      addFavorite({
                        id: s.id,
                        type: "stop",
                        name: s.name,
                        subtitle: `${s.routes.length} routes`,
                      });
                    }}
                    className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                    aria-label={`Save stop ${s.name}`}
                  >
                    <Heart
                      size={16}
                      className={isFavorite(s.id, "stop") ? "fill-red-500 text-red-500" : "text-gray-400"}
                    />
                  </button>
                </div>
              ))}
              {stops.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No stops found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
