'use client';

import React, { useEffect, useRef } from 'react';

// Declare google types
declare global {
  interface Window {
    google: any;
  }
}

export interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
  icon?: string;
}

export interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  height?: string;
  className?: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  center,
  zoom = 13,
  markers = [],
  onMarkerClick,
  height = '400px',
  className = '',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // Initialize Google Map
    if (mapRef.current && !googleMapRef.current) {
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });
    }

    // Update center and zoom
    if (googleMapRef.current) {
      googleMapRef.current.setCenter(center);
      googleMapRef.current.setZoom(zoom);
    }
  }, [center, zoom]);

  useEffect(() => {
    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    if (googleMapRef.current) {
      markers.forEach((markerData) => {
        const marker = new window.google.maps.Marker({
          position: { lat: markerData.lat, lng: markerData.lng },
          map: googleMapRef.current!,
          title: markerData.title,
          icon: markerData.icon,
        });

        marker.addListener('click', () => {
          onMarkerClick?.(markerData);
        });

        markersRef.current.push(marker);
      });
    }

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
    };
  }, [markers, onMarkerClick]);

  return (
    <div className={`rounded-lg overflow-hidden shadow-lg ${className}`}>
      <div ref={mapRef} style={{ height, width: '100%' }} />
      {!window.google && (
        <div
          className="flex items-center justify-center bg-gray-200 dark:bg-gray-700"
          style={{ height }}
        >
          <p className="text-[var(--foreground)] font-poppins">
            Google Maps API not loaded. Add the script to your HTML.
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;
