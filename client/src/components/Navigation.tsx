/**
 * DESIGN: The Atelier — Craft-Forward Learning Studio
 * Navigation: Persistent left sidebar with discipline nav + session stats
 * Typography: Fraunces for titles, Outfit for body
 * Colors: Warm charcoal base, cream accents, amber gold primary
 * Updated: All 6 mastery modules + reference tools
 */

import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  BookOpen, FlaskConical, Brain, Network, Briefcase,
  Search, Home, ChevronLeft, ChevronRight, Flame, Clock,
  GraduationCap, Menu, X, Calculator, GitBranch, Map, Shield,
  Trophy, PlayCircle, Download, Sparkles, Headphones, BarChart3, Users,
  Bookmark, ListMusic, Sun, Moon
} from 'lucide-react';
import { useMastery } from '@/contexts/MasteryContext';
import { useTheme } from '@/contexts/ThemeContext';
import NotificationCenter from './NotificationCenter';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: Home },
      { path: '/search', label: 'Search', icon: Search },
    ]
  },
  {
    label: 'Mastery Modules',
    items: [
      { path: '/exam-simulator', label: 'Exam Simulator', icon: GraduationCap },
      { path: '/formula-lab', label: 'Formula Lab', icon: Calculator },
      { path: '/case-simulator', label: 'Case Simulator', icon: GitBranch },
      { path: '/connection-map', label: 'Connection Map', icon: Map },
      { path: '/fs-toolkit', label: 'FS Toolkit', icon: Shield },
    ]
  },
  {
    label: 'Quick Study',
    items: [
      { path: '/study', label: 'Study Session', icon: PlayCircle },
      { path: '/formulas', label: 'Formula Ref', icon: FlaskConical },
      { path: '/quiz', label: 'Quick Quiz', icon: Brain },
      { path: '/connections', label: 'Concept Links', icon: Network },
      { path: '/cases', label: 'Case Library', icon: Briefcase },
      { path: '/ai-quiz', label: 'AI Quiz', icon: Sparkles },
      { path: '/hands-free', label: 'Hands-Free', icon: Headphones },
      { path: '/achievements', label: 'Achievements', icon: Trophy },
      { path: '/progress', label: 'Progress Export', icon: Download },
      { path: '/analytics', label: 'Analytics', icon: BarChart3 },
      { path: '/groups', label: 'Study Groups', icon: Users },
      { path: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
      { path: '/playlists', label: 'Playlists', icon: ListMusic },
    ]
  }
];

export default function Navigation({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session, totalStudyTime, getStudiedCount, getMasteredCount } = useMastery();
  const { theme, toggleTheme, switchable } = useTheme();

  const studied = getStudiedCount();
  const mastered = getMasteredCount();
  const hours = Math.floor(totalStudyTime / 60);
  const mins = totalStudyTime % 60;

  const allItems = NAV_SECTIONS.flatMap(s => s.items);

  const sidebar = (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="hidden lg:flex flex-col h-screen sticky top-0 border-r border-border bg-sidebar"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--primary)' }}>
          <GraduationCap className="w-5 h-5" style={{ color: 'var(--primary-foreground)' }} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="overflow-hidden"
            >
              <h1 className="text-sm font-semibold tracking-tight whitespace-nowrap" style={{ fontFamily: 'var(--font-display)' }}>
                EMBA Knowledge
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Explorer</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Sections */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto space-y-3">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground px-3 py-1.5"
                >
                  {section.label}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const isActive = location === item.path;
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <motion.div
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative ${
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                          style={{ background: 'var(--primary)' }}
                        />
                      )}
                      <Icon className="w-[16px] h-[16px] shrink-0" />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-[13px] font-medium whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Session Stats */}
      <div className="border-t border-border px-3 py-4 space-y-3">
        <AnimatePresence>
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Flame className="w-3.5 h-3.5" style={{ color: session.streak > 0 ? 'var(--chart-5)' : undefined }} />
                <span>{session.streak} streak</span>
                <span className="mx-1">·</span>
                <Clock className="w-3.5 h-3.5" />
                <span>{hours}h {mins}m</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{studied} studied · {mastered} mastered</span>
              </div>
              {session.quizTotal > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Brain className="w-3.5 h-3.5" />
                  <span>Quiz: {session.quizScore}/{session.quizTotal} ({Math.round(session.quizScore / session.quizTotal * 100)}%)</span>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-1">
              <Flame className="w-4 h-4" style={{ color: session.streak > 0 ? 'var(--chart-5)' : 'var(--muted-foreground)' }} />
              <span className="text-[10px] text-muted-foreground">{session.streak}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notification Bell + Theme Toggle + Collapse Toggle */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border">
        <div className="flex items-center gap-1">
          <NotificationCenter />
          {switchable && toggleTheme && (
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );

  return (
    <div className="flex min-h-screen">
      {sidebar}

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <GraduationCap className="w-4 h-4" style={{ color: 'var(--primary-foreground)' }} />
          </div>
          <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>EMBA Explorer</span>
        </div>
        <div className="flex items-center gap-1">
          {switchable && toggleTheme && (
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-md pt-16"
            onClick={() => setMobileOpen(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setMobileOpen(false); }}
            role="dialog"
            aria-label="Navigation menu"
          >
            <nav className="p-4 space-y-4">
              {NAV_SECTIONS.map(section => (
                <div key={section.label}>
                  <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground px-4 py-1">{section.label}</p>
                  <div className="space-y-0.5">
                    {section.items.map(item => {
                      const Icon = item.icon;
                      const isActive = location === item.path;
                      return (
                        <Link key={item.path} href={item.path}>
                          <div
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                              isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-base font-medium">{item.label}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 min-w-0 lg:pt-0 pt-14" role="region" aria-label="Page content">
        {children}
      </div>
    </div>
  );
}
