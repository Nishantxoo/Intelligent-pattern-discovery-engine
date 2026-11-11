"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store/useAppStore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  LineChart as LineChartIcon, 
  AlertCircle, 
  Play, 
  Calendar, 
  ShieldCheck, 
  Filter, 
  Layers, 
  Package, 
  DollarSign, 
  Hash, 
  TrendingUp, 
  Loader2,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import type { TemporalTrend } from "@/lib/types";

export default function TemporalPage() {
  const { datasetId, activeCategory, setActiveCategory } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trend, setTrend] = useState<TemporalTrend[] | null>(null);

  // Options state
  const [selectedCategory, setSelectedCategory] = useState<string>(activeCategory || "All Categories");
  const [selectedProduct, setSelectedProduct] = useState<string>("All Products");
  const [selectedMetric, setSelectedMetric] = useState<string>("transaction_count"); // transaction_count, quantity, revenue
  const [granularity, setGranularity] = useState<string>("month"); // month, week

  // Dynamic dropdown options populated from backend
  const [categories, setCategories] = useState<string[]>([
    "All Categories",
    "General Merchandise",
    "Home Decor & Lighting",
    "Kitchenware & Dining",
    "Bags & Personal Items",
    "Seasonal & Holiday",
    "Stationery & Craft",
    "Toys & Children"
  ]);

  const [products, setProducts] = useState<string[]>([
    "All Products",
    "White Hanging Heart T-Light Holder",
    "Jumbo Bag Red Retrospot",
    "Regency Cakestand 3 Tier",
    "Party Bunting",
    "Lunch Bag Red Retrospot",
    "Assorted Colour Bird Ornament",
    "Set Of 3 Cake Tins Pantry Design",
    "Pack Of 72 Retrospot Cake Cases"
  ]);

  const activeId = datasetId;

  // Core fetcher with guaranteed smooth loader duration (350ms)
  const fetchTrendData = async (cat: string, prod: string, metric: string, gran: string) => {
    if (!activeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [data] = await Promise.all([
        api.analyzeTemporal(activeId, {
          target_category: cat,
          target_product: prod,
          metric: metric,
          granularity: gran
        }),
        new Promise((resolve) => setTimeout(resolve, 350)) // Smooth visible graph loader
      ]);

      if (data.status === "success") {
        const raw = data.monthly_trend || [];
        const normalized = raw.map((item: any) => ({
          ...item,
          period: item.period || item.year_week || item.year_month || item.date || "",
          year_month: item.year_month || item.year_week || item.period,
          year_week: item.year_week || item.year_month || item.period
        }));
        setTrend(normalized);
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
        }
      } else {
        setError(data.message || "Analysis unavailable");
      }
    } catch (err: any) {
      setError(err.message || "Failed to run temporal analysis");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const initialCat = activeCategory || selectedCategory;
    fetchTrendData(initialCat, selectedProduct, selectedMetric, granularity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Sync when activeCategory changes externally
  useEffect(() => {
    if (activeCategory && activeCategory !== selectedCategory) {
      setSelectedCategory(activeCategory);
      setSelectedProduct("All Products");
      fetchTrendData(activeCategory, "All Products", selectedMetric, granularity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  // Fast category switcher: updates state, active store, triggers loader, and reprises trend
  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedProduct("All Products");
    setActiveCategory(cat === "All Categories" ? null : cat);
    fetchTrendData(cat, "All Products", selectedMetric, granularity);
  };

  // Product selection handler
  const handleProductSelect = (prod: string) => {
    setSelectedProduct(prod);
    fetchTrendData(selectedCategory, prod, selectedMetric, granularity);
  };

  // Metric selection handler
  const handleMetricSelect = (metric: string) => {
    setSelectedMetric(metric);
    fetchTrendData(selectedCategory, selectedProduct, metric, granularity);
  };

  // Granularity selection handler
  const handleGranularitySelect = (gran: string) => {
    setGranularity(gran);
    fetchTrendData(selectedCategory, selectedProduct, selectedMetric, gran);
  };

  // Calculate summary metrics
  const totalValue = trend ? trend.reduce((sum, item) => sum + (Number(item.value) || 0), 0) : 0;
  const peakItem = trend && trend.length > 0 
    ? [...trend].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))[0] 
    : null;
  const avgMonthly = trend && trend.length > 0 ? Math.round(totalValue / trend.length) : 0;

  const metricLabel = 
    selectedMetric === "quantity" ? "Units Sold" :
    selectedMetric === "revenue" ? "Revenue (£)" : "Transactions";

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-3">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
            <span>Time-Series Aggregation • 374 Calendar Days</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center">
            <LineChartIcon className="mr-3 h-8 w-8 text-indigo-400" />
            Temporal Trends & Seasonality
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Continuous monthly purchase counts, demand velocity, and revenue trajectory across the 2010–2011 retail calendar.
          </p>
        </div>
        
        <Button 
          onClick={() => fetchTrendData(selectedCategory, selectedProduct, selectedMetric, granularity)} 
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              Reprising Trends...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="h-4 w-4" /> Refresh Timeline
            </span>
          )}
        </Button>
      </div>

      {/* Quick Category Switcher Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-indigo-400" /> Quick Category Exploration
          </label>
          <span className="text-xs text-indigo-400 font-mono font-medium">Click to Reprise Trend</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
                  active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105 border border-indigo-400"
                    : "bg-secondary/40 text-zinc-300 border border-border/80 hover:bg-secondary hover:text-white"
                }`}
              >
                {active && <Sparkles className="h-3 w-3 text-white" />}
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Options & Product Filters Section */}
      <div className="border border-border/80 rounded-2xl bg-card/90 backdrop-blur-md p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2 font-semibold text-sm text-white">
            <Filter className="h-4 w-4 text-indigo-400" />
            <span>Options Section</span>
          </div>
          <span className="text-xs text-zinc-400">
            Active Filter: <span className="font-semibold text-white">{selectedCategory}</span>
            {selectedProduct !== "All Products" && <span className="text-indigo-400"> • {selectedProduct}</span>}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Category Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-400" /> Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategorySelect(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-zinc-900 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Specific Product Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-indigo-400" /> Specific Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {products.map((prod) => (
                <option key={prod} value={prod} className="bg-zinc-900 text-white">
                  {prod}
                </option>
              ))}
            </select>
          </div>

          {/* Metric Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-indigo-400" /> Metric
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => handleMetricSelect(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="transaction_count" className="bg-zinc-900 text-white">Transaction Count</option>
              <option value="quantity" className="bg-zinc-900 text-white">Quantity (Units Sold)</option>
              <option value="revenue" className="bg-zinc-900 text-white">Revenue (£)</option>
            </select>
          </div>

          {/* Frequency Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" /> Granularity
            </label>
            <div className="grid grid-cols-2 gap-2 h-10">
              <button
                type="button"
                onClick={() => handleGranularitySelect("month")}
                className={`rounded-lg text-xs font-medium transition-all ${
                  granularity === "month"
                    ? "bg-indigo-600 text-white font-semibold shadow-sm"
                    : "bg-background border border-border text-zinc-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => handleGranularitySelect("week")}
                className={`rounded-lg text-xs font-medium transition-all ${
                  granularity === "week"
                    ? "bg-indigo-600 text-white font-semibold shadow-sm"
                    : "bg-background border border-border text-zinc-400 hover:text-white"
                }`}
              >
                Weekly
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-border/80 bg-card/80 p-4 rounded-xl shadow-sm">
          <p className="text-xs text-zinc-400 font-medium">Total Cumulative {metricLabel}</p>
          <p className="text-2xl font-bold text-white mt-1">
            {selectedMetric === "revenue" ? `£${totalValue.toLocaleString()}` : totalValue.toLocaleString()}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">13 months cumulative total for {selectedCategory}</p>
        </div>

        <div className="border border-border/80 bg-card/80 p-4 rounded-xl shadow-sm">
          <p className="text-xs text-zinc-400 font-medium">Peak Season Period</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {peakItem ? (peakItem.period || peakItem.year_week || peakItem.year_month || "—") : "—"}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            High of {peakItem ? Number(peakItem.value).toLocaleString() : 0} {metricLabel.toLowerCase()}
          </p>
        </div>

        <div className="border border-border/80 bg-card/80 p-4 rounded-xl shadow-sm">
          <p className="text-xs text-zinc-400 font-medium">Monthly Average</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">
            {selectedMetric === "revenue" ? `£${avgMonthly.toLocaleString()}` : avgMonthly.toLocaleString()}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Steady baseline run-rate</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Trajectory Chart with In-Place Loader */}
      <Card className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-lg relative">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <span>{selectedProduct !== "All Products" ? selectedProduct : selectedCategory} Trend</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                  {metricLabel}
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-zinc-300 mt-0.5">
                Trajectory tracking for <span className="text-white font-semibold">{selectedCategory}</span>
                {selectedProduct !== "All Products" && <span className="text-indigo-300"> • {selectedProduct}</span>}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-semibold">
                {trend ? `${trend.length} Periods Plotted` : "Tracking Data"}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="h-[460px] p-6 relative">
          {/* Prominent in-place graph loader overlay */}
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-background/85 backdrop-blur-sm flex flex-col items-center justify-center z-30"
              >
                <div className="relative mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center relative overflow-hidden shadow-lg">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 via-transparent to-purple-500/30"
                    />
                    <TrendingUp className="h-7 w-7 text-indigo-400 relative z-10" />
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -inset-1 rounded-2xl bg-indigo-500/30 blur-md -z-10"
                  />
                </div>

                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                  <span>Reprising Trends for {selectedProduct !== "All Products" ? selectedProduct : selectedCategory}...</span>
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Filtering and plotting continuous calendar timeline
                </p>

                <div className="w-48 bg-secondary/60 rounded-full h-1 mt-4 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                    initial={{ width: "20%" }}
                    animate={{ width: "90%" }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {trend && (
            <motion.div 
              key={`${selectedCategory}-${selectedProduct}-${selectedMetric}-${granularity}`}
              initial={{ opacity: 0.85, scale: 0.995 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 20, right: 30, left: 15, bottom: 10 }}>
                  <defs>
                    <linearGradient id="trendGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  {/* Grid with subtle white lines */}
                  <CartesianGrid strokeDasharray="3 3" opacity={0.16} stroke="#ffffff" />

                  {/* XAxis with bright white font and weekly interval spacing */}
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 11, fill: "#ffffff", fontWeight: 600 }} 
                    axisLine={{ stroke: "#ffffff", strokeWidth: 1.5, opacity: 0.6 }}
                    tickLine={{ stroke: "#ffffff", strokeWidth: 1 }}
                    interval={granularity === "week" ? 3 : 0}
                    tickFormatter={(val: string) => {
                      if (!val) return "";
                      return granularity === "week" ? val.replace(/^\d{4}-/, "") : val;
                    }}
                  />

                  {/* YAxis with bright white font */}
                  <YAxis 
                    tick={{ fontSize: 12, fill: "#ffffff", fontWeight: 600 }} 
                    axisLine={{ stroke: "#ffffff", strokeWidth: 1.5, opacity: 0.6 }}
                    tickLine={{ stroke: "#ffffff", strokeWidth: 1 }}
                    tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                  />

                  {/* Tooltip with high-contrast white text on dark card */}
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#090d16', 
                      borderColor: '#4338ca',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
                    }}
                    itemStyle={{ color: '#818cf8', fontWeight: 600 }}
                    labelStyle={{ color: '#ffffff', fontWeight: 700, marginBottom: '4px' }}
                    labelFormatter={(lbl) => `${granularity === "week" ? "Week" : "Month"}: ${lbl}`}
                    formatter={(val: any) => [
                      `${selectedMetric === "revenue" ? "£" : ""}${Number(val).toLocaleString()} ${selectedMetric === "quantity" ? "units" : selectedMetric === "revenue" ? "" : "transactions"}`, 
                      metricLabel
                    ]}
                  />

                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name={metricLabel} 
                    stroke="#818cf8" 
                    strokeWidth={3.5} 
                    dot={{ r: 5, fill: "#818cf8", stroke: "#ffffff", strokeWidth: 1.5 }}
                    activeDot={{ r: 7, fill: "#a5b4fc", stroke: "#ffffff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
