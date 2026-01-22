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
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

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
        if (window.google && window.google.maps && window.google.maps.places) {
            setIsScriptLoaded(true);
            setIsLoading(false);
            return;
        }

        // Check if script tag already exists
        const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
        if (existingScript) {
            // Wait for it to load
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

        return () => {
            // Cleanup: remove script if component unmounts (optional)
            // Note: We might not want to remove it if other components use it
        };
    }, [onError]);

    // Initialize autocomplete when script is loaded
    useEffect(() => {
        if (!isScriptLoaded || !inputRef.current || disabled) {
            return;
        }

        try {
            // Initialize Google Places Autocomplete
            autocompleteRef.current = new window.google.maps.places.Autocomplete(
                inputRef.current,
                {
                    types: ['address'], // Restrict to addresses
                    fields: ['place_id', 'formatted_address', 'geometry', 'name', 'address_components', 'types'],
                }
            );

            // Handle place selection
            autocompleteRef.current.addListener('place_changed', () => {
                const place = autocompleteRef.current.getPlace();

                // Check if a valid place was selected
                if (!place || !place.place_id) {
                    console.warn('No valid place selected from autocomplete');
                    return;
                }

                // Fetch detailed place information
                const service = new window.google.maps.places.PlacesService(
                    document.createElement('div')
                );

                service.getDetails(
                    {
                        placeId: place.place_id,
                        fields: [
                            'place_id',
                            'formatted_address',
                            'name',
                            'geometry',
                            'address_components',
                            'types',
                        ],
                    },
                    (placeDetails: any, status: string) => {
                        if (status === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                            // Update input value to show the selected address
                            if (inputRef.current) {
                                inputRef.current.value = placeDetails.formatted_address || placeDetails.name || '';
                            }

                            // Call onChange with detailed place information
                            onChange({
                                placeId: placeDetails.place_id,
                                formattedAddress: placeDetails.formatted_address || '',
                                name: placeDetails.name || undefined,
                                geometry: placeDetails.geometry ? {
                                    location: {
                                        lat: placeDetails.geometry.location.lat(),
                                        lng: placeDetails.geometry.location.lng(),
                                    },
                                } : undefined,
                                addressComponents: placeDetails.address_components || undefined,
                                types: placeDetails.types || undefined,
                            });
                        } else {
                            console.warn('Failed to get place details:', status);
                            // Fallback to basic place info if details fetch fails
                            const address = place.formatted_address || place.name || '';
                            if (inputRef.current) {
                                inputRef.current.value = address;
                            }
                            onChange({
                                placeId: place.place_id || '',
                                formattedAddress: address,
                                name: place.name || undefined,
                            });
                        }
                    }
                );
            });

            return () => {
                // Cleanup listener
                if (autocompleteRef.current) {
                    window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
                }
            };
        } catch (error) {
            console.error('Error initializing Places Autocomplete:', error);
            onError?.('Failed to initialize Places Autocomplete');
        }
    }, [isScriptLoaded, disabled, onChange, onError]);

    // Update input value when value prop changes (only if input is not focused)
    useEffect(() => {
        if (inputRef.current && value !== inputRef.current.value) {
            // Only update if the input is not focused (to avoid interrupting user typing)
            const isFocused = document.activeElement === inputRef.current;
            if (!isFocused) {
                inputRef.current.value = value || '';
            }
        }
    }, [value]);

    return (
        <div className="relative">
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#49659c] size-4 pointer-events-none" />
                <input
                    ref={inputRef}
                    type="text"
                    defaultValue={value}
                    placeholder={placeholder}
                    disabled={disabled || isLoading}
                    required={required}
                    onChange={(e) => {
                        // Allow user to type freely - Google Autocomplete will handle suggestions
                        // We don't interfere with typing here
                    }}
                    onBlur={(e) => {
                        // When user leaves the field
                        const currentValue = e.target.value.trim();
                        
                        if (!currentValue) {
                            // If input is empty, clear the place data
                            onChange({
                                placeId: '',
                                formattedAddress: '',
                            });
                        } else {
                            // Check if we need to update - if user typed something and no place was selected
                            // We'll trigger onChange to update the parent with manual entry
                            // Note: If a place was selected via autocomplete, onChange would have been called already
                            // So if we're here and the value is different, it's likely manual entry
                            const storedValue = value || '';
                            if (currentValue !== storedValue) {
                                // User likely typed manually - treat as manual entry without place_id
                                onChange({
                                    placeId: '',
                                    formattedAddress: currentValue,
                                });
                            }
                        }
                    }}
                    className={cn(
                        "w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed",
                        className
                    )}
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="size-4 animate-spin text-[#49659c]" />
                    </div>
                )}
            </div>
        </div>
    );
}
