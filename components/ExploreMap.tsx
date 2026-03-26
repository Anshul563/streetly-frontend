"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import { Map, MapTileLayer, MapMarker, MapPopup, MapLayers, MapLayersControl, MapZoomControl } from "@/components/ui/map";

type Issue = {
  id: number;
  title: string;
  latitude: number;
  longitude: number;
  status: string;
};

export default function ExploreMap() {
  const [issues, setIssues] = useState<Issue[]>([]);

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
      center={[28.6139, 77.2090]} // default: Delhi
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
      
      {issues.map((issue) => (
        <MapMarker
          key={issue.id}
          position={[issue.latitude, issue.longitude]}
        >
          <MapPopup>
            <div>
              <h2 className="font-semibold">{issue.title}</h2>
              <p>Status: {issue.status}</p>
            </div>
          </MapPopup>
        </MapMarker>
      ))}
    </Map>
  );
}
