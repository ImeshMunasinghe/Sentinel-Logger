'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Waypoint {
  sequence_order: number;
  timestamp: string;
  location_name: string;
  latitude: number;
  longitude: number;
  nfc_tag_id: string;
}

interface PatrolMapProps {
  waypoints: Waypoint[];
}

// Custom Leaflet CSS overrides
const mapStyles = `
  .custom-marker-pin {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    background-color: #14b8a6; /* teal-500 */
    color: #0f172a; /* slate-900 */
    font-weight: 800;
    border: 2px solid #ffffff;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    font-size: 11px;
    width: 24px;
    height: 24px;
  }
`;

function createNumberedIcon(num: number) {
  return L.divIcon({
    className: '',
    html: `<div class="custom-marker-pin">${num}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}

// Controller to dynamically pan and zoom to fit the current route polylines
function MapController({ waypoints }: { waypoints: Waypoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (waypoints.length > 0) {
      const bounds = L.latLngBounds(waypoints.map(w => [w.latitude, w.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [waypoints, map]);

  return null;
}

export default function PatrolMap({ waypoints }: PatrolMapProps) {
  const defaultCenter: [number, number] = [37.7749, -122.4194]; // San Francisco seeds center
  const polylineCoords = waypoints.map(w => [w.latitude, w.longitude] as [number, number]);

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-slate-805 bg-slate-950">
      <style dangerouslySetInnerHTML={{ __html: mapStyles }} />
      <MapContainer
        center={defaultCenter}
        zoom={14}
        style={{ width: '100%', height: '100%' }}
        className="z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {waypoints.map((point) => (
          <Marker
            key={point.sequence_order}
            position={[point.latitude, point.longitude]}
            icon={createNumberedIcon(point.sequence_order)}
          >
            <Popup className="bg-slate-950 text-white rounded border border-slate-800">
              <div className="text-xs space-y-1">
                <p className="font-bold text-teal-400">Step {point.sequence_order}: {point.location_name}</p>
                <p className="text-[10px] text-slate-400 font-mono">Tag ID: {point.nfc_tag_id}</p>
                <p className="text-[10px] text-slate-400">Scanned: {new Date(point.timestamp).toLocaleTimeString()}</p>
                <p className="text-[9px] text-slate-500 font-mono">Lat: {point.latitude}, Lng: {point.longitude}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {polylineCoords.length > 1 && (
          <Polyline
            positions={polylineCoords}
            color="#14b8a6" // Teal
            weight={3}
            opacity={0.8}
            dashArray="5, 10"
          />
        )}

        <MapController waypoints={waypoints} />
      </MapContainer>
    </div>
  );
}
