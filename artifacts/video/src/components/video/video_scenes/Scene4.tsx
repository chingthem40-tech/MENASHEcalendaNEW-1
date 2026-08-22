import { motion } from 'framer-motion';

export function Scene4() {
  return (
    <motion.div
      className="absolute inset-0 w-full h-screen overflow-hidden"
      initial={{ opacity: 0, scale: 1.08, clipPath: 'polygon(50% 0, 50% 0, 50% 100%, 50% 100%)' }}
      animate={{ opacity: 1, scale: 1, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
      exit={{ opacity: 0, scale: .96, clipPath: 'polygon(50% 0, 50% 0, 50% 100%, 50% 100%)' }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(217,170,87,.14),transparent_34%),linear-gradient(115deg,#071312,#0d211d_55%,#182a25)]" />
      <div className="relative z-10 h-full px-[9vw] flex items-center">
        <div className="w-[39vw]">
          <motion.div className="mono-label text-[.72vw] text-[#d9aa57] mb-[2.2vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3 }}>BUILT TO LAST / PRODUCTION READY</motion.div>
          <motion.h2 className="text-[4vw] leading-[.98] tracking-[-.06em] font-extrabold max-w-[34vw]" initial={{ opacity: 0, y: '3vh' }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .85, delay: .45, ease: [0.16, 1, .3, 1] }}>
            Sacred experience.<br /><span className="text-[#d9aa57]">Serious foundation.</span>
          </motion.h2>
          <motion.p className="mt-[2.8vh] text-[1.1vw] leading-[1.5] text-[#c9d1c9]/72 max-w-[25vw]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>
            A fast web app, mobile companion, and API architecture designed to keep community life in rhythm.
          </motion.p>
          <motion.div className="mt-[4vh] flex gap-[.7vw]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
            <span className="mono-label text-[.58vw] px-[.8vw] py-[.7vh] border border-[#d9aa57]/40 text-[#f4dca0] rounded-full">WEB EXPERIENCE</span>
            <span className="mono-label text-[.58vw] px-[.8vw] py-[.7vh] border border-[#8ea8a0]/35 text-[#c9d1c9] rounded-full">MOBILE</span>
          </motion.div>
        </div>

        <div className="absolute right-[8vw] w-[38vw] h-[62vh]">
          <motion.div className="absolute inset-0 rounded-[1.2vw] border border-[#f4dca0]/12" animate={{ rotate: [0, 2, 0], scale: [1, 1.02, 1] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div className="absolute top-[4vh] left-[3vw] w-[22vw] glass-panel rounded-[1vw] p-[1.5vw]" initial={{ opacity: 0, x: '2vw' }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .7, duration: .8 }}>
            <div className="flex items-center justify-between">
              <div className="mono-label text-[.62vw] text-[#8ea8a0]">SERVICE MAP</div>
              <span className="text-[.65vw] text-[#d9aa57]">LIVE</span>
            </div>
            <div className="mt-[2.2vh] space-y-[1.8vh]">
              {[
                ['WEB APP', 'calendar + community', '#d9aa57'],
                ['API', 'zmanim + notifications', '#8ea8a0'],
                ['MOBILE', 'daily experience', '#c49b62'],
              ].map(([name, note, color], i) => (
                <motion.div key={name} className="flex items-center" initial={{ opacity: 0, x: '-1vw' }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 + i * .18 }}>
                  <div className="w-[.7vw] h-[.7vw] rounded-full mr-[.8vw]" style={{ backgroundColor: color }} />
                  <div><div className="text-[.85vw]">{name}</div><div className="text-[.62vw] text-[#8c9b91] mt-[.25vh]">{note}</div></div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div className="absolute right-[1.5vw] bottom-[3vh] w-[17vw] h-[32vh] rounded-[1vw] overflow-hidden border border-[#f4dca0]/20 shadow-[0_1.8vw_4vw_rgba(0,0,0,.25)]" initial={{ opacity: 0, y: '4vh', rotate: 4 }} animate={{ opacity: 1, y: 0, rotate: 3 }} transition={{ delay: 1.2, duration: .9 }}>
            <img src={`${import.meta.env.BASE_URL}images/app1.jpg`} alt="Community tools" className="w-full h-full object-cover" />
          </motion.div>
          <motion.div className="absolute left-[0vw] bottom-[1vh] glass-panel rounded-[.8vw] px-[1vw] py-[1.2vh] w-[15vw]" initial={{ opacity: 0, y: '2vh' }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.55 }}>
            <div className="mono-label text-[.52vw] text-[#8c9b91]">SYNCED</div>
            <div className="text-[1.02vw] mt-[.6vh] text-[#f4dca0]">One calendar. Every layer.</div>
          </motion.div>
        </div>

        <motion.div className="absolute left-[9vw] bottom-[12vh] flex items-center gap-[1.1vw]" initial={{ opacity: 0, letterSpacing: '.4em' }} animate={{ opacity: 1, letterSpacing: '.15em' }} transition={{ delay: 1.8, duration: 1.1 }}>
          <img src={`${import.meta.env.BASE_URL}images/cal3.png`} alt="Benei Menashe Calendar" className="w-[4.3vw] h-[4.3vw] object-contain rounded-full" />
          <div>
            <div className="text-[1.7vw] font-extrabold tracking-[-.04em]">MENASHE</div>
            <div className="mono-label text-[.67vw] text-[#d9aa57] mt-[.4vh]">THE LIVING JOURNEY</div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}