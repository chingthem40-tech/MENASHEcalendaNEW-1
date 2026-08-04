import { useVideoPlayer } from '@/lib/video';
import { AnimatePresence, motion } from 'framer-motion';

import { Scene0 } from './video_scenes/Scene0';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';

const SCENE_DURATIONS = {
  0: 8000,
  1: 8000,
  2: 8000,
  3: 8000,
  4: 8000,
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({
    durations: SCENE_DURATIONS,
  });

  return (
    <div className="w-full h-screen overflow-hidden relative bg-[#02040A] text-white">
      
      {/* Persistent Background Video 1: Stars */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        animate={{
          opacity: currentScene <= 1 ? 0.6 : currentScene === 4 ? 0.8 : 0.2,
          scale: currentScene === 0 ? 1 : 1.1,
        }}
        transition={{ duration: 4, ease: 'easeInOut' }}
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

      {/* Persistent Background Video 2: Golden Light */}
      <motion.div
        className="absolute inset-0 w-full h-full mix-blend-screen"
        animate={{
          opacity: currentScene === 1 ? 0.5 : currentScene === 2 || currentScene === 3 ? 0.2 : currentScene === 4 ? 0.6 : 0,
        }}
        transition={{ duration: 3 }}
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

      {/* Global Grain Overlay */}
      <div 
        className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none mix-blend-overlay z-50"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene0 key="scene0" />}
        {currentScene === 1 && <Scene1 key="scene1" />}
        {currentScene === 2 && <Scene2 key="scene2" />}
        {currentScene === 3 && <Scene3 key="scene3" />}
        {currentScene === 4 && <Scene4 key="scene4" />}
      </AnimatePresence>
    </div>
  );
}
