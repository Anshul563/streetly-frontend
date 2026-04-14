"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import {
  Map,
  MapTileLayer,
  MapMarker,
  MapTooltip,
  MapLayers,
  MapLayersControl,
  MapZoomControl,
} from "@/components/ui/map";
import { useRouter } from "next/navigation";
import { createSlug } from "@/lib/utils";

type Issue = {
  id: number;
  title: string;
  latitude: number;
  longitude: number;
  status: string;
  imageUrl?: string;
  images?: string[];
  user?: {
    name: string;
    username: string;
  };
};

export default function ExploreMap() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchMapIssues();
  }, []);

  const fetchMapIssues = async () => {
    try {
      const res = await API.get("/issues/map");
      setIssues(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Map
      center={[28.6139, 77.209]} // default: Delhi
      zoom={10}
      className="h-full w-full"
    >
      <MapLayers defaultTileLayer="Street">
        <MapTileLayer name="Street" />
        <MapTileLayer
          name="Satellite"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri &mdash; Source: Esri"
        />
        <MapLayersControl position="top-4 right-4" />
      </MapLayers>
      <MapZoomControl position="bottom-4 right-4" />

      {issues.map((issue) => {
        const image =
          issue.imageUrl ||
          (issue.images && issue.images.length > 0 ? issue.images[0] : null);
        const markerIcon = image ? (
          <div className="w-10 h-10 rounded-full overflow-hidden border-[3px] shadow-lg border-white pointer-events-auto">
            <img
              src={image}
              alt={issue.title}
              className="w-full h-full object-cover bg-muted"
            />
          </div>
        ) : undefined;

        return (
          <MapMarker
            key={issue.id}
            position={[issue.latitude, issue.longitude]}
            icon={markerIcon}
            iconAnchor={image ? [20, 40] : undefined}
            popupAnchor={image ? [0, -35] : undefined}
            eventHandlers={{
              click: () =>
                router.push(`/post/${createSlug(issue.title)}-${issue.id}`),
            }}
          >
            <MapTooltip
              side="top"
              className="bg-popover text-popover-foreground border shadow-md font-sans"
            >
              <div className="flex flex-col gap-1 px-1">
                <h2 className="font-semibold text-sm leading-tight max-w-[200px] truncate">
                  {issue.title}
                </h2>
                {issue.user && (
                  <p className="text-xs text-muted-foreground flex gap-1 items-center">
                    by <span>{issue.user.name}</span>
                    <span className="opacity-70">@{issue.user.username}</span>
                  </p>
                )}
              </div>
            </MapTooltip>
          </MapMarker>
        );
      })}
    </Map>
  );
}
