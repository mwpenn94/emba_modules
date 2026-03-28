/**
 * DESIGN: The Atelier — Cross-Discipline Connection Map
 * Interactive visual node-and-edge graph showing how concepts connect across disciplines
 * Click nodes to explore, hover for details, filter by discipline
 */

import Navigation from '@/components/Navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Network, Filter, Search, ChevronRight,
  Zap, Building2, X
} from 'lucide-react';

interface ConceptNode {
  id: string;
  name: string;
  discipline: string;
  description: string;
  fsApplication: string;
}

interface ConceptEdge {
  from: string;
  to: string;
  relationship: string;
  strength: 'strong' | 'moderate' | 'subtle';
}

const nodes: ConceptNode[] = [
  { id: 'npv', name: 'Net Present Value', discipline: 'Finance', description: 'Discounted cash flow valuation method', fsApplication: 'IUL cash value projections, premium financing feasibility' },
  { id: 'wacc', name: 'WACC', discipline: 'Finance', description: 'Weighted average cost of capital', fsApplication: 'Client business valuation for buy-sell agreements' },
  { id: 'capm', name: 'CAPM', discipline: 'Finance', description: 'Capital asset pricing model for expected returns', fsApplication: 'Portfolio allocation recommendations, risk-adjusted return analysis' },
  { id: 'breakeven', name: 'Breakeven Analysis', discipline: 'Accounting', description: 'Point where revenue equals total costs', fsApplication: 'Practice profitability analysis, new market entry decisions' },
  { id: 'ratio', name: 'Financial Ratios', discipline: 'Accounting', description: 'Liquidity, profitability, and efficiency metrics', fsApplication: 'Client business health assessment, AM Best carrier analysis' },
  { id: 'amortization', name: 'Amortization', discipline: 'Accounting', description: 'Systematic allocation of costs over time', fsApplication: 'Premium financing loan schedules, DAC accounting' },
  { id: 'porter', name: "Porter's Five Forces", discipline: 'Strategy', description: 'Industry competitive analysis framework', fsApplication: 'Regional market competitive analysis for practice expansion' },
  { id: 'swot', name: 'SWOT Analysis', discipline: 'Strategy', description: 'Strengths, weaknesses, opportunities, threats', fsApplication: 'Practice strategic planning, annual business review' },
  { id: 'bcg', name: 'BCG Matrix', discipline: 'Strategy', description: 'Portfolio classification: stars, cash cows, dogs, question marks', fsApplication: 'Product line analysis, client segment prioritization' },
  { id: 'segmentation', name: 'Market Segmentation', discipline: 'Marketing', description: 'Dividing market into distinct customer groups', fsApplication: 'HNW vs. mass affluent targeting, business owner niche' },
  { id: 'pricing', name: 'Pricing Strategy', discipline: 'Marketing', description: 'Value-based, cost-plus, competitive pricing models', fsApplication: 'Advisory fee structure design, tiered pricing models' },
  { id: 'clv', name: 'Customer Lifetime Value', discipline: 'Marketing', description: 'Total predicted revenue from a customer relationship', fsApplication: 'Client acquisition cost justification, retention investment' },
  { id: 'herzberg', name: "Herzberg's Two-Factor", discipline: 'Leading Organizations', description: 'Hygiene factors vs. motivators in employee satisfaction', fsApplication: 'Advisor recruitment and retention strategy' },
  { id: 'transformational', name: 'Transformational Leadership', discipline: 'Leading Organizations', description: 'Inspiring change through vision and empowerment', fsApplication: 'Building team culture, mentoring new advisors' },
  { id: 'regression', name: 'Regression Analysis', discipline: 'Data & Decisions', description: 'Statistical relationship modeling between variables', fsApplication: 'Revenue forecasting, client behavior prediction' },
  { id: 'decision-tree', name: 'Decision Trees', discipline: 'Data & Decisions', description: 'Branching logic for sequential decisions under uncertainty', fsApplication: 'Case design optimization, product recommendation engine' },
  { id: 'bayes', name: "Bayes' Theorem", discipline: 'Data & Decisions', description: 'Updating probability estimates with new evidence', fsApplication: 'Underwriting risk assessment, prospect qualification' },
  { id: 'supply-demand', name: 'Supply & Demand', discipline: 'Economics', description: 'Market equilibrium through price mechanism', fsApplication: 'Talent market analysis, product demand forecasting' },
  { id: 'game-theory', name: 'Game Theory', discipline: 'Economics', description: 'Strategic interaction between rational agents', fsApplication: 'Competitive response strategy, negotiation tactics' },
  { id: 'lean', name: 'Lean Operations', discipline: 'Operations', description: 'Eliminating waste and maximizing value', fsApplication: 'Streamlining client onboarding, reducing admin burden' },
  { id: 'fiduciary', name: 'Fiduciary Duty', discipline: 'US Business Law', description: 'Legal obligation to act in client\'s best interest', fsApplication: 'Suitability documentation, compliance framework' },
  { id: 'contract', name: 'Contract Law', discipline: 'US Business Law', description: 'Elements of enforceable agreements', fsApplication: 'Policy contracts, buy-sell agreements, employment agreements' },
];

const edges: ConceptEdge[] = [
  { from: 'npv', to: 'wacc', relationship: 'WACC provides the discount rate for NPV calculations', strength: 'strong' },
  { from: 'npv', to: 'breakeven', relationship: 'NPV determines when cumulative discounted cash flows break even', strength: 'strong' },
  { from: 'npv', to: 'amortization', relationship: 'Amortization schedules feed into NPV cash flow projections', strength: 'moderate' },
  { from: 'wacc', to: 'capm', relationship: 'CAPM determines cost of equity, a component of WACC', strength: 'strong' },
  { from: 'ratio', to: 'breakeven', relationship: 'Ratio analysis identifies margin structure for breakeven', strength: 'moderate' },
  { from: 'porter', to: 'swot', relationship: 'Porter analysis feeds into the external factors of SWOT', strength: 'strong' },
  { from: 'porter', to: 'pricing', relationship: 'Competitive forces determine pricing power', strength: 'strong' },
  { from: 'porter', to: 'game-theory', relationship: 'Competitive dynamics modeled through game theory', strength: 'moderate' },
  { from: 'swot', to: 'bcg', relationship: 'SWOT informs portfolio positioning in BCG matrix', strength: 'moderate' },
  { from: 'segmentation', to: 'pricing', relationship: 'Different segments justify different pricing strategies', strength: 'strong' },
  { from: 'segmentation', to: 'clv', relationship: 'Segment-level CLV drives resource allocation', strength: 'strong' },
  { from: 'clv', to: 'npv', relationship: 'CLV is essentially NPV applied to customer relationships', strength: 'strong' },
  { from: 'herzberg', to: 'transformational', relationship: 'Motivators align with transformational leadership behaviors', strength: 'moderate' },
  { from: 'herzberg', to: 'lean', relationship: 'Reducing admin burden (hygiene) enables focus on value-add', strength: 'subtle' },
  { from: 'regression', to: 'clv', relationship: 'Regression models predict customer lifetime value', strength: 'moderate' },
  { from: 'decision-tree', to: 'bayes', relationship: 'Decision trees incorporate Bayesian probability updates', strength: 'strong' },
  { from: 'decision-tree', to: 'npv', relationship: 'Decision tree branches weighted by NPV of each outcome', strength: 'moderate' },
  { from: 'supply-demand', to: 'pricing', relationship: 'Market equilibrium determines optimal price point', strength: 'strong' },
  { from: 'game-theory', to: 'pricing', relationship: 'Competitor pricing responses modeled through game theory', strength: 'moderate' },
  { from: 'lean', to: 'breakeven', relationship: 'Lean reduces fixed costs, lowering breakeven point', strength: 'moderate' },
  { from: 'fiduciary', to: 'pricing', relationship: 'Fiduciary duty constrains pricing to fair value', strength: 'subtle' },
  { from: 'contract', to: 'fiduciary', relationship: 'Contracts formalize fiduciary obligations', strength: 'strong' },
  { from: 'bayes', to: 'regression', relationship: 'Bayesian regression combines prior beliefs with data', strength: 'moderate' },
  { from: 'bcg', to: 'clv', relationship: 'BCG classification informed by segment CLV', strength: 'moderate' },
];

const disciplineColors: Record<string, string> = {
  'Finance': 'var(--discipline-finance)',
  'Accounting': 'var(--discipline-accounting)',
  'Strategy': 'var(--discipline-strategy)',
  'Marketing': 'var(--discipline-marketing)',
  'Leading Organizations': 'var(--discipline-leadership)',
  'Data & Decisions': 'var(--discipline-data)',
  'Economics': 'var(--discipline-economics)',
  'Operations': 'var(--discipline-operations)',
  'US Business Law': 'var(--discipline-law)',
};

export default function ConnectionMap() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [filterDiscipline, setFilterDiscipline] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const disciplines = useMemo(() => Array.from(new Set(nodes.map(n => n.discipline))), []);

  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      if (filterDiscipline && n.discipline !== filterDiscipline) return false;
      if (searchQuery && !n.name.toLowerCase().includes(searchQuery.toLowerCase()) && !n.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [filterDiscipline, searchQuery]);

  const selectedNodeData = nodes.find(n => n.id === selectedNode);
  const connectedEdges = edges.filter(e => e.from === selectedNode || e.to === selectedNode);
  const connectedNodeIds = new Set(connectedEdges.reduce<string[]>((acc, e) => { acc.push(e.from, e.to); return acc; }, []));

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
            <Network className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Connection Map</h1>
              <p className="text-xs text-muted-foreground font-mono">{nodes.length} concepts · {edges.length} connections · {disciplines.length} disciplines</p>
            </div>
          </div>
        </div>

        <div className="px-6 lg:px-10 py-6">
          {/* Controls */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search concepts..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-input border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterDiscipline(null)}
                className={`px-2.5 py-1.5 text-[10px] font-mono rounded-md border transition-all ${!filterDiscipline ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
              >All</button>
              {disciplines.map(d => (
                <button
                  key={d}
                  onClick={() => setFilterDiscipline(filterDiscipline === d ? null : d)}
                  className={`px-2.5 py-1.5 text-[10px] font-mono rounded-md border transition-all ${filterDiscipline === d ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ background: disciplineColors[d] || 'var(--muted)' }} />
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-6 flex-col lg:flex-row">
            {/* Node Grid */}
            <div className="flex-1">
              {filteredNodes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center col-span-full">
                  <Network className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <h3 className="text-base font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>No concepts match</h3>
                  <p className="text-xs text-muted-foreground max-w-xs">Try a different search term or clear the discipline filter.</p>
                  <button onClick={() => { setFilterDiscipline(null); setSearchQuery(''); }} className="mt-3 px-4 py-2 rounded-lg bg-accent text-sm font-medium hover:bg-accent/80 transition-colors">
                    Clear Filters
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredNodes.map((node, i) => {
                  const isSelected = selectedNode === node.id;
                  const isConnected = selectedNode ? connectedNodeIds.has(node.id) : false;
                  const isDimmed = selectedNode && !isSelected && !isConnected;
                  const color = disciplineColors[node.discipline] || 'var(--muted)';

                  return (
                    <motion.button
                      key={node.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: isDimmed ? 0.3 : 1, scale: 1 }}
                      transition={{ delay: i * 0.02 }}
                      whileHover={{ scale: 1.03 }}
                      onClick={() => setSelectedNode(isSelected ? null : node.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${isSelected ? 'ring-2 ring-primary border-primary/50' : isConnected ? 'border-primary/30 bg-primary/5' : 'border-border bg-card hover:border-primary/20'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        <span className="text-[9px] font-mono text-muted-foreground truncate">{node.discipline}</span>
                      </div>
                      <h4 className="text-xs font-semibold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>{node.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{node.description}</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Detail Panel */}
            <AnimatePresence>
              {selectedNodeData && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="lg:w-80 shrink-0"
                >
                  <div className="sticky top-6 p-5 rounded-xl border border-border bg-card space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md text-white" style={{ background: disciplineColors[selectedNodeData.discipline] }}>
                          {selectedNodeData.discipline}
                        </span>
                        <h3 className="text-base font-bold mt-2" style={{ fontFamily: 'var(--font-display)' }}>{selectedNodeData.name}</h3>
                      </div>
                      <button onClick={() => setSelectedNode(null)} className="p-1 rounded-lg hover:bg-accent">
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">{selectedNodeData.description}</p>

                    <div className="p-3 rounded-lg border border-border/50 bg-accent/30">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Building2 className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-semibold">FS Application</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{selectedNodeData.fsApplication}</p>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-primary" />
                        Connections ({connectedEdges.length})
                      </h4>
                      <div className="space-y-2">
                        {connectedEdges.map((edge, i) => {
                          const otherNodeId = edge.from === selectedNode ? edge.to : edge.from;
                          const otherNode = nodes.find(n => n.id === otherNodeId);
                          if (!otherNode) return null;
                          return (
                            <button
                              key={i}
                              onClick={() => setSelectedNode(otherNodeId)}
                              className="w-full text-left p-2.5 rounded-lg border border-border/50 hover:border-primary/30 transition-all"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: disciplineColors[otherNode.discipline] }} />
                                <span className="text-[10px] font-semibold">{otherNode.name}</span>
                                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ml-auto ${edge.strength === 'strong' ? 'bg-green-900/30 text-green-400' : edge.strength === 'moderate' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-muted text-muted-foreground'}`}>
                                  {edge.strength}
                                </span>
                              </div>
                              <p className="text-[9px] text-muted-foreground leading-relaxed">{edge.relationship}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Navigation>
  );
}
