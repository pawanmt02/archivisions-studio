import React, { useState } from 'react';
import { Maximize2, ZoomIn } from 'lucide-react';
import FullscreenModal from './FullscreenModal';

const toDataUrl = (b64) => {
  if (!b64) return null;
  if (b64.startsWith('data:')) return b64;
  return `data:image/png;base64,${b64}`;
};

const RenderGallery = ({ renders, onSelect, selectedId }) => {
  const [hovered, setHovered] = useState(null);
  const [fullscreenRender, setFullscreenRender] = useState(null);

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

              {/* Hover overlay with zoom button */}
              {isHovered && (
                <div
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 6,
                    background: 'rgba(10, 13, 18, 0.6)',
                    backdropFilter: 'blur(2px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 6, zIndex: 10,
                  }}
                >
                  <button
                    title="Fullscreen Inspection"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullscreenRender(render);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 14,
                      background: 'rgba(10, 13, 18, 0.85)',
                      border: '1px solid rgba(99, 198, 210, 0.5)',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    }}
                  >
                    <Maximize2 size={11} style={{ color: 'var(--accent-teal)' }} />
                    <span>Zoom</span>
                  </button>
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

      {/* Fullscreen Modal with Historical Metadata */}
      {fullscreenRender && (
        <FullscreenModal
          isOpen={!!fullscreenRender}
          onClose={() => setFullscreenRender(null)}
          imageSrc={toDataUrl(fullscreenRender.rendered_image_b64 || fullscreenRender.sketch_image_b64)}
          title={`Historical Render #${fullscreenRender.id} — Architectural Blueprint Inspection`}
          metadata={{
            mode: fullscreenRender.generation_mode || fullscreenRender.mode,
            style: fullscreenRender.prompt_or_style || fullscreenRender.style_preset || 'Architectural',
            iou: fullscreenRender.edge_similarity_score ?? fullscreenRender.iou_score,
            seed: fullscreenRender.seed_used ?? fullscreenRender.seed,
            latency: fullscreenRender.inference_latency_seconds
              ? `${fullscreenRender.inference_latency_seconds.toFixed(2)}s`
              : fullscreenRender.created_at
              ? new Date(fullscreenRender.created_at).toLocaleTimeString()
              : null,
          }}
        />
      )}
    </div>
  );
};

export default RenderGallery;
