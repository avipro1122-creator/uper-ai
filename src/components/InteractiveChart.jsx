import React, { useState } from 'react';

export default function InteractiveChart({ data, title }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  if (!data || data.length === 0) return null;

  // Extract revenue data to calculate dimensions
  const revenues = data.map(d => d.revenue);
  const maxRevenue = Math.max(...revenues) * 1.15; // 15% headroom
  const minRevenue = Math.min(...revenues) * 0.85; // 15% footroom
  
  const width = 500;
  const height = 180;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  // Map index to X coordinate
  const getX = (index) => {
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };
  
  // Map value to Y coordinate
  const getY = (val) => {
    return paddingTop + chartHeight - ((val - minRevenue) / (maxRevenue - minRevenue)) * chartHeight;
  };

  // Generate SVG Path for line
  const points = data.map((d, i) => `${getX(i)},${getY(d.revenue)}`).join(' ');
  
  // Generate Area Path (closing the path to the bottom of the chart)
  const areaPoints = `
    ${getX(0)},${paddingTop + chartHeight}
    ${points}
    ${getX(data.length - 1)},${paddingTop + chartHeight}
    Z
  `;

  // Format currency dynamically based on dataset scale
  const isCrores = data.some(d => d.pat !== undefined || d.jioUsers !== undefined) || Math.max(...revenues) > 15000;
  
  const formatCurrency = (val) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: isCrores ? 0 : 2
    }).format(val);
    return isCrores ? `${formatted} Cr` : formatted;
  };

  return (
    <div className="chart-widget-container">
      <div className="chart-widget-header">
        <h4 className="chart-widget-title">{title}</h4>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color" style={{ background: 'var(--accent-color)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>{isCrores ? 'Revenue (₹ Cr)' : 'Price (₹)'}</span>
          </div>
          {data[0]?.jioUsers && (
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#a78bfa' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Jio Users (M)</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="chart-canvas-container">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Y Axis Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + ratio * chartHeight;
            const val = maxRevenue - ratio * (maxRevenue - minRevenue);
            return (
              <g key={idx}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="rgba(255,255,255,0.06)" 
                  strokeDasharray="4"
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 4} 
                  fill="var(--text-secondary)" 
                  fontSize="9" 
                  textAnchor="end"
                  fontFamily="var(--font-mono)"
                >
                  {isCrores ? `${Math.round(val / 1000)}k` : Math.round(val).toLocaleString('en-IN')}
                </text>
              </g>
            );
          })}
          
          {/* X Axis Labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={getX(i)}
              y={height - 8}
              fill="var(--text-secondary)"
              fontSize="9"
              textAnchor="middle"
              fontFamily="var(--font-body)"
            >
              {d.label}
            </text>
          ))}
          
          {/* Gradient Area Fill */}
          <polygon points={areaPoints} fill="url(#chartGradient)" />
          
          {/* Line Path */}
          <polyline
            fill="none"
            stroke="var(--accent-color)"
            strokeWidth="3"
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Vertical Hover Guide Line */}
          {hoveredIndex !== null && (
            <line
              x1={getX(hoveredIndex)}
              y1={paddingTop}
              x2={getX(hoveredIndex)}
              y2={paddingTop + chartHeight}
              stroke="var(--accent-color)"
              strokeWidth="1"
              strokeDasharray="3"
              opacity="0.6"
            />
          )}
          
          {/* Interactive Nodes */}
          {data.map((d, i) => (
            <g key={i}>
              {/* Invisible interactive zone for easier hover selection */}
              <rect
                x={getX(i) - 20}
                y={paddingTop}
                width="40"
                height={chartHeight}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              
              {/* Visible Circle Node */}
              <circle
                cx={getX(i)}
                cy={getY(d.revenue)}
                r={hoveredIndex === i ? 6 : 4}
                fill={hoveredIndex === i ? 'var(--text-primary)' : 'var(--bg-deep)'}
                stroke="var(--accent-color)"
                strokeWidth="2.5"
                style={{ transition: 'all 0.15s ease' }}
              />
            </g>
          ))}
        </svg>
        
        {/* Tooltip Overlay */}
        {hoveredIndex !== null && (
          <div
            style={{
              position: 'absolute',
              left: `${(getX(hoveredIndex) / width) * 100}%`,
              top: `${(getY(data[hoveredIndex].revenue) / height) * 100 - 30}%`,
              transform: 'translate(-50%, -100%)',
              background: '#1e293b',
              border: '1px solid var(--accent-color)',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '0.78rem',
              color: '#fff',
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
              minWidth: '140px'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px' }}>
              {data[hoveredIndex].label}
            </div>
            <div>{isCrores ? 'Rev:' : 'Price:'} <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color)', fontWeight: 600 }}>{formatCurrency(data[hoveredIndex].revenue)}</span></div>
            {data[hoveredIndex].pat && (
              <div>Net Profit: <span style={{ fontFamily: 'var(--font-mono)', color: '#10b981' }}>{formatCurrency(data[hoveredIndex].pat)}</span></div>
            )}
            {data[hoveredIndex].jioUsers && (
              <div>Jio Users: <span style={{ fontFamily: 'var(--font-mono)', color: '#a78bfa' }}>{data[hoveredIndex].jioUsers} Million</span></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
