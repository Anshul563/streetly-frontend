"use client";

import { useEffect, useCallback } from "react";
import { useMapEvents } from "react-leaflet";
import { 
  Map, 
  MapTileLayer, 
  MapMarker, 
  MapSearchControl, 
  MapLayers, 
  MapLayersControl, 
  MapZoomControl 
} from "@/components/ui/map";
import type { PlaceFeature } from "@/components/ui/place-autocomplete";
import { API } from "@/lib/api";

export interface AddressDetails {
  city: string;
  address: string;
  locality: string;
  pincode: string;
}

function LocationMarker({ 
  position, 
  setPosition 
}: { 
  position: {lat: number, lng: number} | null, 
  setPosition: (pos: {lat: number, lng: number}) => void 
}) {
  const map = useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.flyTo(e.latlng, map.getZoom());
    }
  });

  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], map.getZoom() < 15 ? 15 : map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : <MapMarker position={[position.lat, position.lng]} />;
}

export default function MapPicker({ 
  position, 
  setPosition,
  onAddressSelect
}: { 
  position: {lat: number, lng: number} | null, 
  setPosition: (pos: {lat: number, lng: number}) => void,
  onAddressSelect?: (address: AddressDetails) => void
}) {

  const fetchAddressInfo = useCallback(async (lat: number, lng: number) => {
    if (!onAddressSelect) return;
    try {
      const res = await API.get(`/issues/geocode?lat=${lat}&lng=${lng}`);
      const data = res.data;
      if (data.features && data.features.length > 0) {
        const props = data.features[0].properties;
        const city = props.city || props.town || props.village || props.county || props.district || "";
        const locality = props.locality || props.suburb || props.neighbourhood || props.district || "";
        const address = props.street ? `${props.housenumber ? props.housenumber + " " : ""}${props.street}` : props.name || "";
        const pincode = props.postcode || props.postalcode || "";
        onAddressSelect({ city, address, locality, pincode });
      }
    } catch (e) {
      console.error("Reverse geocoding failed", e);
    }
  }, [onAddressSelect]);

  useEffect(() => {
    if (position?.lat && position?.lng) {
      const tId = setTimeout(() => {
        fetchAddressInfo(position.lat, position.lng);
      }, 700);
      return () => clearTimeout(tId);
    }
  }, [position?.lat, position?.lng, fetchAddressInfo]);

  const handlePlaceSelect = (feature: PlaceFeature) => {
    const lng = feature.geometry.coordinates[0];
    const lat = feature.geometry.coordinates[1];
    setPosition({ lat, lng });
  };

  return (
    <Map
      center={position ? [position.lat, position.lng] : [28.6139, 77.2090]}
      zoom={position ? 15 : 5}
      className="h-full w-full relative z-0"
    >
      <MapLayers defaultTileLayer="Street">
        <MapTileLayer name="Street" />
        <MapTileLayer 
          name="Satellite" 
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
          attribution="Tiles &copy; Esri &mdash; Source: Esri" 
        />
        <MapLayersControl position="top-1 right-1" />
      </MapLayers>
      
      <MapZoomControl position="bottom-1 right-1" />
      
      <LocationMarker position={position} setPosition={setPosition} />
      <MapSearchControl onPlaceSelect={handlePlaceSelect} />
    </Map>
  );
}
