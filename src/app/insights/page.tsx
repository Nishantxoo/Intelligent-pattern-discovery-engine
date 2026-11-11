"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store/useAppStore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles, AlertCircle, RefreshCw, Lightbulb, ShieldCheck, ArrowRight } from "lucide-react";
import type { Insight } from "@/lib/types";

export default function InsightsPage() {
  const { datasetId } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);

  const activeId = datasetId;

  const handleGenerate = async () => {
    if (!activeId) {
      setInsights([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.generateInsights(activeId);
      setInsights(data.insights || []);
    } catch (err: any) {
      setError(err.message || "Failed to generate insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Automated Store Recommendations • Data-Backed Insights</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center">
            <Sparkles className="mr-3 h-8 w-8 text-indigo-400" />
            Automated Business Insights
          </h1>
          <p className="text-zinc-300 mt-1 text-sm">
            Key takeaways on top product pairings, customer purchase habits, and merchandising opportunities in plain English.
          </p>
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm"
        >
          {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Lightbulb className="h-4 w-4 mr-2" />}
          Refresh Insights
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <RefreshCw className="h-8 w-8 mb-4 animate-spin text-indigo-400 opacity-60" />
          <p className="text-sm">Synthesizing store recommendations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, idx) => (
            <Card key={idx} className="bg-card border rounded-xl overflow-hidden shadow-sm hover:border-indigo-500/30 transition-all">
              <CardHeader className="p-5 pb-3">
                <div className="flex justify-between items-start gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    insight.importance === "High" 
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                      : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  }`}>
                    {insight.type} • {insight.importance} Impact
                  </span>
                  {insight.metrics?.lift && (
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {Number(insight.metrics.lift).toFixed(2)}x Boost
                    </span>
                  )}
                </div>
                <CardTitle className="text-base text-foreground mt-3 font-semibold leading-snug">
                  {insight.pattern}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-border/40 text-center font-mono text-xs">
                  {insight.metrics?.support !== undefined && (
                    <div className="bg-background border rounded-lg p-2">
                      <div className="text-[10px] text-zinc-400 uppercase">Order Share</div>
                      <div className="font-bold text-foreground">{(Number(insight.metrics.support) * 100).toFixed(1)}%</div>
                    </div>
                  )}
                  {insight.metrics?.confidence !== undefined && (
                    <div className="bg-background border rounded-lg p-2">
                      <div className="text-[10px] text-zinc-400 uppercase">Follow-Through</div>
                      <div className="font-bold text-emerald-400">{(Number(insight.metrics.confidence) * 100).toFixed(1)}%</div>
                    </div>
                  )}
                  {insight.metrics?.lift !== undefined && (
                    <div className="bg-background border rounded-lg p-2">
                      <div className="text-[10px] text-zinc-400 uppercase">Connection Boost</div>
                      <div className="font-bold text-amber-400">{Number(insight.metrics.lift).toFixed(2)}x</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
