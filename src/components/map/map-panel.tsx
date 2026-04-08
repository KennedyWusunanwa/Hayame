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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function deriveMarkerPositions(markers: MapMarker[]) {
  const markersWithCoordinates = markers.filter(
    (marker) => Number.isFinite(marker.lat) && Number.isFinite(marker.lng),
  ) as Array<MapMarker & { lat: number; lng: number }>;

  if (markersWithCoordinates.length === 0) {
    return markers.slice(0, 6).map((marker, index) => ({
      ...marker,
      x: [18, 60, 30, 72, 46, 84][index % 6],
      y: [22, 30, 56, 48, 76, 66][index % 6],
    }));
  }

  const lats = markersWithCoordinates.map((marker) => marker.lat);
  const lngs = markersWithCoordinates.map((marker) => marker.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 0.02;
  const lngRange = maxLng - minLng || 0.02;

  return markersWithCoordinates.map((marker) => ({
    ...marker,
    x: clamp(((marker.lng - minLng) / lngRange) * 72 + 14, 10, 90),
    y: clamp((1 - (marker.lat - minLat) / latRange) * 62 + 16, 12, 88),
  }));
}

const placeholderAdapter: MapAdapter = {
  render: (markers: MapMarker[]) => {
    const positionedMarkers = deriveMarkerPositions(markers);

    return (
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_48%,#edfdf4_100%)]">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute inset-x-0 top-[18%] border-t border-dashed border-sky-200" />
          <div className="absolute inset-x-0 top-[50%] border-t border-dashed border-sky-100" />
          <div className="absolute inset-x-0 bottom-[18%] border-t border-dashed border-emerald-100" />
          <div className="absolute inset-y-0 left-[26%] border-l border-dashed border-sky-100" />
          <div className="absolute inset-y-0 left-[60%] border-l border-dashed border-sky-100" />
        </div>
        <div className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur">
          Location overview
        </div>
        <div className="absolute bottom-4 left-4 max-w-[14rem] rounded-2xl border border-white/80 bg-white/90 p-3 shadow-lg backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            Areas in results
          </p>
          <div className="mt-2 space-y-2 text-xs text-gray-700">
            {markers.slice(0, 4).map((marker) => (
              <div
                className="flex items-center justify-between gap-3"
                key={marker.id}
              >
                <span className="truncate font-medium">{marker.label}</span>
                {marker.price ? (
                  <span className="whitespace-nowrap text-gray-500">
                    {marker.price}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        {positionedMarkers.map((marker) => (
          <div
            key={marker.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          >
            <div className="rounded-full bg-primary p-2 text-white shadow-lg shadow-primary/30">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="mt-2 min-w-[7rem] rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-xs shadow-md">
              <div className="truncate font-semibold text-gray-800">
                {marker.label}
              </div>
              {marker.price ? (
                <div className="text-gray-500">{marker.price}</div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  },
};

type Props = {
  markers: MapMarker[];
  adapter?: MapAdapter;
  className?: string;
};

export function MapPanel({
  markers,
  adapter = placeholderAdapter,
  className,
}: Props) {
  return (
    <div className={cn("h-full", className)}>{adapter.render(markers)}</div>
  );
}

export const placeholderMapAdapter = placeholderAdapter;
