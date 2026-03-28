/**
 * DESIGN: The Atelier — Financial Services Practice Toolkit
 * 6 operational tools: Client Discovery, Case Design, Compliance Checklist,
 * Recruiting ROI, Practice Dashboard, Meeting Prep
 * All cross-referenced to EMBA concepts
 */

import React from 'react';
import Navigation from '@/components/Navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { useState, useMemo } from 'react';
import {
  ArrowLeft, Briefcase, Users, FileText, Shield, UserPlus,
  BarChart3, Calendar, ChevronRight, CheckCircle2, Circle,
  Download, Plus, Trash2, Building2
} from 'lucide-react';

// ── Tool Definitions ───────────────────────────────────────────

interface ToolDef {
  id: string;
  name: string;
  icon: any;
  color: string;
  description: string;
  embaLink: string;
}

const tools: ToolDef[] = [
  { id: 'discovery', name: 'Client Discovery', icon: Users, color: 'var(--chart-1)', description: 'Comprehensive fact finder with HNW and business owner supplements', embaLink: 'Marketing & Pricing → Customer Discovery, Strategy → Stakeholder Analysis' },
  { id: 'case-design', name: 'Case Design', icon: FileText, color: 'var(--chart-2)', description: 'IUL analysis, premium financing feasibility, estate planning needs', embaLink: 'Finance → NPV/IRR, Accounting → Present Value, Data → Decision Trees' },
  { id: 'compliance', name: 'Compliance Checklist', icon: Shield, color: 'var(--chart-3)', description: 'Suitability documentation, regulatory requirements, audit trail', embaLink: 'US Business Law → Fiduciary Duty, Ethics → Compliance Frameworks' },
  { id: 'recruiting', name: 'Recruiting ROI', icon: UserPlus, color: 'var(--chart-4)', description: 'Calculate cost-to-hire, time-to-productivity, and retention economics', embaLink: 'Leading Organizations → Recruitment, Finance → ROI Analysis, HR → Retention' },
  { id: 'dashboard', name: 'Practice Dashboard', icon: BarChart3, color: 'var(--chart-5)', description: 'KPI tracking, pipeline management, revenue forecasting', embaLink: 'Data & Decisions → KPIs, Strategy → Balanced Scorecard, Operations → Metrics' },
  { id: 'meeting-prep', name: 'Meeting Prep', icon: Calendar, color: 'var(--discipline-communications)', description: 'Pre-meeting research template, agenda builder, follow-up tracker', embaLink: 'Business Communications → Presentation, Strategy → Stakeholder Management' },
];

// ── Client Discovery Tool ──────────────────────────────────────
function ClientDiscovery() {
  const sections = [
    {
      title: 'Personal Information',
      fields: ['Full Name', 'Date of Birth', 'SSN (last 4)', 'Marital Status', 'Dependents', 'Address', 'Phone', 'Email', 'Employer', 'Occupation', 'Annual Income', 'Net Worth Estimate']
    },
    {
      title: 'Financial Goals',
      fields: ['Retirement Target Age', 'Retirement Income Need', 'Education Funding Goals', 'Estate Planning Objectives', 'Charitable Giving Plans', 'Business Succession Plans']
    },
    {
      title: 'Current Coverage',
      fields: ['Life Insurance (carrier, face amount, type)', 'Disability Insurance', 'Long-Term Care', 'Health Insurance', 'Property & Casualty', 'Umbrella Liability']
    },
    {
      title: 'Risk Profile',
      fields: ['Investment Risk Tolerance (1-10)', 'Time Horizon', 'Liquidity Needs', 'Tax Bracket', 'State of Residence (AZ)', 'Special Circumstances']
    },
    {
      title: 'HNW Supplement',
      fields: ['Business Ownership Details', 'Real Estate Holdings', 'Stock Options/RSUs', 'Trust Structures', 'Philanthropic Vehicles', 'Key Person Insurance Needs', 'Buy-Sell Agreement Status']
    },
  ];

  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const toggle = (field: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const total = sections.reduce((s, sec) => s + sec.fields.length, 0);
  const pct = Math.round(completed.size / total * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Client Discovery Checklist</h3>
        <span className="text-xs font-mono text-muted-foreground">{completed.size}/{total} ({pct}%)</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: 'var(--chart-1)' }} animate={{ width: `${pct}%` }} />
      </div>
      {sections.map(sec => (
        <div key={sec.title} className="p-4 rounded-xl border border-border bg-card">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{sec.title}</h4>
          <div className="space-y-2">
            {sec.fields.map(field => (
              <button key={field} onClick={() => toggle(field)} className="flex items-center gap-3 w-full text-left group">
                {completed.has(field) ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--chart-1)' }} />
                ) : (
                  <Circle className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
                <span className={`text-xs ${completed.has(field) ? 'line-through text-muted-foreground' : ''}`}>{field}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Case Design Tool ───────────────────────────────────────────
function CaseDesign() {
  const [clientAge, setClientAge] = useState(45);
  const [faceAmount, setFaceAmount] = useState(2000000);
  const [premium, setPremium] = useState(50000);
  const [years, setYears] = useState(20);
  const [creditRate, setCreditRate] = useState(6.0);

  const projectedCV = useMemo(() => {
    return premium * years * Math.pow(1 + creditRate / 100, years / 3);
  }, [premium, years, creditRate]);

  const incomeNeed = useMemo(() => {
    const retirementAge = 65;
    const yearsToRetirement = Math.max(retirementAge - clientAge, 1);
    return faceAmount * 0.04; // 4% rule
  }, [faceAmount, clientAge]);

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>IUL Case Design Worksheet</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Inputs</h4>
          {[
            { label: 'Client Age', value: clientAge, set: setClientAge, min: 25, max: 70, unit: '' },
            { label: 'Face Amount', value: faceAmount, set: setFaceAmount, min: 100000, max: 10000000, step: 100000, unit: '$' },
            { label: 'Annual Premium', value: premium, set: setPremium, min: 10000, max: 500000, step: 5000, unit: '$' },
            { label: 'Payment Years', value: years, set: setYears, min: 5, max: 30, unit: '' },
            { label: 'Illustrated Rate', value: creditRate, set: setCreditRate, min: 3, max: 10, step: 0.25, unit: '%' },
          ].map(inp => (
            <div key={inp.label}>
              <label className="text-[10px] text-muted-foreground">{inp.label}</label>
              <div className="flex items-center gap-2">
                {inp.unit && <span className="text-xs text-muted-foreground w-4">{inp.unit}</span>}
                <input
                  type="number"
                  value={inp.value}
                  onChange={e => {
                    const v = parseFloat(e.target.value);
                    if (isNaN(v)) { inp.set(inp.min); return; }
                    inp.set(Math.max(inp.min, Math.min(inp.max, v)));
                  }}
                  min={inp.min}
                  max={inp.max}
                  step={(inp as any).step || 1}
                  className="flex-1 px-2 py-1.5 text-xs bg-input border border-border rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projections</h4>
          {[
            { label: 'Total Premiums', value: `$${(premium * years).toLocaleString()}` },
            { label: 'Projected Cash Value', value: `$${projectedCV.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, highlight: true },
            { label: 'Death Benefit', value: `$${faceAmount.toLocaleString()}` },
            { label: 'Income Need (4% Rule)', value: `$${incomeNeed.toLocaleString()}/yr` },
            { label: 'IRC 7702 Status', value: premium * years < faceAmount * 0.5 ? 'Likely Compliant' : 'Review MEC Limits' },
            { label: 'Suitability Score', value: clientAge < 55 && years >= 10 ? 'Strong' : 'Moderate' },
          ].map(r => (
            <div key={r.label} className={`flex items-center justify-between py-1.5 ${(r as any).highlight ? 'px-2 rounded-lg bg-primary/10' : ''}`}>
              <span className="text-[10px] text-muted-foreground">{r.label}</span>
              <span className="text-xs font-mono font-semibold">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-lg border border-border/50 bg-card/50">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <strong>EMBA Connection:</strong> This worksheet applies Finance (NPV, time value of money), Accounting (present value, amortization), and Data & Decisions (scenario analysis) concepts to real IUL case design.
        </p>
      </div>
    </div>
  );
}

// ── Compliance Checklist ───────────────────────────────────────
function ComplianceChecklist() {
  const categories = [
    {
      title: 'Pre-Sale Requirements',
      items: ['Client suitability assessment completed', 'Risk tolerance documented', 'Financial needs analysis on file', 'Product comparison provided', 'Replacement form (if applicable)', 'State-specific disclosure forms (AZ)']
    },
    {
      title: 'Application Process',
      items: ['Application fully completed and signed', 'HIPAA authorization obtained', 'Premium payment method documented', 'Beneficiary designations confirmed', 'Trust documentation (if applicable)', 'Medical exam scheduled/completed']
    },
    {
      title: 'Post-Issue',
      items: ['Policy delivery receipt signed', 'Free-look period explained', 'Premium schedule confirmed', 'Annual review scheduled', 'Client file archived', 'CRM updated with policy details']
    },
    {
      title: 'Continuing Education',
      items: ['Arizona CE credits current', 'Ethics CE requirement met', 'Anti-money laundering training', 'Cybersecurity awareness training', 'Product-specific training completed', 'E&O insurance current']
    },
  ];

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const toggle = (item: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const total = categories.reduce((s, c) => s + c.items.length, 0);
  const pct = Math.round(checked.size / total * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Compliance Checklist</h3>
        <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${pct === 100 ? 'bg-green-900/30 text-green-400' : 'text-muted-foreground'}`}>
          {pct}% Complete
        </span>
      </div>
      {categories.map(cat => (
        <div key={cat.title} className="p-4 rounded-xl border border-border bg-card">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{cat.title}</h4>
          <div className="space-y-2">
            {cat.items.map(item => (
              <button key={item} onClick={() => toggle(item)} className="flex items-center gap-3 w-full text-left group">
                {checked.has(item) ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--chart-1)' }} />
                ) : (
                  <Circle className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
                <span className={`text-xs ${checked.has(item) ? 'line-through text-muted-foreground' : ''}`}>{item}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Recruiting ROI Calculator ──────────────────────────────────
function RecruitingROI() {
  const [recruitingCost, setRecruitingCost] = useState(15000);
  const [trainingCost, setTrainingCost] = useState(10000);
  const [monthsToProductive, setMonthsToProductive] = useState(6);
  const [avgAdvisorRevenue, setAvgAdvisorRevenue] = useState(150000);
  const [retentionRate, setRetentionRate] = useState(70);

  const totalCost = recruitingCost + trainingCost + (monthsToProductive * avgAdvisorRevenue / 12 * 0.3);
  const productiveMonths = Math.max(1, 12 - monthsToProductive);
  const yearOneROI = totalCost > 0 ? ((avgAdvisorRevenue * productiveMonths / 12) - totalCost) / totalCost * 100 : 0;
  const expectedValue = avgAdvisorRevenue * (retentionRate / 100) * 3; // 3-year horizon

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Recruiting ROI Calculator</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inputs</h4>
          {[
            { label: 'Recruiting Cost', value: recruitingCost, set: setRecruitingCost, unit: '$' },
            { label: 'Training Cost', value: trainingCost, set: setTrainingCost, unit: '$' },
            { label: 'Months to Productive', value: monthsToProductive, set: setMonthsToProductive, unit: 'mo' },
            { label: 'Avg Advisor Revenue/Year', value: avgAdvisorRevenue, set: setAvgAdvisorRevenue, unit: '$' },
            { label: 'Retention Rate', value: retentionRate, set: setRetentionRate, unit: '%' },
          ].map(inp => (
            <div key={inp.label}>
              <label className="text-[10px] text-muted-foreground">{inp.label}</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4">{inp.unit}</span>
                <input type="number" value={inp.value} onChange={e => {
                    const v = parseFloat(e.target.value);
                    inp.set(isNaN(v) || v < 0 ? 0 : v);
                  }}
                  className="flex-1 px-2 py-1.5 text-xs bg-input border border-border rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Results</h4>
          {[
            { label: 'Total Hiring Cost', value: `$${totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
            { label: 'Year 1 ROI', value: `${yearOneROI.toFixed(1)}%`, highlight: yearOneROI > 0 },
            { label: '3-Year Expected Value', value: `$${expectedValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
            { label: 'Breakeven Month', value: avgAdvisorRevenue > 0 ? `Month ${Math.ceil(totalCost / (avgAdvisorRevenue / 12))}` : 'N/A' },
            { label: 'Cost per Productive Month', value: productiveMonths > 0 ? `$${(totalCost / productiveMonths).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : 'N/A' },
          ].map(r => (
            <div key={r.label} className={`flex items-center justify-between py-1.5 ${(r as any).highlight ? 'px-2 rounded-lg bg-primary/10' : ''}`}>
              <span className="text-[10px] text-muted-foreground">{r.label}</span>
              <span className="text-xs font-mono font-semibold">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 rounded-lg border border-border/50 bg-card/50">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <strong>EMBA Connection:</strong> Applies Finance (ROI, breakeven), Leading Organizations (recruitment strategy, Herzberg theory), and Data & Decisions (expected value calculations) to advisor recruiting decisions.
        </p>
      </div>
    </div>
  );
}

// ── Practice Dashboard ─────────────────────────────────────────
function PracticeDashboard() {
  const [kpis] = useState([
    { name: 'Active Clients', value: 142, target: 200, unit: '' },
    { name: 'AUM', value: 28.5, target: 50, unit: '$M' },
    { name: 'Monthly Revenue', value: 23750, target: 35000, unit: '$' },
    { name: 'Client Retention', value: 94, target: 95, unit: '%' },
    { name: 'New Clients (MTD)', value: 3, target: 5, unit: '' },
    { name: 'Avg Policy Size', value: 185000, target: 250000, unit: '$' },
    { name: 'Pipeline Value', value: 450000, target: 600000, unit: '$' },
    { name: 'Advisor Count', value: 5, target: 8, unit: '' },
  ]);

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Practice KPI Dashboard</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(kpi => {
          const pct = Math.min(100, (kpi.value / kpi.target) * 100);
          const onTrack = pct >= 80;
          return (
            <div key={kpi.name} className="p-3 rounded-xl border border-border bg-card">
              <div className="text-[10px] text-muted-foreground mb-1">{kpi.name}</div>
              <div className="text-lg font-bold font-mono" style={{ color: onTrack ? 'var(--chart-1)' : 'var(--chart-5)' }}>
                {kpi.unit === '$' ? `$${kpi.value.toLocaleString()}` : kpi.unit === '$M' ? `$${kpi.value}M` : `${kpi.value}${kpi.unit}`}
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: onTrack ? 'var(--chart-1)' : 'var(--chart-5)' }} />
              </div>
              <div className="text-[9px] text-muted-foreground mt-1">
                Target: {kpi.unit === '$' ? `$${kpi.target.toLocaleString()}` : kpi.unit === '$M' ? `$${kpi.target}M` : `${kpi.target}${kpi.unit}`}
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-3 rounded-lg border border-border/50 bg-card/50">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <strong>EMBA Connection:</strong> Applies Data & Decisions (KPI selection, dashboard design), Strategy (Balanced Scorecard), and Operations (process metrics) to practice management.
        </p>
      </div>
    </div>
  );
}

// ── Meeting Prep ───────────────────────────────────────────────
function MeetingPrep() {
  const [items, setItems] = useState([
    { id: '1', text: 'Review client file and recent correspondence', done: false },
    { id: '2', text: 'Check market conditions affecting client portfolio', done: false },
    { id: '3', text: 'Prepare policy review summary', done: false },
    { id: '4', text: 'Draft agenda with 3 key discussion points', done: false },
    { id: '5', text: 'Prepare 1-page financial summary', done: false },
    { id: '6', text: 'Review compliance requirements for recommendations', done: false },
    { id: '7', text: 'Set follow-up action items template', done: false },
  ]);
  const [newItem, setNewItem] = useState('');

  const toggle = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    setItems(prev => [...prev, { id: Date.now().toString(), text: newItem.trim(), done: false }]);
    setNewItem('');
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Meeting Preparation Checklist</h3>
      <div className="p-4 rounded-xl border border-border bg-card space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 group">
            <button onClick={() => toggle(item.id)}>
              {item.done ? (
                <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--chart-1)' }} />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            <span className={`text-xs flex-1 ${item.done ? 'line-through text-muted-foreground' : ''}`}>{item.text}</span>
            <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Add preparation item..."
          className="flex-1 px-3 py-2 text-xs bg-input border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button onClick={addItem} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main Toolkit Page ──────────────────────────────────────────
export default function FSToolkit() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const toolComponents: Record<string, React.ReactElement> = {
    'discovery': <ClientDiscovery />,
    'case-design': <CaseDesign />,
    'compliance': <ComplianceChecklist />,
    'recruiting': <RecruitingROI />,
    'dashboard': <PracticeDashboard />,
    'meeting-prep': <MeetingPrep />,
  };

  const currentTool = tools.find(t => t.id === activeTool);

  return (
    <Navigation>
      <div className="min-h-screen">
        {/* Header */}
        <div className="px-6 lg:px-10 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Link href="/">
              <motion.div whileHover={{ x: -2 }} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </Link>
            <Briefcase className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Financial Services Toolkit</h1>
              <p className="text-xs text-muted-foreground font-mono">6 operational tools · EMBA-integrated · Financial services practice</p>
            </div>
          </div>
        </div>

        <div className="px-6 lg:px-10 py-8 max-w-4xl mx-auto">
          {!activeTool ? (
            /* ── Tool Grid ── */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Financial Services Practice Tools</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Operational artifacts for daily practice, each cross-referenced to EMBA concepts you're mastering
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((t, i) => (
                  <motion.button
                    key={t.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -4, boxShadow: `0 8px 30px ${t.color}15` }}
                    onClick={() => setActiveTool(t.id)}
                    className="text-left p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${t.color}20` }}>
                      <t.icon className="w-5 h-5" style={{ color: t.color }} />
                    </div>
                    <h3 className="text-sm font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>{t.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{t.description}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/70">{t.embaLink}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : currentTool ? (
            /* ── Active Tool ── */
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <button onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-3 h-3" /> All Tools
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${currentTool.color}20` }}>
                  <currentTool.icon className="w-5 h-5" style={{ color: currentTool.color }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>{currentTool.name}</h2>
                  <p className="text-[10px] font-mono text-muted-foreground">{currentTool.embaLink}</p>
                </div>
              </div>
              {toolComponents[activeTool]}
            </motion.div>
          ) : null}
        </div>
      </div>
    </Navigation>
  );
}
