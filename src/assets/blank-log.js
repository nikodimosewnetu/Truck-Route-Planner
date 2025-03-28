// This file exports a function to draw the blank log sheet template
// The actual log sheet drawing is implemented in LogCanvas.js

export const drawBlankLogTemplate = (ctx, width, height) => {
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
  
  // Add status labels
  const statusLabels = ['1. Off Duty', '2. Sleeper Berth', '3. Driving', '4. On Duty (Not Driving)'];
  ctx.textAlign = 'right';
  
  for (let i = 0; i < 4; i++) {
    const y = gridTop + i * rowHeight + rowHeight / 2;
    ctx.fillText(statusLabels[i], width - 10, y + 4);
  }
  
  return { gridTop, gridBottom, rowHeight, cellWidth };
};
