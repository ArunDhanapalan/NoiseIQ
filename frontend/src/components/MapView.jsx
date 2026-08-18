import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { Volume2, Radio, UserCheck, MapPin, AlertTriangle, ShieldCheck, ShieldAlert, Crosshair, Flame, Layers } from 'lucide-react';
import { INDIAN_CITIES } from '../services/mockData';

// Custom Leaflet DivIcon generator for individual dB sensor markers
function createCustomPinIcon(decibelLevel) {
  let severityClass = 'quiet';
  if (decibelLevel > 70) severityClass = 'violation';
  else if (decibelLevel >= 55) severityClass = 'moderate';

  const html = `
    <div class="noise-pin-container">
      <div class="noise-pin ${severityClass}">
        ${Math.round(decibelLevel)}
      </div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-noise-leaflet-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
}

// Custom Leaflet DivIcon generator for City Average dB markers on India Map view
function createCityAvgPinIcon(cityName, avgDb) {
  let severityClass = 'quiet';
  if (avgDb > 70) severityClass = 'violation';
  else if (avgDb >= 55) severityClass = 'moderate';

  const html = `
    <div class="noise-pin-container shadow-xl">
      <div class="noise-pin ${severityClass}" style="padding: 2px 8px; border-radius: 16px; min-width: 52px; text-align: center; white-space: nowrap; display: flex; align-items: center; justify-content: center; gap: 3px;">
        <span style="font-weight: 900; font-size: 11px;">${Math.round(avgDb)} dB</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-city-avg-leaflet-marker',
    iconSize: [52, 26],
    iconAnchor: [26, 13],
    popupAnchor: [0, -13]
  });
}

// Custom Marker for User's selected position during submission
const USER_PIN_ICON = L.divIcon({
  html: `
    <div style="background-color: #3B82F6; width: 32px; height: 32px; border-radius: 50%; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; color: white;">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>
  `,
  className: 'user-pin-leaflet-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Subcomponent: Leaflet Heatmap Layer with Multi-Spore Continuous Thermal Color Field
function HeatmapLayer({ features }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !features || !Array.isArray(features) || features.length === 0) return;

    // Multi-spore acoustic field projection around each sensor point for smooth thermal color continuous gradient
    const points = [];
    features.forEach(f => {
      if (!f || !f.geometry || !f.geometry.coordinates) return;
      const coords = f.geometry.coordinates; // [lng, lat]
      const centerLat = Number(coords[1]);
      const centerLng = Number(coords[0]);
      if (isNaN(centerLat) || isNaN(centerLng)) return;

      const db = Number(f.properties?.decibel_level || 50);
      const baseIntensity = Math.min(1.0, Math.max(0.12, (db - 30) / 65));

      // Center sensor point
      points.push([centerLat, centerLng, baseIntensity]);

      // Projected surrounding acoustic spore points with radial decay
      const offsets = [
        [0.0018, 0.0018, 0.85],
        [-0.0018, 0.0018, 0.85],
        [0.0018, -0.0018, 0.85],
        [-0.0018, -0.0018, 0.85],
        [0.0035, 0.0, 0.65],
        [-0.0035, 0.0, 0.65],
        [0.0, 0.0035, 0.65],
        [0.0, -0.0035, 0.65]
      ];

      offsets.forEach(([dLat, dLng, decayFactor]) => {
        points.push([
          centerLat + dLat,
          centerLng + dLng,
          Math.min(1.0, Math.max(0.08, baseIntensity * decayFactor))
        ]);
      });
    });

    if (points.length === 0) return;

    let heatLayer;
    try {
      heatLayer = L.heatLayer(points, {
        radius: 48,
        blur: 28,
        maxZoom: 15,
        minOpacity: 0.35,
        gradient: {
          0.12: '#3B82F6', // Blue (<45 dB)
          0.32: '#06B6D4', // Cyan (45 - 55 dB)
          0.52: '#10B981', // Safe Green (55 - 65 dB)
          0.72: '#F59E0B', // Amber / Orange (65 - 75 dB)
          0.86: '#EF4444', // Red (75 - 85 dB - Violation)
          1.00: '#8B5CF6'  // Severe Violet Crimson (>85 dB)
        }
      }).addTo(map);
    } catch (err) {
      console.warn('Heatmap layer render warning:', err);
    }

    return () => {
      if (heatLayer && map) {
        try {
          map.removeLayer(heatLayer);
        } catch (e) { }
      }
    };
  }, [map, features]);

  return null;
}

// Controller component to invalidate map size on container layout changes
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const timer1 = setTimeout(() => map.invalidateSize(), 150);
    const timer2 = setTimeout(() => map.invalidateSize(), 500);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  return null;
}

// Map click listener component
function MapClickListener({ isSelectingLocation, onLocationSelected }) {
  useMapEvents({
    click(e) {
      if (isSelectingLocation && onLocationSelected) {
        onLocationSelected({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

// Map zoom listener component to track current zoom level
function ZoomTracker({ onZoomChange }) {
  const map = useMapEvents({
    zoomend() {
      if (map) onZoomChange(map.getZoom());
    }
  });

  useEffect(() => {
    if (map) onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}

// Controller component to auto-center map when target position changes (Zoom size 11 for full city view, 15 for specific sensor point)
function MapRecenter({ center, targetZoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      const isNational = Math.abs(center[0] - 20.5937) < 0.1 && Math.abs(center[1] - 78.9629) < 0.1;
      const zoomLevel = targetZoom ? targetZoom : (isNational ? 5 : 11);
      map.flyTo(center, zoomLevel, { duration: 1.2 });
      setTimeout(() => map.invalidateSize(), 300);
    }
  }, [center, targetZoom, map]);
  return null;
}

export default function MapView({
  features = [],
  selectedUserLocation,
  isSelectingLocation,
  onLocationSelected,
  mapCenter = [13.0499, 80.2824],
  targetZoom = null
}) {
  const [viewMode, setViewMode] = useState('markers'); // 'markers', 'heatmap', 'hybrid'
  const [currentZoom, setCurrentZoom] = useState(5);

  const showMarkers = viewMode === 'markers' || viewMode === 'hybrid';
  const showHeatmap = viewMode === 'heatmap' || viewMode === 'hybrid';

  const isZoomedOutNationalView = currentZoom < 8;

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-inner border border-base-300">

      {/* Decibel Severity Map Legend Widget (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/45 text-white backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-xl shadow-2xl space-y-1 text-xs">
        <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-emerald-400 block">
          Acoustic Map Legend
        </span>
        <div className="flex items-center gap-3 text-[11px] font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm border border-white/40"></span>
            <span>&lt;55 dB (Quiet/Safe)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm border border-white/40"></span>
            <span>55–70 dB (Moderate)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm border border-white/40"></span>
            <span>&gt;70 dB (Violation)</span>
          </span>
        </div>
      </div>

      {/* Map Mode Selector Toggle Widget (Top Right) */}
      <div className="absolute top-3 right-3 z-[400] bg-slate-600/60 text-white backdrop-blur-md border border-white/20 p-1.5 rounded-full shadow-2xl flex items-center space-x-1">
        <button
          type="button"
          onClick={() => setViewMode('markers')}
          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${viewMode === 'markers' ? 'bg-primary text-white shadow-md' : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Markers</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('heatmap')}
          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${viewMode === 'heatmap' ? 'bg-primary text-white shadow-md' : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>Heatmap</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('hybrid')}
          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${viewMode === 'hybrid' ? 'bg-primary text-white shadow-md' : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
        >
          <Layers className="w-3.5 h-3.5 text-pink-600" />
          <span>Hybrid</span>
        </button>
      </div>

      {/* Selection Mode Banner Overlay */}
      {isSelectingLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-primary-content px-4 py-2 rounded-full shadow-lg font-semibold text-xs flex items-center gap-2 animate-bounce">
          <Crosshair className="w-4 h-4" />
          <span>Click anywhere on the map to place your pin!</span>
        </div>
      )}

      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[400px] md:min-h-[550px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickListener
          isSelectingLocation={isSelectingLocation}
          onLocationSelected={onLocationSelected}
        />

        <ZoomTracker onZoomChange={setCurrentZoom} />
        <MapRecenter center={mapCenter} targetZoom={targetZoom} />
        <MapResizer />

        {/* Heatmap Layer */}
        {showHeatmap && <HeatmapLayer features={features} />}

        {/* User Selected Pin */}
        {selectedUserLocation && (
          <Marker position={[selectedUserLocation.lat, selectedUserLocation.lng]} icon={USER_PIN_ICON}>
            <Popup>
              <div className="text-xs p-1">
                <strong className="text-primary flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Selected Pin Location
                </strong>
                <p className="mt-1 font-mono text-[11px]">
                  {selectedUserLocation.lat.toFixed(5)}, {selectedUserLocation.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Spatial Feature Markers */}
        {showMarkers && (
          isZoomedOutNationalView ? (
            /* Zoomed Out (< 8): Render City Average Markers for 10 Metropolises */
            INDIAN_CITIES.map((city) => (
              <Marker
                key={`city-avg-pin-${city.id}`}
                position={city.center}
                icon={createCityAvgPinIcon(city.name, city.avgDb)}
              >
                <Popup>
                  <div className="p-1 text-xs space-y-1">
                    <strong className="text-sm font-bold text-gray-900 block">{city.name} ({city.state})</strong>
                    <div className="text-[11px] text-gray-600">📍 {city.landmark}</div>
                    <div className="flex items-center justify-between pt-1 border-t">
                      <span className="text-gray-500 font-semibold">City Avg Noise:</span>
                      <span className="font-mono font-extrabold text-primary">{city.avgDb} dB</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-semibold pt-0.5">
                      Zoom in to populate detailed sensor grid
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))
          ) : (
            /* Zoomed In (>= 8): Populate All Granular Sensor Reading Markers */
            features.map((feature) => {
              const coords = feature.geometry.coordinates; // [lng, lat]
              const props = feature.properties;
              const lat = coords[1];
              const lng = coords[0];

              return (
                <Marker
                  key={props.id}
                  position={[lat, lng]}
                  icon={createCustomPinIcon(props.decibel_level)}
                >
                  <Popup className="noise-popup">
                    <div className="p-1 min-w-[200px] text-xs">

                      {/* Title & dB badge */}
                      <div className="flex items-center justify-between gap-2 border-b pb-1.5 mb-2">
                        <span className="font-bold text-sm text-gray-900 truncate">{props.location_name}</span>
                        <span className={`px-2 py-0.5 rounded text-white font-mono font-bold text-xs ${props.decibel_level > 70 ? 'bg-red-500' : (props.decibel_level >= 55 ? 'bg-amber-500' : 'bg-emerald-500')
                          }`}>
                          {Math.round(props.decibel_level)} dB
                        </span>
                      </div>

                      {/* Details Grid */}
                      <div className="space-y-1 text-gray-600">
                        <div className="flex justify-between">
                          <span>Category:</span>
                          <span className="font-semibold capitalize text-gray-800">{props.category}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Source:</span>
                          <span className="font-mono text-gray-800 font-medium">
                            {props.source_type === 'iot_sensor' ? 'IoT Sensor' : 'Crowdsourced'}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span>Recorded:</span>
                          <span className="font-mono text-[11px] text-gray-500">
                            {new Date(props.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                    </div>
                  </Popup>
                </Marker>
              );
            })
          )
        )}

      </MapContainer>
    </div>
  );
}
