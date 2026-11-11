"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "./Sidebar";
import { 
  Sparkles, 
  Menu, 
  X, 
  Activity, 
  Network, 
  PieChart, 
  LineChart, 
  TrendingUp, 
  Home, 
  AlertTriangle 
} from "lucide-react";

class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Route render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 m-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
          <h2 className="text-lg font-bold text-foreground">Something went wrong loading this view</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            {this.state.error?.message || "An unexpected error occurred while rendering this route."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
          >
            Retry View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", icon: <Home className="h-4 w-4" />, label: "Home" },
    { href: "/dashboard", icon: <Activity className="h-4 w-4" />, label: "Categories" },
    { href: "/patterns", icon: <Network className="h-4 w-4" />, label: "Product Patterns" },
    { href: "/demographics", icon: <PieChart className="h-4 w-4" />, label: "Customer Behavior" },
    { href: "/temporal", icon: <LineChart className="h-4 w-4" />, label: "Trends" },
    { href: "/forecasting", icon: <TrendingUp className="h-4 w-4" />, label: "Forecast" },
    { href: "/insights", icon: <Sparkles className="h-4 w-4" />, label: "AI Explanations" },
  ];

  return (
    <div className={`flex flex-col md:flex-row w-full min-h-screen ${isLanding ? 'bg-[#050505]' : 'bg-background'}`}>
      <Sidebar />
      
      {/* Mobile Top Header for small/split screens */}
      {!isLanding && (
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-40">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            <span className="font-semibold text-sm tracking-tight">Retail Intelligence</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-secondary/80 text-foreground hover:bg-secondary transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>
      )}

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {!isLanding && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-border bg-card/95 backdrop-blur-xl px-4 py-3 space-y-1 z-30"
          >
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? "bg-indigo-500/10 text-indigo-400 font-semibold"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <span className={`mr-3 ${active ? "text-indigo-400" : "text-muted-foreground"}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        <motion.div
          key={pathname}
          initial={isLanding ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={`flex-1 overflow-auto ${!isLanding ? 'p-4 sm:p-6 md:p-8' : ''}`}
        >
          <RouteErrorBoundary>
            {children}
          </RouteErrorBoundary>
        </motion.div>
      </main>
    </div>
  );
}
