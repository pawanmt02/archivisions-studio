import React, { useState } from 'react';

const toDataUrl = (b64) => {
  if (!b64) return null;
  if (b64.startsWith('data:')) return b64;
  return `data:image/png;base64,${b64}`;
};

const RenderGallery = ({ renders, onSelect, selectedId }) => {
  const [hovered, setHovered] = useState(null);

  if (!renders || renders.length === 0) return null;

  return (
    <div className="panel-section">
      <div className="panel-title">History</div>
      <div className="gallery-grid">
        {renders.map((render) => {
          const mode = render.generation_mode || render.mode || 'sketch';
          const iou  = render.edge_similarity_score ?? render.iou_score;
          const imgSrc = toDataUrl(render.rendered_image_b64 || render.sketch_image_b64);
          const isSelected = selectedId === render.id;
          const isHovered  = hovered === render.id;

          return (
            <div
              key={render.id}
              className={`gallery-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(render)}
              onMouseEnter={() => setHovered(render.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                boxShadow: isHovered ? '0 6px 20px rgba(0,0,0,0.4)' : undefined,
              }}
            >
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt="Render thumbnail"
                  className="gallery-image"
                  style={{ animation: 'fadeInThumb 0.4s ease' }}
                />
              ) : (
                <div className="gallery-image" style={{
                  background: 'var(--bg-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 18, opacity: 0.3 }}>🖼</span>
                </div>
              )}

              {/* Hover overlay with "View" */}
              {isHovered && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 6,
                  background: 'rgba(0,0,0,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
                  pointerEvents: 'none',
                }}>
                  View
                </div>
              )}

              <div className="gallery-info">
                <span className={`badge ${mode === 'text' ? 'badge-text' : 'badge-sketch'}`}>
                  {mode.toUpperCase()}
                </span>
                {iou != null && (
                  <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                    {(iou * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RenderGallery;
