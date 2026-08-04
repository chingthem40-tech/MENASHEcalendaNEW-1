import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500); // Branding image
    const t2 = setTimeout(() => setPhase(2), 2000); // UI screens
    const t3 = setTimeout(() => setPhase(3), 3500); // Features list
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', y: -100 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 flex">
        
        {/* Left: Branding & Core Message */}
        <div className="w-[45%] h-full relative bg-[#02040A] flex flex-col justify-center px-16 border-r border-[#D4AF37]/10 z-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <img 
              src={`${import.meta.env.BASE_URL}images/branding.png`}
              alt="Rooted in Heritage"
              className="w-48 mb-12 mix-blend-screen opacity-90"
            />
            <h2 className="font-display text-5xl text-white mb-6 leading-tight">
              Sacred Time,<br/> Modern Flow.
            </h2>
            <p className="font-body text-xl text-[#8391a8] max-w-md font-light">
              A meticulously crafted Jewish calendar designed specifically for the Menashe community.
            </p>
          </motion.div>

          <div className="mt-16 space-y-6">
            {['Zmanim & Prayer Times', 'Parasha & Daf Yomi', 'Jewish Holidays'].map((feat, i) => (
              <motion.div
                key={feat}
                className="flex items-center space-x-4"
                initial={{ opacity: 0, x: -20 }}
                animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ duration: 0.8, delay: i * 0.2, ease: 'easeOut' }}
              >
                <div className="w-2 h-2 bg-[#D4AF37] rotate-45" />
                <span className="font-body text-lg text-white font-medium tracking-wide uppercase">{feat}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: UI Parallax Showcase */}
        <div className="w-[55%] h-full relative bg-[#0A1124] overflow-hidden flex items-center justify-center perspective-[1200px]">
          {/* Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1)_0%,transparent_70%)]" />

          {/* Center Main Screen */}
          <motion.div
            className="absolute w-[400px] shadow-2xl rounded-2xl overflow-hidden border border-[#D4AF37]/20 z-10"
            initial={{ opacity: 0, y: 150, rotateX: 20, scale: 0.9 }}
            animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0, scale: 1 } : { opacity: 0, y: 150, rotateX: 20, scale: 0.9 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <img src={`${import.meta.env.BASE_URL}images/app1.jpg`} alt="App UI" className="w-full h-auto" />
          </motion.div>

          {/* Left Screen (Background) */}
          <motion.div
            className="absolute w-[350px] -left-12 opacity-60 rounded-2xl overflow-hidden border border-white/5"
            initial={{ opacity: 0, x: 100, scale: 0.8, rotateY: 30 }}
            animate={phase >= 2 ? { opacity: 0.4, x: -20, scale: 0.85, rotateY: 15 } : { opacity: 0, x: 100, scale: 0.8, rotateY: 30 }}
            transition={{ duration: 1.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <img src={`${import.meta.env.BASE_URL}images/cal1.png`} alt="Calendar UI" className="w-full h-auto mix-blend-screen" />
          </motion.div>

          {/* Right Screen (Background) */}
          <motion.div
            className="absolute w-[350px] -right-12 opacity-60 rounded-2xl overflow-hidden border border-white/5"
            initial={{ opacity: 0, x: -100, scale: 0.8, rotateY: -30 }}
            animate={phase >= 2 ? { opacity: 0.4, x: 20, scale: 0.85, rotateY: -15 } : { opacity: 0, x: -100, scale: 0.8, rotateY: -30 }}
            transition={{ duration: 1.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <img src={`${import.meta.env.BASE_URL}images/cal2.png`} alt="Calendar UI" className="w-full h-auto mix-blend-screen" />
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
