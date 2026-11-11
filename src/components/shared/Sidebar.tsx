"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Database, LineChart, PieChart, Sparkles, TrendingUp, Network, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store/useAppStore";

export function Sidebar() {
  const pathname = usePathname();

  // Hide sidebar on landing page
  if (pathname === "/") return null;

  return (
    <aside className="w-64 border-r border-border bg-card/80 backdrop-blur-xl flex-shrink-0 flex flex-col hidden md:flex transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-border/50">
        <Sparkles className="h-5 w-5 text-indigo-500 mr-2" />
        <span className="font-semibold text-lg tracking-tight">Retail Intelligence</span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto">
        <div className="pt-2 pb-1 px-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Explore</p>
        </div>
        <NavItem href="/dashboard" icon={<Activity className="h-4 w-4" />} label="Categories" active={pathname === "/dashboard"} />
        <NavItem href="/patterns" icon={<Network className="h-4 w-4" />} label="Product Patterns" active={pathname === "/patterns"} />
        <NavItem href="/demographics" icon={<PieChart className="h-4 w-4" />} label="Customer Behavior" active={pathname === "/demographics"} />
        <NavItem href="/temporal" icon={<LineChart className="h-4 w-4" />} label="Trends" active={pathname === "/temporal"} />
        <NavItem href="/forecasting" icon={<TrendingUp className="h-4 w-4" />} label="Forecast" active={pathname === "/forecasting"} />
        
        <div className="pt-4 pb-1 px-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Understand</p>
        </div>
        
        <NavItem href="/insights" icon={<Sparkles className="h-4 w-4" />} label="AI Explanations" active={pathname === "/insights"} />
      </nav>
      <DatasetManager />
      <div className="p-4 border-t border-border/50 text-xs text-muted-foreground bg-secondary/20">
        Intelligent Pattern Discovery Engine
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
        active 
          ? "bg-indigo-500/10 text-indigo-400" 
          : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
      }`}
    >
      <span className={`mr-3 transition-colors ${active ? "text-indigo-400" : "text-muted-foreground group-hover:text-foreground"}`}>
        {icon}
      </span>
      {label}
      {active && (
        <span className="ml-auto w-1 h-4 bg-indigo-500 rounded-full" />
      )}
    </Link>
  );
}


function DatasetManager() {
  const { datasetId, setDatasetId } = useAppStore();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const uploadStarted = useRef(false);
  const bootStarted = useRef(false);

  useEffect(() => {
    if (datasetId || bootStarted.current) return;
    bootStarted.current = true;
    setBusy(true);
    setMessage("Loading sample dataset…");
    api.loadDemoDataset()
      .then((result) => {
        if (!uploadStarted.current) {
          setDatasetId(result.dataset_id);
          setMessage(`Sample data ready · ${result.row_count.toLocaleString()} rows`);
          setError(false);
        }
      })
      .catch((err: unknown) => {
        if (!uploadStarted.current) {
          setMessage(err instanceof Error ? err.message : "Could not connect to the API.");
          setError(true);
        }
      })
      .finally(() => setBusy(false));
  }, [datasetId, setDatasetId]);

  async function handleUpload(file?: File) {
    if (!file) return;
    uploadStarted.current = true;
    setBusy(true);
    setError(false);
    setMessage(`Uploading ${file.name}…`);
    try {
      const result = await api.uploadDataset(file);
      setDatasetId(result.dataset_id);
      await queryClient.invalidateQueries();
      setMessage(`Loaded ${file.name} · ${result.row_count.toLocaleString()} rows`);
    } catch (err) {
      setError(true);
      setMessage(err instanceof Error ? err.message : "Dataset upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function loadDemo() {
    uploadStarted.current = true;
    setBusy(true);
    setError(false);
    setMessage("Loading sample dataset…");
    try {
      const result = await api.loadDemoDataset();
      setDatasetId(result.dataset_id);
      await queryClient.invalidateQueries();
      setMessage(`Sample data ready · ${result.row_count.toLocaleString()} rows`);
    } catch (err) {
      setError(true);
      setMessage(err instanceof Error ? err.message : "Could not load sample data.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-border/50 p-4 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Database className="h-3.5 w-3.5" /> Dataset
      </div>
      <label className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-2.5 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20 ${busy ? "pointer-events-none opacity-60" : ""}`}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Upload CSV / Excel
        <input type="file" accept=".csv,.xlsx,.xls,.xlsm" className="hidden" disabled={busy} onChange={(e) => { void handleUpload(e.target.files?.[0]); e.currentTarget.value = ""; }} />
      </label>
      <button type="button" onClick={() => void loadDemo()} disabled={busy} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50">
        Use sample dataset
      </button>
      {message && <p className={`break-words text-[11px] leading-relaxed ${error ? "text-red-400" : "text-muted-foreground"}`} role="status">
        <span className="inline-flex items-start gap-1.5">{error ? <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" /> : datasetId && !busy ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" /> : null}{message}</span>
      </p>}
    </div>
  );
}
