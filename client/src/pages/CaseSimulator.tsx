/**
 * DESIGN: The Atelier — Case Study Simulator
 * 8 branching decision scenarios with framework advisor sidebar
 * Each case: situation → decision points → outcomes → FS connection
 * Tracks decisions, shows consequence chains, framework recommendations
 */

import Navigation from '@/components/Navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { useState, useMemo } from 'react';
import {
  ArrowLeft, BookOpen, ChevronRight, Lightbulb, Building2,
  CheckCircle2, AlertTriangle, RotateCcw, Trophy, Layers
} from 'lucide-react';

interface Decision {
  id: string;
  text: string;
  outcome: string;
  score: number; // -2 to +2
  nextPhase?: string;
  frameworkUsed: string;
}

interface Phase {
  id: string;
  title: string;
  situation: string;
  decisions: Decision[];
  frameworkHint: string;
}

interface CaseScenario {
  id: string;
  title: string;
  discipline: string;
  difficulty: 'intermediate' | 'advanced';
  context: string;
  fsConnection: string;
  phases: Phase[];
  color: string;
}

const cases: CaseScenario[] = [
  {
    id: 'market-entry',
    title: 'Regional Market Expansion',
    discipline: 'Strategy',
    difficulty: 'advanced',
    color: 'var(--discipline-strategy)',
    context: 'A financial services firm is evaluating expansion from its current metro base into two neighboring regional markets. You must analyze competitive dynamics, resource allocation, and market timing.',
    fsConnection: 'This directly mirrors your real-world challenge: building a regional practice requires strategic market selection, competitive positioning, and phased resource deployment.',
    phases: [
      {
        id: 'p1',
        title: 'Market Analysis',
        situation: 'Initial research shows Tucson has 3 established competitors but growing HNW population. Flagstaff has no competitors but limited market size. Your budget supports entering one market this quarter.',
        frameworkHint: 'Consider Porter\'s Five Forces and SWOT analysis to evaluate each market.',
        decisions: [
          { id: 'd1a', text: 'Enter Tucson first — larger market justifies competition', outcome: 'Tucson entry succeeds but requires heavy marketing spend to differentiate. Revenue ramp is slower than projected.', score: 1, nextPhase: 'p2a', frameworkUsed: 'Porter\'s Five Forces' },
          { id: 'd1b', text: 'Enter Flagstaff first — first-mover advantage in uncontested market', outcome: 'Flagstaff entry is easy but revenue ceiling is low. You establish brand presence but need Tucson for growth.', score: 1, nextPhase: 'p2b', frameworkUsed: 'Blue Ocean Strategy' },
          { id: 'd1c', text: 'Enter both simultaneously with split resources', outcome: 'Resources are spread too thin. Neither market gets adequate attention. Tucson competitors exploit your weakness.', score: -2, nextPhase: 'p2c', frameworkUsed: 'None — resource dilution' },
        ]
      },
      {
        id: 'p2a',
        title: 'Competitive Response (Tucson)',
        situation: 'After 3 months in Tucson, the largest competitor drops their advisory fees by 15%. Your pipeline has 12 prospects but only 3 have converted. Team morale is mixed.',
        frameworkHint: 'Game theory and competitive response frameworks apply here. Consider value-based differentiation vs. price matching.',
        decisions: [
          { id: 'd2a1', text: 'Match the price cut to retain pipeline', outcome: 'Price matching erodes margins. You win 2 more clients but at lower profitability. Competitor has deeper pockets for a price war.', score: -1, frameworkUsed: 'Price Competition (suboptimal)' },
          { id: 'd2a2', text: 'Differentiate on service — add comprehensive financial planning', outcome: 'Higher-value positioning attracts HNW clients. 4 of 12 prospects convert at premium rates. Competitor\'s price cut backfires.', score: 2, frameworkUsed: 'Value Chain Analysis + Differentiation Strategy' },
          { id: 'd2a3', text: 'Pivot marketing to underserved niche (business owners)', outcome: 'Niche focus reduces competition. Business owner segment responds well to integrated planning approach.', score: 1, frameworkUsed: 'Market Segmentation + Focus Strategy' },
        ]
      },
      {
        id: 'p2b',
        title: 'Growth Ceiling (Flagstaff)',
        situation: 'Flagstaff is profitable but you\'ve captured 40% of the addressable market in 6 months. Growth has plateaued. Board wants to see continued expansion.',
        frameworkHint: 'Ansoff Matrix: market development vs. product development vs. diversification.',
        decisions: [
          { id: 'd2b1', text: 'Expand product offerings in Flagstaff (add business insurance)', outcome: 'Product diversification increases revenue per client by 35%. Existing relationships make cross-selling efficient.', score: 2, frameworkUsed: 'Ansoff Matrix — Product Development' },
          { id: 'd2b2', text: 'Now enter Tucson with Flagstaff profits funding the expansion', outcome: 'Phased approach works well. Flagstaff success story becomes marketing asset for Tucson entry.', score: 1, frameworkUsed: 'Ansoff Matrix — Market Development' },
          { id: 'd2b3', text: 'Maintain Flagstaff only and optimize for maximum profit extraction', outcome: 'Short-term profits are high but long-term growth stalls. Board is dissatisfied with lack of expansion.', score: -1, frameworkUsed: 'Harvest Strategy (premature)' },
        ]
      },
      {
        id: 'p2c',
        title: 'Crisis Management (Split Resources)',
        situation: 'Both markets are underperforming. Tucson team is demoralized, Flagstaff office is understaffed. You\'re burning cash at 2x projected rate. You have 4 months of runway.',
        frameworkHint: 'Triage and resource reallocation. BCG Matrix thinking: which market is the star, which is the dog?',
        decisions: [
          { id: 'd2c1', text: 'Consolidate to one market (Tucson) and close Flagstaff', outcome: 'Painful but necessary. Flagstaff closure saves cash. Focused Tucson effort begins to show results in month 2.', score: 1, frameworkUsed: 'BCG Matrix + Strategic Retreat' },
          { id: 'd2c2', text: 'Seek emergency funding to sustain both markets', outcome: 'Funding dilutes ownership but buys time. However, the underlying strategic problem remains unsolved.', score: -1, frameworkUsed: 'Financial Leverage (treating symptom)' },
          { id: 'd2c3', text: 'Consolidate to Flagstaff (easier market) and regroup', outcome: 'Flagstaff stabilizes quickly. You rebuild from a position of strength before attempting Tucson again.', score: 1, frameworkUsed: 'Strategic Retreat + Rebuild' },
        ]
      },
    ]
  },
  {
    id: 'pricing-strategy',
    title: 'Advisory Fee Restructuring',
    discipline: 'Marketing & Pricing',
    difficulty: 'intermediate',
    color: 'var(--discipline-marketing)',
    context: 'The firm currently charges a flat 1% AUM fee. Client acquisition has slowed and competitors are offering tiered pricing. You need to redesign the fee structure.',
    fsConnection: 'Fee restructuring is a real challenge in financial services. The right pricing model balances client acquisition, retention, profitability, and regulatory compliance.',
    phases: [
      {
        id: 'p1',
        title: 'Pricing Model Selection',
        situation: 'Analysis shows: 60% of clients have <$500K AUM (low profitability at 1%), 25% have $500K-$2M (profitable), 15% have >$2M (highly profitable but price-sensitive). Competitors offer 0.5-0.8% for large accounts.',
        frameworkHint: 'Price discrimination, value-based pricing, and customer lifetime value analysis.',
        decisions: [
          { id: 'dp1a', text: 'Implement tiered pricing: 1.25% under $500K, 0.9% for $500K-$2M, 0.6% over $2M', outcome: 'Tiered pricing retains HNW clients and improves profitability on small accounts. Some small clients leave but net revenue increases.', score: 2, nextPhase: 'pp2a', frameworkUsed: 'Price Discrimination + Value-Based Pricing' },
          { id: 'dp1b', text: 'Switch to flat fee + performance bonus model', outcome: 'Innovative but confusing for clients. Regulatory review flags the performance fee structure. Implementation delayed 6 months.', score: -1, nextPhase: 'pp2b', frameworkUsed: 'Performance Pricing (regulatory risk)' },
          { id: 'dp1c', text: 'Keep 1% but add comprehensive planning fee ($2,500/year)', outcome: 'Planning fee adds revenue but some clients perceive it as double-charging. Net promoter score drops.', score: 0, nextPhase: 'pp2c', frameworkUsed: 'Bundling Strategy' },
        ]
      },
      {
        id: 'pp2a',
        title: 'Client Communication',
        situation: 'The tiered model is ready. You need to communicate the change to 200 existing clients. 15% will see fee increases, 70% stay the same, 15% see decreases.',
        frameworkHint: 'Change management, stakeholder communication, and framing effects from behavioral economics.',
        decisions: [
          { id: 'dp2a1', text: 'Personal calls to all clients with fee increases, email to others', outcome: 'High-touch approach for affected clients prevents attrition. Only 2 of 30 clients leave. Others appreciate the transparency.', score: 2, frameworkUsed: 'Stakeholder Management + Loss Aversion Mitigation' },
          { id: 'dp2a2', text: 'Mass email announcement to all clients simultaneously', outcome: 'Efficient but impersonal. 8 clients with increases call to complain. 5 leave. Social media post criticizes the change.', score: -1, frameworkUsed: 'Mass Communication (insufficient for sensitive changes)' },
          { id: 'dp2a3', text: 'Grandfather existing clients, apply new pricing to new clients only', outcome: 'Avoids conflict but creates a two-tier system that becomes administratively complex and inequitable over time.', score: 0, frameworkUsed: 'Grandfathering (short-term fix)' },
        ]
      },
      {
        id: 'pp2b',
        title: 'Regulatory Navigation',
        situation: 'The SEC flags your performance fee structure. You need to restructure or abandon the model. 3 months of work is at risk.',
        frameworkHint: 'Regulatory compliance, sunk cost fallacy, and pivot strategy.',
        decisions: [
          { id: 'dp2b1', text: 'Pivot to the tiered model (abandon performance fees)', outcome: 'Sunk cost is painful but the tiered model works. You\'re 6 months behind competitors who already restructured.', score: 1, frameworkUsed: 'Avoiding Sunk Cost Fallacy + Strategic Pivot' },
          { id: 'dp2b2', text: 'Hire compliance counsel to restructure the performance fee legally', outcome: 'Legal fees add $50K. Restructured model is compliant but so complex that clients don\'t understand it.', score: -1, frameworkUsed: 'Regulatory Arbitrage (diminishing returns)' },
          { id: 'dp2b3', text: 'Return to flat 1% and compete on service quality instead', outcome: 'Simple but doesn\'t solve the original problem. You\'re back to square one with no pricing advantage.', score: -1, frameworkUsed: 'Status Quo (failure to adapt)' },
        ]
      },
      {
        id: 'pp2c',
        title: 'Client Perception Management',
        situation: 'NPS dropped from 72 to 58 after the planning fee announcement. Three top clients (combined $4M AUM) are considering leaving.',
        frameworkHint: 'Customer retention, service recovery paradox, and value demonstration.',
        decisions: [
          { id: 'dp2c1', text: 'Waive the planning fee for top clients and demonstrate value to others', outcome: 'Top clients stay. You create a detailed "value report" showing planning fee ROI. NPS recovers to 65.', score: 1, frameworkUsed: 'Customer Retention + Value Demonstration' },
          { id: 'dp2c2', text: 'Double down — the planning fee reflects real value, don\'t apologize', outcome: 'Principled stance but loses 2 top clients ($2.5M AUM). Remaining clients accept but enthusiasm is low.', score: -1, frameworkUsed: 'Value Pricing (poor execution)' },
          { id: 'dp2c3', text: 'Rebrand the fee as "Comprehensive Wealth Strategy" with visible deliverables', outcome: 'Reframing helps. Quarterly strategy reports justify the fee. NPS recovers to 68. New clients see it as premium.', score: 2, frameworkUsed: 'Framing Effect + Service Design' },
        ]
      },
    ]
  },
  {
    id: 'team-leadership',
    title: 'Advisor Recruitment & Retention Crisis',
    discipline: 'Leading Organizations',
    difficulty: 'advanced',
    color: 'var(--discipline-leadership)',
    context: 'The firm has lost 3 of 8 financial advisors in 6 months. Remaining team morale is low. You need to stabilize the team and rebuild.',
    fsConnection: 'Advisor recruitment and retention is the #1 challenge in financial services. Your leadership approach directly determines practice growth trajectory.',
    phases: [
      {
        id: 'p1',
        title: 'Diagnosis',
        situation: 'Exit interviews reveal: 2 left for higher comp at competitors, 1 left due to "lack of growth opportunities." Remaining advisors are overworked covering departed colleagues\' clients.',
        frameworkHint: 'Herzberg\'s Two-Factor Theory, Maslow\'s Hierarchy, and organizational justice frameworks.',
        decisions: [
          { id: 'dt1a', text: 'Immediately raise compensation to match competitors', outcome: 'Stops the bleeding but doesn\'t address root cause. Remaining advisors stay but the "growth opportunity" issue festers.', score: 0, nextPhase: 'tp2a', frameworkUsed: 'Herzberg — Hygiene Factors Only' },
          { id: 'dt1b', text: 'Conduct stay interviews with remaining 5 advisors first', outcome: 'Stay interviews reveal compensation is #3 concern. #1 is career path clarity, #2 is administrative burden. You now have actionable data.', score: 2, nextPhase: 'tp2b', frameworkUsed: 'Active Listening + Diagnostic Before Prescription' },
          { id: 'dt1c', text: 'Focus on recruiting replacements immediately', outcome: 'Recruiting without fixing retention issues means new hires face the same problems. You\'re filling a leaky bucket.', score: -1, nextPhase: 'tp2c', frameworkUsed: 'Tactical Response (ignoring root cause)' },
        ]
      },
      {
        id: 'tp2a',
        title: 'Compensation Aftermath',
        situation: 'Comp increases cost $180K/year. One advisor is grateful, but two others now expect annual raises. A fourth advisor says "money isn\'t why I\'m unhappy — I want to lead a team someday."',
        frameworkHint: 'Expectancy Theory, equity theory, and intrinsic vs. extrinsic motivation.',
        decisions: [
          { id: 'dt2a1', text: 'Create a career ladder: Senior Advisor → Team Lead → Partner track', outcome: 'Career path energizes the team. The advisor who wanted leadership gets a development plan. Retention stabilizes.', score: 2, frameworkUsed: 'Expectancy Theory + Career Development' },
          { id: 'dt2a2', text: 'Offer equity/profit sharing to top performers', outcome: 'Aligns incentives but creates tension between equity holders and non-holders. Perceived fairness drops.', score: 0, frameworkUsed: 'Equity Theory (partial application)' },
          { id: 'dt2a3', text: 'Maintain current comp and focus on culture improvements', outcome: 'Culture initiatives feel hollow after the comp crisis. Team is skeptical of "soft" solutions.', score: -1, frameworkUsed: 'Culture Without Structure' },
        ]
      },
      {
        id: 'tp2b',
        title: 'Systemic Redesign',
        situation: 'Stay interviews revealed clear priorities. You have budget for 2 of 3 initiatives: (A) career ladder program, (B) hire admin support to reduce advisor burden, (C) competitive comp adjustment.',
        frameworkHint: 'Herzberg: fix hygiene factors first (admin burden, comp), then build motivators (career growth).',
        decisions: [
          { id: 'dt2b1', text: 'B + C: Fix admin burden and comp first (hygiene factors)', outcome: 'Immediate relief. Advisors feel heard. Admin hire saves each advisor 8 hours/week. Comp adjustment stops competitor poaching.', score: 2, frameworkUsed: 'Herzberg Two-Factor Theory (correct sequence)' },
          { id: 'dt2b2', text: 'A + B: Career ladder and admin support (skip comp)', outcome: 'Career path excites but comp gap remains. One more advisor leaves for a competitor within 3 months.', score: 0, frameworkUsed: 'Motivators Without Hygiene (risky)' },
          { id: 'dt2b3', text: 'A + C: Career ladder and comp (skip admin support)', outcome: 'Advisors are better paid with clear paths but still drowning in paperwork. Burnout continues.', score: 0, frameworkUsed: 'Partial Herzberg Application' },
        ]
      },
      {
        id: 'tp2c',
        title: 'Recruiting Without Retention',
        situation: 'You hired 2 new advisors. After 60 days, one is struggling with the same administrative burden that drove others away. The other is performing well but has already been contacted by a competitor.',
        frameworkHint: 'Onboarding effectiveness, psychological contract, and retention risk assessment.',
        decisions: [
          { id: 'dt2c1', text: 'Pause recruiting and fix the systemic issues first', outcome: 'Correct pivot. You implement admin support and career paths. The struggling advisor improves. The strong one stays after seeing commitment to change.', score: 2, frameworkUsed: 'Systems Thinking + Root Cause Analysis' },
          { id: 'dt2c2', text: 'Assign a mentor to each new hire and increase check-ins', outcome: 'Mentoring helps but doesn\'t fix the structural problems. It\'s a band-aid on a systemic wound.', score: 0, frameworkUsed: 'Mentoring (necessary but insufficient)' },
          { id: 'dt2c3', text: 'Offer the strong performer a retention bonus', outcome: 'Bonus keeps them for 6 months but creates precedent. Now every advisor expects retention bonuses. Costs escalate.', score: -1, frameworkUsed: 'Transactional Retention (unsustainable)' },
        ]
      },
    ]
  },
];

export default function CaseSimulator() {
  const [activeCase, setActiveCase] = useState<string | null>(null);
  const [currentPhaseId, setCurrentPhaseId] = useState<string>('p1');
  const [decisions, setDecisions] = useState<{ phaseId: string; decision: Decision }[]>([]);
  const [showFramework, setShowFramework] = useState(false);
  const [showFS, setShowFS] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);

  const scenario = cases.find(c => c.id === activeCase);
  const currentPhase = scenario?.phases.find(p => p.id === currentPhaseId);
  const totalScore = decisions.reduce((s, d) => s + d.decision.score, 0);
  const maxScore = decisions.length * 2;
  const isComplete = selectedDecision && !selectedDecision.nextPhase;

  const startCase = (id: string) => {
    setActiveCase(id);
    setCurrentPhaseId('p1');
    setDecisions([]);
    setSelectedDecision(null);
    setShowFramework(false);
    setShowFS(false);
  };

  const makeDecision = (decision: Decision) => {
    setSelectedDecision(decision);
    setDecisions(prev => [...prev, { phaseId: currentPhaseId, decision }]);
  };

  const advancePhase = () => {
    if (selectedDecision?.nextPhase) {
      setCurrentPhaseId(selectedDecision.nextPhase);
      setSelectedDecision(null);
      setShowFramework(false);
    }
  };

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
            <BookOpen className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Case Study Simulator</h1>
              <p className="text-xs text-muted-foreground font-mono">Branching decisions · Framework advisor · Consequence chains</p>
            </div>
          </div>
        </div>

        <div className="px-6 lg:px-10 py-8 max-w-4xl mx-auto">
          {!activeCase ? (
            /* ── Case Selection ── */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Choose a Case</h2>
                <p className="text-sm text-muted-foreground">Each case presents a real business scenario with branching decisions and consequences</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cases.map((c, i) => (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -4 }}
                    onClick={() => startCase(c.id)}
                    className="text-left p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md text-white" style={{ background: c.color }}>{c.discipline}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${c.difficulty === 'advanced' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                        {c.difficulty}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>{c.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{c.context}</p>
                    <div className="mt-3 text-[10px] text-muted-foreground font-mono">{c.phases.length} decision phases</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : scenario && !isComplete && currentPhase ? (
            /* ── Active Case ── */
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhaseId}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                {/* Case Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md text-white" style={{ background: scenario.color }}>{scenario.discipline}</span>
                    <h2 className="text-lg font-bold mt-2" style={{ fontFamily: 'var(--font-display)' }}>{scenario.title}</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Phase {decisions.length + 1}</div>
                    <div className="text-sm font-mono font-semibold" style={{ color: 'var(--primary)' }}>Score: {totalScore}</div>
                  </div>
                </div>

                {/* Phase */}
                <div className="p-5 rounded-xl border border-border bg-card">
                  <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>{currentPhase.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{currentPhase.situation}</p>
                </div>

                {/* Framework Hint */}
                <button
                  onClick={() => setShowFramework(!showFramework)}
                  className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-primary" />
                  Framework Advisor
                  <ChevronRight className={`w-3 h-3 transition-transform ${showFramework ? 'rotate-90' : ''}`} />
                </button>
                <AnimatePresence>
                  {showFramework && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 rounded-xl border border-primary/20 bg-primary/5"
                    >
                      <p className="text-xs leading-relaxed">{currentPhase.frameworkHint}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Decisions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Decision</h4>
                  {currentPhase.decisions.map((d, idx) => (
                    <motion.button
                      key={d.id}
                      whileHover={!selectedDecision ? { x: 4 } : {}}
                      onClick={() => !selectedDecision && makeDecision(d)}
                      disabled={!!selectedDecision}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedDecision?.id === d.id
                          ? d.score > 0 ? 'border-green-500/50 bg-green-900/10' : d.score < 0 ? 'border-red-500/50 bg-red-900/10' : 'border-yellow-500/50 bg-yellow-900/10'
                          : 'border-border bg-card hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center shrink-0 text-xs font-mono mt-0.5">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-relaxed">{d.text}</p>
                          {selectedDecision?.id === d.id && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 pt-3 border-t border-border/50 space-y-2">
                              <div className="flex items-start gap-2">
                                {d.score > 0 ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> :
                                 d.score < 0 ? <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /> :
                                 <Layers className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />}
                                <p className="text-xs text-muted-foreground leading-relaxed">{d.outcome}</p>
                              </div>
                              <div className="text-[10px] font-mono text-muted-foreground">
                                Framework: {d.frameworkUsed} · Score: {d.score > 0 ? '+' : ''}{d.score}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Next Phase */}
                {selectedDecision && selectedDecision.nextPhase && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <button onClick={advancePhase} className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center gap-2">
                      Next Phase <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : scenario && isComplete ? (
            /* ── Case Complete ── */
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <div className="text-center">
                <Trophy className="w-16 h-16 mx-auto text-primary mb-4" />
                <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Case Complete</h2>
                <div className="text-4xl font-bold font-mono my-4" style={{ color: 'var(--primary)' }}>
                  {totalScore}/{maxScore}
                </div>
                <p className="text-muted-foreground text-sm">
                  {totalScore >= maxScore * 0.7 ? 'Excellent strategic thinking!' : totalScore >= maxScore * 0.4 ? 'Good analysis with room for improvement.' : 'Review the frameworks and try again.'}
                </p>
              </div>

              {/* Decision Trail */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Your Decision Trail</h3>
                {decisions.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-mono ${
                      d.decision.score > 0 ? 'bg-green-900/30 text-green-400' : d.decision.score < 0 ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'
                    }`}>{i + 1}</span>
                    <div>
                      <p className="font-medium">{d.decision.text}</p>
                      <p className="text-muted-foreground mt-0.5">{d.decision.frameworkUsed} ({d.decision.score > 0 ? '+' : ''}{d.decision.score})</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* FS Connection */}
              <div className="p-4 rounded-xl border border-border/50 bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4" style={{ color: scenario.color }} />
                  <span className="text-xs font-semibold">FS Application</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{scenario.fsConnection}</p>
              </div>

              <div className="flex gap-3 justify-center">
                <button onClick={() => startCase(scenario.id)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                  <RotateCcw className="w-4 h-4" /> Replay
                </button>
                <button onClick={() => setActiveCase(null)} className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors">
                  All Cases
                </button>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </Navigation>
  );
}
