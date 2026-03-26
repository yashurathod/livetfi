import { useState, useCallback, useEffect } from "react";

export interface FavoriteItem {
  id: string;
  type: "stop" | "route";
  name: string;
  subtitle: string;
}

const KEY = "tfi-favorites";

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
    setFavorites((prev) => (prev.some((f) => f.id === item.id) ? prev : [...prev, item]));
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  );

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
