import { useState, useCallback, useEffect } from "react";

export interface FavoriteItem {
  id: string;
  type: "stop" | "route";
  name: string;
  subtitle: string;
}

const KEY = "tfi-favorites";
const SYNC_EVENT = "tfi-favorites-updated";

function sameFavorite(a: FavoriteItem, b: { id: string; type?: FavoriteItem["type"] }): boolean {
  return a.id === b.id && (b.type ? a.type === b.type : true);
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(favorites));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  }, [favorites]);

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const raw = localStorage.getItem(KEY);
        setFavorites(raw ? (JSON.parse(raw) as FavoriteItem[]) : []);
      } catch {
        setFavorites([]);
      }
    };

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(SYNC_EVENT, syncFromStorage);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(SYNC_EVENT, syncFromStorage);
    };
  }, []);

  const addFavorite = useCallback((item: FavoriteItem) => {
    setFavorites((prev) => (prev.some((f) => sameFavorite(f, item)) ? prev : [...prev, item]));
  }, []);

  const removeFavorite = useCallback((id: string, type?: FavoriteItem["type"]) => {
    setFavorites((prev) => prev.filter((f) => !sameFavorite(f, { id, type })));
  }, []);

  const isFavorite = useCallback(
    (id: string, type?: FavoriteItem["type"]) => favorites.some((f) => sameFavorite(f, { id, type })),
    [favorites]
  );

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
