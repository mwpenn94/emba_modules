/**
 * AudioPlayer — Floating TTS control bar with Edge TTS + Browser fallback
 * Voice selection from 322 Edge neural voices, rate/pitch controls, play/pause/stop, progress
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import {
  Play, Pause, Square, Volume2, VolumeX, Settings, X, Loader2
} from 'lucide-react';
import { useTTS, type EdgeVoice } from '@/hooks/useTTS';

interface AudioPlayerProps {
  items: { label: string; text: string }[];
  title?: string;
  onClose?: () => void;
}

// Rate presets for Edge TTS format
const RATE_PRESETS = [
  { label: '0.5x', value: '-50%' },
  { label: '0.75x', value: '-25%' },
  { label: '1x', value: '+0%' },
  { label: '1.25x', value: '+25%' },
  { label: '1.5x', value: '+50%' },
  { label: '2x', value: '+100%' },
];

export default function AudioPlayer({ items, title, onClose }: AudioPlayerProps) {
  const tts = useTTS();
  const [showSettings, setShowSettings] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [localeFilter, setLocaleFilter] = useState('en');

  // Group voices by locale
  const filteredVoices = useMemo(() => {
    if (!localeFilter) return tts.voices;
    return tts.voices.filter((v: EdgeVoice) => v.language === localeFilter || v.locale.startsWith(localeFilter));
  }, [tts.voices, localeFilter]);

  // Get unique languages for filter
  const languages = useMemo(() => {
    const langs = new Set(tts.voices.map((v: EdgeVoice) => v.language));
    return Array.from(langs).sort();
  }, [tts.voices]);

  const handlePlay = () => {
    if (tts.isPaused) {
      tts.resume();
      return;
    }
    if (tts.isSpeaking) {
      tts.pause();
      return;
    }
    const texts = items.map(i => `${i.label}. ${i.text}`);
    setIsActive(true);
    tts.speakQueue(texts, () => setIsActive(false));
  };

  const handleStop = () => {
    tts.stop();
    setIsActive(false);
  };

  const handleSpeakSingle = (index: number) => {
    const item = items[index];
    if (!item) return;
    setIsActive(true);
    tts.speakText(`${item.label}. ${item.text}`, () => setIsActive(false));
  };

  const currentItem = items[tts.currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-xl border border-border bg-card shadow-lg overflow-hidden"
    >
      {/* Main controls */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Volume2 className="w-4 h-4 text-primary shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ fontFamily: 'var(--font-display)' }}>
            {title || 'Audio Playback'}
          </p>
          {isActive && currentItem && (
            <p className="text-[10px] text-muted-foreground truncate">
              {tts.currentIndex + 1}/{items.length} — {currentItem.label}
            </p>
          )}
          {tts.error && (
            <p className="text-[10px] text-destructive truncate">{tts.error}</p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePlay}
            disabled={tts.isLoading && !tts.isSpeaking}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {tts.isLoading && !tts.isSpeaking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : tts.isSpeaking && !tts.isPaused ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          {isActive && (
            <button
              onClick={handleStop}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              onClick={() => { handleStop(); onClose(); }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {isActive && (
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${tts.progress}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      )}

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="px-4 py-3 space-y-3">
              {/* Engine toggle */}
              <div>
                <label className="text-[10px] text-muted-foreground font-medium block mb-1.5">Engine</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => tts.setOptions({ engine: 'edge' })}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      tts.options.engine === 'edge'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Edge Neural ({tts.voices.length} voices)
                  </button>
                  <button
                    onClick={() => tts.setOptions({ engine: 'browser' })}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      tts.options.engine === 'browser'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Browser ({tts.browserVoices.length} voices)
                  </button>
                </div>
              </div>

              {/* Voice selection */}
              {tts.options.engine === 'edge' ? (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-[10px] text-muted-foreground font-medium">Voice</label>
                    <select
                      value={localeFilter}
                      onChange={e => setLocaleFilter(e.target.value)}
                      className="text-[10px] px-1.5 py-0.5 bg-input border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">All Languages</option>
                      {languages.map(lang => (
                        <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={tts.options.voiceId}
                    onChange={e => tts.setOptions({ voiceId: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs bg-input border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {filteredVoices.map((v: EdgeVoice) => (
                      <option key={v.shortName} value={v.shortName}>
                        {v.friendlyName} ({v.gender}, {v.locale})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium block mb-1">Voice</label>
                  <select
                    value={tts.options.voiceId}
                    onChange={e => tts.setOptions({ voiceId: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs bg-input border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {tts.browserVoices.map(v => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Speed presets */}
              <div>
                <label className="text-[10px] text-muted-foreground font-medium block mb-1.5">Speed</label>
                <div className="flex gap-1 flex-wrap">
                  {RATE_PRESETS.map(preset => (
                    <button
                      key={preset.value}
                      onClick={() => tts.setOptions({ rate: preset.value })}
                      className={`px-2.5 py-1 text-[10px] rounded-md border transition-colors ${
                        tts.options.rate === preset.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice count info */}
              <p className="text-[10px] text-muted-foreground">
                {tts.options.engine === 'edge'
                  ? `${tts.voices.length} neural voices available via Microsoft Edge TTS`
                  : `${tts.browserVoices.length} voices available via browser Web Speech API`
                }
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item list (clickable) */}
      {items.length > 1 && !isActive && (
        <div className="border-t border-border max-h-40 overflow-y-auto">
          {items.slice(0, 20).map((item, i) => (
            <button
              key={i}
              onClick={() => handleSpeakSingle(i)}
              className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-accent/50 transition-colors"
            >
              <Play className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-xs truncate">{item.label}</span>
            </button>
          ))}
          {items.length > 20 && (
            <p className="px-4 py-2 text-[10px] text-muted-foreground">
              +{items.length - 20} more — press play to hear all
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
