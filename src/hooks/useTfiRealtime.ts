import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTfiFeed, type Arrival } from "@/data/tfiApi";

export function useTfiRealtime() {
  const query = useQuery({
    queryKey: ["tfi-realtime"],
    queryFn: fetchTfiFeed,
    refetchInterval: 15000,
    staleTime: 10000,
    retry: 2,
  });

  const arrivalsByStop = useMemo(() => {
    const map = new Map<string, Arrival[]>();
    
    // Index arrivals by stopId (primary key from trip updates)
    for (const item of query.data?.arrivals ?? []) {
      const list = map.get(item.stopId) ?? [];
      list.push(item);
      map.set(item.stopId, list);
    }
    
    // Sort each stop's arrivals by time
    for (const [key, list] of map.entries()) {
      list.sort((a, b) => a.minutesAway - b.minutesAway);
      map.set(key, list);
    }
    
    return map;
  }, [query.data?.arrivals]);

  /**
   * Lookup arrivals for a stop by ID, with fallback to find by other stop IDs
   */
  const getArrivalsForStop = (stopId: string): Arrival[] => {
    // Direct lookup
    const direct = arrivalsByStop.get(stopId);
    if (direct && direct.length > 0) {
      console.log(`[StopLookup] Direct match for ${stopId}:`, direct.length, "arrivals");
      return direct;
    }
    
    // Fallback: try all arrivals and filter by stopId (in case of ID format mismatches)
    const allArrivals = query.data?.arrivals ?? [];
    const matching = allArrivals.filter(a => 
      a.stopId === stopId || 
      a.stopId.includes(stopId) || 
      stopId.includes(a.stopId)
    );
    
    console.log(
      `[StopLookup] Fallback for ${stopId}: checked ${allArrivals.length} arrivals, found ${matching.length} matches`
    );
    if (matching.length > 0) console.log(`[StopLookup] Sample match:`, matching[0]);
    
    if (matching.length > 0) {
      matching.sort((a, b) => a.minutesAway - b.minutesAway);
      return matching;
    }
    
    return [];
  };

  return {
    buses: query.data?.buses ?? [],
    routes: query.data?.routes ?? [],
    arrivals: query.data?.arrivals ?? [],
    stops: query.data?.stops ?? [],
    allStops: query.data?.allStops ?? [],
    arrivalsByStop,
    getArrivalsForStop,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
