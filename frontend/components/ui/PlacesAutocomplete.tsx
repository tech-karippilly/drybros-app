"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

declare global {
    interface Window {
        google: any;
    }
}

export interface PlaceDetails {
    placeId: string;
    formattedAddress: string;
    name?: string;
    geometry?: {
        location: {
            lat: number;
            lng: number;
        };
    };
    addressComponents?: any[];
    types?: string[];
}

interface PlacesAutocompleteProps {
    value: string;
    onChange: (placeDetails: PlaceDetails) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    onError?: (error: string) => void;
}

export function PlacesAutocomplete({
    value,
    onChange,
    placeholder = "Search for a place...",
    className,
    disabled = false,
    required = false,
    onError,
}: PlacesAutocompleteProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);

    // Load Google Places API script
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
            console.error('NEXT_PUBLIC_GOOGLE_PLACES_API_KEY is not set');
            onError?.('Google Places API key is not configured');
            setIsLoading(false);
            return;
        }

        // Check if script is already loaded
        if (window.google && window.google.maps && window.google.maps.places && window.google.maps.places.PlaceAutocompleteElement) {
            setIsScriptLoaded(true);
            setIsLoading(false);
            return;
        }

        // Check if script tag already exists
        const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
        if (existingScript) {
            existingScript.addEventListener('load', () => {
                setIsScriptLoaded(true);
                setIsLoading(false);
            });
            return;
        }

        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            setIsScriptLoaded(true);
            setIsLoading(false);
        };

        script.onerror = () => {
            console.error('Failed to load Google Maps script');
            onError?.('Failed to load Google Places API');
            setIsLoading(false);
        };

        document.head.appendChild(script);

        return () => {};
    }, [onError]);

    // Store the selected place text to prevent clearing
    const selectedPlaceTextRef = useRef<string>(value || '');
    
    // Update ref when value changes from parent (only on initial mount or external changes)
    useEffect(() => {
        if (value && value !== selectedPlaceTextRef.current) {
            selectedPlaceTextRef.current = value;
        }
    }, [value]);

    // Initialize autocomplete when script is loaded
    useEffect(() => {
        if (!isScriptLoaded || !containerRef.current || disabled) {
            return;
        }

        const element = document.createElement('gmp-place-autocomplete');
        
        try {
            // Create PlaceAutocompleteElement
            element.setAttribute('placeholder', placeholder);
            element.setAttribute('class', className || '');
            element.setAttribute('aria-disabled', disabled ? 'true' : 'false');
            element.setAttribute('aria-required', required ? 'true' : 'false');

            // Listen for place selection
            const handlePlaceSelect = (event: any) => {
                const place = event.detail;
                console.log('Place selected - full event detail:', place);
                
                if (!place || !place.placeId) {
                    onError?.('No valid place selected from autocomplete');
                    return;
                }
                
                // Debug: log all available properties
                console.log('Available properties:', Object.keys(place));
                console.log('Location:', place.location);
                console.log('Geometry:', place.geometry);
                console.log('Lat/Lng:', place.lat, place.lng);
                
                // Try multiple ways to get lat/lng from the place object
                let lat: number | undefined;
                let lng: number | undefined;
                
                // Method 1: Direct location property (newer API)
                if (place.location && typeof place.location.lat === 'number' && typeof place.location.lng === 'number') {
                    lat = place.location.lat;
                    lng = place.location.lng;
                }
                // Method 2: Geometry property (older API style)
                else if (place.geometry && place.geometry.location) {
                    if (typeof place.geometry.location.lat === 'function') {
                        lat = place.geometry.location.lat();
                        lng = place.geometry.location.lng();
                    } else if (typeof place.geometry.location.lat === 'number') {
                        lat = place.geometry.location.lat;
                        lng = place.geometry.location.lng;
                    }
                }
                // Method 3: Direct lat/lng properties
                else if (typeof place.lat === 'number' && typeof place.lng === 'number') {
                    lat = place.lat;
                    lng = place.lng;
                }
                // Method 4: Latitude/Longitude properties
                else if (typeof place.latitude === 'number' && typeof place.longitude === 'number') {
                    lat = place.latitude;
                    lng = place.longitude;
                }
                
                console.log('Extracted lat/lng:', lat, lng);
                
                // Store the selected place name/text
                selectedPlaceTextRef.current = place.name || place.formattedAddress || '';
                
                const details: PlaceDetails = {
                    placeId: place.placeId,
                    formattedAddress: place.formattedAddress || '',
                    name: place.name || undefined,
                    geometry: lat !== undefined && lng !== undefined ? {
                        location: { lat, lng },
                    } : undefined,
                    addressComponents: place.addressComponents || undefined,
                    types: place.types || undefined,
                };
                
                console.log('PlaceDetails to be sent:', details);
                setPlaceDetails(details);
                onChange(details);
            };

            element.addEventListener('gmp-placeautocomplete-select', handlePlaceSelect);

            // Clear previous element
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(element);
            
            return () => {
                element.removeEventListener('gmp-placeautocomplete-select', handlePlaceSelect);
                element.remove();
            };
        } catch (error) {
            console.error('Error initializing PlaceAutocompleteElement:', error);
            onError?.('Failed to initialize PlaceAutocompleteElement');
            // Clean up element if it was created
            if (element && element.parentNode) {
                element.remove();
            }
        }
    // Only re-initialize when script loads, disabled state changes, or on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isScriptLoaded, disabled]);

    // No need to sync input value with ref, handled by PlaceAutocompleteElement

    return (
        <div className="relative">
            <div ref={containerRef} className="relative w-full" />
            {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="size-4 animate-spin text-[#49659c]" />
                </div>
            )}
        </div>
    );
}
