import React, { useState } from 'react';

/**
 * Interactive Charts with Hover Effects
 * Tooltip, hover highlights, smooth animations
 */

export const InteractiveBarChart = ({ title, data, height = 280 }) => {
  const canvasRef = React.useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!data || data.length === 0) return;

    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const barWidth = chartWidth / data.length * 0.8;
    const barGap = (chartWidth / data.length) * 0.2;

    let hoveredIdx = -1;
    data.forEach((d, i) => {
      const barX = padding + i * (barWidth + barGap) + barGap / 2;
      if (x >= barX && x <= barX + barWidth && y < rect.height - padding) {
        hoveredIdx = i;
      }
    });

    setHoveredIndex(hoveredIdx);
    if (hoveredIdx >= 0) {
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        label: data[hoveredIdx].label,
        value: data[hoveredIdx].value
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltip(null);
  };

  // Define vibrant colors with good contrast
  const getBarColor = (index) => {
    const colors = ['#00D9FF', '#00FF88', '#FFD700', '#FF6B6B', '#9D4EDD', '#3A86FF'];
    return colors[index % colors.length];
  };

  React.useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth;
    const realHeight = height;

    canvas.width = width;
    canvas.height = realHeight;

    const maxValue = Math.max(...data.map(d => d.value));
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = realHeight - padding * 2;
    const barWidth = chartWidth / data.length * 0.8;
    const barGap = (chartWidth / data.length) * 0.2;

    // Background
    ctx.fillStyle = '#0F1419';
    ctx.fillRect(0, 0, width, realHeight);

    // Grid lines
    ctx.strokeStyle = '#2A3A4A';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Bars with hover effect
    data.forEach((d, i) => {
      const barHeight = (d.value / maxValue) * chartHeight;
      const x = padding + i * (barWidth + barGap) + barGap / 2;
      const y = padding + chartHeight - barHeight;
      const barColor = getBarColor(i);

      // Bar with hover highlight
      const isHovered = hoveredIndex === i;
      ctx.fillStyle = barColor;
      ctx.globalAlpha = isHovered ? 1 : 0.7;
      ctx.fillRect(x, y, barWidth, barHeight);
      ctx.globalAlpha = 1;

      // Border on hover
      if (isHovered) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = barColor;
        ctx.strokeStyle = barColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, barWidth, barHeight);
        ctx.shadowBlur = 0;
      }

      // Value label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px var(--font)';
      ctx.textAlign = 'center';
      ctx.fillText(d.value, x + barWidth / 2, y - 8);

      // Category label
      ctx.fillStyle = '#A0AEC0';
      ctx.font = '11px var(--font)';
      ctx.fillText(d.label, x + barWidth / 2, realHeight - 15);
    });

    // Axes
    ctx.strokeStyle = '#4A5A6A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, realHeight - padding);
    ctx.lineTo(width - padding, realHeight - padding);
    ctx.stroke();
  }, [data, height, hoveredIndex]);

  return (
    <div>
      {title && <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>{title}</div>}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 15, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: height, display: 'block', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        
        {/* Tooltip */}
        {tooltip && (
          <div 
            style={{
              position: 'absolute',
              left: tooltip.x + 10,
              top: tooltip.y - 30,
              background: '#00D9FF',
              color: '#000',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(0,217,255,0.4)',
              whiteSpace: 'nowrap'
            }}
          >
            <div>{tooltip.label}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{tooltip.value}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export const InteractivePieChart = ({ title, data, height = 260 }) => {
  const canvasRef = React.useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  // Define vibrant pie colors
  const pieColors = ['#00D9FF', '#00FF88', '#FFD700', '#FF6B6B', '#9D4EDD', '#3A86FF', '#FF00FF', '#00FFFF'];

  const getPieColor = (index) => {
    return pieColors[index % pieColors.length];
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    const distance = Math.sqrt(x * x + y * y);

    if (distance > radius || distance < radius * 0.3) {
      setHoveredIndex(null);
      setTooltip(null);
      return;
    }

    const angle = Math.atan2(y, x) + Math.PI / 2;
    const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;
    const total = data.reduce((sum, d) => sum + d.value, 0);

    let currentAngle = 0;
    let hoveredIdx = -1;

    data.forEach((d, i) => {
      const sliceAngle = (d.value / total) * Math.PI * 2;
      if (normalizedAngle >= currentAngle && normalizedAngle <= currentAngle + sliceAngle) {
        hoveredIdx = i;
      }
      currentAngle += sliceAngle;
    });

    setHoveredIndex(hoveredIdx);
    if (hoveredIdx >= 0) {
      const percentage = ((data[hoveredIdx].value / total) * 100).toFixed(1);
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        label: data[hoveredIdx].label,
        value: data[hoveredIdx].value,
        percentage: percentage
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltip(null);
  };

  React.useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth;
    const realHeight = height;

    canvas.width = width;
    canvas.height = realHeight;

    const centerX = width / 2;
    const centerY = realHeight / 2;
    const radius = Math.min(centerX, centerY) - 40;
    const total = data.reduce((sum, d) => sum + d.value, 0);

    // Background
    ctx.fillStyle = '#0F1419';
    ctx.fillRect(0, 0, width, realHeight);

    let currentAngle = -Math.PI / 2;

    data.forEach((d, i) => {
      const sliceAngle = (d.value / total) * Math.PI * 2;
      const isHovered = hoveredIndex === i;
      const expandRadius = isHovered ? radius * 1.15 : radius;
      const sliceColor = getPieColor(i);

      // Draw slice with glow on hover
      ctx.fillStyle = sliceColor;
      ctx.globalAlpha = isHovered ? 1 : 0.85;
      
      if (isHovered) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = sliceColor;
      }

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, expandRadius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Label with better visibility
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (expandRadius * 0.65);
      const labelY = centerY + Math.sin(labelAngle) * (expandRadius * 0.65);

      const percentage = ((d.value / total) * 100).toFixed(0);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = isHovered ? 'bold 15px var(--font)' : 'bold 13px var(--font)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${percentage}%`, labelX, labelY);

      currentAngle += sliceAngle;
    });

    // Legend with better colors
    const legendX = width - 160;
    let legendY = 20;
    data.forEach((d, i) => {
      const isHovered = hoveredIndex === i;
      const legendColor = getPieColor(i);
      
      ctx.fillStyle = legendColor;
      ctx.globalAlpha = isHovered ? 1 : 0.7;
      ctx.fillRect(legendX, legendY, 16, 16);
      ctx.globalAlpha = 1;

      ctx.fillStyle = isHovered ? '#00D9FF' : '#E0E7FF';
      ctx.font = isHovered ? 'bold 12px var(--font)' : '11px var(--font)';
      ctx.textAlign = 'left';
      ctx.fillText(d.label, legendX + 24, legendY + 11);

      legendY += 24;
    });
  }, [data, height, hoveredIndex]);

  return (
    <div>
      {title && <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>{title}</div>}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 15, position: 'relative', maxWidth: '450px' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: height, display: 'block', cursor: 'pointer' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />

        {/* Tooltip */}
        {tooltip && (
          <div 
            style={{
              position: 'absolute',
              left: tooltip.x + 10,
              top: tooltip.y - 40,
              background: '#00D9FF',
              color: '#000',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(0,217,255,0.4)',
              whiteSpace: 'nowrap'
            }}
          >
            <div>{tooltip.label}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{tooltip.value} ({tooltip.percentage}%)</div>
          </div>
        )}
      </div>
    </div>
  );
};
