import { useState } from "react";
import { Bell, MapPin, Info, ExternalLink, Bus, ChevronRight } from "lucide-react";
import clsx from "clsx";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none",
        checked ? "bg-tfi-green" : "bg-gray-200"
      )}
    >
      <span
        className={clsx(
          "inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(false);
  const [autoLocate, setAutoLocate] = useState(true);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-safe pb-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 pt-3">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-safe no-scrollbar space-y-5">

        {/* App identity card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-tfi-green flex items-center justify-center shrink-0">
            <Bus size={26} className="text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">TFI On The Go</p>
            <p className="text-xs text-gray-500 mt-0.5">Version 1.0.0</p>
            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed max-w-56">
              Real-time tracking for Dublin Bus, Bus Éireann, and Go-Ahead Ireland.
            </p>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-1 mb-2">
            Preferences
          </p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-tfi-orange/10 flex items-center justify-center">
                  <Bell size={15} className="text-tfi-orange" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                  <p className="text-[11px] text-gray-500">Delay alerts for saved stops</p>
                </div>
              </div>
              <Toggle checked={notifications} onChange={setNotifications} />
            </div>

            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-tfi-blue/10 flex items-center justify-center">
                  <MapPin size={15} className="text-tfi-blue" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Auto-locate</p>
                  <p className="text-[11px] text-gray-500">Centre map on your location</p>
                </div>
              </div>
              <Toggle checked={autoLocate} onChange={setAutoLocate} />
            </div>
          </div>
        </div>

        {/* About */}
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-1 mb-2">
            About
          </p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            <a
              href="https://www.transportforireland.ie"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-4 active:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-tfi-green/10 flex items-center justify-center">
                  <ExternalLink size={15} className="text-tfi-green" />
                </div>
                <p className="text-sm font-medium text-gray-900">TFI Website</p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </a>

            <div className="flex items-start gap-3 px-4 py-4">
              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                <Info size={15} className="text-gray-500" />
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Data sourced from TFI GTFS-Realtime feeds. Map tiles by OpenStreetMap contributors via CARTO. Bus positions are simulated for demo purposes.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
