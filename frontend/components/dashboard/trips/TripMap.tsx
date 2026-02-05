"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw, MapPin, Navigation } from 'lucide-react';

interface TripMapProps {
    pickupLat?: number | null;
    pickupLng?: number | null;
    dropLat?: number | null;
    dropLng?: number | null;
    pickupLocation: string;
    dropLocation?: string | null;
    liveLocationLat?: number | null;
    liveLocationLng?: number | null;
}

export function TripMap({
    pickupLat,
    pickupLng,
    dropLat,
    dropLng,
    pickupLocation,
    dropLocation,
    liveLocationLat,
    liveLocationLng,
}: TripMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

    const initializeMap = () => {
        if (!mapRef.current || !window.google) return;

        try {
            setIsLoading(true);
            setError(null);

            // Clear existing markers and directions
            markersRef.current.forEach(marker => marker.setMap(null));
            markersRef.current = [];
            if (directionsRendererRef.current) {
                directionsRendererRef.current.setMap(null);
            }

            const hasPickupCoords = pickupLat != null && pickupLng != null;
            const hasDropCoords = dropLat != null && dropLng != null;

            if (!hasPickupCoords && !hasDropCoords) {
                setError('No location coordinates available');
                setIsLoading(false);
                return;
            }

            // Default center to pickup or drop location
            const center = hasPickupCoords
                ? { lat: pickupLat!, lng: pickupLng! }
                : { lat: dropLat!, lng: dropLng! };

            // Create map
            const map = new window.google.maps.Map(mapRef.current, {
                center,
                zoom: 13,
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'off' }],
                    },
                ],
            });

            mapInstanceRef.current = map;

            // Add pickup marker
            if (hasPickupCoords) {
                const pickupMarker = new window.google.maps.Marker({
                    position: { lat: pickupLat!, lng: pickupLng! },
                    map,
                    title: 'Pickup Location',
                    label: 'A',
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 12,
                        fillColor: '#10b981',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 3,
                    },
                });

                const pickupInfo = new window.google.maps.InfoWindow({
                    content: `<div style="padding: 8px;"><strong>Pickup</strong><br/>${pickupLocation}</div>`,
                });

                pickupMarker.addListener('click', () => {
                    pickupInfo.open(map, pickupMarker);
                });

                markersRef.current.push(pickupMarker);
            }

            // Add drop marker
            if (hasDropCoords && dropLocation) {
                const dropMarker = new window.google.maps.Marker({
                    position: { lat: dropLat!, lng: dropLng! },
                    map,
                    title: 'Drop Location',
                    label: 'B',
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 12,
                        fillColor: '#ef4444',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 3,
                    },
                });

                const dropInfo = new window.google.maps.InfoWindow({
                    content: `<div style="padding: 8px;"><strong>Drop</strong><br/>${dropLocation}</div>`,
                });

                dropMarker.addListener('click', () => {
                    dropInfo.open(map, dropMarker);
                });

                markersRef.current.push(dropMarker);

                // Draw route if both locations exist
                if (hasPickupCoords) {
                    const directionsService = new window.google.maps.DirectionsService();
                    const directionsRenderer = new window.google.maps.DirectionsRenderer({
                        map,
                        suppressMarkers: true, // We're using custom markers
                        polylineOptions: {
                            strokeColor: '#3b82f6',
                            strokeWeight: 4,
                            strokeOpacity: 0.7,
                        },
                    });

                    directionsRendererRef.current = directionsRenderer;

                    directionsService.route(
                        {
                            origin: { lat: pickupLat!, lng: pickupLng! },
                            destination: { lat: dropLat!, lng: dropLng! },
                            travelMode: window.google.maps.TravelMode.DRIVING,
                        },
                        (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
                            if (status === window.google.maps.DirectionsStatus.OK && result) {
                                directionsRenderer.setDirections(result);
                            }
                        }
                    );
                }
            }

            // Add live location marker (Driver's current location)
            const hasLiveLocation = liveLocationLat != null && liveLocationLng != null;
            if (hasLiveLocation) {
                const liveMarker = new window.google.maps.Marker({
                    position: { lat: liveLocationLat!, lng: liveLocationLng! },
                    map,
                    title: 'Driver Live Location',
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 14,
                        fillColor: '#3b82f6',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 4,
                    },
                    animation: window.google.maps.Animation.BOUNCE,
                });

                const liveInfo = new window.google.maps.InfoWindow({
                    content: `<div style="padding: 8px;">
                        <strong style="color: #3b82f6;">🚗 Driver Live Location</strong><br/>
                        <span style="font-size: 12px; color: #666;">Updates every 5 minutes</span>
                    </div>`,
                });

                liveMarker.addListener('click', () => {
                    liveInfo.open(map, liveMarker);
                });

                markersRef.current.push(liveMarker);
            }

            // Fit bounds if we have multiple locations
            if (hasPickupCoords || hasDropCoords || hasLiveLocation) {
                const bounds = new window.google.maps.LatLngBounds();
                if (hasPickupCoords) bounds.extend({ lat: pickupLat!, lng: pickupLng! });
                if (hasDropCoords) bounds.extend({ lat: dropLat!, lng: dropLng! });
                if (hasLiveLocation) bounds.extend({ lat: liveLocationLat!, lng: liveLocationLng! });
                map.fitBounds(bounds);
            }

            setIsLoading(false);
        } catch (err) {
            console.error('Error initializing map:', err);
            setError('Failed to load map');
            setIsLoading(false);
        }
    };

    const loadGoogleMaps = () => {
        if (window.google && window.google.maps) {
            initializeMap();
            return;
        }

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
            setError('Google Maps API key not configured');
            setIsLoading(false);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => initializeMap();
        script.onerror = () => {
            setError('Failed to load Google Maps');
            setIsLoading(false);
        };
        document.head.appendChild(script);
    };

    useEffect(() => {
        loadGoogleMaps();

        return () => {
            // Cleanup
            markersRef.current.forEach(marker => marker.setMap(null));
            if (directionsRendererRef.current) {
                directionsRendererRef.current.setMap(null);
            }
        };
    }, [pickupLat, pickupLng, dropLat, dropLng]);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0d121c] dark:text-white flex items-center gap-2">
                    <Navigation size={20} />
                    Trip Route Map
                </h3>
                <button
                    onClick={initializeMap}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium text-[#49659c] dark:text-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh map"
                >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Location Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <MapPin size={16} className="text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase mb-0.5">
                            Pickup (A)
                        </p>
                        <p className="text-xs text-green-900 dark:text-green-300 truncate">
                            {pickupLocation}
                        </p>
                    </div>
                </div>
                {dropLocation && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <MapPin size={16} className="text-red-600 dark:text-red-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase mb-0.5">
                                Drop (B)
                            </p>
                            <p className="text-xs text-red-900 dark:text-red-300 truncate">
                                {dropLocation}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Map Container */}
            <div className="relative">
                <div
                    ref={mapRef}
                    className="w-full h-[400px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
                />
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 rounded-lg">
                        <div className="text-center">
                            <Loader2 className="size-8 animate-spin text-[#0d59f2] mx-auto mb-2" />
                            <p className="text-sm text-[#49659c] dark:text-gray-400">Loading map...</p>
                        </div>
                    </div>
                )}
                {error && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/95 dark:bg-gray-900/95 rounded-lg">
                        <div className="text-center px-4">
                            <MapPin className="size-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
                            <button
                                onClick={initializeMap}
                                className="px-4 py-2 bg-[#0d59f2] text-white rounded-lg text-sm font-medium hover:bg-[#0d59f2]/90 transition-all"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Note about driver location */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                    <strong>Note:</strong> Real-time driver location tracking is not yet implemented. 
                    The map shows pickup and drop locations with the route between them.
                </p>
            </div>
        </div>
    );
}
