import { motion } from 'framer-motion';

export function Scene0() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.1 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Hero Image Background */}
      <motion.div
        className="absolute inset-0 w-full h-full opacity-60"
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.5 }}
        transition={{ duration: 8, ease: 'easeOut' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/hero-jerusalem.png`}
          alt="Jerusalem"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#02040A] via-transparent to-[#02040A] opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02040A] via-transparent to-transparent opacity-80" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-10">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 2, delay: 1, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden mb-6"
        >
          <h2 className="text-[#D4AF37] font-body tracking-[0.3em] uppercase text-sm md:text-xl font-light mb-2">
            The Lost Tribe of Menashe
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, filter: 'blur(20px)', y: 40 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 2.5, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white font-medium tracking-tight leading-tight max-w-5xl gold-gradient-text drop-shadow-2xl">
            A Living Journey <br/> of Faith and Return
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '100px' }}
          transition={{ duration: 1.5, delay: 3, ease: 'easeInOut' }}
          className="h-[1px] bg-[#d4a843] mt-12 mx-auto"
        />
      </div>
    </motion.div>
  );
}
