import React from 'react';

/**
 * QuestionnaireWrapper centers its children, adds a beautiful animated gradient background,
 * a soft vignette overlay, and a fade-in-up animation for the card.
 */
const QuestionnaireWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-200 via-purple-100 to-emerald-100">
      {/* Animated SVG background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full animate-pulse-slow">
          <defs>
            <radialGradient id="bg-grad" cx="50%" cy="50%" r="80%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#c4b5fd" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.2" />
            </radialGradient>
          </defs>
          <ellipse cx="720" cy="450" rx="900" ry="400" fill="url(#bg-grad)" />
        </svg>
        {/* Vignette overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/10 pointer-events-none" />
      </div>
      {/* Centered card with fade-in-up animation */}
      <div className="relative z-10 animate-fade-in-up">
        {children}
      </div>
      {/* Fade-in-up animation keyframes */}
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite alternate;
        }
        @keyframes pulse-slow {
          0% { filter: blur(0px) brightness(1); }
          100% { filter: blur(4px) brightness(1.08); }
        }
      `}</style>
    </div>
  );
};

export default QuestionnaireWrapper; 