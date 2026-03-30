import { Map, Search, Settings } from "lucide-react";
import clsx from "clsx";

export type TabId = "map" | "search" | "settings";

const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: "map",       label: "Map",       Icon: Map },
  { id: "search",    label: "Search",    Icon: Search },
  { id: "settings",  label: "Settings",  Icon: Settings },
];

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="bg-white border-t border-gray-100 pb-safe-nav shadow-[0_-1px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={clsx(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-xl transition-all duration-150",
                active
                  ? "text-tfi-green"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div className={clsx(
                "flex items-center justify-center w-10 h-6 rounded-full transition-all duration-150",
                active && "bg-tfi-green/10"
              )}>
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? "fill-tfi-green/10" : ""}
                />
              </div>
              <span className={clsx(
                "text-[10px] font-medium tracking-wide",
                active ? "text-tfi-green" : "text-gray-400"
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
