import { motion } from 'framer-motion';

export function Scene3() {
  return (
    <motion.div
      className="absolute inset-0 w-full h-screen overflow-hidden"
      initial={{ opacity: 0, clipPath: 'inset(50% 0 50% 0)' }}
      animate={{ opacity: 1, clipPath: 'inset(0% 0 0% 0)' }}
      exit={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div className="absolute left-0 top-0 w-[60vw] h-full overflow-hidden" initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}>
        <img src={`${import.meta.env.BASE_URL}images/yishai.png`} alt="Yishai Memorial landscape" className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#071312]/35 to-[#071312]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071312] via-transparent to-[#071312]/10" />
      </motion.div>
      <div className="absolute left-0 top-0 w-[60vw] h-full bg-[#071312]/15" />

      <div className="relative z-10 h-full px-[9vw] flex items-center">
        <div className="w-[34vw]">
          <motion.div className="mono-label text-[.72vw] text-[#d9aa57] mb-[2.2vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3 }}>REMEMBRANCE / NEVER OUT OF REACH</motion.div>
          <motion.h2 className="text-[4.35vw] leading-[.96] tracking-[-.06em] font-extrabold" initial={{ opacity: 0, y: '3vh' }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .85, delay: .46, ease: [0.16, 1, .3, 1] }}>
            A sanctuary for the <span className="text-[#d9aa57]">names</span> we carry.
          </motion.h2>
          <motion.p className="mt-[2.8vh] text-[1.12vw] leading-[1.5] text-[#c9d1c9]/76 max-w-[25vw]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.05 }}>
            The 3D Memorial Sanctuary turns remembrance into a place — quiet, shared, and always present.
          </motion.p>
          <motion.div className="mt-[4vh] flex gap-[.7vw]" initial={{ opacity: 0, y: '2vh' }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.35 }}>
            {['MEMORIALS', 'FAMILY', 'COMMUNITY'].map((label) => <span key={label} className="mono-label text-[.57vw] px-[.75vw] py-[.65vh] rounded-full border border-[#f4dca0]/18 text-[#f4dca0]/78">{label}</span>)}
          </motion.div>
        </div>

        <motion.div
          className="absolute right-[8vw] top-[17vh] w-[31vw] h-[57vh] glass-panel rounded-[1.1vw] overflow-hidden p-[.55vw] shadow-[0_2vw_5vw_rgba(0,0,0,.36)]"
          initial={{ opacity: 0, x: '6vw', rotateY: -18, scale: .9 }}
          animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
          transition={{ duration: 1.15, delay: .6, ease: [0.16, 1, 0.3, 1] }}
          style={{ perspective: 1000 }}
        >
          <div className="relative h-full rounded-[.8vw] overflow-hidden">
            <img src={`${import.meta.env.BASE_URL}images/hero-jerusalem.png`} alt="Memorial sanctuary concept" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071312]/95 via-transparent to-[#071312]/10" />
            <div className="absolute left-[1.2vw] top-[1.2vw] right-[1.2vw] flex justify-between">
              <span className="mono-label text-[.55vw] text-[#f4dca0]">SANCTUARY / 03D</span>
              <span className="w-[.5vw] h-[.5vw] rounded-full bg-[#d9aa57] shadow-[0_0_1vw_rgba(217,170,87,.5)]" />
            </div>
            <div className="absolute left-[1.3vw] bottom-[1.4vw]">
              <div className="text-[1.35vw] text-[#f5f0e7]">Yishai Memorial</div>
              <div className="text-[.68vw] text-[#c9d1c9]/68 mt-[.45vh]">Or ilui neshama · a place to remember</div>
            </div>
          </div>
        </motion.div>

        <motion.div className="absolute right-[37vw] bottom-[13vh] glass-panel rounded-[.8vw] p-[1vw] w-[12vw]" initial={{ opacity: 0, y: '3vh' }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }}>
          <img src={`${import.meta.env.BASE_URL}images/app3.jpg`} alt="Library and prayer books" className="w-full h-[15vh] object-cover rounded-[.5vw] opacity-80" />
          <div className="mono-label text-[.5vw] text-[#8ea8a0] mt-[.8vh]">LIBRARY / SIDDUR</div>
        </motion.div>
      </div>
    </motion.div>
  );
}