import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});

export const geocodePincode = async (pincode: string, apiKey: string) => {
  try {
    const response = await client.geocode({
      params: {
        address: pincode,
        components: { country: 'IN' },
        key: apiKey,
      },
    });

    if (response.data.results.length > 0) {
      return {
        lat: response.data.results[0].geometry.location.lat,
        lng: response.data.results[0].geometry.location.lng,
        address: response.data.results[0].formatted_address,
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};

export const reverseGeocode = async (lat: number, lng: number, apiKey: string) => {
  try {
    const response = await client.reverseGeocode({
      params: {
        latlng: { lat, lng },
        key: apiKey,
      },
    });

    if (response.data.results.length > 0) {
      return {
        address: response.data.results[0].formatted_address,
        pincode: extractPincode(response.data.results[0].formatted_address),
      };
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
};

const extractPincode = (address: string): string => {
  const pincodeMatch = address.match(/\b\d{6}\b/);
  return pincodeMatch ? pincodeMatch[0] : '';
};