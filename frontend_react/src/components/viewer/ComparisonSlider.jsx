import React, { useState, useRef, useEffect } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

// Ensure base64 string has the data URL prefix
const toDataUrl = (b64) => {
  if (!b64) return null;
  if (b64.startsWith('data:')) return b64;
  return `data:image/png;base64,${b64}`;
};

const ComparisonSlider = ({ sketchB64, renderB64, width = 280, height = 280 }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const containerRef = useRef(null);

  const renderSrc = toDataUrl(renderB64);
  const sketchSrc = toDataUrl(sketchB64);

  // Animate reveal when new render arrives
  useEffect(() => {
    if (renderSrc) {
      setRevealed(false);
      const t = setTimeout(() => setRevealed(true), 80);
      return () => clearTimeout(t);
    }
  }, [renderSrc]);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e) => handleMove(e.clientX);
    const onTouchMove = (e) => handleMove(e.touches[0].clientX);
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging]);

  // Text mode — show render with fade-in animation
  if (!sketchSrc && renderSrc) {
    return (
      <div style={{
        width: '100%', borderRadius: 10, overflow: 'hidden',
        background: 'var(--bg-surface)', position: 'relative',
      }}>
        <img
          src={renderSrc}
          alt="Generated render"
          style={{
            width: '100%', height: height, objectFit: 'cover', display: 'block',
            opacity: revealed ? 1 : 0,
            transform: revealed ? 'scale(1)' : 'scale(1.04)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        />
        {/* Shimmer overlay while loading */}
        {!revealed && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, var(--bg-surface) 25%, rgba(99,198,210,0.08) 50%, var(--bg-surface) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.2s infinite',
          }} />
        )}
        <div style={{
          position: 'absolute', bottom: 8, right: 10,
          fontSize: 10, fontWeight: 700, letterSpacing: 1,
          padding: '3px 8px', borderRadius: 20,
          background: 'rgba(99,198,210,0.2)', color: 'var(--accent-teal)',
          border: '1px solid rgba(99,198,210,0.3)',
        }}>AI RENDER</div>
      </div>
    );
  }

  if (!sketchSrc && !renderSrc) {
    return (
      <div style={{
        width: '100%', height: height, background: 'var(--bg-surface)',
        borderRadius: 10, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <div style={{ fontSize: 32, opacity: 0.3 }}>🖼</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No renders yet</p>
      </div>
    );
  }

  // Sketch mode — comparison slider
  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative', width: '100%', height: height,
        overflow: 'hidden', borderRadius: 10, userSelect: 'none',
        background: '#fff', cursor: 'ew-resize',
        opacity: revealed ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
      onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
      onTouchStart={(e) => { setIsDragging(true); handleMove(e.touches[0].clientX); }}
    >
      {/* Sketch (left / background) */}
      {sketchSrc && (
        <img src={sketchSrc} alt="Sketch"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}

      {/* Render (right, clipped) */}
      {renderSrc && (
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: `${100 - sliderPos}%`, overflow: 'hidden' }}>
          <img src={renderSrc} alt="Render"
            style={{
              position: 'absolute', top: 0, right: 0, height: '100%',
              width: `${containerRef.current?.getBoundingClientRect().width || 280}px`,
              maxWidth: 'none', objectFit: 'cover',
            }} />
        </div>
      )}

      {/* Divider line */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${sliderPos}%`, width: 2, background: 'var(--accent-teal)', zIndex: 10 }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 30, height: 30, background: 'var(--accent-teal)',
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', boxShadow: '0 0 12px rgba(99,198,210,0.6)',
          color: 'var(--bg-primary)', cursor: 'ew-resize',
        }}>
          <ChevronsLeftRight size={14} />
        </div>
      </div>

      {/* Labels */}
      <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#333', background: 'rgba(255,255,255,0.85)', padding: '2px 7px', borderRadius: 20 }}>SKETCH</div>
      <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '2px 7px', borderRadius: 20 }}>RENDER</div>
    </div>
  );
};

export default ComparisonSlider;
