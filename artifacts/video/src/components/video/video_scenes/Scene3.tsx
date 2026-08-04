import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500); // Screen 1
    const t2 = setTimeout(() => setPhase(2), 2000); // Screen 2
    const t3 = setTimeout(() => setPhase(3), 4000); // Screen 3
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        
        {/* Dynamic Text Center Overlay */}
        <div className="absolute z-30 w-full flex justify-center mt-64 pointer-events-none">
          <div className="bg-[#02040A]/80 backdrop-blur-md px-10 py-6 rounded-2xl border border-[#D4AF37]/30 text-center shadow-[0_0_50px_rgba(212,175,55,0.1)]">
            <AnimateText phase={phase} />
          </div>
        </div>

        {/* Floating Screens */}
        <div className="relative w-full h-full perspective-[1500px]">
          
          {/* Feature 1: Siddur / Prayer Board */}
          <motion.div
            className="absolute top-[10%] left-[15%] w-[400px] shadow-2xl rounded-2xl overflow-hidden border border-white/10"
            initial={{ opacity: 0, z: -1000, x: -200, rotateY: 30 }}
            animate={phase >= 1 ? { opacity: phase >= 2 ? 0.3 : 1, z: phase >= 2 ? -500 : 0, x: 0, rotateY: 15 } : { opacity: 0, z: -1000, x: -200, rotateY: 30 }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          >
            <img src={`${import.meta.env.BASE_URL}images/app2.jpg`} alt="Siddur" className="w-full h-auto" />
            <div className="absolute inset-0 bg-[#D4AF37]/10 mix-blend-overlay" />
          </motion.div>

          {/* Feature 2: 3D Sanctuary */}
          <motion.div
            className="absolute top-[15%] right-[15%] w-[450px] shadow-2xl rounded-2xl overflow-hidden border border-[#D4AF37]/30 z-10"
            initial={{ opacity: 0, z: -800, x: 200, rotateY: -30 }}
            animate={phase >= 2 ? { opacity: phase >= 3 ? 0.3 : 1, z: phase >= 3 ? -300 : 100, x: 0, rotateY: -10 } : { opacity: 0, z: -800, x: 200, rotateY: -30 }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          >
            <img src={`${import.meta.env.BASE_URL}images/app3.jpg`} alt="3D Sanctuary" className="w-full h-auto" />
          </motion.div>

          {/* Feature 3: AI Rav Menashe */}
          <motion.div
            className="absolute top-[20%] left-[30%] w-[420px] shadow-[0_30px_60px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden border border-[#D4AF37]/50 z-20"
            initial={{ opacity: 0, z: -600, y: 300, rotateX: 45 }}
            animate={phase >= 3 ? { opacity: 1, z: 200, y: 0, rotateX: 0 } : { opacity: 0, z: -600, y: 300, rotateX: 45 }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          >
            <img src={`${import.meta.env.BASE_URL}images/app4.jpg`} alt="AI Rav" className="w-full h-auto" />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-2xl" />
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}

function AnimateText({ phase }: { phase: number }) {
  if (phase === 1) {
    return (
      <motion.h2 
        key="p1"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
        className="font-display text-4xl text-white font-medium"
      >
        Complete <span className="text-[#D4AF37]">Siddur</span> Library
      </motion.h2>
    );
  }
  if (phase === 2) {
    return (
      <motion.h2 
        key="p2"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
        className="font-display text-4xl text-white font-medium"
      >
        3D <span className="text-[#D4AF37]">Memorial</span> Sanctuary
      </motion.h2>
    );
  }
  if (phase === 3) {
    return (
      <motion.h2 
        key="p3"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
        className="font-display text-4xl text-white font-medium"
      >
        AI <span className="text-[#D4AF37]">Rav Menashe</span> Wisdom
      </motion.h2>
    );
  }
  return null;
}
