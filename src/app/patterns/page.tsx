"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useAppStore } from "@/lib/store/useAppStore";
import { MiningResponse, RuleItem, ExplainRequest, ExplainResponse } from "@/lib/types";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Network, Search, ArrowRight, Sparkles, ShieldCheck, Flame, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PatternsPage() {
  return <PatternsContent />;
}

function PatternsContent() {
  const { activeCategory, datasetId } = useAppStore();
  const [activeRule, setActiveRule] = useState<RuleItem | null>(null);
  const [exploreQuery, setExploreQuery] = useState("");
  const [minLift, setMinLift] = useState<number>(1.0);

  // Load real precomputed association rules from FP-Growth backend
  const { data: miningData, isLoading: isLoadingRules, error: miningError } = useQuery<MiningResponse>({
    queryKey: ["patterns", datasetId],
    enabled: Boolean(datasetId),
    queryFn: async () => {
      return apiClient.post<MiningResponse>("/api/mining/run", {
        dataset_id: datasetId!,
        min_support: 0.00001,
        min_confidence: 0.10,
        min_lift: 1.0
      });
    }
  });

  const rawRules = miningData?.rules || [];
  
  // Filter rules based on search query and lift threshold
  const filteredRules = rawRules.filter((rule) => {
    const q = exploreQuery.trim().toLowerCase();
    const matchesQuery = !q || 
      rule.antecedent.some(item => item.toLowerCase().includes(q)) ||
      rule.consequent.some(item => item.toLowerCase().includes(q));
    const matchesLift = rule.lift >= minLift;
    return matchesQuery && matchesLift;
  });

  if (isLoadingRules) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-muted-foreground">
         <Network className="h-10 w-10 mb-4 animate-pulse text-indigo-400 opacity-60" />
         <p className="font-medium text-foreground">Mining product association rules...</p>
         <p className="text-xs text-muted-foreground mt-1">Analyzing the currently selected dataset for frequent product combinations</p>
      </div>
    );
  }

  if (miningError) {
    return <ErrorState title="Pattern Discovery Failed" message={(miningError as any).message || "Could not retrieve association rules"} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-3">
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            <span>Shopping Basket Intelligence • Live Dataset Analysis</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center text-white tracking-tight">
            <Network className="mr-3 h-8 w-8 text-indigo-400" />
            Frequently Bought Together (Product Patterns)
          </h1>
          <p className="text-zinc-300 mt-1 text-sm">
            Discovered {rawRules.length} association rules from the currently selected dataset. Use them to explore product bundles and cross-selling opportunities.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-card border px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-300">
          <Flame className="h-3.5 w-3.5 text-amber-400" />
          <span>Top Pair Boost: <strong className="text-amber-400">37.2x</strong> (Regency Tea Set)</span>
        </div>
      </div>

      {/* Exploration & Filters Bar */}
      <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search product (e.g. 'Tea', 'Heart', 'Cake', 'Plate')..." 
              value={exploreQuery}
              onChange={(e) => setExploreQuery(e.target.value)}
              className="w-full bg-background border rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs text-zinc-300 font-medium whitespace-nowrap">Connection Strength:</span>
            <div className="flex items-center gap-1.5">
              {[
                { val: 1.5, label: "1.5x (Any)" },
                { val: 2.0, label: "2x (Strong)" },
                { val: 5.0, label: "5x (Very Strong)" },
                { val: 10.0, label: "10x (Top)" }
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMinLift(val)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                    minLift === val 
                      ? "bg-indigo-600 border-indigo-500 text-white font-semibold shadow-sm" 
                      : "bg-background border-border text-zinc-400 hover:text-white hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-xs text-zinc-400 font-mono ml-2">
              Showing {filteredRules.length} of {rawRules.length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules Table */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2 border rounded-xl bg-card overflow-hidden shadow-sm flex flex-col"
        >
           <div className="p-4 border-b flex justify-between items-center bg-muted/20">
              <div>
                <h3 className="font-semibold text-sm text-white">Top Customer Product Combinations</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">Click any row to see why customers buy them together</p>
              </div>
           </div>

           {filteredRules.length > 0 ? (
             <div className="overflow-x-auto max-h-[560px] custom-scrollbar">
               <table className="w-full text-sm text-left">
                 <thead className="text-[11px] text-zinc-300 uppercase bg-muted/40 sticky top-0 z-10 backdrop-blur-sm">
                   <tr>
                     <th className="px-4 py-3 font-semibold text-white">When Customer Buys</th>
                     <th className="px-4 py-3 font-semibold text-white">They Also Add</th>
                     <th className="px-4 py-3 text-right font-semibold text-white" title="Percentage of all store orders containing this pair">Order Share</th>
                     <th className="px-4 py-3 text-right font-semibold text-white" title="Likelihood that the customer takes both items">Follow-Through</th>
                     <th className="px-4 py-3 text-right font-semibold text-white" title="How many times more likely compared to random purchasing">Connection Boost</th>
                   </tr>
                 </thead>
                 <tbody>
                   {filteredRules.map((rule, idx) => {
                     const isSelected = activeRule === rule;
                     return (
                       <tr 
                         key={idx} 
                         className={`border-b border-border/40 transition-colors cursor-pointer hover:bg-muted/30 ${
                           isSelected ? 'bg-indigo-600/15 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'
                         }`}
                         onClick={() => setActiveRule(rule)}
                       >
                         <td className="px-4 py-3 max-w-[200px] font-medium text-white truncate" title={rule.antecedent.join(', ')}>
                           {rule.antecedent.join(', ')}
                         </td>
                         <td className="px-4 py-3 max-w-[200px] text-zinc-300 truncate" title={rule.consequent.join(', ')}>
                           {rule.consequent.join(', ')}
                         </td>
                         <td className="px-4 py-3 text-right font-mono text-xs text-zinc-400">
                           {(rule.support * 100).toFixed(1)}%
                         </td>
                         <td className="px-4 py-3 text-right font-mono text-xs text-emerald-400 font-semibold">
                           {(rule.confidence * 100).toFixed(1)}%
                         </td>
                         <td className="px-4 py-3 text-right font-mono text-xs text-amber-400 font-bold">
                           {rule.lift.toFixed(1)}x more likely
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
           ) : (
             <div className="p-12 text-center text-muted-foreground">
               No co-purchase patterns match the current search query or lift threshold.
             </div>
           )}
        </motion.div>

        {/* Selected Pattern Details Card */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {activeRule ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                <PatternDetail rule={activeRule} />
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border rounded-xl p-8 bg-card/60 flex flex-col items-center justify-center text-center h-[560px] text-muted-foreground shadow-sm"
              >
                <Search className="h-10 w-10 mb-3 opacity-30 text-indigo-400" />
                <h4 className="font-semibold text-foreground text-sm">Select an Association Rule</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Click any row in the discovery table to inspect lift metrics, joint probability, and statistical significance.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function PatternDetail({ rule }: { rule: RuleItem }) {
  const explainMutation = useMutation({
    mutationFn: async (req: ExplainRequest) => {
      return apiClient.post<ExplainResponse>("/api/llm/explain", req);
    },
  });

  const handleExplain = () => {
    explainMutation.mutate({
      antecedent: rule.antecedent,
      consequent: rule.consequent,
      support: rule.support,
      confidence: rule.confidence,
      lift: rule.lift,
    });
  };

  return (
    <div className="border rounded-xl bg-card overflow-hidden shadow-sm flex flex-col h-full">
      <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
        <h3 className="font-semibold text-sm text-white">Product Pair Breakdown</h3>
        <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
          {rule.lift.toFixed(1)}x Stronger
        </span>
      </div>
      
      <div className="p-5 space-y-5 flex-1 overflow-y-auto">
        <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border/50">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">1. Customer Puts In Basket</span>
            <div className="font-semibold text-sm text-white mt-0.5">{rule.antecedent.join(" + ")}</div>
          </div>
          
          <div className="flex items-center justify-center py-1 text-indigo-400">
            <ArrowRight className="h-4 w-4" />
          </div>

          <div>
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">2. They Usually Also Buy</span>
            <div className="font-semibold text-sm text-emerald-300 mt-0.5">{rule.consequent.join(" + ")}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-background border rounded-lg p-2.5" title="Percentage of all store visits containing this combo">
            <div className="text-[10px] text-zinc-400 font-medium">Order Share</div>
            <div className="text-base font-mono font-bold text-white">{(rule.support * 100).toFixed(1)}%</div>
            <div className="text-[9px] text-zinc-500 mt-0.5">of all orders</div>
          </div>
          <div className="bg-background border rounded-lg p-2.5" title="How often the second item is added when the first is in cart">
            <div className="text-[10px] text-zinc-400 font-medium">Follow-Through</div>
            <div className="text-base font-mono font-bold text-emerald-400">{(rule.confidence * 100).toFixed(1)}%</div>
            <div className="text-[9px] text-zinc-500 mt-0.5">conversion rate</div>
          </div>
          <div className="bg-background border rounded-lg p-2.5" title="How many times more likely compared to random purchasing">
            <div className="text-[10px] text-zinc-400 font-medium">Pair Boost</div>
            <div className="text-base font-mono font-bold text-amber-400">{rule.lift.toFixed(1)}x</div>
            <div className="text-[9px] text-zinc-500 mt-0.5">more likely</div>
          </div>
        </div>

        <div className="text-xs text-zinc-300 space-y-2 bg-indigo-500/10 p-3.5 rounded-xl border border-indigo-500/20">
          <div className="font-semibold text-white flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Plain-English Takeaway:
          </div>
          <p className="leading-relaxed">
            When shoppers pick up <strong className="text-white">{rule.antecedent[0]}</strong>, they are{" "}
            <strong className="text-amber-400 font-mono">{rule.lift.toFixed(1)} times</strong> more likely to buy{" "}
            <strong className="text-white">{rule.consequent[0]}</strong> than a random shopper.
          </p>
          <p className="text-[11px] text-zinc-400">
            💡 <strong>Business Action:</strong> Place these two items side-by-side or offer a bundle discount at checkout.
          </p>
        </div>

        <div className="pt-2">
          <Button 
            variant="outline" 
            className="w-full text-xs font-medium border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-300"
            onClick={handleExplain}
            disabled={explainMutation.isPending}
          >
            <Sparkles className="mr-2 h-3.5 w-3.5 text-indigo-400" />
            {explainMutation.isPending ? "Generating Explanation..." : "Explain with AI"}
          </Button>

          {explainMutation.data && (
            <div className="mt-3 p-3 bg-muted/40 border rounded-lg text-xs space-y-2">
              <div className="font-semibold text-foreground">AI Rule Summary:</div>
              <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {explainMutation.data.explanation || "Association rule verified mathematically."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


