import axios from 'axios';

// API base URL - this will work both locally and on Replit
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000/api'
  : `https://${window.location.hostname.replace('3000', '8000')}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Geocode an address to coordinates
 * @param {string} address - The address to geocode
 * @returns {Promise<Object>} - Geocoded location
 */
export const geocodeAddress = async (address) => {
  try {
    const response = await api.get('/geocode', {
      params: { address }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Calculate route with HOS compliance
 * @param {Object} tripData - Trip data including locations and cycle hours
 * @returns {Promise<Object>} - Route data with HOS-compliant schedule
 */
export const calculateRoute = async (tripData) => {
  try {
    const response = await api.post('/calculate-route', tripData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Handle API errors and provide meaningful error messages
 * @param {Error} error - The error object from axios
 * @returns {Error} - Error with meaningful message
 */
const handleApiError = (error) => {
  let errorMessage = 'An unexpected error occurred';
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const responseError = error.response.data;
    
    if (responseError.error) {
      errorMessage = responseError.error;
    } else if (responseError.detail) {
      errorMessage = responseError.detail;
    } else {
      errorMessage = `Server error: ${error.response.status}`;
    }
  } else if (error.request) {
    // The request was made but no response was received
    errorMessage = 'No response received from server. Please check your internet connection.';
  } else {
    // Something happened in setting up the request that triggered an Error
    errorMessage = error.message;
  }
  
  const customError = new Error(errorMessage);
  customError.originalError = error;
  return customError;
};
