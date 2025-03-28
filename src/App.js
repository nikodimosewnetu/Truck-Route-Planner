import React, { useState } from 'react';
import TripForm from './components/TripForm';
import RouteMap from './components/RouteMap';
import RouteDetails from './components/RouteDetails';
import LogSheet from './components/LogSheet';
import { calculateRoute } from './utils/api';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [activeLogIndex, setActiveLogIndex] = useState(0);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await calculateRoute(formData);
      setRouteData(result);
      setActiveTab('map');
    } catch (err) {
      setError(err.message || 'An error occurred while calculating the route');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (!routeData) return null;

    switch (activeTab) {
      case 'map':
        return (
          <RouteMap 
            stops={routeData.stops} 
            segments={routeData.segments}
            polyline={routeData.polyline}
          />
        );
      case 'details':
        return (
          <RouteDetails 
            routeData={routeData}
          />
        );
      case 'logs':
        return (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Driver's Daily Logs</h3>
              <div className="flex space-x-2">
                <button 
                  className="px-2 py-1 bg-gray-200 rounded"
                  disabled={activeLogIndex === 0}
                  onClick={() => setActiveLogIndex(activeLogIndex - 1)}
                >
                  <i className="fas fa-chevron-left"></i> Previous
                </button>
                <span className="px-2 py-1">
                  Log {activeLogIndex + 1} of {routeData.logs.length}
                </span>
                <button 
                  className="px-2 py-1 bg-gray-200 rounded"
                  disabled={activeLogIndex === routeData.logs.length - 1}
                  onClick={() => setActiveLogIndex(activeLogIndex + 1)}
                >
                  Next <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
            <LogSheet logData={routeData.logs[activeLogIndex]} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-800 text-white py-4 shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold flex items-center">
            <i className="fas fa-truck mr-2"></i> Truck Route Planner with HOS Compliance
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white p-4 rounded shadow-md">
              <h2 className="text-xl font-bold mb-4">Trip Details</h2>
              <TripForm onSubmit={handleSubmit} isLoading={loading} />
              
              {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
                  <p className="font-bold">Error</p>
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            {routeData ? (
              <div className="bg-white rounded shadow-md">
                <div className="border-b">
                  <nav className="flex">
                    <button 
                      className={`px-4 py-2 font-medium ${activeTab === 'map' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                      onClick={() => setActiveTab('map')}
                    >
                      <i className="fas fa-map-marked-alt mr-1"></i> Route Map
                    </button>
                    <button 
                      className={`px-4 py-2 font-medium ${activeTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                      onClick={() => setActiveTab('details')}
                    >
                      <i className="fas fa-info-circle mr-1"></i> Route Details
                    </button>
                    <button 
                      className={`px-4 py-2 font-medium ${activeTab === 'logs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                      onClick={() => setActiveTab('logs')}
                    >
                      <i className="fas fa-clipboard-list mr-1"></i> Log Sheets
                    </button>
                  </nav>
                </div>
                <div className="p-4">
                  {renderTabContent()}
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded shadow-md flex flex-col items-center justify-center min-h-[400px] text-center">
                <i className="fas fa-truck-moving text-6xl text-gray-300 mb-4"></i>
                <h2 className="text-xl font-bold text-gray-700">Enter Trip Details to Calculate Your Route</h2>
                <p className="text-gray-500 mt-2">
                  Fill out the form to get HOS-compliant route plans and ELD logs.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-4 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p>Truck Route Planner with HOS Compliance &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
