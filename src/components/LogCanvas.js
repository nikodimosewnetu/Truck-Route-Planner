import React, { useRef, useEffect } from 'react';

function LogCanvas({ date, offDutyPeriods, sleeperBerthPeriods, drivingPeriods, onDutyPeriods, totalMiles }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
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
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short',
        day: 'numeric',
        year: 'numeric' 
      });
    };
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.fillText(formatDate(date), 10, 20);
    
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
    drawActivityBlock(offDutyPeriods, 0, 'rgba(0, 200, 0, 0.5)');      // Green for Off Duty
    drawActivityBlock(sleeperBerthPeriods, 1, 'rgba(100, 100, 255, 0.5)'); // Blue for Sleeper Berth
    drawActivityBlock(drivingPeriods, 2, 'rgba(200, 0, 0, 0.5)');      // Red for Driving
    drawActivityBlock(onDutyPeriods, 3, 'rgba(255, 150, 0, 0.5)');     // Orange for On Duty
    
    // Add total miles
    ctx.textAlign = 'left';
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`Total Miles: ${totalMiles}`, 10, gridBottom + 30);
    
  }, [date, offDutyPeriods, sleeperBerthPeriods, drivingPeriods, onDutyPeriods, totalMiles]);
  
  return (
    <div className="border rounded p-2 bg-white">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={300}
        className="w-full h-auto"
      />
    </div>
  );
}

export default LogCanvas;
