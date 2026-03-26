import { useState } from "react";
import BottomNav, { type TabId } from "@/components/BottomNav";
import BusMap from "@/components/BusMap";
import SearchScreen from "@/components/SearchScreen";
import FavoritesScreen from "@/components/FavoritesScreen";
import SettingsScreen from "@/components/SettingsScreen";

export default function Index() {
  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [focusedRoute, setFocusedRoute] = useState<{ routeNumber: string; nonce: number } | null>(null);

  const handleRouteSelect = (routeNumber: string) => {
    setFocusedRoute({ routeNumber, nonce: Date.now() });
    setActiveTab("map");
  };

  return (
    <div className="h-full w-full overflow-hidden bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-hidden relative">
        <div className={activeTab === "map" ? "absolute inset-0" : "absolute inset-0 opacity-0 pointer-events-none"}>
          <BusMap active={activeTab === "map"} focusRoute={focusedRoute} />
        </div>
        <div className={activeTab === "search" ? "absolute inset-0" : "hidden"}>
          <SearchScreen onRouteSelect={handleRouteSelect} />
        </div>
        <div className={activeTab === "favorites" ? "absolute inset-0" : "hidden"}>
          <FavoritesScreen />
        </div>
        <div className={activeTab === "settings" ? "absolute inset-0" : "hidden"}>
          <SettingsScreen />
        </div>
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
