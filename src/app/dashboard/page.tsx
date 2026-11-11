"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { Monitor, Laptop, Paperclip, LayoutGrid, Heart, Coffee, Shirt, Smartphone, Car, Dumbbell, ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { setActiveCategory } = useAppStore();
  const router = useRouter();

  const handleCategorySelect = (category: string) => {
    setActiveCategory(category);
    // After selecting a category, navigate to the first exploration area
    router.push("/patterns");
  };

  const categories = [
    {
      id: "Home Decor & Lighting",
      name: "Home Decor & Lighting",
      icon: <LayoutGrid className="h-6 w-6 text-indigo-400" />
    },
    {
      id: "Kitchenware & Dining",
      name: "Kitchenware & Dining",
      icon: <Coffee className="h-6 w-6 text-indigo-400" />
    },
    {
      id: "Bags & Personal Items",
      name: "Bags & Personal Items",
      icon: <Shirt className="h-6 w-6 text-indigo-400" />
    },
    {
      id: "Seasonal & Holiday",
      name: "Seasonal & Holiday",
      icon: <Heart className="h-6 w-6 text-indigo-400" />
    },
    {
      id: "Craft & Stationery",
      name: "Craft & Stationery",
      icon: <Paperclip className="h-6 w-6 text-indigo-400" />
    },
    {
      id: "General Merchandise",
      name: "General Merchandise",
      icon: <Sparkles className="h-6 w-6 text-indigo-400" />
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-background text-foreground rounded-3xl border border-white/5 shadow-2xl">
      {/* Dynamic Background Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 w-full h-full p-8 md:p-12 lg:p-16 flex flex-col">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-16 max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Category Explorer
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white to-white/50">
            Select a Product Category
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed">
            Explore shopping patterns, customer behavior, sales trends, and AI-powered demand forecasts for each retail department.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6"
        >
          {categories.map((category) => (
            <motion.div
              variants={itemVariants}
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className="group relative cursor-pointer overflow-hidden rounded-[24px] bg-secondary/20 border border-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-secondary/40 hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-indigo-500/10"
            >
              {/* Subtle inner gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="h-12 w-12 rounded-2xl bg-background/80 border border-white/10 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:border-indigo-500/30 transition-transform duration-300 ease-out">
                  {category.icon}
                </div>
                
                <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-indigo-100 transition-colors">
                  {category.name}
                </h3>
                
                <p className="text-xs text-muted-foreground font-medium mb-6 group-hover:text-muted-foreground/80 transition-colors line-clamp-2">
                  Explore patterns, segments, and trends.
                </p>
                
                <div className="mt-auto flex items-center text-xs font-bold uppercase tracking-wide text-indigo-400 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  Explore <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
