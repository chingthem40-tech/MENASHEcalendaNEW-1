import { useVideoPlayer } from '@/lib/video';
import { AnimatePresence, motion } from 'framer-motion';

import { Scene0 } from './video_scenes/Scene0';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';

const SCENE_DURATIONS = {
  0: 6200,
  1: 6900,
  2: 6700,
  3: 6900,
  4: 6500,
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({
    durations: SCENE_DURATIONS,
  });

  return (
    <div className="video-root text-[var(--color-text-primary)]">
      {/* Persistent atmosphere: the same sky carries every beat. */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        animate={{
          opacity: currentScene === 0 ? 0.75 : currentScene === 3 ? 0.56 : 0.32,
          scale: currentScene === 0 ? 1.02 : currentScene === 4 ? 1.1 : 1.06,
        }}
        transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <video
          src={`${import.meta.env.BASE_URL}videos/stars-bg.mp4`}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      </motion.div>

      <motion.div
        className="absolute inset-0 w-full h-full mix-blend-screen pointer-events-none"
        animate={{
          opacity: currentScene === 0 ? 0.18 : currentScene === 1 ? 0.4 : currentScene === 3 ? 0.3 : 0.16,
          x: currentScene % 2 === 0 ? '-2%' : '2%',
        }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <video
          src={`${import.meta.env.BASE_URL}videos/golden-light.mp4`}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      </motion.div>

      <div className="absolute inset-0 fine-grid opacity-60 pointer-events-none" />
      <div className="absolute inset-0 scene-vignette pointer-events-none" />

      {/* Persistent anchor: the logo travels from hero to the closing lockup. */}
      <motion.div
        className="absolute z-40 top-[4.2vh] left-[4vw] flex items-center gap-[.8vw]"
        animate={{
          opacity: currentScene === 0 ? 0 : 1,
          scale: currentScene === 4 ? 1.08 : 0.86,
          x: currentScene === 4 ? '1vw' : 0,
        }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/cal3.png`}
          alt="Benei Menashe Calendar emblem"
          className="w-[3.4vw] h-[3.4vw] object-contain rounded-full"
        />
        <span className="mono-label text-[.7vw] text-[#f4dca0]/80">MENASHE / CALENDAR</span>
      </motion.div>

      <div className="absolute z-40 right-[4vw] top-[4.8vh] mono-label text-[.62vw] text-[#c9d1c9]/55">
        {String(currentScene + 1).padStart(2, '0')} / 05
      </div>

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene0 key="scene0" />}
        {currentScene === 1 && <Scene1 key="scene1" />}
        {currentScene === 2 && <Scene2 key="scene2" />}
        {currentScene === 3 && <Scene3 key="scene3" />}
        {currentScene === 4 && <Scene4 key="scene4" />}
      </AnimatePresence>

      <div className="absolute z-40 bottom-[3.2vh] left-[4vw] right-[4vw] flex items-center justify-between pointer-events-none">
        <span className="mono-label text-[.56vw] text-[#c9d1c9]/48">A LIVING CALENDAR FOR A LIVING PEOPLE</span>
        <span className="mono-label text-[.56vw] text-[#c9d1c9]/48">WEB · API · MOBILE</span>
      </div>
    </div>
  );
}
