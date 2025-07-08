"use client";
import React, { createContext, useContext, ReactNode } from 'react';
import { useLoadScript } from '@react-google-maps/api';

// Define libraries outside to prevent re-renders
const libraries: ("places" | "geometry")[] = ['places', 'geometry'];

// Context type
interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
}

// Create the context
const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

// Custom hook to use the context
export const useGoogleMapsContext = (): GoogleMapsContextType => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMapsContext must be used within GoogleMapsProvider');
  }
  return context;
};

// Provider props type
interface GoogleMapsProviderProps {
  children: ReactNode;
}

// Provider component
export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
    preventGoogleFontsLoading: true,
  });

  const value: GoogleMapsContextType = {
    isLoaded,
    loadError,
  };

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
};