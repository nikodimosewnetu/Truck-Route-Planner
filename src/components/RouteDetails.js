import React from 'react';

function RouteDetails({ routeData }) {
  if (!routeData) return null;
  
  const {
    total_distance,
    total_duration,
    estimated_start_time,
    estimated_delivery_time,
    stops
  } = routeData;
  
  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Format duration in hours and minutes
  const formatDuration = (hours) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };
  
  // Group stops by type for summary
  const stopCounts = stops.reduce((acc, stop) => {
    acc[stop.stop_type] = (acc[stop.stop_type] || 0) + 1;
    return acc;
  }, {});
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Trip Summary</h3>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Total Distance</div>
            <div className="text-lg font-medium">{Math.round(total_distance)} miles</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Total Duration</div>
            <div className="text-lg font-medium">{formatDuration(total_duration)}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Estimated Start</div>
            <div className="text-lg font-medium">{formatDateTime(estimated_start_time)}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Estimated Delivery</div>
            <div className="text-lg font-medium">{formatDateTime(estimated_delivery_time)}</div>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900">Stop Summary</h3>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(stopCounts).map(([type, count]) => (
            <div key={type} className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">
                {type.charAt(0).toUpperCase() + type.slice(1)} Stops
              </div>
              <div className="text-lg font-medium">{count}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900">Trip Timeline</h3>
        <div className="mt-2 space-y-4">
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-200"></div>
            {stops.map((stop, index) => {
              // Skip intermediate points
              if (stop.stop_type === 'intermediate') return null;
              
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
              
              return (
                <div key={index} className="relative pl-10 pb-8">
                  <div className={`absolute left-1 top-1 w-6 h-6 rounded-full ${bgColor} flex items-center justify-center text-white z-10`}>
                    <i className={`fas fa-${icon} text-sm`}></i>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="font-medium">
                      {stop.stop_type.charAt(0).toUpperCase() + stop.stop_type.slice(1)}
                      {stop.stop_type === 'rest' && ' Period'}
                      {(stop.stop_type === 'break' || stop.stop_type === 'fuel') && ' Stop'}
                    </div>
                    <div className="text-sm text-gray-600">{stop.location.address}</div>
                    <div className="mt-1 flex justify-between">
                      <div className="text-sm">
                        <span className="text-gray-500">Arrival:</span> {new Date(stop.arrival_time).toLocaleString()}
                      </div>
                      {stop.duration > 0 && (
                        <div className="text-sm ml-4">
                          <span className="text-gray-500">Duration:</span> {formatDuration(stop.duration)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RouteDetails;
