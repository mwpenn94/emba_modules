/**
 * OfflineBanner — Shows offline status and update availability.
 * Appears at the top of the app when offline or when an update is available.
 */

import { useOffline } from '@/hooks/useOffline';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, Download } from 'lucide-react';

export default function OfflineBanner() {
  const { isOffline, updateAvailable, applyUpdate, isServiceWorkerReady } = useOffline();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-amber-500/90 text-amber-950 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium backdrop-blur-sm"
        >
          <WifiOff className="w-4 h-4" />
          <span>You're offline — cached content is still available</span>
        </motion.div>
      )}

      {updateAvailable && !isOffline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-primary/90 text-primary-foreground px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium backdrop-blur-sm"
        >
          <Download className="w-4 h-4" />
          <span>A new version is available</span>
          <button
            onClick={applyUpdate}
            className="flex items-center gap-1 px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors text-xs font-semibold"
          >
            <RefreshCw className="w-3 h-3" /> Update Now
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
