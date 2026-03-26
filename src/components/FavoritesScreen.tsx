import { Heart, MapPin, Bus, Trash2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import clsx from "clsx";
import { useTfiRealtime } from "@/hooks/useTfiRealtime";

export default function FavoritesScreen() {
  const { favorites, removeFavorite } = useFavorites();
  const { arrivals } = useTfiRealtime();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-safe pb-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 pt-3">Saved</h1>
        <p className="text-xs text-gray-500 mt-0.5">Your saved stops and routes</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-safe no-scrollbar">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Heart size={28} className="text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Nothing saved yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-52 leading-relaxed">
              Tap the heart on any stop on the map to save it here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((fav) => {
              const next = fav.type === "route"
                ? arrivals.find((a) => a.routeNumber === fav.id || a.routeNumber === fav.name)
                : undefined;

              return (
                <div key={fav.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  {/* Top row */}
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                      fav.type === "stop" ? "bg-tfi-green/10" : "bg-tfi-blue/10"
                    )}>
                      {fav.type === "stop"
                        ? <MapPin size={18} className="text-tfi-green" />
                        : <Bus size={18} className="text-tfi-blue" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{fav.name}</p>
                      <p className="text-[11px] text-gray-500">{fav.subtitle}</p>
                    </div>
                    <button
                      onClick={() => removeFavorite(fav.id)}
                      className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                      aria-label="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Next arrival */}
                  {next && (
                    <div className="flex items-center gap-3 mt-3 bg-gray-50 rounded-xl p-2.5">
                      <div className="h-8 w-8 rounded-lg bg-tfi-green flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-bold">{next.routeNumber}</span>
                      </div>
                      <p className="text-xs text-gray-500 flex-1 truncate">→ {next.destination}</p>
                      <div className="text-right shrink-0">
                        <span className="text-lg font-bold text-gray-900">{next.minutesAway}</span>
                        <span className="text-[10px] text-gray-400 ml-0.5">min</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
