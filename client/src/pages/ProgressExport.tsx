/**
 * ProgressExport — Download study progress as CSV or formatted report
 * Shows summary stats and lets users export their mastery data
 */

import Navigation from '@/components/Navigation';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useState } from 'react';
import { useMastery } from '@/contexts/MasteryContext';
import embaData from '@/data/emba_data.json';
import { CORE_DISCIPLINES, SPECIALIZATION_DISCIPLINES } from '@/data/types';
import {
  ArrowLeft, Download, FileText, Table2, BarChart3,
  Trophy, Clock, Flame, BookOpen, CheckCircle
} from 'lucide-react';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function ProgressExport() {
  const { mastery, session, totalStudyTime, getStudiedCount, getMasteredCount, studyHistory } = useMastery();
  const [exporting, setExporting] = useState(false);

  const definitions = embaData.definitions || [];
  const allDisciplines = [...CORE_DISCIPLINES, ...SPECIALIZATION_DISCIPLINES];

  const studied = getStudiedCount();
  const mastered = getMasteredCount();
  const hours = Math.floor(totalStudyTime / 60);
  const mins = totalStudyTime % 60;

  // Compute per-discipline stats
  const disciplineStats = allDisciplines.map(disc => {
    const defs = definitions.filter((d: any) => d.discipline === disc);
    const total = defs.length;
    if (total === 0) return null;

    const seenCount = defs.filter((d: any) => mastery[`def-${disc}-${d.id}`]?.seen).length;
    const masteredCount = defs.filter((d: any) => mastery[`def-${disc}-${d.id}`]?.mastered).length;
    const avgConfidence = defs.reduce((sum: number, d: any) => {
      const conf = mastery[`def-${disc}-${d.id}`]?.confidence || 0;
      return sum + conf;
    }, 0) / total;

    return {
      discipline: disc,
      total,
      seen: seenCount,
      mastered: masteredCount,
      progress: Math.round((masteredCount / total) * 100),
      avgConfidence: avgConfidence.toFixed(1),
    };
  }).filter(Boolean) as Array<{
    discipline: string; total: number; seen: number; mastered: number; progress: number; avgConfidence: string;
  }>;

  const exportCSV = () => {
    setExporting(true);

    // Header
    const lines = ['Discipline,Total Definitions,Studied,Mastered,Progress %,Avg Confidence'];

    // Per-discipline rows
    disciplineStats.forEach(s => {
      lines.push(`"${s.discipline}",${s.total},${s.seen},${s.mastered},${s.progress},${s.avgConfidence}`);
    });

    // Summary
    lines.push('');
    lines.push('--- Summary ---');
    lines.push(`Total Definitions,${definitions.length}`);
    lines.push(`Total Studied,${studied}`);
    lines.push(`Total Mastered,${mastered}`);
    lines.push(`Study Time,"${hours}h ${mins}m"`);
    lines.push(`Current Streak,${session.streak}`);
    lines.push(`Quiz Score,"${session.quizScore}/${session.quizTotal}"`);

    // Detailed definition-level export
    lines.push('');
    lines.push('--- Detailed Definitions ---');
    lines.push('Term,Discipline,Difficulty,Seen,Mastered,Confidence,Last Reviewed');

    definitions.forEach((d: any) => {
      const key = `def-${d.discipline}-${d.id}`;
      const state = mastery[key];
      lines.push(
        `"${d.term.replace(/"/g, '""')}","${d.discipline}","${d.difficulty || ''}",${state?.seen ? 'Yes' : 'No'},${state?.mastered ? 'Yes' : 'No'},${state?.confidence || 0},"${state?.lastReviewed ? new Date(state.lastReviewed).toLocaleDateString() : ''}"`
      );
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emba-progress-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setTimeout(() => setExporting(false), 1000);
  };

  const exportReport = () => {
    setExporting(true);

    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const overallProgress = definitions.length > 0 ? Math.round((mastered / definitions.length) * 100) : 0;

    let report = `Knowledge Explorer — Progress Report\n`;
    report += `Generated: ${date}\n`;
    report += `${'='.repeat(50)}\n\n`;

    report += `SUMMARY\n`;
    report += `${'-'.repeat(30)}\n`;
    report += `Total Definitions: ${definitions.length}\n`;
    report += `Studied: ${studied} (${definitions.length > 0 ? Math.round((studied / definitions.length) * 100) : 0}%)\n`;
    report += `Mastered: ${mastered} (${overallProgress}%)\n`;
    report += `Study Time: ${hours}h ${mins}m\n`;
    report += `Current Streak: ${session.streak} days\n`;
    report += `Quiz Performance: ${session.quizScore}/${session.quizTotal}${session.quizTotal > 0 ? ` (${Math.round(session.quizScore / session.quizTotal * 100)}%)` : ''}\n\n`;

    report += `DISCIPLINE BREAKDOWN\n`;
    report += `${'-'.repeat(30)}\n`;

    disciplineStats.sort((a, b) => b.progress - a.progress).forEach(s => {
      const bar = '█'.repeat(Math.round(s.progress / 5)) + '░'.repeat(20 - Math.round(s.progress / 5));
      report += `\n${s.discipline}\n`;
      report += `  [${bar}] ${s.progress}%\n`;
      report += `  ${s.seen}/${s.total} studied · ${s.mastered} mastered · Avg confidence: ${s.avgConfidence}/5\n`;
    });

    report += `\n\nSTUDY HISTORY (Last 30 Days)\n`;
    report += `${'-'.repeat(30)}\n`;

    const last30 = Object.entries(studyHistory || {})
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 30);

    if (last30.length > 0) {
      last30.forEach(([date, count]) => {
        report += `${date}: ${count} item${count !== 1 ? 's' : ''} studied\n`;
      });
    } else {
      report += `No study history recorded yet.\n`;
    }

    report += `\n\nWEAK AREAS (Confidence < 3)\n`;
    report += `${'-'.repeat(30)}\n`;

    const weakItems = definitions.filter((d: any) => {
      const key = `def-${d.discipline}-${d.id}`;
      const state = mastery[key];
      return state?.seen && (state?.confidence || 0) < 3;
    }).slice(0, 30);

    if (weakItems.length > 0) {
      weakItems.forEach((d: any) => {
        const key = `def-${d.discipline}-${d.id}`;
        const conf = mastery[key]?.confidence || 0;
        report += `  [${conf}/5] ${d.term} (${d.discipline})\n`;
      });
    } else {
      report += `  No weak areas identified. Keep studying!\n`;
    }

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emba-progress-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    setTimeout(() => setExporting(false), 1000);
  };

  return (
    <Navigation>
      <div className="min-h-screen">
        {/* Header */}
        <div className="px-6 lg:px-10 py-6 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/">
              <motion.div whileHover={{ x: -2 }} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Progress Export</h1>
              <p className="text-xs text-muted-foreground">Download your study progress and mastery data</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-border bg-card">
              <BookOpen className="w-4 h-4 text-primary mb-1" />
              <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>{studied}</p>
              <p className="text-[10px] text-muted-foreground">Studied</p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-card">
              <CheckCircle className="w-4 h-4 text-primary mb-1" />
              <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>{mastered}</p>
              <p className="text-[10px] text-muted-foreground">Mastered</p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-card">
              <Clock className="w-4 h-4 text-primary mb-1" />
              <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>{hours}h {mins}m</p>
              <p className="text-[10px] text-muted-foreground">Study Time</p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-card">
              <Flame className="w-4 h-4 text-primary mb-1" />
              <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>{session.streak}</p>
              <p className="text-[10px] text-muted-foreground">Day Streak</p>
            </div>
          </div>
        </div>

        <div className="px-6 lg:px-10 py-6 space-y-6">
          {/* Export Buttons */}
          <section>
            <h2 className="text-base font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>Export Options</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportCSV}
                disabled={exporting}
                className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-all text-left disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
                  <Table2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Export as CSV</h3>
                  <p className="text-xs text-muted-foreground">Spreadsheet with all definitions, mastery status, and confidence levels</p>
                </div>
                <Download className="w-4 h-4 text-muted-foreground shrink-0 ml-auto" />
              </motion.button>

              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportReport}
                disabled={exporting}
                className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-all text-left disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Export Report</h3>
                  <p className="text-xs text-muted-foreground">Formatted text report with progress bars, weak areas, and study history</p>
                </div>
                <Download className="w-4 h-4 text-muted-foreground shrink-0 ml-auto" />
              </motion.button>
            </div>
          </section>

          {/* Discipline Breakdown Table */}
          <section>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <BarChart3 className="w-4 h-4 text-primary" />
              Discipline Breakdown
            </h2>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-accent/30">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Discipline</th>
                      <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">Total</th>
                      <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">Studied</th>
                      <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">Mastered</th>
                      <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">Progress</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground w-32"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {disciplineStats.sort((a, b) => b.progress - a.progress).map((s, i) => (
                      <tr key={s.discipline} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-accent/10'}`}>
                        <td className="px-4 py-2.5">
                          <Link href={`/discipline/${slugify(s.discipline)}`}>
                            <span className="text-xs font-medium hover:text-primary transition-colors cursor-pointer">{s.discipline}</span>
                          </Link>
                        </td>
                        <td className="text-right px-3 py-2.5 text-xs font-mono text-muted-foreground">{s.total}</td>
                        <td className="text-right px-3 py-2.5 text-xs font-mono text-muted-foreground">{s.seen}</td>
                        <td className="text-right px-3 py-2.5 text-xs font-mono text-muted-foreground">{s.mastered}</td>
                        <td className="text-right px-3 py-2.5 text-xs font-mono font-semibold">{s.progress}%</td>
                        <td className="px-4 py-2.5">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${s.progress}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Navigation>
  );
}
