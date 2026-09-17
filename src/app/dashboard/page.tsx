"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DashboardStats from "@/components/dashboard/DashboardStats";
import {
  LayoutDashboard,
  ArrowRight,
  Code2,
  Sparkles,
  Award,
  Zap,
  BookOpen,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Developer";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-black min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border border-[#203460] bg-[#14213d]/60">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#fca311]/10 border border-[#fca311]/30 text-[#fca311] text-xs font-semibold">
            <Sparkles className="h-3 w-3" />
            <span>DSA Mastery Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back, <span className="text-[#fca311]">{userName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#e5e5e5]/70">
            Monitor your algorithmic progress, review your weak topics, and stay interview-ready.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/problems"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fca311] hover:bg-[#e5930e] text-black font-bold text-xs shadow-lg shadow-[#fca311]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <BookOpen className="h-4 w-4 stroke-[2.5]" />
            <span>Open Problem Sheet</span>
            <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </Link>
        </div>
      </div>

      {/* KPI Overview Component */}
      <DashboardStats />

      {/* Pro Tips / Revision Strategy Advice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6 border border-[#203460] space-y-3 bg-[#14213d]/60">
          <div className="flex items-center gap-2 text-[#fca311]">
            <Zap className="h-5 w-5" />
            <h3 className="text-sm font-bold text-white">Spaced Repetition Tip</h3>
          </div>
          <p className="text-xs text-[#e5e5e5]/80 leading-relaxed">
            Aim for at least <strong>2 to 3 revisions</strong> on every Medium and Hard problem within 14 days of your initial solve. Increment the revision counter every time you successfully dry-run the optimal solution on paper.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-[#203460] space-y-3 bg-[#14213d]/60">
          <div className="flex items-center gap-2 text-white">
            <Award className="h-5 w-5 text-[#fca311]" />
            <h3 className="text-sm font-bold text-white">Pattern Recognition</h3>
          </div>
          <p className="text-xs text-[#e5e5e5]/80 leading-relaxed">
            Notice how Two Pointers and Sliding Window solve a large percentage of array subarray problems in $O(N)$ time. Read through the <strong>Approach Guides</strong> to understand why sorting enables the two-pointer technique.
          </p>
        </div>
      </div>
    </div>
  );
}
