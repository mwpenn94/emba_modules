/**
 * Pomodoro Timer — Floating, minimizable focus timer widget.
 * 25/5 default intervals with custom settings, progress ring, audio chimes,
 * and analytics logging via MasteryContext.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Play, Pause, RotateCcw, Settings, X, Minimize2, Maximize2, Coffee, Brain } from 'lucide-react';
import { useMastery } from '@/contexts/MasteryContext';

type TimerPhase = 'focus' | 'break' | 'idle';

interface PomodoroSettings {
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
  soundEnabled: true,
};

function loadSettings(): PomodoroSettings {
  try {
    const saved = localStorage.getItem('ke-pomodoro-settings');
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(s: PomodoroSettings) {
  try { localStorage.setItem('ke-pomodoro-settings', JSON.stringify(s)); } catch {}
}

/* ── Audio chime via Web Audio API ── */
function playChime(type: 'focus-end' | 'break-end' | 'start') {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'focus-end') {
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
      // Second tone
      setTimeout(() => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.frequency.value = 1047;
        g2.gain.setValueAtTime(0.3, ctx.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        o2.start(ctx.currentTime);
        o2.stop(ctx.currentTime + 0.6);
      }, 300);
    } else if (type === 'break-end') {
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1);
    } else {
      osc.frequency.value = 523;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {}
}

/* ── Progress Ring SVG ── */
function ProgressRing({ progress, size, strokeWidth, color }: {
  progress: number; size: number; strokeWidth: number; color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000"
      />
    </svg>
  );
}

export default function PomodoroTimer() {
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<PomodoroSettings>(loadSettings);
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(settings.focusMinutes * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalFocusSeconds, setTotalFocusSeconds] = useState(0);
  const { totalStudyTime, incrementStreak } = useMastery();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusStartRef = useRef<number>(0);

  const totalSeconds = phase === 'focus'
    ? settings.focusMinutes * 60
    : phase === 'break'
      ? (completedSessions % settings.sessionsBeforeLongBreak === 0 && completedSessions > 0
          ? settings.longBreakMinutes
          : settings.breakMinutes) * 60
      : settings.focusMinutes * 60;

  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Timer tick
  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
        if (phase === 'focus') {
          setTotalFocusSeconds((prev) => prev + 1);
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, phase]);

  // Phase transition when timer hits 0
  useEffect(() => {
    if (secondsLeft === 0 && running) {
      setRunning(false);

      if (phase === 'focus') {
        // Log focus time
        // Study time is tracked automatically by MasteryContext's visibility timer
        // Just increment streak on completed focus sessions
        incrementStreak();
        setTotalFocusSeconds(0);

        const newCompleted = completedSessions + 1;
        setCompletedSessions(newCompleted);

        if (settings.soundEnabled) playChime('focus-end');

        // Start break
        const isLongBreak = newCompleted % settings.sessionsBeforeLongBreak === 0;
        const breakSecs = (isLongBreak ? settings.longBreakMinutes : settings.breakMinutes) * 60;
        setPhase('break');
        setSecondsLeft(breakSecs);
        if (settings.autoStartBreaks) {
          setTimeout(() => setRunning(true), 500);
        }
      } else if (phase === 'break') {
        if (settings.soundEnabled) playChime('break-end');
        setPhase('focus');
        setSecondsLeft(settings.focusMinutes * 60);
        if (settings.autoStartFocus) {
          setTimeout(() => setRunning(true), 500);
        }
      }
    }
  }, [secondsLeft, running, phase]);

  const startTimer = useCallback(() => {
    if (phase === 'idle') {
      setPhase('focus');
      setSecondsLeft(settings.focusMinutes * 60);
    }
    if (settings.soundEnabled && !running) playChime('start');
    setRunning(true);
    focusStartRef.current = Date.now();
  }, [phase, settings, running]);

  const pauseTimer = useCallback(() => {
    setRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setRunning(false);
    setPhase('idle');
    setSecondsLeft(settings.focusMinutes * 60);
    setCompletedSessions(0);
      // Focus time tracked by MasteryContext visibility timer
    setTotalFocusSeconds(0);
  }, [settings, totalFocusSeconds, incrementStreak]);

  const updateSettings = (updates: Partial<PomodoroSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettings(newSettings);
    if (phase === 'idle') {
      setSecondsLeft(newSettings.focusMinutes * 60);
    }
  };

  const phaseColor = phase === 'focus' ? 'var(--primary)' : phase === 'break' ? '#10B981' : 'var(--muted-foreground)';
  const phaseLabel = phase === 'focus' ? 'Focus' : phase === 'break' ? 'Break' : 'Ready';

  // Floating trigger button (always visible)
  if (!visible) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setVisible(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:border-primary/30 transition-colors"
        title="Pomodoro Timer"
      >
        <Timer className="w-5 h-5 text-primary" />
        {running && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
            style={{ background: phaseColor }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </motion.button>
    );
  }

  // Minimized view
  if (minimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border shadow-lg cursor-pointer"
        onClick={() => setMinimized(false)}
      >
        <div className="relative w-8 h-8">
          <ProgressRing progress={progress} size={32} strokeWidth={3} color={phaseColor} />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono">
            {formatTime(secondsLeft).split(':')[0]}
          </span>
        </div>
        <span className="text-xs font-mono" style={{ color: phaseColor }}>{phaseLabel}</span>
        {running && (
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: phaseColor }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
      </motion.div>
    );
  }

  // Full widget
  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        className="fixed bottom-6 right-6 z-50 w-72 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Pomodoro</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => setMinimized(true)}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              title="Minimize"
            >
              <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => { setVisible(false); if (running) pauseTimer(); }}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-border"
            >
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[11px] text-muted-foreground">
                    Focus (min)
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={settings.focusMinutes}
                      onChange={(e) => updateSettings({ focusMinutes: Math.max(1, Math.min(120, +e.target.value || 25)) })}
                      className="w-full mt-1 px-2 py-1.5 rounded bg-background border border-border text-xs"
                    />
                  </label>
                  <label className="text-[11px] text-muted-foreground">
                    Break (min)
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={settings.breakMinutes}
                      onChange={(e) => updateSettings({ breakMinutes: Math.max(1, Math.min(60, +e.target.value || 5)) })}
                      className="w-full mt-1 px-2 py-1.5 rounded bg-background border border-border text-xs"
                    />
                  </label>
                  <label className="text-[11px] text-muted-foreground">
                    Long Break (min)
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={settings.longBreakMinutes}
                      onChange={(e) => updateSettings({ longBreakMinutes: Math.max(1, Math.min(60, +e.target.value || 15)) })}
                      className="w-full mt-1 px-2 py-1.5 rounded bg-background border border-border text-xs"
                    />
                  </label>
                  <label className="text-[11px] text-muted-foreground">
                    Sessions/Long
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={settings.sessionsBeforeLongBreak}
                      onChange={(e) => updateSettings({ sessionsBeforeLongBreak: Math.max(1, Math.min(10, +e.target.value || 4)) })}
                      className="w-full mt-1 px-2 py-1.5 rounded bg-background border border-border text-xs"
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoStartBreaks}
                      onChange={(e) => updateSettings({ autoStartBreaks: e.target.checked })}
                      className="rounded"
                    />
                    Auto-start breaks
                  </label>
                  <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoStartFocus}
                      onChange={(e) => updateSettings({ autoStartFocus: e.target.checked })}
                      className="rounded"
                    />
                    Auto-start focus after break
                  </label>
                  <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                      className="rounded"
                    />
                    Sound effects
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timer display */}
        <div className="flex flex-col items-center py-6 px-4">
          {/* Phase indicator */}
          <div className="flex items-center gap-2 mb-4">
            {phase === 'focus' ? (
              <Brain className="w-4 h-4" style={{ color: phaseColor }} />
            ) : phase === 'break' ? (
              <Coffee className="w-4 h-4" style={{ color: phaseColor }} />
            ) : (
              <Timer className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-xs font-mono tracking-wider uppercase" style={{ color: phaseColor }}>
              {phaseLabel}
            </span>
          </div>

          {/* Progress ring + time */}
          <div className="relative w-36 h-36 mb-4">
            <ProgressRing progress={progress} size={144} strokeWidth={6} color={phaseColor} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-mono font-bold tracking-tight">
                {formatTime(secondsLeft)}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1">
                Session {completedSessions + (phase === 'focus' ? 1 : 0)}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={resetTimer}
              className="p-2.5 rounded-xl bg-muted hover:bg-accent transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={running ? pauseTimer : startTimer}
              className="p-4 rounded-xl text-primary-foreground transition-colors"
              style={{ background: phaseColor }}
              title={running ? 'Pause' : 'Start'}
            >
              {running ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            <button
              onClick={() => {
                // Skip to next phase
                setRunning(false);
                if (phase === 'focus') {
                  // Focus time tracked by MasteryContext visibility timer
                  setTotalFocusSeconds(0);
                  const newCompleted = completedSessions + 1;
                  setCompletedSessions(newCompleted);
                  const isLongBreak = newCompleted % settings.sessionsBeforeLongBreak === 0;
                  setPhase('break');
                  setSecondsLeft((isLongBreak ? settings.longBreakMinutes : settings.breakMinutes) * 60);
                } else {
                  setPhase('focus');
                  setSecondsLeft(settings.focusMinutes * 60);
                }
              }}
              className="p-2.5 rounded-xl bg-muted hover:bg-accent transition-colors"
              title="Skip"
            >
              <span className="text-xs font-mono text-muted-foreground">Skip</span>
            </button>
          </div>
        </div>

        {/* Session count */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {completedSessions} session{completedSessions !== 1 ? 's' : ''} completed
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {Math.round(totalFocusSeconds / 60)}m focused
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
