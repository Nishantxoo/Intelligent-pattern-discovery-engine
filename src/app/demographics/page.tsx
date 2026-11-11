"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useAppStore } from "@/lib/store/useAppStore";
import { Users, ShoppingBag, Repeat, Award, Globe, ShieldCheck, PieChart as PieIcon, ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { motion } from "framer-motion";

interface CustomerBehaviorSummary {
  status: string;
  segmentation_type: string;
  total_unique_customers: number;
  repeat_customers: number;
  repeat_purchase_rate_percent: number;
  average_units_per_basket: number;
  segments: Record<string, number>;
  countries: Record<string, number>;
}

interface SegmentPreference {
  customer_segment: string;
  category: string;
  purchase_count: number;
  total_segment_purchases: number;
  probability: number;
  age_group: string;
}

interface DemographicsResponse {
  status: string;
  summary: CustomerBehaviorSummary;
  preferences: SegmentPreference[];
}

export default function DemographicsPage() {
  const { datasetId } = useAppStore();
  const [selectedSegment, setSelectedSegment] = useState<string>("High spend");

  const { data, isLoading, error } = useQuery<DemographicsResponse>({
    queryKey: ["customer-behavior", datasetId],
    enabled: Boolean(datasetId),
    queryFn: async () => {
      return apiClient.post<DemographicsResponse>("/api/demographics/analyze", {
        dataset_id: datasetId!,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-muted-foreground">
        <Users className="h-10 w-10 mb-4 animate-pulse text-indigo-400 opacity-60" />
        <p className="font-medium text-foreground">Analyzing Customer Behavioral Tiers...</p>
        <p className="text-xs text-muted-foreground mt-1">Extracting RFM frequency segments and category purchase affinities</p>
      </div>
    );
  }

  if (error || !data || data.status !== "success") {
    return (
      <div className="p-8 text-center text-muted-foreground bg-card border rounded-xl">
        <p className="font-semibold text-foreground">Customer Behavior Analysis Unavailable</p>
        <p className="text-xs mt-1">Please ensure backend models are initialized.</p>
      </div>
    );
  }

  const summary = data.summary;
  const preferences = data.preferences || [];

  // Filter preferences for selected segment
  const segmentPrefs = preferences
    .filter((p) => p.customer_segment === selectedSegment || p.age_group === selectedSegment)
    .sort((a, b) => b.probability - a.probability);

  const segmentColors: Record<string, string> = {
    "High spend": "#818cf8",
    "Mid spend": "#34d399",
    "Low spend": "#fbbf24",
  };

  const segmentDescriptions: Record<string, string> = {
    "High spend": "Customers in the top third of total spend in this dataset.",
    "Mid spend": "Customers in the middle third of total spend in this dataset.",
    "Low spend": "Customers in the bottom third of total spend in this dataset.",
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Customer Segmentation • Grouped by Real Purchase Habits</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center text-white tracking-tight">
            <Users className="mr-3 h-8 w-8 text-indigo-400" />
            Customer Behavior & Buyer Types
          </h1>
          <p className="text-zinc-300 mt-1 text-sm">
            Understand who your buyers are—from your VIP accounts to one-time shoppers—and what categories they purchase most.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-card border px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-300">
          <Repeat className="h-3.5 w-3.5 text-emerald-400" />
          <span>Loyalty: <strong className="text-emerald-400">{summary.repeat_purchase_rate_percent.toFixed(1)}%</strong> return rate</span>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1">
            <Users className="h-4 w-4 text-indigo-400" /> Total Shoppers
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {summary.total_unique_customers.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Individual customer accounts</div>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1">
            <Repeat className="h-4 w-4 text-emerald-400" /> Returning Shoppers
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {summary.repeat_customers.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {summary.repeat_purchase_rate_percent.toFixed(1)}% repeat purchase rate
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1">
            <ShoppingBag className="h-4 w-4 text-amber-400" /> Average Cart Size
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {summary.average_units_per_basket.toFixed(0)} units
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Average products per bulk order</div>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1">
            <Globe className="h-4 w-4 text-sky-400" /> Primary Location
          </div>
          <div className="text-2xl font-bold font-mono text-white">United Kingdom</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">91.7% of all purchase volume</div>
        </div>
      </div>

      {/* Segments Exploration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Behavioral Tier Selectors */}
        <div className="lg:col-span-1 border rounded-xl bg-card p-5 space-y-4 shadow-sm">
          <div className="font-semibold text-sm border-b pb-3 text-white flex items-center justify-between">
            <span>Customer Buyer Groups</span>
            <span className="text-xs text-zinc-400 font-normal">Click group to inspect</span>
          </div>

          <div className="space-y-3">
            {Object.entries(summary.segments).map(([segName, count]) => {
              const isSelected = selectedSegment === segName;
              const totalItems = Object.values(summary.segments).reduce((a, b) => a + b, 0);
              const pct = ((count / totalItems) * 100).toFixed(1);
              const color = segmentColors[segName] || "#818cf8";

              return (
                <div
                  key={segName}
                  onClick={() => setSelectedSegment(segName)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600/10 border-indigo-500 shadow-sm"
                      : "bg-background border-border hover:border-zinc-600 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }}></span>
                      {segName}
                    </div>
                    <span className="text-xs font-mono font-bold" style={{ color }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {segmentDescriptions[segName] || "Customer cluster"}
                  </div>
                  <div className="mt-3 text-[11px] font-mono text-zinc-400 flex justify-between pt-2 border-t border-border/40">
                    <span>Purchased items:</span>
                    <span className="font-semibold text-foreground">{count.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Tier Category Affinities */}
        <div className="lg:col-span-2 border rounded-xl bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6 pb-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <PieIcon className="h-5 w-5 text-indigo-400" />
                  Category Affinity: <span className="text-indigo-400">{selectedSegment}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Empirical probability distribution of purchasing across product categories
                </p>
              </div>

              <span className="text-xs font-mono px-2.5 py-1 rounded bg-secondary text-foreground">
                {segmentPrefs.length} Categories Analyzed
              </span>
            </div>

            {/* Horizontal Bar Chart of Affinities */}
            <div className="h-[300px] w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={segmentPrefs}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    tick={{ fontSize: 11, fill: "#ffffff", fontWeight: 600 }}
                    axisLine={{ stroke: "#ffffff", opacity: 0.5 }}
                    tickLine={{ stroke: "#ffffff", opacity: 0.5 }}
                    domain={[0, 0.4]}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 12, fill: "#ffffff", fontWeight: 700 }}
                    axisLine={{ stroke: "#ffffff", opacity: 0.5 }}
                    tickLine={{ stroke: "#ffffff", opacity: 0.5 }}
                    width={135}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#090d16",
                      borderColor: "#4338ca",
                      borderRadius: "10px",
                      fontSize: "12px",
                      color: "#ffffff",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.6)"
                    }}
                    itemStyle={{ color: "#818cf8", fontWeight: 600 }}
                    labelStyle={{ color: "#ffffff", fontWeight: 700 }}
                    formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}% purchase share`, "Affinity"]}
                  />
                  <Bar dataKey="probability" radius={[0, 6, 6, 0]}>
                    {segmentPrefs.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? "#818cf8" : index === 1 ? "#6366f1" : "#4f46e5"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Detailed Category Volume
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {segmentPrefs.map((pref) => (
                  <div
                    key={pref.category}
                    className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-background border border-border"
                  >
                    <span className="font-semibold text-white truncate max-w-[170px]">{pref.category}</span>
                    <span className="font-mono text-zinc-300">
                      {pref.purchase_count.toLocaleString()} units <span className="text-indigo-400 font-semibold">({(pref.probability * 100).toFixed(1)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
