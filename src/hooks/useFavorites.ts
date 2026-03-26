import { useState, useCallback, useEffect } from "react";

export interface FavoriteItem {
  id: string;
  type: "stop" | "route";
  name: string;
  subtitle: string;
}

const KEY = "tfi-favorites";

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
  }, [favorites]);

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
