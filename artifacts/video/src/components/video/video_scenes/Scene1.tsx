import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1000); // text enters
    const t2 = setTimeout(() => setPhase(2), 2500); // portrait enters
    const t3 = setTimeout(() => setPhase(3), 6000); // start exit
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -100, filter: 'blur(10px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 w-full h-full flex items-center justify-between px-20">
        
        {/* Left Side: Quote */}
        <div className="w-1/2 relative z-10 flex flex-col justify-center max-w-2xl pl-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[#D4AF37] font-display text-8xl leading-none absolute -top-10 -left-6 opacity-30">
              "
            </span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white font-normal leading-snug">
              I will bring the remnant of my people from the East...
            </h2>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
            className="mt-8"
          >
            <p className="font-body text-[#d4a843] text-xl md:text-2xl tracking-widest uppercase font-light">
              Isaiah 43:5
            </p>
          </motion.div>
        </div>

        {/* Right Side: Portrait */}
        <div className="w-1/2 h-full relative flex items-center justify-center">
          <motion.div
            className="relative w-[500px] h-[700px]"
            initial={{ opacity: 0, scale: 0.8, x: 100, rotateY: 15 }}
            animate={phase >= 2 ? { opacity: 1, scale: 1, x: 0, rotateY: 0 } : { opacity: 0, scale: 0.8, x: 100, rotateY: 15 }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
            style={{ perspective: 1000 }}
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-[#D4AF37] blur-[100px] opacity-20 rounded-full" />
            
            {/* Image Mask */}
            <div className="absolute inset-0 overflow-hidden rounded-[200px] rounded-bl-none border border-[#d4a843]/30 bg-[#0A1124]">
              <motion.img
                src={`${import.meta.env.BASE_URL}images/yishai.png`}
                alt="Portrait"
                className="w-full h-full object-cover mix-blend-luminosity opacity-80"
                animate={{ scale: [1, 1.05] }}
                transition={{ duration: 10, ease: 'linear' }}
              />
            </div>
            
            {/* Corner Accent */}
            <motion.div 
              className="absolute -bottom-4 -left-4 w-24 h-24 border-b-2 border-l-2 border-[#D4AF37]"
              initial={{ opacity: 0, scale: 0 }}
              animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
