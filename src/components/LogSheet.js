import React from 'react';
import LogCanvas from './LogCanvas';

function LogSheet({ logData }) {
  if (!logData) return null;
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };
  
  return (
    <div className="bg-white border rounded p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold">Driver's Daily Log</h3>
          <p className="text-sm">Date: {formatDate(logData.date)}</p>
        </div>
        <div className="text-right">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => window.print()}
          >
            <i className="fas fa-print mr-2"></i> Print Log
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="md:w-1/2">
          <div className="border p-3 rounded">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-600">From:</label>
                <div className="font-medium">{logData.carrier || 'Carrier Name'}</div>
              </div>
              <div>
                <label className="block text-xs text-gray-600">To:</label>
                <div className="font-medium">Destination</div>
              </div>
              <div>
                <label className="block text-xs text-gray-600">Total Miles:</label>
                <div className="font-medium">{logData.total_miles}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:w-1/2">
          <div className="border p-3 rounded">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-600">Main Office:</label>
                <div className="font-medium">{logData.main_office || 'Office Address'}</div>
              </div>
              <div>
                <label className="block text-xs text-gray-600">Home Terminal:</label>
                <div className="font-medium">{logData.home_terminal || 'Terminal Address'}</div>
              </div>
              <div>
                <label className="block text-xs text-gray-600">Carrier/Driver:</label>
                <div className="font-medium">Driver Name</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <LogCanvas 
        date={logData.date}
        offDutyPeriods={logData.off_duty}
        sleeperBerthPeriods={logData.sleeper_berth}
        drivingPeriods={logData.driving}
        onDutyPeriods={logData.on_duty}
        totalMiles={logData.total_miles}
      />
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Shipping Documents:</label>
          <div className="mt-1 border rounded p-2 min-h-[60px]">
            {logData.shipping_docs || 'No shipping documents listed'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Remarks:</label>
          <div className="mt-1 border rounded p-2 min-h-[60px]">
            {logData.remarks || 'No remarks listed'}
          </div>
        </div>
      </div>
      
      <div className="mt-4 border-t pt-4">
        <div className="text-center text-sm text-gray-500">
          I certify that the entries are true and correct:
        </div>
        <div className="flex justify-center mt-4">
          <div className="border-b border-black w-64 mb-1"></div>
        </div>
        <div className="text-center text-sm">Driver's Signature</div>
      </div>
    </div>
  );
}

export default LogSheet;
