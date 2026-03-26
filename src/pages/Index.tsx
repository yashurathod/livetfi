import { useState } from "react";
import BottomNav, { type TabId } from "@/components/BottomNav";
import BusMap from "@/components/BusMap";
import SearchScreen from "@/components/SearchScreen";
import FavoritesScreen from "@/components/FavoritesScreen";
import SettingsScreen from "@/components/SettingsScreen";

export default function Index() {
  const [activeTab, setActiveTab] = useState<TabId>("map");

  return (
    <div className="h-full w-full overflow-hidden bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-hidden relative">
        <div className={activeTab === "map" ? "block h-full" : "hidden"}>
          <BusMap />
        </div>
        <div className={activeTab === "search" ? "block h-full" : "hidden"}>
          <SearchScreen />
        </div>
        <div className={activeTab === "favorites" ? "block h-full" : "hidden"}>
          <FavoritesScreen />
        </div>
        <div className={activeTab === "settings" ? "block h-full" : "hidden"}>
          <SettingsScreen />
        </div>
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
