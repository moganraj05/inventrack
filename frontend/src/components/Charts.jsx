import React from 'react';

/**
 * Simple Chart Component (Canvas-based)
 * No external dependencies - uses Canvas API
 */

export const BarChart = ({ title, data, height = 300 }) => {
  const canvasRef = React.useRef(null);

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
    ctx.fillStyle = 'var(--bg3)';
    ctx.fillRect(0, 0, width, realHeight);

    // Grid lines
    ctx.strokeStyle = 'var(--border)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Bars
    data.forEach((d, i) => {
      const barHeight = (d.value / maxValue) * chartHeight;
      const x = padding + i * (barWidth + barGap) + barGap / 2;
      const y = padding + chartHeight - barHeight;

      // Bar
      ctx.fillStyle = d.color || 'var(--accent)';
      ctx.fillRect(x, y, barWidth, barHeight);

      // Value label
      ctx.fillStyle = 'var(--text)';
      ctx.font = '12px var(--font)';
      ctx.textAlign = 'center';
      ctx.fillText(d.value, x + barWidth / 2, y - 5);

      // Category label
      ctx.fillStyle = 'var(--text2)';
      ctx.font = '11px var(--font)';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barWidth / 2, realHeight - 15);
    });

    // Axes
    ctx.strokeStyle = 'var(--text3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, realHeight - padding);
    ctx.lineTo(width - padding, realHeight - padding);
    ctx.stroke();
  }, [data, height]);

  return (
    <div style={{ marginBottom: 20 }}>
      {title && <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>{title}</div>}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 15, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: height, display: 'block' }}
        />
      </div>
    </div>
  );
};

export const PieChart = ({ title, data, height = 250 }) => {
  const canvasRef = React.useRef(null);

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
    ctx.fillStyle = 'var(--bg3)';
    ctx.fillRect(0, 0, width, realHeight);

    let currentAngle = -Math.PI / 2;

    data.forEach(d => {
      const sliceAngle = (d.value / total) * Math.PI * 2;

      // Draw slice
      ctx.fillStyle = d.color || 'var(--accent)';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px var(--font)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const percentage = ((d.value / total) * 100).toFixed(0);
      ctx.fillText(`${percentage}%`, labelX, labelY);

      currentAngle += sliceAngle;
    });

    // Legend
    const legendX = width - 150;
    let legendY = 20;
    data.forEach(d => {
      ctx.fillStyle = d.color || 'var(--accent)';
      ctx.fillRect(legendX, legendY, 12, 12);

      ctx.fillStyle = 'var(--text)';
      ctx.font = '11px var(--font)';
      ctx.textAlign = 'left';
      ctx.fillText(d.label, legendX + 20, legendY + 9);

      legendY += 20;
    });
  }, [data, height]);

  return (
    <div style={{ marginBottom: 20 }}>
      {title && <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>{title}</div>}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 15 }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: height, display: 'block' }}
        />
      </div>
    </div>
  );
};

export const LineChart = ({ title, data, height = 300 }) => {
  const canvasRef = React.useRef(null);

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
    const stepX = chartWidth / (data.length - 1 || 1);

    // Background
    ctx.fillStyle = 'var(--bg3)';
    ctx.fillRect(0, 0, width, realHeight);

    // Grid lines
    ctx.strokeStyle = 'var(--border)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Line
    ctx.strokeStyle = 'var(--accent)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((d, i) => {
      const x = padding + i * stepX;
      const y = padding + chartHeight - (d.value / maxValue) * chartHeight;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Points
    ctx.fillStyle = 'var(--accent)';
    data.forEach((d, i) => {
      const x = padding + i * stepX;
      const y = padding + chartHeight - (d.value / maxValue) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Value label
      ctx.fillStyle = 'var(--text)';
      ctx.font = '11px var(--font)';
      ctx.textAlign = 'center';
      ctx.fillText(d.value, x, y - 12);
    });

    // Axes
    ctx.strokeStyle = 'var(--text3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, realHeight - padding);
    ctx.lineTo(width - padding, realHeight - padding);
    ctx.stroke();

    // Labels
    ctx.fillStyle = 'var(--text2)';
    ctx.font = '11px var(--font)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    data.forEach((d, i) => {
      const x = padding + i * stepX;
      ctx.fillText(d.label || i, x, realHeight - padding + 8);
    });
  }, [data, height]);

  return (
    <div style={{ marginBottom: 20 }}>
      {title && <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>{title}</div>}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 15, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: height, display: 'block' }}
        />
      </div>
    </div>
  );
};
