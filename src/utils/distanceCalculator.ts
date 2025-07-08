// utils/distanceCalculator.ts
interface LatLng {
  lat: number;
  lng: number;
}

export const calculateDistance = async (
  origin: LatLng,
  destination: LatLng,
  apiKey?: string // Not needed for JS API
): Promise<number> => {
  try {
    // Check if Google Maps API is loaded
    if (typeof window === 'undefined' || !window.google) {
      throw new Error("Google Maps API not loaded");
    }

    // Create cache key
    const cacheKey = `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
      return parseFloat(cached);
    }

    // Use Google Maps JavaScript API
    const service = new google.maps.DistanceMatrixService();
    
    return new Promise((resolve, reject) => {
      service.getDistanceMatrix({
        origins: [new google.maps.LatLng(origin.lat, origin.lng)],
        destinations: [new google.maps.LatLng(destination.lat, destination.lng)],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      }, (response, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK && response) {
          const element = response.rows[0]?.elements[0];
          if (element && element.status === 'OK') {
            const distanceKm = element.distance!.value / 1000;
            sessionStorage.setItem(cacheKey, distanceKm.toString());
            resolve(distanceKm);
          } else {
            reject(new Error('Distance calculation failed'));
          }
        } else {
          reject(new Error(`Distance Matrix API error: ${status}`));
        }
      });
    });
    
  } catch (error) {
    console.error("Distance calculation error:", error);
    // Fallback to Haversine formula
    return calculateHaversineDistance(origin, destination);
  }
};

// Haversine formula fallback
function calculateHaversineDistance(origin: LatLng, destination: LatLng): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(destination.lat - origin.lat);
  const dLon = toRad(destination.lng - origin.lng);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(origin.lat)) * Math.cos(toRad(destination.lat)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * Math.PI / 180;
}