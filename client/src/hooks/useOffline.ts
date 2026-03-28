/**
 * useOffline — Service Worker registration, offline detection, and content caching.
 */

import { useState, useEffect, useCallback } from 'react';

interface OfflineState {
  isOffline: boolean;
  isServiceWorkerReady: boolean;
  updateAvailable: boolean;
  cacheContentData: (data: unknown) => void;
  cacheMasteryData: (data: unknown) => void;
  applyUpdate: () => void;
}

export function useOffline(): OfflineState {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        setIsServiceWorkerReady(true);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              setWaitingWorker(newWorker);
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });

    // Handle controller change (new SW activated)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const cacheContentData = useCallback((data: unknown) => {
    if (!navigator.serviceWorker?.controller) return;
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_CONTENT_DATA',
      payload: data,
    });
  }, []);

  const cacheMasteryData = useCallback((data: unknown) => {
    if (!navigator.serviceWorker?.controller) return;
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_MASTERY_DATA',
      payload: data,
    });
  }, []);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [waitingWorker]);

  return {
    isOffline,
    isServiceWorkerReady,
    updateAvailable,
    cacheContentData,
    cacheMasteryData,
    applyUpdate,
  };
}
