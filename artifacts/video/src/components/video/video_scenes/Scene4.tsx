import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800); // Title
    const t2 = setTimeout(() => setPhase(2), 2500); // Badges
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Split text for staggering
  const titleLetters = "BNEI MENASHE".split("");

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#02040A]/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        
        {/* Glow behind text */}
        <motion.div 
          className="absolute w-[600px] h-[600px] bg-[#D4AF37] rounded-full blur-[150px] opacity-10"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Hero Title */}
        <div className="relative z-10 flex overflow-hidden mb-6">
          {titleLetters.map((letter, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 100, rotateX: -90 }}
              animate={phase >= 1 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 100, rotateX: -90 }}
              transition={{ 
                duration: 1.2, 
                delay: i * 0.08, 
                ease: [0.16, 1, 0.3, 1] 
              }}
              className="font-display text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFF2C8] via-[#D4AF37] to-[#8C6D14] drop-shadow-[0_10px_20px_rgba(212,175,55,0.3)] mx-1"
              style={{ transformOrigin: 'bottom center' }}
            >
              {letter === " " ? "\u00A0" : letter}
            </motion.span>
          ))}
        </div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          animate={phase >= 1 ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          transition={{ duration: 1.5, delay: 1.5, ease: 'easeOut' }}
          className="z-10"
        >
          <p className="font-body text-xl tracking-[0.4em] uppercase text-[#d4a843] font-light">
            Rooted in Heritage
          </p>
        </motion.div>

        {/* Platforms */}
        <motion.div
          className="flex space-x-8 mt-16 z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-full px-6 py-3 backdrop-blur-md">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            <span className="font-body text-white tracking-wider">WEB EXPERIENCE</span>
          </div>
          <div className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-full px-6 py-3 backdrop-blur-md">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M16 1H8C6.34 1 5 2.34 5 4v16c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3zm-2 20h-4v-1h4v1zm3.25-3H6.75V4h10.5v14z"/></svg>
            <span className="font-body text-white tracking-wider">MOBILE APP</span>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
