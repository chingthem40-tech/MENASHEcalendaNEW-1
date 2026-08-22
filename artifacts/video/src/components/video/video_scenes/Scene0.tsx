import { motion } from 'framer-motion';

export function Scene0() {
  const title = 'Time, held sacred.';

  return (
    <motion.div
      className="absolute inset-0 w-full h-screen overflow-hidden"
      initial={{ opacity: 0, clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ opacity: 1, clipPath: 'circle(100% at 50% 50%)' }}
      exit={{ opacity: 0, scale: 1.12, clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="absolute top-[10vh] right-[7vw] w-[38vw] h-[38vw] rounded-full border border-[#d9aa57]/18"
        animate={{ rotate: [0, 8, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[16vh] right-[13vw] w-[26vw] h-[26vw] rounded-full border border-[#8ea8a0]/16"
        animate={{ rotate: [0, -14, 0], scale: [1.04, .98, 1.04] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 h-full flex items-center px-[9vw]">
        <div className="w-[55vw]">
          <motion.div
            className="flex items-center gap-[1vw] mb-[3.4vh]"
            initial={{ opacity: 0, x: -2vw }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: .7, delay: .35, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="h-[1px] w-[4vw] bg-[#d9aa57] line-draw" />
            <span className="mono-label text-[.78vw] text-[#f4dca0]">BENEI MENASHE / DIGITAL LUACH</span>
          </motion.div>

          <motion.h1
            className="font-bold tracking-[-.065em] leading-[.95] text-[7.8vw] max-w-[48vw] gold-gradient-text"
            initial={{ opacity: 0, y: '4vh', rotateX: -24 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1.05, delay: .55, ease: [0.16, 1, 0.3, 1] }}
          >
            {title}
          </motion.h1>

          <motion.p
            className="mt-[3.6vh] text-[1.35vw] leading-[1.45] tracking-[-.01em] text-[#c9d1c9]/78 max-w-[30vw]"
            initial={{ opacity: 0, y: '2vh' }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .8, delay: 1.15, ease: [0.16, 1, 0.3, 1] }}
          >
            The sacred Jewish calendar, reimagined for the journey of the Menashe community.
          </motion.p>
        </div>

        <motion.div
          className="absolute right-[10vw] top-[24vh] w-[26vw] h-[48vh] rounded-[1.3vw] border border-[#f4dca0]/20 glass-panel overflow-hidden"
          initial={{ opacity: 0, y: '8vh', rotate: 5, scale: .88 }}
          animate={{ opacity: 1, y: 0, rotate: -4, scale: 1 }}
          transition={{ duration: 1.2, delay: .8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(217,170,87,.24),transparent_35%)]" />
          <div className="relative p-[1.8vw] h-full">
            <div className="mono-label text-[.62vw] text-[#8ea8a0]">TODAY / JERUSALEM</div>
            <div className="mt-[3vh] text-right">
              <div className="serif-note text-[5.4vw] leading-none text-[#f4dca0]">י״ז</div>
              <div className="text-[1.3vw] mt-[1vh] text-[#f5f0e7]">Tammuz 5786</div>
              <div className="text-[.82vw] mt-[.5vh] text-[#8c9b91]">Wednesday · 2 July 2026</div>
            </div>
            <div className="absolute left-[1.8vw] right-[1.8vw] bottom-[2.4vw]">
              <div className="h-[1px] bg-[#f4dca0]/24 mb-[1.5vw]" />
              <div className="flex items-end justify-between">
                <div>
                  <div className="mono-label text-[.58vw] text-[#8c9b91]">NEXT MOMENT</div>
                  <div className="text-[1.6vw] text-[#f5f0e7] mt-[.4vh]">Mincha</div>
                </div>
                <div className="text-[2.1vw] text-[#d9aa57]">16:42</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-[13vh] left-[9vw] mono-label text-[.62vw] text-[#c9d1c9]/55"
          initial={{ opacity: 0, letterSpacing: '.5em' }}
          animate={{ opacity: 1, letterSpacing: '.18em' }}
          transition={{ duration: 1.2, delay: 1.6, ease: [0.16, 1, 0.3, 1] }}
        >
          OUR HERITAGE · OUR TIME · OUR FUTURE
        </motion.div>
      </div>
    </motion.div>
  );
}