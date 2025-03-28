import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

function RouteMap({ stops, segments, polyline }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  // Initialize map when component mounts
  useEffect(() => {
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([40, -95], 4);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
    }
    
    return () => {
      // Cleanup map if component unmounts
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);
  
  // Update map with route data
  useEffect(() => {
    if (!mapInstanceRef.current || !stops || !segments || !polyline) return;
    
    // Clear existing layers
    mapInstanceRef.current.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });
    
    // Define marker icons
    const icons = {
      start: L.divIcon({
        html: `<i class="fas fa-play-circle text-green-600 text-xl"></i>`,
        className: 'custom-div-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      }),
      end: L.divIcon({
        html: `<i class="fas fa-flag-checkered text-red-600 text-xl"></i>`,
        className: 'custom-div-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      }),
      pickup: L.divIcon({
        html: `<i class="fas fa-box text-blue-600 text-xl"></i>`,
        className: 'custom-div-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      }),
      dropoff: L.divIcon({
        html: `<i class="fas fa-box-open text-purple-600 text-xl"></i>`,
        className: 'custom-div-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      }),
      rest: L.divIcon({
        html: `<i class="fas fa-bed text-gray-600 text-xl"></i>`,
        className: 'custom-div-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      }),
      break: L.divIcon({
        html: `<i class="fas fa-coffee text-amber-600 text-xl"></i>`,
        className: 'custom-div-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      }),
      fuel: L.divIcon({
        html: `<i class="fas fa-gas-pump text-orange-600 text-xl"></i>`,
        className: 'custom-div-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
    };
    
    // Add route line
    try {
      const decodedPolyline = L.Polyline.fromEncoded(polyline);
      const routeLine = L.polyline(decodedPolyline.getLatLngs(), {
        color: 'blue',
        weight: 4,
        opacity: 0.7
      }).addTo(mapInstanceRef.current);
      
      // Fit map to route bounds
      mapInstanceRef.current.fitBounds(routeLine.getBounds(), {
        padding: [50, 50]
      });
    } catch (error) {
      console.error('Error decoding polyline:', error);
    }
    
    // Add markers for stops
    const stopMarkers = [];
    stops.forEach((stop, index) => {
      const { location, stop_type, arrival_time, departure_time, duration } = stop;
      const position = [location.lat, location.lng];
      const icon = icons[stop_type] || L.divIcon({
        html: `<i class="fas fa-map-marker-alt text-gray-600 text-xl"></i>`,
        className: 'custom-div-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      
      const marker = L.marker(position, { icon }).addTo(mapInstanceRef.current);
      
      // Format arrival and departure times
      const formatTime = (date) => new Date(date).toLocaleString();
      const arrivalTime = formatTime(arrival_time);
      const departureTime = formatTime(departure_time);
      
      // Create popup content
      let popupContent = `<div class="text-sm">
        <p class="font-bold">${stop_type.charAt(0).toUpperCase() + stop_type.slice(1)} Stop</p>
        <p>${location.address}</p>
        <p>Arrival: ${arrivalTime}</p>
        <p>Departure: ${departureTime}</p>
      `;
      
      if (duration > 0) {
        const hours = Math.floor(duration);
        const minutes = Math.round((duration - hours) * 60);
        popupContent += `<p>Duration: ${hours}h ${minutes}m</p>`;
      }
      
      popupContent += `</div>`;
      
      marker.bindPopup(popupContent);
      stopMarkers.push(marker);
    });
    
    // If we have stop markers, fit the map to show them all
    if (stopMarkers.length > 0) {
      const group = L.featureGroup(stopMarkers);
      mapInstanceRef.current.fitBounds(group.getBounds(), {
        padding: [50, 50]
      });
    }
  }, [stops, segments, polyline]);
  
  return (
    <div className="w-full h-[500px] rounded overflow-hidden">
      <div ref={mapRef} className="w-full h-full"></div>
    </div>
  );
}

export default RouteMap;
