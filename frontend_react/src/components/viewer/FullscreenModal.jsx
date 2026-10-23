import React, { useEffect } from 'react';
import { X, Maximize2, Sparkles, Layers, Cpu, Clock, Hash } from 'lucide-react';

/**
 * Modal Overlay Fullscreen Render Viewer (MOFRV)
 *
 * Provides an unobstructed, distraction-free 100vw/100vh display environment
 * for inspecting high-resolution architectural generative outputs, fine material
 * textures, and structural edge-alignment overlays.
 */
const FullscreenModal = ({
  isOpen,
  onClose,
  imageSrc,
  title = 'High-Resolution Architectural Render',
  metadata = null,
}) => {
  // Global Escape key dismissal listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background body scrolling when modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !imageSrc) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fullscreen-modal-backdrop"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(10, 13, 18, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.25s ease-out',
        userSelect: 'none',
      }}
    >
      {/* Top Header / Actions Bar */}
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          zIndex: 1001,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: 'rgba(99, 198, 210, 0.15)',
              border: '1px solid rgba(99, 198, 210, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-teal, #63c6d2)',
            }}
          >
            <Maximize2 size={16} />
          </div>
          <div>
            <div
              style={{
                color: '#fff',
                fontSize: '15px',
                fontWeight: 600,
                letterSpacing: '0.3px',
              }}
            >
              {title}
            </div>
            <div
              style={{
                color: 'var(--text-secondary, #8892a4)',
                fontSize: '11px',
              }}
            >
              Press <kbd style={{ padding: '2px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '10px' }}>Esc</kbd> or click outside to dismiss
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title="Close (Esc)"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(224, 90, 90, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(224, 90, 90, 0.4)';
            e.currentTarget.style.color = '#ff8080';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.color = '#fff';
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Main High-Resolution Image Container */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '90vw',
          maxHeight: metadata ? '76vh' : '86vh',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          background: '#070a0e',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8), 0 0 1px rgba(255, 255, 255, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageSrc}
          alt={title}
          style={{
            maxWidth: '90vw',
            maxHeight: metadata ? '76vh' : '86vh',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>

      {/* Generation Metadata Inspection Bar (When opened with metadata) */}
      {metadata && (
        <div
          style={{
            marginTop: '16px',
            width: '100%',
            maxWidth: '1200px',
            padding: '12px 18px',
            borderRadius: '10px',
            background: 'rgba(22, 27, 39, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            zIndex: 1001,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Generation Mode Badge */}
            {metadata.mode && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.8px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background:
                    metadata.mode === 'text'
                      ? 'rgba(240, 168, 88, 0.18)'
                      : 'rgba(99, 198, 210, 0.18)',
                  color:
                    metadata.mode === 'text'
                      ? 'var(--accent-amber, #f0a858)'
                      : 'var(--accent-teal, #63c6d2)',
                  border: `1px solid ${
                    metadata.mode === 'text'
                      ? 'rgba(240, 168, 88, 0.35)'
                      : 'rgba(99, 198, 210, 0.35)'
                  }`,
                }}
              >
                {metadata.mode.toUpperCase()}
              </span>
            )}

            {/* Preset Style Badge */}
            {metadata.style && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#e8eaf0' }}>
                <Sparkles size={14} style={{ color: 'var(--accent-teal, #63c6d2)' }} />
                <span style={{ color: 'var(--text-secondary, #8892a4)' }}>Style:</span>
                <span style={{ fontWeight: 600 }}>{metadata.style}</span>
              </div>
            )}

            {/* Structural Fidelity Score (IoU % value) */}
            {metadata.iou != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#e8eaf0' }}>
                <Layers size={14} style={{ color: 'var(--accent-teal, #63c6d2)' }} />
                <span style={{ color: 'var(--text-secondary, #8892a4)' }}>Edge IoU Fidelity:</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: metadata.iou >= 0.5 ? 'var(--accent-teal, #63c6d2)' : 'var(--accent-amber, #f0a858)',
                  }}
                >
                  {(metadata.iou * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Seed ID */}
            {metadata.seed != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#e8eaf0' }}>
                <Hash size={14} style={{ color: 'var(--text-secondary, #8892a4)' }} />
                <span style={{ color: 'var(--text-secondary, #8892a4)' }}>Seed:</span>
                <span style={{ fontFamily: 'monospace', color: '#fff' }}>{metadata.seed}</span>
              </div>
            )}

            {/* Inference Latency */}
            {metadata.latency != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#e8eaf0' }}>
                <Clock size={14} style={{ color: 'var(--text-secondary, #8892a4)' }} />
                <span style={{ color: 'var(--text-secondary, #8892a4)' }}>Latency:</span>
                <span style={{ fontWeight: 500 }}>{typeof metadata.latency === 'number' ? `${metadata.latency.toFixed(2)}s` : metadata.latency}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FullscreenModal;
