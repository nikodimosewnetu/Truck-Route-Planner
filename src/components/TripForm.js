import React, { useState } from 'react';
import { geocodeAddress } from '../utils/api';

function TripForm({ onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_hours: 0
  });
  
  const [addressSuggestions, setAddressSuggestions] = useState({
    current_location: null,
    pickup_location: null,
    dropoff_location: null
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear suggestions when input changes
    if (addressSuggestions[name]) {
      setAddressSuggestions({
        ...addressSuggestions,
        [name]: null
      });
    }
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };
  
  const handleBlur = async (e) => {
    const { name, value } = e.target;
    
    // Skip geocoding if the field is empty
    if (!value.trim()) return;
    
    // Only geocode address fields
    if (['current_location', 'pickup_location', 'dropoff_location'].includes(name)) {
      try {
        const result = await geocodeAddress(value);
        setAddressSuggestions({
          ...addressSuggestions,
          [name]: result
        });
      } catch (error) {
        setValidationErrors({
          ...validationErrors,
          [name]: 'Address could not be found. Please enter a valid location.'
        });
      }
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.current_location.trim()) {
      errors.current_location = 'Current location is required';
    }
    
    if (!formData.pickup_location.trim()) {
      errors.pickup_location = 'Pickup location is required';
    }
    
    if (!formData.dropoff_location.trim()) {
      errors.dropoff_location = 'Dropoff location is required';
    }
    
    const cycleHours = parseFloat(formData.current_cycle_hours);
    if (isNaN(cycleHours) || cycleHours < 0 || cycleHours > 70) {
      errors.current_cycle_hours = 'Cycle hours must be between 0 and 70';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Convert current_cycle_hours to a number
      const dataToSubmit = {
        ...formData,
        current_cycle_hours: parseFloat(formData.current_cycle_hours)
      };
      
      onSubmit(dataToSubmit);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Current Location
        </label>
        <div className="mt-1 relative">
          <input
            type="text"
            name="current_location"
            value={formData.current_location}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.current_location ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter current location"
          />
          {addressSuggestions.current_location && (
            <div className="mt-1 text-sm text-gray-500">
              Found: {addressSuggestions.current_location.display_name}
            </div>
          )}
          {validationErrors.current_location && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.current_location}</p>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Pickup Location
        </label>
        <div className="mt-1 relative">
          <input
            type="text"
            name="pickup_location"
            value={formData.pickup_location}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.pickup_location ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter pickup location"
          />
          {addressSuggestions.pickup_location && (
            <div className="mt-1 text-sm text-gray-500">
              Found: {addressSuggestions.pickup_location.display_name}
            </div>
          )}
          {validationErrors.pickup_location && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.pickup_location}</p>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Dropoff Location
        </label>
        <div className="mt-1 relative">
          <input
            type="text"
            name="dropoff_location"
            value={formData.dropoff_location}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.dropoff_location ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter dropoff location"
          />
          {addressSuggestions.dropoff_location && (
            <div className="mt-1 text-sm text-gray-500">
              Found: {addressSuggestions.dropoff_location.display_name}
            </div>
          )}
          {validationErrors.dropoff_location && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.dropoff_location}</p>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Current Cycle Hours Used (0-70)
        </label>
        <div className="mt-1 relative">
          <input
            type="number"
            name="current_cycle_hours"
            min="0"
            max="70"
            step="0.5"
            value={formData.current_cycle_hours}
            onChange={handleChange}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.current_cycle_hours ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter hours used in current cycle"
          />
          {validationErrors.current_cycle_hours && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.current_cycle_hours}</p>
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        <p><i className="fas fa-info-circle mr-1"></i> Using 70 hour/8 day cycle for property-carrying drivers</p>
      </div>
      
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Calculating Route...
            </>
          ) : (
            <>Calculate Route</>
          )}
        </button>
      </div>
    </form>
  );
}

export default TripForm;
