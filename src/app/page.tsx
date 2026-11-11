"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Database, Network, TrendingUp, Lightbulb } from "lucide-react";
import { SplitText } from "@/components/ui/SplitText";
import { GridBackground } from "@/components/ui/GridBackground";

export default function LandingPage() {
  return (
    <GridBackground>
      {/* Navbar Minimal */}
      <nav className="w-full flex justify-between items-center px-6 md:px-12 py-6 z-20">
        <div className="font-bold text-xl tracking-tighter text-white flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
             <Network className="h-4 w-4 text-white" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">IPDE</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-6">
          <Link 
            href="/dashboard" 
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Categories
          </Link>
          <Link 
            href="/patterns" 
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Product Patterns
          </Link>
          <Link 
            href="/demographics" 
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Customer Behavior
          </Link>
          <Link 
            href="/temporal" 
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Trends
          </Link>
          <Link 
            href="/forecasting" 
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Forecast
          </Link>
          <Link 
            href="/insights" 
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            AI Insights
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href="/demographics" 
            className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-all"
          >
            Customer Behavior
          </Link>
          <Link 
            href="/dashboard" 
            className="text-xs font-semibold px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/30"
          >
            Explore Engine
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-20 mt-16 lg:mt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Intelligent Pattern Discovery Engine v1.0
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          <SplitText text="Find the patterns hiding in your data." delay={0.2} />
        </h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="text-lg md:text-xl text-zinc-300 max-w-2xl mb-12"
        >
          Discover what customers buy together, understand real shopper habits, and accurately predict future sales demand — made simple for any business team.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.5, type: "spring" }}
        >
          <Link 
            href="/dashboard"
            className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-indigo-600 px-8 font-medium text-white transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-[0_0_40px_8px_rgba(79,70,229,0.3)] hover:shadow-[0_0_60px_12px_rgba(79,70,229,0.5)]"
          >
            <span className="mr-2 text-lg">Explore the Engine</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </main>

      {/* Scroll Story Section */}
      <section className="w-full max-w-6xl mx-auto px-6 py-32 z-20 mt-32">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
          className="text-center mb-24"
        >
          <h2 className="text-3xl font-bold text-white mb-4">How it works</h2>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mx-auto"></div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8 relative">
          {/* Connection Line */}
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-indigo-900 to-transparent -z-10" />

          <StoryStep 
            number="01"
            title="SHOPPING DATA"
            description="Thousands of receipts and orders contain hidden shopping patterns impossible to spot by hand."
            icon={<Database className="h-8 w-8 text-zinc-400" />}
            delay={0.1}
          />
          <StoryStep 
            number="02"
            title="BUNDLE PATTERNS"
            description="Instantly reveals which products shoppers buy together so you can create high-selling bundles."
            icon={<Network className="h-8 w-8 text-indigo-400" />}
            delay={0.3}
          />
          <StoryStep 
            number="03"
            title="CUSTOMER HABITS"
            description="Groups shoppers into VIPs, Repeat Buyers, and New Visitors based on real spending habits."
            icon={<Lightbulb className="h-8 w-8 text-purple-400" />}
            delay={0.5}
          />
          <StoryStep 
            number="04"
            title="SALES FORECAST"
            description="Predicts upcoming sales demand weeks ahead so you always stock the right amount of inventory."
            icon={<TrendingUp className="h-8 w-8 text-emerald-400" />}
            delay={0.7}
          />
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="w-full border-t border-white/5 py-24 text-center z-20 mt-auto bg-black/50 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-white mb-8">Your data is waiting.</h2>
          <Link href="/dashboard">
            <button className="group inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-medium text-black transition-transform hover:scale-105 active:scale-95">
              Enter the Engine <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
        </motion.div>
      </footer>
    </GridBackground>
  );
}

function StoryStep({ number, title, description, icon, delay }: { number: string, title: string, description: string, icon: any, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay }}
      className="flex flex-col items-center text-center group"
    >
      <div className="w-24 h-24 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center mb-6 shadow-xl relative overflow-hidden transition-colors group-hover:border-indigo-500/50">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {icon}
      </div>
      <div className="text-sm font-mono text-indigo-500 mb-2">{number}</div>
      <h3 className="text-lg font-bold text-white mb-3 tracking-wide">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed max-w-[200px]">
        {description}
      </p>
    </motion.div>
  );
}
