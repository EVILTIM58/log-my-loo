import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom poop marker
const createPoopIcon = (hasPhoto) => {
  return divIcon({
    html: `<div style="
      font-size: 28px;
      filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.3));
      cursor: pointer;
      transition: transform 0.2s;
    " class="poop-marker">💩</div>`,
    className: 'custom-poop-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

function FlyToLocation({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13, { duration: 1.5 });
    }
  }, [center, map]);
  
  return null;
}

export default function GlobalMap({ drops, onMarkerClick, userLocation }) {
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Try to get user's location for initial center
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
    }
  }, [userLocation]);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={mapCenter}
        zoom={3}
        className="w-full h-full"
        style={{ background: '#1e293b' }}
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {userLocation && <FlyToLocation center={[userLocation.latitude, userLocation.longitude]} />}
        
        {drops.map((drop) => (
          <Marker
            key={drop.id}
            position={[drop.latitude, drop.longitude]}
            icon={createPoopIcon(!!drop.photo_url)}
            eventHandlers={{
              click: () => onMarkerClick(drop)
            }}
          >
            <Popup className="poop-popup">
              <div className="text-center p-1">
                <p className="font-semibold text-slate-800">{drop.location_name || 'Mystery Spot'}</p>
                <p className="text-xs text-slate-500">by {drop.user_name || 'Anonymous'}</p>
                {drop.average_rating > 0 && (
                  <p className="text-amber-500 text-sm mt-1">
                    {'⭐'.repeat(Math.round(drop.average_rating))} ({drop.review_count})
                  </p>
                )}
                <button 
                  className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium"
                  onClick={() => onMarkerClick(drop)}
                >
                  View Details →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <style>{`
        .custom-poop-icon {
          background: transparent !important;
          border: none !important;
        }
        .poop-marker:hover {
          transform: scale(1.3) !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  );
}