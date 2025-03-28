// Set current year in the footer
document.getElementById('currentYear').textContent = new Date().getFullYear();

const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction 
    ? 'https://truck-route-backend-1.onrender.com/api'
    : `${window.location.origin}/api`;

console.log('Using API base URL:', API_BASE_URL);

let routeData = null;
let map = null;
let activeTab = 'map';
let activeLogIndex = 0;

// DOM Elements
const tripForm = document.getElementById('tripForm');
const loadingIndicator = document.getElementById('loading');
const submitButton = document.getElementById('submitButton');
const errorPanel = document.getElementById('errorPanel');
const errorMessage = document.getElementById('errorMessage');
const emptyState = document.getElementById('emptyState');
const resultTabs = document.getElementById('resultTabs');

const mapTab = document.getElementById('mapTab');
const detailsTab = document.getElementById('detailsTab');
const logsTab = document.getElementById('logsTab');

const mapContent = document.getElementById('mapContent');
const detailsContent = document.getElementById('detailsContent');
const logsContent = document.getElementById('logsContent');

const prevLogBtn = document.getElementById('prevLogBtn');
const nextLogBtn = document.getElementById('nextLogBtn');
const logPagination = document.getElementById('logPagination');
const logSheet = document.getElementById('logSheet');

// Get location suggestions as user types
async function getLocationSuggestions(query) {
  try {
    // Only make API call if query is at least 3 characters
    if (!query || query.length < 3) {
      return [];
    }
    
    // For debugging - we'll log the actual URL we're trying to access
    const url = `${API_BASE_URL}/location-suggestions?query=${encodeURIComponent(query)}`;
    console.log('Fetching suggestions from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    return []; // Return empty array on error
  }
}

// Geocode an address to coordinates
async function geocodeAddress(address) {
  try {
    const url = `${API_BASE_URL}/geocode?address=${encodeURIComponent(address)}`;
    console.log('Geocoding address from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
}

// Calculate route with HOS compliance
async function calculateRoute(tripData) {
  try {
    console.log('Calculating route with:', tripData);
    console.log('Using API URL:', `${API_BASE_URL}/calculate-route`);
    
    const response = await fetch(`${API_BASE_URL}/calculate-route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tripData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calculating route:', error);
    throw error;
  }
}

// Handle API errors
function handleApiError(error) {
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
}

// Initialize map
function initMap() {
  if (map) {
    map.remove();
  }
  map = L.map('map').setView([40, -95], 4);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

// Update map with route data
function updateMap(stops, segments, polylinePath) {
  if (!map) {
    initMap();
  }
  
  // Clear existing layers
  map.eachLayer(layer => {
    if (layer instanceof L.Marker || layer instanceof L.Polyline) {
      map.removeLayer(layer);
    }
  });
  
  // Define marker icons
  const icons = {
    start: L.divIcon({
      html: `<i class="fas fa-play-circle" style="color: #16a34a; font-size: 20px;"></i>`,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    }),
    end: L.divIcon({
      html: `<i class="fas fa-flag-checkered" style="color: #dc2626; font-size: 20px;"></i>`,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    }),
    pickup: L.divIcon({
      html: `<i class="fas fa-box" style="color: #2563eb; font-size: 20px;"></i>`,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    }),
    dropoff: L.divIcon({
      html: `<i class="fas fa-box-open" style="color: #9333ea; font-size: 20px;"></i>`,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    }),
    rest: L.divIcon({
      html: `<i class="fas fa-bed" style="color: #4b5563; font-size: 20px;"></i>`,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    }),
    break: L.divIcon({
      html: `<i class="fas fa-coffee" style="color: #d97706; font-size: 20px;"></i>`,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    }),
    fuel: L.divIcon({
      html: `<i class="fas fa-gas-pump" style="color: #ea580c; font-size: 20px;"></i>`,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })
  };
  
  // Add route polyline
  try {
    const routeLine = L.polyline(polyline.decode(polylinePath), {
      color: 'blue',
      weight: 4,
      opacity: 0.7
    }).addTo(map);
    
    // Fit map to route bounds
    map.fitBounds(routeLine.getBounds(), {
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
      html: `<i class="fas fa-map-marker-alt" style="color: #4b5563; font-size: 20px;"></i>`,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    
    const marker = L.marker(position, { icon }).addTo(map);
    
    // Format arrival and departure times
    const formatTime = (date) => new Date(date).toLocaleString();
    const arrivalTime = formatTime(arrival_time);
    const departureTime = formatTime(departure_time);
    
    // Create popup content
    let popupContent = `<div style="font-size: 14px;">
      <p style="font-weight: bold;">${stop_type.charAt(0).toUpperCase() + stop_type.slice(1)} Stop</p>
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
}

// Format date and time
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Format duration in hours and minutes
function formatDuration(hours) {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h ${minutes}m`;
}

// Update route details view
function updateRouteDetails(routeData) {
  if (!routeData) return;
  
  const {
    total_distance,
    total_duration,
    estimated_start_time,
    estimated_delivery_time,
    stops
  } = routeData;
  
  // Group stops by type for summary
  const stopCounts = stops.reduce((acc, stop) => {
    acc[stop.stop_type] = (acc[stop.stop_type] || 0) + 1;
    return acc;
  }, {});
  
  let detailsHTML = `
    <div>
      <h3 class="text-lg font-medium text-gray-900">Trip Summary</h3>
      <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-gray-50 p-3 rounded">
          <div class="text-sm text-gray-500">Total Distance</div>
          <div class="text-lg font-medium">${Math.round(total_distance)} miles</div>
        </div>
        <div class="bg-gray-50 p-3 rounded">
          <div class="text-sm text-gray-500">Total Duration</div>
          <div class="text-lg font-medium">${formatDuration(total_duration)}</div>
        </div>
        <div class="bg-gray-50 p-3 rounded">
          <div class="text-sm text-gray-500">Estimated Start</div>
          <div class="text-lg font-medium">${formatDateTime(estimated_start_time)}</div>
        </div>
        <div class="bg-gray-50 p-3 rounded">
          <div class="text-sm text-gray-500">Estimated Delivery</div>
          <div class="text-lg font-medium">${formatDateTime(estimated_delivery_time)}</div>
        </div>
      </div>
    </div>
    
    <div>
      <h3 class="text-lg font-medium text-gray-900">Stop Summary</h3>
      <div class="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
  `;
  
  for (const [type, count] of Object.entries(stopCounts)) {
    detailsHTML += `
      <div class="bg-gray-50 p-3 rounded">
        <div class="text-sm text-gray-500">
          ${type.charAt(0).toUpperCase() + type.slice(1)} Stops
        </div>
        <div class="text-lg font-medium">${count}</div>
      </div>
    `;
  }
  
  detailsHTML += `
      </div>
    </div>
    
    <div>
      <h3 class="text-lg font-medium text-gray-900">Trip Timeline</h3>
      <div class="mt-2 space-y-4">
        <div class="relative">
          <div class="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-200"></div>
  `;
  
  stops.forEach((stop, index) => {
    // Skip intermediate points
    if (stop.stop_type === 'intermediate') return;
    
    let icon;
    let bgColor;
    
    switch (stop.stop_type) {
      case 'start':
        icon = 'play-circle';
        bgColor = 'bg-green-500';
        break;
      case 'pickup':
        icon = 'box';
        bgColor = 'bg-blue-500';
        break;
      case 'dropoff':
        icon = 'box-open';
        bgColor = 'bg-purple-500';
        break;
      case 'rest':
        icon = 'bed';
        bgColor = 'bg-gray-500';
        break;
      case 'break':
        icon = 'coffee';
        bgColor = 'bg-amber-500';
        break;
      case 'fuel':
        icon = 'gas-pump';
        bgColor = 'bg-orange-500';
        break;
      case 'end':
        icon = 'flag-checkered';
        bgColor = 'bg-red-500';
        break;
      default:
        icon = 'map-marker-alt';
        bgColor = 'bg-gray-500';
    }
    
    detailsHTML += `
      <div class="relative pl-10 pb-8">
        <div class="absolute left-1 top-1 w-6 h-6 rounded-full ${bgColor} flex items-center justify-center text-white z-10">
          <i class="fas fa-${icon} text-sm"></i>
        </div>
        <div class="bg-white p-3 rounded shadow-sm">
          <div class="font-medium">
            ${stop.stop_type.charAt(0).toUpperCase() + stop.stop_type.slice(1)}
            ${stop.stop_type === 'rest' ? ' Period' : ''}
            ${(stop.stop_type === 'break' || stop.stop_type === 'fuel') ? ' Stop' : ''}
          </div>
          <div class="text-sm text-gray-600">${stop.location.address}</div>
          <div class="mt-1 flex justify-between">
            <div class="text-sm">
              <span class="text-gray-500">Arrival:</span> ${new Date(stop.arrival_time).toLocaleString()}
            </div>
            ${stop.duration > 0 ? 
              `<div class="text-sm ml-4">
                <span class="text-gray-500">Duration:</span> ${formatDuration(stop.duration)}
              </div>` 
              : ''}
          </div>
        </div>
      </div>
    `;
  });
  
  detailsHTML += `
        </div>
      </div>
    </div>
  `;
  
  detailsContent.innerHTML = detailsHTML;
}

// Format date for log sheet
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

// Draw log canvas
function drawLogCanvas(canvas, logData) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Define grid dimensions
  const gridTop = 40;
  const gridHeight = height - 80;
  const gridBottom = gridTop + gridHeight;
  const cellWidth = width / 24; // 24 hours in a day
  
  // Draw log grid background
  ctx.fillStyle = '#f9f9f9';
  ctx.fillRect(0, gridTop, width, gridHeight);
  
  // Draw grid lines
  ctx.beginPath();
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  
  // Draw horizontal lines (status rows)
  const rowHeight = gridHeight / 4;
  for (let i = 0; i <= 4; i++) {
    const y = gridTop + i * rowHeight;
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  
  // Draw vertical lines (hour columns)
  for (let i = 0; i <= 24; i++) {
    const x = i * cellWidth;
    ctx.moveTo(x, gridTop);
    ctx.lineTo(x, gridBottom);
  }
  
  ctx.stroke();
  
  // Draw hour labels
  ctx.font = '10px Arial';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  
  for (let i = 0; i <= 24; i++) {
    const hour = i === 24 ? 0 : i;
    const x = i * cellWidth;
    
    // Draw midnight as 0
    ctx.fillText(hour.toString(), x, gridTop - 15);
    
    // Draw vertical line markers (thicker for every 6 hours)
    ctx.beginPath();
    ctx.strokeStyle = i % 6 === 0 ? '#777' : '#ddd';
    ctx.lineWidth = i % 6 === 0 ? 2 : 1;
    ctx.moveTo(x, gridTop - 10);
    ctx.lineTo(x, gridTop);
    ctx.stroke();
  }
  
  // Add day/date label at top
  const formattedDate = new Date(logData.date).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short',
    day: 'numeric',
    year: 'numeric' 
  });
  
  ctx.font = '12px Arial';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'left';
  ctx.fillText(formattedDate, 10, 20);
  
  // Add status labels
  const statusLabels = ['Off Duty', 'Sleeper Berth', 'Driving', 'On Duty (Not Driving)'];
  ctx.textAlign = 'right';
  
  for (let i = 0; i < 4; i++) {
    const y = gridTop + i * rowHeight + rowHeight / 2;
    ctx.fillText(statusLabels[i], width - 10, y + 4);
  }
  
  // Draw activity blocks
  const drawActivityBlock = (periods, rowIndex, color) => {
    if (!periods || !periods.length) return;
    
    const y = gridTop + rowIndex * rowHeight;
    
    ctx.fillStyle = color;
    
    periods.forEach(period => {
      const [start, end] = period;
      const x = start * cellWidth;
      const blockWidth = (end - start) * cellWidth;
      
      // Draw activity block
      ctx.fillRect(x, y, blockWidth, rowHeight);
      
      // Draw border around block
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, blockWidth, rowHeight);
    });
  };
  
  // Draw each type of activity
  drawActivityBlock(logData.off_duty, 0, 'rgba(0, 200, 0, 0.5)');      // Green for Off Duty
  drawActivityBlock(logData.sleeper_berth, 1, 'rgba(100, 100, 255, 0.5)'); // Blue for Sleeper Berth
  drawActivityBlock(logData.driving, 2, 'rgba(200, 0, 0, 0.5)');      // Red for Driving
  drawActivityBlock(logData.on_duty, 3, 'rgba(255, 150, 0, 0.5)');     // Orange for On Duty
  
  // Add total miles
  ctx.textAlign = 'left';
  ctx.fillStyle = '#333';
  ctx.font = 'bold 12px Arial';
  ctx.fillText(`Total Miles: ${logData.total_miles}`, 10, gridBottom + 30);
}

// Update log sheet view
function updateLogSheet(logData) {
  if (!logData) return;
  
  logSheet.innerHTML = `
    <div class="bg-white border rounded p-2">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h3 class="text-lg font-bold">Driver's Daily Log</h3>
          <p class="text-sm">Date: ${formatDate(logData.date)}</p>
        </div>
        <div class="text-right">
          <button 
            class="px-4 py-2 bg-blue-600 text-white rounded print-button"
          >
            <i class="fas fa-print mr-2"></i> Print Log
          </button>
        </div>
      </div>
      
      <div class="flex flex-col md:flex-row gap-4 mb-4">
        <div class="md:w-1/2">
          <div class="border p-3 rounded">
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-xs text-gray-600">From:</label>
                <div class="font-medium">${logData.carrier || 'Carrier Name'}</div>
              </div>
              <div>
                <label class="block text-xs text-gray-600">To:</label>
                <div class="font-medium">Destination</div>
              </div>
              <div>
                <label class="block text-xs text-gray-600">Total Miles:</label>
                <div class="font-medium">${logData.total_miles}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="md:w-1/2">
          <div class="border p-3 rounded">
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-xs text-gray-600">Main Office:</label>
                <div class="font-medium">${logData.main_office || 'Office Address'}</div>
              </div>
              <div>
                <label class="block text-xs text-gray-600">Home Terminal:</label>
                <div class="font-medium">${logData.home_terminal || 'Terminal Address'}</div>
              </div>
              <div>
                <label class="block text-xs text-gray-600">Carrier/Driver:</label>
                <div class="font-medium">Driver Name</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="border rounded p-2 bg-white">
        <canvas id="logCanvas" width="800" height="300" class="w-full h-auto"></canvas>
      </div>
      
      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Shipping Documents:</label>
          <div class="mt-1 border rounded p-2 min-h-[60px]">
            ${logData.shipping_docs || 'No shipping documents listed'}
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Remarks:</label>
          <div class="mt-1 border rounded p-2 min-h-[60px]">
            ${logData.remarks || 'No remarks listed'}
          </div>
        </div>
      </div>
      
      <div class="mt-4 border-t pt-4">
        <div class="text-center text-sm text-gray-500">
          I certify that the entries are true and correct:
        </div>
        <div class="flex justify-center mt-4">
          <div class="border-b border-black w-64 mb-1"></div>
        </div>
        <div class="text-center text-sm">Driver's Signature</div>
      </div>
    </div>
  `;
  
  // Initialize and draw the log canvas
  const logCanvas = document.getElementById('logCanvas');
  if (logCanvas) {
    drawLogCanvas(logCanvas, logData);
    
    // Add print handler
    const printButton = document.querySelector('.print-button');
    if (printButton) {
      printButton.addEventListener('click', () => {
        window.print();
      });
    }
  }
  
  // Update pagination
  updateLogPagination();
}

// Update log pagination
function updateLogPagination() {
  if (!routeData || !routeData.logs) return;
  
  const totalLogs = routeData.logs.length;
  logPagination.textContent = `Log ${activeLogIndex + 1} of ${totalLogs}`;
  
  prevLogBtn.disabled = activeLogIndex === 0;
  nextLogBtn.disabled = activeLogIndex === totalLogs - 1;
}

// Show active tab content
function showActiveTab() {
  // Hide all content
  mapContent.classList.add('hidden');
  detailsContent.classList.add('hidden');
  logsContent.classList.add('hidden');
  
  // Reset tab styling
  mapTab.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
  detailsTab.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
  logsTab.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
  
  mapTab.classList.add('text-gray-600', 'hover:text-blue-600');
  detailsTab.classList.add('text-gray-600', 'hover:text-blue-600');
  logsTab.classList.add('text-gray-600', 'hover:text-blue-600');
  
  // Show active content and style active tab
  switch (activeTab) {
    case 'map':
      mapContent.classList.remove('hidden');
      mapTab.classList.remove('text-gray-600', 'hover:text-blue-600');
      mapTab.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
      
      // Refresh the map (needed sometimes for proper rendering)
      if (map) {
        map.invalidateSize();
      }
      break;
    case 'details':
      detailsContent.classList.remove('hidden');
      detailsTab.classList.remove('text-gray-600', 'hover:text-blue-600');
      detailsTab.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
      break;
    case 'logs':
      logsContent.classList.remove('hidden');
      logsTab.classList.remove('text-gray-600', 'hover:text-blue-600');
      logsTab.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
      break;
  }
}

// Show loading state
function showLoading() {
  loadingIndicator.classList.remove('hidden');
  submitButton.disabled = true;
}

// Hide loading state
function hideLoading() {
  loadingIndicator.classList.add('hidden');
  submitButton.disabled = false;
}

// Show error message
function showError(message) {
  errorPanel.classList.remove('hidden');
  errorMessage.textContent = message;
}

// Hide error message
function hideError() {
  errorPanel.classList.add('hidden');
}

// Update UI with route data
function updateUI(data) {
  routeData = data;
  
  // Hide empty state and show results
  emptyState.classList.add('hidden');
  resultTabs.classList.remove('hidden');
  
  // Update the map
  updateMap(data.stops, data.segments, data.polyline);
  
  // Update route details
  updateRouteDetails(data);
  
  // Reset active log index
  activeLogIndex = 0;
  
  // Update log sheet
  if (data.logs && data.logs.length > 0) {
    updateLogSheet(data.logs[activeLogIndex]);
  }
  
  // Show active tab
  showActiveTab();
}

// Validate form fields
function validateForm() {
  let isValid = true;
  
  // Current location
  const currentLocation = document.getElementById('current_location');
  const currentLocationError = document.getElementById('current_location_error');
  
  if (!currentLocation.value.trim()) {
    currentLocationError.textContent = 'Current location is required';
    currentLocationError.classList.remove('hidden');
    currentLocation.classList.add('border-red-300');
    isValid = false;
  } else {
    currentLocationError.classList.add('hidden');
    currentLocation.classList.remove('border-red-300');
  }
  
  // Pickup location
  const pickupLocation = document.getElementById('pickup_location');
  const pickupLocationError = document.getElementById('pickup_location_error');
  
  if (!pickupLocation.value.trim()) {
    pickupLocationError.textContent = 'Pickup location is required';
    pickupLocationError.classList.remove('hidden');
    pickupLocation.classList.add('border-red-300');
    isValid = false;
  } else {
    pickupLocationError.classList.add('hidden');
    pickupLocation.classList.remove('border-red-300');
  }
  
  // Dropoff location
  const dropoffLocation = document.getElementById('dropoff_location');
  const dropoffLocationError = document.getElementById('dropoff_location_error');
  
  if (!dropoffLocation.value.trim()) {
    dropoffLocationError.textContent = 'Dropoff location is required';
    dropoffLocationError.classList.remove('hidden');
    dropoffLocation.classList.add('border-red-300');
    isValid = false;
  } else {
    dropoffLocationError.classList.add('hidden');
    dropoffLocation.classList.remove('border-red-300');
  }
  
  // Current cycle hours
  const currentCycleHours = document.getElementById('current_cycle_hours');
  const currentCycleHoursError = document.getElementById('current_cycle_hours_error');
  
  const hours = parseFloat(currentCycleHours.value);
  if (isNaN(hours) || hours < 0 || hours > 70) {
    currentCycleHoursError.textContent = 'Cycle hours must be between 0 and 70';
    currentCycleHoursError.classList.remove('hidden');
    currentCycleHours.classList.add('border-red-300');
    isValid = false;
  } else {
    currentCycleHoursError.classList.add('hidden');
    currentCycleHours.classList.remove('border-red-300');
  }
  
  return isValid;
}

// Handle form submission
async function handleSubmit(e) {
  e.preventDefault();
  
  hideError();
  
  if (!validateForm()) {
    return;
  }
  
  const formData = {
    current_location: document.getElementById('current_location').value,
    pickup_location: document.getElementById('pickup_location').value,
    dropoff_location: document.getElementById('dropoff_location').value,
    current_cycle_hours: parseFloat(document.getElementById('current_cycle_hours').value)
  };
  
  showLoading();
  
  try {
    const result = await calculateRoute(formData);
    hideLoading();
    updateUI(result);
    activeTab = 'map';
    showActiveTab();
  } catch (error) {
    hideLoading();
    showError(error.message || 'An error occurred while calculating the route');
  }
}

// Initialize the application
// Creates and displays a suggestion dropdown
function createSuggestionDropdown(inputElement, suggestions) {
  // Remove any existing dropdown
  const existingDropdown = document.getElementById(`${inputElement.id}_dropdown`);
  if (existingDropdown) {
    existingDropdown.remove();
  }
  
  if (!suggestions || suggestions.length === 0) return;
  
  // Create dropdown container
  const dropdown = document.createElement('div');
  dropdown.id = `${inputElement.id}_dropdown`;
  dropdown.className = 'absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto';
  
  // Add suggestions to dropdown
  suggestions.forEach(suggestion => {
    const item = document.createElement('div');
    item.className = 'px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm';
    item.textContent = suggestion.display_name;
    
    // Handle click on suggestion
    item.addEventListener('click', () => {
      inputElement.value = suggestion.display_name;
      dropdown.remove();
      
      // Show suggestion as selected
      const suggestionDisplay = document.getElementById(`${inputElement.id}_suggestion`);
      if (suggestionDisplay) {
        suggestionDisplay.textContent = `Selected: ${suggestion.display_name}`;
        suggestionDisplay.classList.remove('hidden');
      }
    });
    
    dropdown.appendChild(item);
  });
  
  // Position dropdown
  const inputRect = inputElement.getBoundingClientRect();
  dropdown.style.width = `${inputElement.offsetWidth}px`;
  
  // Add to DOM
  inputElement.parentNode.appendChild(dropdown);
}

// Sets up autocomplete for an input field
function setupLocationAutocomplete(inputId) {
  const inputElement = document.getElementById(inputId);
  if (!inputElement) return;
  
  let debounceTimer;
  
  inputElement.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    
    // Clear previous timer
    clearTimeout(debounceTimer);
    
    // Hide any existing suggestion display
    const suggestionDisplay = document.getElementById(`${inputId}_suggestion`);
    if (suggestionDisplay) {
      suggestionDisplay.classList.add('hidden');
    }
    
    // Remove existing dropdown if query is too short
    if (query.length < 3) {
      const existingDropdown = document.getElementById(`${inputId}_dropdown`);
      if (existingDropdown) {
        existingDropdown.remove();
      }
      return;
    }
    
    // Set new timer to debounce API calls
    debounceTimer = setTimeout(async () => {
      try {
        const suggestions = await getLocationSuggestions(query);
        createSuggestionDropdown(inputElement, suggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    }, 300); // 300ms debounce delay
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (e.target !== inputElement) {
      const dropdown = document.getElementById(`${inputId}_dropdown`);
      if (dropdown) {
        dropdown.remove();
      }
    }
  });
}

function init() {
  // Add form submit handler
  tripForm.addEventListener('submit', handleSubmit);
  
  // Add tab click handlers
  mapTab.addEventListener('click', () => {
    activeTab = 'map';
    showActiveTab();
  });
  
  detailsTab.addEventListener('click', () => {
    activeTab = 'details';
    showActiveTab();
  });
  
  logsTab.addEventListener('click', () => {
    activeTab = 'logs';
    showActiveTab();
  });
  
  // Add log navigation handlers
  prevLogBtn.addEventListener('click', () => {
    if (activeLogIndex > 0 && routeData && routeData.logs) {
      activeLogIndex--;
      updateLogSheet(routeData.logs[activeLogIndex]);
    }
  });
  
  nextLogBtn.addEventListener('click', () => {
    if (routeData && routeData.logs && activeLogIndex < routeData.logs.length - 1) {
      activeLogIndex++;
      updateLogSheet(routeData.logs[activeLogIndex]);
    }
  });
  
  // Set up autocomplete for location inputs
  setupLocationAutocomplete('current_location');
  setupLocationAutocomplete('pickup_location');
  setupLocationAutocomplete('dropoff_location');
  
  // Initialize map
  initMap();
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
