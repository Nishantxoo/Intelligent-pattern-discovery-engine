"use client";

import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { ReactNode } from "react";

interface DatasetRequiredStateProps {
  title?: string;
  message?: string;
  children: ReactNode;
}

export function DatasetRequiredState({ 
  title = "No Active Dataset", 
  message = "You need to upload and preprocess a dataset before accessing this analysis.",
  children 
}: DatasetRequiredStateProps) {
  
  const datasetId = useAppStore((state) => state.datasetId);

  if (!datasetId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Database className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-md mb-8">{message}</p>
        
        <Link href="/data">
          <Button size="lg">
            Upload Dataset
          </Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
