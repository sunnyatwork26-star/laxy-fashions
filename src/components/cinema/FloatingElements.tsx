"use client";

/**
 * FloatingElements — CSS-only floating gold bokeh/shimmer particles.
 * Used on the homepage hero for a premium visual touch.
 * Zero JS runtime cost — pure CSS animations.
 */
export default function FloatingElements() {
  return (
    <div className="floating-container" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="floating-particle"
          style={{
            // Distribute particles across the container
            left: `${10 + (i * 11) % 80}%`,
            top: `${15 + (i * 13) % 65}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${4 + (i % 3) * 2}s`,
            width: `${3 + (i % 3) * 2}px`,
            height: `${3 + (i % 3) * 2}px`,
            opacity: 0.2 + (i % 3) * 0.1,
          }}
        />
      ))}

      <style jsx>{`
        .floating-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 1;
        }
        .floating-particle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(197, 145, 46, 0.6) 0%,
            rgba(197, 145, 46, 0) 70%
          );
          animation: floatUp ease-in-out infinite alternate;
        }
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.15;
          }
          50% {
            opacity: 0.35;
          }
          100% {
            transform: translateY(-20px) scale(1.3);
            opacity: 0.1;
          }
        }
      `}</style>
    </div>
  );
}
