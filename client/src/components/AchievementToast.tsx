/**
 * DESIGN: The Atelier — Achievement Toast
 * Micro-celebration overlay when achievements unlock
 * Spring-based entrance, particle burst, auto-dismiss
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useMastery } from '@/contexts/MasteryContext';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

function Particle({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
      animate={{ opacity: 0, scale: 1, x, y }}
      transition={{ duration: 0.8, delay, ease: 'easeOut' }}
      className="absolute w-2 h-2 rounded-full"
      style={{ background: `hsl(${Math.random() * 60 + 30}, 80%, 60%)`, top: '50%', left: '50%' }}
    />
  );
}

export default function AchievementToast() {
  const { newAchievement, dismissAchievement } = useMastery();
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    if (newAchievement) {
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        delay: Math.random() * 0.3,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => dismissAchievement(), 5000);
      return () => clearTimeout(timer);
    }
  }, [newAchievement, dismissAchievement]);

  return (
    <AnimatePresence>
      {newAchievement && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-6 right-6 z-[100] max-w-sm"
        >
          <div className="relative bg-card border border-primary/30 rounded-2xl shadow-2xl shadow-primary/10 p-5 overflow-hidden">
            {/* Particle burst */}
            <div className="absolute inset-0 pointer-events-none">
              {particles.map(p => (
                <Particle key={p.id} delay={p.delay} x={p.x} y={p.y} />
              ))}
            </div>

            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl" />

            <div className="relative flex items-start gap-4">
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.1 }}
                className="text-3xl shrink-0"
              >
                {newAchievement.icon}
              </motion.div>

              <div className="flex-1 min-w-0">
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-[10px] font-mono tracking-widest uppercase text-primary mb-0.5"
                >
                  Achievement Unlocked
                </motion.p>
                <motion.h3
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-base font-bold"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {newAchievement.title}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs text-muted-foreground mt-0.5"
                >
                  {newAchievement.description}
                </motion.p>
              </div>

              <button
                onClick={dismissAchievement}
                className="p-1 rounded-lg hover:bg-accent transition-colors text-muted-foreground shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar auto-dismiss */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 5, ease: 'linear' }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
