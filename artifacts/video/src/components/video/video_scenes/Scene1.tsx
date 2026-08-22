import { motion } from 'framer-motion';

export function Scene1() {
  return (
    <motion.div
      className="absolute inset-0 w-full h-screen overflow-hidden"
      initial={{ opacity: 0, clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)' }}
      animate={{ opacity: 1, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
      exit={{ opacity: 0, clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
      transition={{ duration: .95, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative z-10 h-full flex items-center px-[9vw]">
        <div className="w-[37vw]">
          <motion.div
            className="mono-label text-[.72vw] text-[#d9aa57] mb-[2.2vh]"
            initial={{ opacity: 0, y: '2vh' }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .6, delay: .25 }}
          >
            ONE VIEW / EVERY MOMENT
          </motion.div>
          <motion.h2
            className="text-[4.3vw] leading-[.98] tracking-[-.055em] font-extrabold text-[#f5f0e7] max-w-[34vw]"
            initial={{ opacity: 0, y: '3vh' }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .85, delay: .45, ease: [0.16, 1, 0.3, 1] }}
          >
            A day that reads <span className="text-[#d9aa57]">like prayer.</span>
          </motion.h2>
          <motion.p
            className="mt-[2.8vh] text-[1.15vw] leading-[1.5] text-[#c9d1c9]/72 max-w-[25vw]"
            initial={{ opacity: 0, y: '2vh' }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .7, delay: .9 }}
          >
            Hebrew date, parashah, zmanim, and the next intention — together, at a glance.
          </motion.p>
        </div>

        <motion.div
          className="absolute right-[8vw] top-[14vh] w-[43vw] h-[70vh]"
          initial={{ opacity: 0, x: '5vw', scale: .92 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 1.1, delay: .35, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="absolute left-[5vw] top-[3vh] w-[20vw] h-[55vh] rounded-[1.2vw] overflow-hidden border border-[#f4dca0]/20 shadow-[0_2vw_5vw_rgba(0,0,0,.3)]"
            animate={{ y: ['0vh', '-1.3vh', '0vh'], rotate: [4, 2, 4] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img src={`${import.meta.env.BASE_URL}images/cal1.png`} alt="Benei Menashe Calendar emblem" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071312]/70 via-transparent to-transparent" />
          </motion.div>
          <motion.div
            className="absolute right-[1vw] top-[11vh] w-[19vw] h-[51vh] rounded-[1.2vw] overflow-hidden border border-[#8ea8a0]/25 shadow-[0_2vw_5vw_rgba(0,0,0,.34)]"
            animate={{ y: ['0vh', '1.7vh', '0vh'], rotate: [-5, -3, -5] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img src={`${import.meta.env.BASE_URL}images/cal2.png`} alt="Calendar identity" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-[#071312]/40 mix-blend-multiply" />
          </motion.div>
          <motion.div
            className="absolute bottom-[2vh] left-[11vw] glass-panel w-[27vw] rounded-[1vw] p-[1.5vw]"
            initial={{ opacity: 0, y: '4vh' }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .8, delay: 1.1 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="mono-label text-[.58vw] text-[#8c9b91]">THU / 03 TAMMUZ</div>
                <div className="text-[1.55vw] mt-[.8vh] text-[#f5f0e7]">A quiet morning</div>
              </div>
              <div className="w-[2vw] h-[2vw] rounded-full border border-[#d9aa57]/50 flex items-center justify-center text-[#d9aa57] text-[.9vw]">א</div>
            </div>
            <div className="mt-[1.7vh] h-[1px] bg-[#f4dca0]/20" />
            <div className="flex justify-between mt-[1.5vh] text-[.8vw]">
              <span className="text-[#8c9b91]">Sunrise</span><span className="text-[#f4dca0]">05:34</span>
              <span className="text-[#8c9b91] ml-[1vw]">Sunset</span><span className="text-[#f4dca0]">19:47</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.svg
          className="absolute left-[47vw] bottom-[17vh] w-[7vw] h-[7vw] text-[#d9aa57]/60"
          viewBox="0 0 100 100"
          initial={{ opacity: 0, rotate: -30 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ duration: 1.2, delay: 1.25 }}
        >
          <motion.circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="1" pathLength="1" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, delay: 1.4 }} />
          <motion.path d="M50 18v64M18 50h64" fill="none" stroke="currentColor" strokeWidth="1" pathLength="1" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: .8, delay: 1.8 }} />
        </motion.svg>
      </div>
    </motion.div>
  );
}