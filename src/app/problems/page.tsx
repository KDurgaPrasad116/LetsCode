import React from "react";
import ProblemTable from "@/components/tracker/ProblemTable";
import { ListTodo, Sparkles } from "lucide-react";

export default function ProblemsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-black min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border border-[#203460]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#fca311]/10 border border-[#fca311]/30 text-[#fca311] text-xs font-semibold">
            <Sparkles className="h-3 w-3" />
            <span>Interactive DSA Checklist & Sheet</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ListTodo className="h-7 w-7 text-[#fca311]" />
            Problem Tracker & Explorer
          </h1>
          <p className="text-xs sm:text-sm text-[#e5e5e5]/70">
            Filter, sort, and log your progress across all 250 curriculum problems. Click on any status pill to cycle between Unsolved, Attempting, and Solved.
          </p>
        </div>
      </div>

      {/* Interactive Table */}
      <ProblemTable />
    </div>
  );
}
