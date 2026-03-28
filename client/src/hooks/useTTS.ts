/**
 * useTTS — Edge TTS hook with Web Speech API fallback
 * Uses server-side Edge TTS for high-quality neural voices (322 voices, 40+ languages)
 * Falls back to browser Web Speech API if server is unavailable
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface EdgeVoice {
  name: string;
  shortName: string;
  locale: string;
  gender: string;
  language: string;
  friendlyName: string;
}

export interface TTSOptions {
  rate: string;       // Edge TTS format: '-50%' to '+100%'
  pitch: string;      // Edge TTS format: '-50Hz' to '+50Hz'
  volume: string;     // Edge TTS format: '-50%' to '+100%'
  voiceId: string;    // Edge TTS shortName e.g. 'en-US-EmmaMultilingualNeural'
  engine: 'edge' | 'browser'; // which TTS engine to use
}

export interface TTSState {
  isSpeaking: boolean;
  isPaused: boolean;
  isLoading: boolean;
  voices: EdgeVoice[];
  browserVoices: SpeechSynthesisVoice[];
  currentIndex: number;
  totalItems: number;
  progress: number;
  error: string | null;
}

const STORAGE_KEY = 'emba-tts-settings';
const DEFAULT_OPTIONS: TTSOptions = {
  rate: '+0%',
  pitch: '+0Hz',
  volume: '+0%',
  voiceId: 'en-US-EmmaMultilingualNeural',
  engine: 'edge',
};

function loadSettings(): TTSOptions {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_OPTIONS, ...JSON.parse(stored) } : DEFAULT_OPTIONS;
  } catch { return DEFAULT_OPTIONS; }
}

function saveSettings(opts: TTSOptions) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(opts)); } catch { /* quota */ }
}

export function useTTS() {
  const [state, setState] = useState<TTSState>({
    isSpeaking: false,
    isPaused: false,
    isLoading: false,
    voices: [],
    browserVoices: [],
    currentIndex: 0,
    totalItems: 0,
    progress: 0,
    error: null,
  });

  const [options, setOptionsState] = useState<TTSOptions>(loadSettings);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);

  // Load Edge TTS voices from server
  useEffect(() => {
    fetch('/api/tts/voices')
      .then(r => r.json())
      .then(data => {
        if (data.voices) {
          setState(prev => ({ ...prev, voices: data.voices }));
        }
      })
      .catch(err => {
        console.warn('[TTS] Failed to load Edge voices, using browser fallback:', err);
      });
  }, []);

  // Load browser voices as fallback
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const loadBrowserVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const english = voices.filter(v => v.lang.startsWith('en'));
      setState(prev => ({ ...prev, browserVoices: english.length > 0 ? english : voices }));
    };
    loadBrowserVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadBrowserVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadBrowserVoices);
  }, []);

  const setOptions = useCallback((opts: Partial<TTSOptions>) => {
    setOptionsState(prev => {
      const next = { ...prev, ...opts };
      saveSettings(next);
      return next;
    });
  }, []);

  // Split long text into chunks at sentence boundaries (server limit is 5000 chars)
  const chunkText = useCallback((text: string, maxLen = 4500): string[] => {
    if (text.length <= maxLen) return [text];
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= maxLen) {
        chunks.push(remaining);
        break;
      }
      // Find last sentence boundary within limit
      let cut = remaining.lastIndexOf('. ', maxLen);
      if (cut < maxLen * 0.3) cut = remaining.lastIndexOf(', ', maxLen);
      if (cut < maxLen * 0.3) cut = remaining.lastIndexOf(' ', maxLen);
      if (cut < maxLen * 0.3) cut = maxLen;
      chunks.push(remaining.slice(0, cut + 1).trim());
      remaining = remaining.slice(cut + 1).trim();
    }
    return chunks;
  }, []);

  // Edge TTS synthesis via server — plays a single chunk
  const speakEdgeChunk = useCallback(async (text: string, signal?: AbortSignal): Promise<void> => {
    const response = await fetch('/api/tts/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice: options.voiceId,
        rate: options.rate,
        pitch: options.pitch,
        volume: options.volume,
      }),
      signal,
    });

    if (!response.ok) throw new Error('TTS synthesis failed');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    return new Promise<void>((resolve, reject) => {
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        reject(new Error('Audio playback failed'));
      };

      if (signal?.aborted) {
        URL.revokeObjectURL(url);
        reject(new Error('Aborted'));
        return;
      }

      signal?.addEventListener('abort', () => {
        audio.pause();
        URL.revokeObjectURL(url);
        audioRef.current = null;
        reject(new Error('Aborted'));
      });

      audio.play().catch(reject);
    });
  }, [options.voiceId, options.rate, options.pitch, options.volume]);

  // Edge TTS synthesis — auto-chunks long text
  const speakEdge = useCallback(async (text: string, signal?: AbortSignal): Promise<void> => {
    const chunks = chunkText(text);
    for (const chunk of chunks) {
      if (signal?.aborted) throw new Error('Aborted');
      await speakEdgeChunk(chunk, signal);
    }
  }, [chunkText, speakEdgeChunk]);

  // Browser TTS fallback
  const speakBrowser = useCallback((text: string, signal?: AbortSignal): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Browser TTS not supported'));
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      // Parse rate from Edge format to browser format
      const rateMatch = options.rate.match(/([+-]?\d+)%/);
      if (rateMatch) {
        utterance.rate = 1 + parseInt(rateMatch[1]) / 100;
      }

      const voice = state.browserVoices.find(v => v.voiceURI === options.voiceId) || state.browserVoices[0];
      if (voice) utterance.voice = voice;

      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        if (e.error === 'canceled') resolve();
        else reject(new Error(e.error));
      };

      signal?.addEventListener('abort', () => {
        window.speechSynthesis.cancel();
        resolve();
      });

      window.speechSynthesis.speak(utterance);
    });
  }, [options.rate, options.voiceId, state.browserVoices]);

  // Speak a single text
  const speakText = useCallback(async (text: string, onEnd?: () => void) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState(prev => ({ ...prev, isSpeaking: true, isPaused: false, isLoading: true, error: null }));

    try {
      if (options.engine === 'edge') {
        await speakEdge(text, controller.signal);
      } else {
        await speakBrowser(text, controller.signal);
      }
      setState(prev => ({ ...prev, isSpeaking: false, isLoading: false }));
      onEnd?.();
    } catch (err: any) {
      if (err.message === 'Aborted') return;
      // Try browser fallback if Edge fails
      if (options.engine === 'edge') {
        try {
          await speakBrowser(text, controller.signal);
          setState(prev => ({ ...prev, isSpeaking: false, isLoading: false }));
          onEnd?.();
          return;
        } catch { /* fallback also failed */ }
      }
      setState(prev => ({ ...prev, isSpeaking: false, isLoading: false, error: err.message }));
    }
  }, [options.engine, speakEdge, speakBrowser]);

  // Queue-based playback
  const speakQueue = useCallback(async (items: string[], onComplete?: () => void) => {
    if (items.length === 0) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    queueRef.current = items;
    indexRef.current = 0;
    onCompleteRef.current = onComplete || null;
    setState(prev => ({ ...prev, totalItems: items.length, currentIndex: 0, progress: 0, isSpeaking: true, error: null }));

    for (let i = 0; i < items.length; i++) {
      if (controller.signal.aborted) break;

      indexRef.current = i;
      setState(prev => ({
        ...prev,
        currentIndex: i,
        progress: Math.round((i / items.length) * 100),
        isLoading: true,
      }));

      try {
        if (options.engine === 'edge') {
          await speakEdge(items[i], controller.signal);
        } else {
          await speakBrowser(items[i], controller.signal);
        }
        setState(prev => ({ ...prev, isLoading: false }));
      } catch (err: any) {
        if (err.message === 'Aborted') break;
        // Try fallback
        if (options.engine === 'edge') {
          try {
            await speakBrowser(items[i], controller.signal);
          } catch { /* skip item */ }
        }
      }

      // Small pause between items
      if (!controller.signal.aborted && i < items.length - 1) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    if (!controller.signal.aborted) {
      setState(prev => ({ ...prev, isSpeaking: false, isLoading: false, progress: 100 }));
      onCompleteRef.current?.();
    }
  }, [options.engine, speakEdge, speakBrowser]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setState(prev => ({ ...prev, isPaused: false }));
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    queueRef.current = [];
    indexRef.current = 0;
    setState(prev => ({ ...prev, isSpeaking: false, isPaused: false, isLoading: false, currentIndex: 0, progress: 0 }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    ...state,
    options,
    setOptions,
    speakText,
    speakQueue,
    pause,
    resume,
    stop,
  };
}
