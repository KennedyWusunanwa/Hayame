import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export type MapMarker = {
  id: string;
  lat?: number;
  lng?: number;
  label: string;
  price?: string;
};

export type MapAdapter = {
  render: (markers: MapMarker[]) => ReactNode;
};

const placeholderAdapter: MapAdapter = {
  render: (markers: MapMarker[]) => (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      <div className="absolute inset-0 opacity-50">
        <div className="absolute left-10 top-12 h-24 w-24 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-10 bottom-10 h-20 w-20 rounded-full bg-sky-300/20 blur-3xl" />
      </div>
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center text-gray-700">
        <MapPin className="h-8 w-8 text-primary" />
        <p className="max-w-sm text-sm">
          Live map coming soon. We’ll plug in Google Maps or Mapbox through the map adapter.
        </p>
        <div className="grid grid-cols-2 gap-3 text-left text-xs">
          {markers.slice(0, 6).map((marker) => (
            <div
              key={marker.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 shadow-sm"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-gray-800">{marker.label}</div>
                {marker.price ? (
                  <div className="text-gray-500">{marker.price}</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

type Props = {
  markers: MapMarker[];
  adapter?: MapAdapter;
  className?: string;
};

export function MapPanel({ markers, adapter = placeholderAdapter, className }: Props) {
  return <div className={cn("h-full", className)}>{adapter.render(markers)}</div>;
}

export const placeholderMapAdapter = placeholderAdapter;
