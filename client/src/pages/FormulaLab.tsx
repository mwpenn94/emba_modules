/**
 * DESIGN: The Atelier — Formula Calculator Lab
 * Interactive calculators: NPV, WACC, Breakeven, Amortization, Premium Financing, Ratio Dashboard
 * Each calculator: input fields, real-time computation, step-by-step breakdown, FS context
 */

import Navigation from '@/components/Navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Calculator, TrendingUp, DollarSign, BarChart3,
  Percent, PieChart, Building2, ChevronRight, Info
} from 'lucide-react';

// ── Calculator Definitions ─────────────────────────────────────
interface CalcInput {
  key: string;
  label: string;
  unit: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
}

interface CalcResult {
  label: string;
  value: string;
  highlight?: boolean;
}

interface CalculatorDef {
  id: string;
  name: string;
  icon: any;
  color: string;
  description: string;
  fsContext: string;
  inputs: CalcInput[];
  compute: (vals: Record<string, number>) => CalcResult[];
  steps: (vals: Record<string, number>) => string[];
}

const calculators: CalculatorDef[] = [
  {
    id: 'npv',
    name: 'Net Present Value',
    icon: TrendingUp,
    color: 'var(--chart-1)',
    description: 'Calculate the present value of future cash flows minus the initial investment.',
    fsContext: 'At WealthBridge, NPV analysis helps evaluate premium financing proposals, comparing the present value of policy benefits against financing costs over the projection period.',
    inputs: [
      { key: 'initial', label: 'Initial Investment', unit: '$', defaultValue: 100000, min: 0, step: 10000 },
      { key: 'rate', label: 'Discount Rate', unit: '%', defaultValue: 10, min: 0, max: 50, step: 0.5 },
      { key: 'cf1', label: 'Year 1 Cash Flow', unit: '$', defaultValue: 30000, step: 5000 },
      { key: 'cf2', label: 'Year 2 Cash Flow', unit: '$', defaultValue: 35000, step: 5000 },
      { key: 'cf3', label: 'Year 3 Cash Flow', unit: '$', defaultValue: 40000, step: 5000 },
      { key: 'cf4', label: 'Year 4 Cash Flow', unit: '$', defaultValue: 45000, step: 5000 },
      { key: 'cf5', label: 'Year 5 Cash Flow', unit: '$', defaultValue: 50000, step: 5000 },
    ],
    compute: (v) => {
      const r = v.rate / 100;
      const cfs = [v.cf1, v.cf2, v.cf3, v.cf4, v.cf5];
      const pvs = cfs.map((cf, i) => cf / Math.pow(1 + r, i + 1));
      const totalPV = pvs.reduce((s, pv) => s + pv, 0);
      const npv = totalPV - v.initial;
      return [
        { label: 'Total PV of Cash Flows', value: `$${totalPV.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
        { label: 'Net Present Value', value: `$${npv.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, highlight: true },
        { label: 'Decision', value: npv > 0 ? 'Accept (NPV > 0)' : 'Reject (NPV < 0)' },
        { label: 'Profitability Index', value: v.initial > 0 ? (totalPV / v.initial).toFixed(3) : 'N/A' },
      ];
    },
    steps: (v) => {
      const r = v.rate / 100;
      const cfs = [v.cf1, v.cf2, v.cf3, v.cf4, v.cf5];
      return cfs.map((cf, i) => `Year ${i + 1}: $${cf.toLocaleString()} / (1 + ${(r * 100).toFixed(1)}%)^${i + 1} = $${(cf / Math.pow(1 + r, i + 1)).toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
    },
  },
  {
    id: 'wacc',
    name: 'Weighted Avg Cost of Capital',
    icon: PieChart,
    color: 'var(--chart-2)',
    description: 'Calculate the blended cost of capital across equity and debt financing.',
    fsContext: 'Understanding WACC helps evaluate whether premium financing arrangements create value — the spread between policy crediting rate and borrowing cost must exceed the WACC hurdle.',
    inputs: [
      { key: 'equity', label: 'Market Value of Equity', unit: '$', defaultValue: 600000, min: 0, step: 50000 },
      { key: 'debt', label: 'Market Value of Debt', unit: '$', defaultValue: 400000, min: 0, step: 50000 },
      { key: 'costEquity', label: 'Cost of Equity', unit: '%', defaultValue: 12, min: 0, max: 50, step: 0.5 },
      { key: 'costDebt', label: 'Cost of Debt', unit: '%', defaultValue: 6, min: 0, max: 30, step: 0.5 },
      { key: 'taxRate', label: 'Tax Rate', unit: '%', defaultValue: 21, min: 0, max: 50, step: 1 },
    ],
    compute: (v) => {
      const total = v.equity + v.debt;
      if (total === 0) return [{ label: 'WACC', value: 'Enter equity or debt values', highlight: true }];
      const we = v.equity / total;
      const wd = v.debt / total;
      const wacc = we * (v.costEquity / 100) + wd * (v.costDebt / 100) * (1 - v.taxRate / 100);
      return [
        { label: 'Equity Weight', value: `${(we * 100).toFixed(1)}%` },
        { label: 'Debt Weight', value: `${(wd * 100).toFixed(1)}%` },
        { label: 'After-Tax Cost of Debt', value: `${((v.costDebt / 100) * (1 - v.taxRate / 100) * 100).toFixed(2)}%` },
        { label: 'WACC', value: `${(wacc * 100).toFixed(2)}%`, highlight: true },
      ];
    },
    steps: (v) => {
      const total = v.equity + v.debt;
      if (total === 0) return ['Enter equity or debt values to see calculation steps.'];
      const we = v.equity / total;
      const wd = v.debt / total;
      return [
        `Total Capital = $${v.equity.toLocaleString()} + $${v.debt.toLocaleString()} = $${total.toLocaleString()}`,
        `Equity Weight = $${v.equity.toLocaleString()} / $${total.toLocaleString()} = ${(we * 100).toFixed(1)}%`,
        `Debt Weight = $${v.debt.toLocaleString()} / $${total.toLocaleString()} = ${(wd * 100).toFixed(1)}%`,
        `WACC = ${(we * 100).toFixed(1)}% × ${v.costEquity}% + ${(wd * 100).toFixed(1)}% × ${v.costDebt}% × (1 - ${v.taxRate}%)`,
      ];
    },
  },
  {
    id: 'breakeven',
    name: 'Breakeven Analysis',
    icon: BarChart3,
    color: 'var(--chart-3)',
    description: 'Find the sales volume where total revenue equals total costs.',
    fsContext: 'For WealthBridge practice planning: how many clients or policies are needed to cover fixed costs (office, staff, licensing) before generating profit.',
    inputs: [
      { key: 'fixedCosts', label: 'Fixed Costs', unit: '$', defaultValue: 120000, min: 0, step: 10000 },
      { key: 'pricePerUnit', label: 'Revenue per Unit', unit: '$', defaultValue: 5000, min: 1, step: 500 },
      { key: 'varCostPerUnit', label: 'Variable Cost per Unit', unit: '$', defaultValue: 1500, min: 0, step: 500 },
    ],
    compute: (v) => {
      const cm = v.pricePerUnit - v.varCostPerUnit;
      const beUnits = cm > 0 ? Math.ceil(v.fixedCosts / cm) : Infinity;
      const beRevenue = beUnits * v.pricePerUnit;
      const cmRatio = v.pricePerUnit > 0 ? cm / v.pricePerUnit : 0;
      return [
        { label: 'Contribution Margin / Unit', value: `$${cm.toLocaleString()}` },
        { label: 'CM Ratio', value: `${(cmRatio * 100).toFixed(1)}%` },
        { label: 'Breakeven Units', value: beUnits === Infinity ? 'N/A' : beUnits.toLocaleString(), highlight: true },
        { label: 'Breakeven Revenue', value: beUnits === Infinity ? 'N/A' : `$${beRevenue.toLocaleString()}` },
      ];
    },
    steps: (v) => {
      const cm = v.pricePerUnit - v.varCostPerUnit;
      return [
        `Contribution Margin = $${v.pricePerUnit.toLocaleString()} - $${v.varCostPerUnit.toLocaleString()} = $${cm.toLocaleString()}`,
        `Breakeven Units = $${v.fixedCosts.toLocaleString()} / $${cm.toLocaleString()} = ${cm > 0 ? Math.ceil(v.fixedCosts / cm) : 'N/A'}`,
      ];
    },
  },
  {
    id: 'amortization',
    name: 'Loan Amortization',
    icon: DollarSign,
    color: 'var(--chart-4)',
    description: 'Calculate monthly payment and amortization schedule for a loan.',
    fsContext: 'Premium financing loans require amortization analysis. Understanding the payment structure helps clients see how interest accumulates and when equity crossover occurs.',
    inputs: [
      { key: 'principal', label: 'Loan Amount', unit: '$', defaultValue: 500000, min: 0, step: 50000 },
      { key: 'rate', label: 'Annual Interest Rate', unit: '%', defaultValue: 5.5, min: 0, max: 30, step: 0.25 },
      { key: 'years', label: 'Loan Term', unit: 'years', defaultValue: 30, min: 1, max: 40, step: 1 },
    ],
    compute: (v) => {
      const r = v.rate / 100 / 12;
      const n = v.years * 12;
      const payment = r > 0 ? v.principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : v.principal / n;
      const totalPaid = payment * n;
      const totalInterest = totalPaid - v.principal;
      return [
        { label: 'Monthly Payment', value: `$${payment.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, highlight: true },
        { label: 'Total Paid', value: `$${totalPaid.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
        { label: 'Total Interest', value: `$${totalInterest.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
        { label: 'Interest-to-Principal Ratio', value: v.principal > 0 ? `${(totalInterest / v.principal * 100).toFixed(1)}%` : 'N/A' },
      ];
    },
    steps: (v) => {
      const r = v.rate / 100 / 12;
      const n = v.years * 12;
      return [
        `Monthly Rate = ${v.rate}% / 12 = ${(r * 100).toFixed(4)}%`,
        `Total Payments = ${v.years} × 12 = ${n}`,
        `PMT = P × [r(1+r)^n] / [(1+r)^n - 1]`,
      ];
    },
  },
  {
    id: 'premium',
    name: 'Premium Financing',
    icon: Building2,
    color: 'var(--chart-5)',
    description: 'Evaluate premium financing feasibility: policy crediting rate vs. borrowing cost spread.',
    fsContext: 'Core WealthBridge product: clients borrow to fund large IUL policies. The spread between policy crediting rate and loan rate determines if the arrangement creates value.',
    inputs: [
      { key: 'premium', label: 'Annual Premium', unit: '$', defaultValue: 250000, min: 0, step: 25000 },
      { key: 'years', label: 'Financing Period', unit: 'years', defaultValue: 10, min: 1, max: 30, step: 1 },
      { key: 'creditRate', label: 'Policy Crediting Rate', unit: '%', defaultValue: 6.5, min: 0, max: 15, step: 0.25 },
      { key: 'loanRate', label: 'Loan Interest Rate', unit: '%', defaultValue: 4.5, min: 0, max: 15, step: 0.25 },
      { key: 'deathBenefit', label: 'Death Benefit', unit: '$', defaultValue: 5000000, min: 0, step: 500000 },
    ],
    compute: (v) => {
      const spread = v.creditRate - v.loanRate;
      const totalPremiums = v.premium * v.years;
      const totalLoanCost = totalPremiums * (v.loanRate / 100) * v.years / 2; // simplified avg balance
      const projectedCV = totalPremiums * Math.pow(1 + v.creditRate / 100, v.years / 2); // simplified
      const netBenefit = projectedCV - totalLoanCost;
      return [
        { label: 'Rate Spread', value: `${spread.toFixed(2)}%`, highlight: true },
        { label: 'Total Premiums', value: `$${totalPremiums.toLocaleString()}` },
        { label: 'Est. Loan Cost', value: `$${totalLoanCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
        { label: 'Projected Cash Value', value: `$${projectedCV.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
        { label: 'Death Benefit', value: `$${v.deathBenefit.toLocaleString()}` },
        { label: 'Feasibility', value: spread >= 1.5 ? 'Strong Candidate' : spread >= 0.5 ? 'Marginal — Review' : 'Not Recommended' },
      ];
    },
    steps: (v) => {
      const spread = v.creditRate - v.loanRate;
      return [
        `Rate Spread = ${v.creditRate}% - ${v.loanRate}% = ${spread.toFixed(2)}%`,
        `Minimum viable spread: 1.50% (covers fees, risk)`,
        spread >= 1.5 ? `✓ Spread exceeds minimum — proceed to detailed illustration` : `✗ Spread below minimum — consider alternative structures`,
      ];
    },
  },
  {
    id: 'ratios',
    name: 'Financial Ratio Dashboard',
    icon: Percent,
    color: 'var(--discipline-accounting)',
    description: 'Calculate key financial ratios from basic financial statement inputs.',
    fsContext: 'Analyzing carrier financial statements (AM Best data) and client business financials requires fluency in ratio analysis for underwriting and case design.',
    inputs: [
      { key: 'revenue', label: 'Revenue', unit: '$', defaultValue: 1000000, min: 0, step: 100000 },
      { key: 'cogs', label: 'Cost of Goods Sold', unit: '$', defaultValue: 600000, min: 0, step: 50000 },
      { key: 'netIncome', label: 'Net Income', unit: '$', defaultValue: 80000, step: 10000 },
      { key: 'totalAssets', label: 'Total Assets', unit: '$', defaultValue: 500000, min: 0, step: 50000 },
      { key: 'totalLiabilities', label: 'Total Liabilities', unit: '$', defaultValue: 200000, min: 0, step: 50000 },
      { key: 'currentAssets', label: 'Current Assets', unit: '$', defaultValue: 150000, min: 0, step: 25000 },
      { key: 'currentLiabilities', label: 'Current Liabilities', unit: '$', defaultValue: 100000, min: 0, step: 25000 },
    ],
    compute: (v) => {
      const grossMargin = v.revenue > 0 ? ((v.revenue - v.cogs) / v.revenue * 100) : 0;
      const netMargin = v.revenue > 0 ? (v.netIncome / v.revenue * 100) : 0;
      const roa = v.totalAssets > 0 ? (v.netIncome / v.totalAssets * 100) : 0;
      const equity = v.totalAssets - v.totalLiabilities;
      const roe = equity > 0 ? (v.netIncome / equity * 100) : 0;
      const currentRatio = v.currentLiabilities > 0 ? v.currentAssets / v.currentLiabilities : 0;
      const debtToEquity = equity > 0 ? v.totalLiabilities / equity : 0;
      return [
        { label: 'Gross Margin', value: `${grossMargin.toFixed(1)}%` },
        { label: 'Net Profit Margin', value: `${netMargin.toFixed(1)}%`, highlight: true },
        { label: 'Return on Assets (ROA)', value: `${roa.toFixed(1)}%` },
        { label: 'Return on Equity (ROE)', value: `${roe.toFixed(1)}%`, highlight: true },
        { label: 'Current Ratio', value: currentRatio.toFixed(2) },
        { label: 'Debt-to-Equity', value: debtToEquity.toFixed(2) },
      ];
    },
    steps: (v) => {
      return [
        `Gross Margin = (Revenue - COGS) / Revenue`,
        `Net Margin = Net Income / Revenue`,
        `ROA = Net Income / Total Assets`,
        `ROE = Net Income / (Total Assets - Total Liabilities)`,
        `Current Ratio = Current Assets / Current Liabilities`,
        `D/E = Total Liabilities / Equity`,
      ];
    },
  },
];

export default function FormulaLab() {
  const [activeCalc, setActiveCalc] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, number>>({});
  const [showSteps, setShowSteps] = useState(false);
  const [showFS, setShowFS] = useState(false);

  const calc = calculators.find(c => c.id === activeCalc);

  const initCalc = useCallback((c: CalculatorDef) => {
    const defaults: Record<string, number> = {};
    c.inputs.forEach(inp => { defaults[inp.key] = inp.defaultValue; });
    setValues(defaults);
    setActiveCalc(c.id);
    setShowSteps(false);
    setShowFS(false);
  }, []);

  const results = useMemo(() => {
    if (!calc) return [];
    return calc.compute(values);
  }, [calc, values]);

  const steps = useMemo(() => {
    if (!calc) return [];
    return calc.steps(values);
  }, [calc, values]);

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
            <Calculator className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Formula Calculator Lab</h1>
              <p className="text-xs text-muted-foreground font-mono">6 interactive calculators · Real-time computation · Step-by-step breakdowns</p>
            </div>
          </div>
        </div>

        <div className="px-6 lg:px-10 py-8">
          {!activeCalc ? (
            /* ── Calculator Grid ── */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Choose a Calculator</h2>
                <p className="text-sm text-muted-foreground">Interactive financial calculators with step-by-step breakdowns and WealthBridge applications</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {calculators.map((c, i) => (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -4, boxShadow: `0 8px 30px ${c.color}20` }}
                    onClick={() => initCalc(c)}
                    className="text-left p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${c.color}20` }}>
                      <c.icon className="w-5 h-5" style={{ color: c.color }} />
                    </div>
                    <h3 className="text-sm font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>{c.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : calc ? (
            /* ── Active Calculator ── */
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
              <button onClick={() => setActiveCalc(null)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-3 h-3" /> All Calculators
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${calc.color}20` }}>
                  <calc.icon className="w-5 h-5" style={{ color: calc.color }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{calc.name}</h2>
                  <p className="text-xs text-muted-foreground">{calc.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inputs</h3>
                  {calc.inputs.map(inp => (
                    <div key={inp.key}>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">{inp.label}</label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-6">{inp.unit}</span>
                        <input
                          type="number"
                          value={values[inp.key] ?? inp.defaultValue}
                          onChange={e => setValues(prev => ({ ...prev, [inp.key]: parseFloat(e.target.value) || 0 }))}
                          min={inp.min}
                          max={inp.max}
                          step={inp.step}
                          className="flex-1 px-3 py-2 text-sm bg-input border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                        />
                      </div>
                      {inp.min !== undefined && inp.max !== undefined && (
                        <input
                          type="range"
                          value={values[inp.key] ?? inp.defaultValue}
                          onChange={e => setValues(prev => ({ ...prev, [inp.key]: parseFloat(e.target.value) }))}
                          min={inp.min}
                          max={inp.max}
                          step={inp.step}
                          className="w-full mt-1 accent-primary"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Results */}
                <div className="space-y-4">
                  <div className="p-5 rounded-xl border border-border bg-card space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Results</h3>
                    {results.map((r, i) => (
                      <motion.div
                        key={r.label}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex items-center justify-between py-2 ${r.highlight ? 'px-3 rounded-lg' : ''}`}
                        style={r.highlight ? { background: `${calc.color}15`, border: `1px solid ${calc.color}30` } : {}}
                      >
                        <span className="text-xs text-muted-foreground">{r.label}</span>
                        <span className={`text-sm font-mono font-semibold ${r.highlight ? '' : ''}`} style={r.highlight ? { color: calc.color } : {}}>
                          {r.value}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Step-by-Step */}
                  <button
                    onClick={() => setShowSteps(!showSteps)}
                    className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" />
                    Step-by-Step Breakdown
                    <ChevronRight className={`w-3 h-3 transition-transform ${showSteps ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showSteps && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 rounded-xl border border-border bg-card/50 space-y-2"
                      >
                        {steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-[10px] font-mono text-muted-foreground mt-0.5 shrink-0">{i + 1}.</span>
                            <span className="text-xs font-mono text-muted-foreground leading-relaxed">{step}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* FS Context */}
                  <button
                    onClick={() => setShowFS(!showFS)}
                    className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5" style={{ color: 'var(--discipline-operations)' }} />
                    WealthBridge Application
                    <ChevronRight className={`w-3 h-3 transition-transform ${showFS ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showFS && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 rounded-xl border border-border/50 bg-card/50"
                      >
                        <p className="text-xs text-muted-foreground leading-relaxed">{calc.fsContext}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </Navigation>
  );
}
