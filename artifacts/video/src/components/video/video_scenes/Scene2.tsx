import { motion } from 'framer-motion';

export function Scene2() {
  const rows = [
    ['Shacharit', '06:18', 'Begin the day'],
    ['Mincha', '16:42', 'Pause + return'],
    ['Maariv', '20:19', 'Close the day'],
  ];

  return (
    <motion.div
      className="absolute inset-0 w-full h-screen overflow-hidden"
      initial={{ opacity: 0, scale: .96, clipPath: 'circle(0% at 80% 50%)' }}
      animate={{ opacity: 1, scale: 1, clipPath: 'circle(100% at 80% 50%)' }}
      exit={{ opacity: 0, scale: 1.06, clipPath: 'circle(0% at 20% 50%)' }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative z-10 h-full flex items-center px-[9vw]">
        <div className="w-[42vw]">
          <motion.div className="mono-label text-[.72vw] text-[#d9aa57] mb-[2.2vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .25 }}>PRAYER / IN ITS PROPER TIME</motion.div>
          <motion.h2
            className="text-[4.25vw] leading-[.98] tracking-[-.06em] font-extrabold max-w-[36vw]"
            initial={{ opacity: 0, y: '3vh' }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .8, delay: .4, ease: [0.16, 1, 0.3, 1] }}
          >
            Know when to <span className="text-[#d9aa57]">begin.</span>
          </motion.h2>
          <motion.p className="mt-[2.6vh] text-[1.15vw] leading-[1.5] text-[#c9d1c9]/72 max-w-[26vw]" initial={{ opacity: 0, y: '2vh' }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .9 }}>
            Location-aware prayer times that move with the sun — not a generic clock.
          </motion.p>

          <motion.div className="mt-[4vh] flex items-center gap-[.8vw]" initial={{ opacity: 0, x: '-2vw' }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.15 }}>
            <span className="w-[.55vw] h-[.55vw] rounded-full bg-[#d9aa57]" />
            <span className="mono-label text-[.62vw] text-[#c9d1c9]/58">JERUSALEM · LIVE ZMANIM</span>
          </motion.div>
        </div>

        <motion.div
          className="absolute right-[10vw] w-[37vw] glass-panel rounded-[1.3vw] p-[2.2vw]"
          initial={{ opacity: 0, y: '5vh', rotate: 2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 1.05, delay: .35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="mono-label text-[.62vw] text-[#8c9b91]">PRAYER BOARD</div>
              <div className="text-[2.05vw] mt-[1vh] tracking-[-.04em]">Today's rhythm</div>
            </div>
            <div className="text-right">
              <div className="serif-note text-[2vw] text-[#f4dca0]">י״ז תמוז</div>
              <div className="text-[.7vw] text-[#8c9b91] mt-[.35vh]">fast begins 04:16</div>
            </div>
          </div>
          <div className="h-[1px] bg-[#f4dca0]/18 mt-[2.4vh] mb-[1vh]" />
          <div>
            {rows.map(([name, time, note], index) => (
              <motion.div
                key={name}
                className="flex items-center py-[1.8vh] border-b border-[#f4dca0]/10 last:border-0"
                initial={{ opacity: 0, x: '2vw' }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: .55, delay: .75 + index * .16 }}
              >
                <div className="w-[2.4vw] h-[2.4vw] rounded-full border border-[#d9aa57]/35 flex items-center justify-center text-[#d9aa57] text-[.85vw]">
                  {index + 1}
                </div>
                <div className="ml-[1vw] flex-1">
                  <div className="text-[1.12vw]">{name}</div>
                  <div className="text-[.7vw] text-[#8c9b91] mt-[.4vh]">{note}</div>
                </div>
                <div className="text-[1.55vw] text-[#f4dca0]">{time}</div>
              </motion.div>
            ))}
          </div>
          <motion.div className="mt-[2vh] flex justify-between items-center text-[.68vw] text-[#8c9b91]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
            <span>Next up · Mincha in 02:14:08</span>
            <span className="w-[6vw] h-[.3vw] bg-[#d9aa57]/20 rounded-full overflow-hidden"><motion.span className="block h-full bg-[#d9aa57]" initial={{ width: 0 }} animate={{ width: '64%' }} transition={{ duration: 1.6, delay: 1.7 }} /></span>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}