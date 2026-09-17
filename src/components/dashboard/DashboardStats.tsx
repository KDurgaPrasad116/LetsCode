"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  Bookmark,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  BarChart3,
} from "lucide-react";

export interface UserStatsResponse {
  totalProblems: number;
  solvedCount: number;
  inProgressCount: number;
  unsolvedCount: number;
  bookmarkedCount: number;
  totalRevisions: number;
  streak?: number;
  completionRate: number;
  difficultyStats: {
    EASY: { total: number; solved: number };
    MEDIUM: { total: number; solved: number };
    HARD: { total: number; solved: number };
  };
  topics: {
    topic: string;
    total: number;
    solved: number;
    percentage: number;
  }[];
}

export default function DashboardStats() {
  const { data: stats, isLoading, isError } = useQuery<UserStatsResponse>({
    queryKey: ["user-stats"],
    queryFn: async () => {
      const res = await fetch("/api/user/stats");
      if (!res.ok) throw new Error("Failed to load user metrics");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-[#14213d]/60 border border-[#203460]" />
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
        Failed to fetch real-time dashboard statistics. Please refresh or try again.
      </div>
    );
  }

  // Circular progress calculation
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.completionRate / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Overall Completion Ring */}
        <div className="glass-panel-glow rounded-2xl p-5 border border-[#203460] bg-[#14213d]/70 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#e5e5e5]/70 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-[#fca311]" />
              Completion Rate
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {stats.completionRate}%
              </span>
              <span className="text-xs text-[#e5e5e5]/60">
                ({stats.solvedCount}/{stats.totalProblems} Solved)
              </span>
            </div>
            <p className="text-[11px] text-[#fca311] flex items-center gap-1 font-medium">
              <TrendingUp className="h-3 w-3" />
              {stats.streak && stats.streak > 0
                ? `${stats.streak} day streak active!`
                : "Solve daily to build streak!"}
            </p>
          </div>

          {/* SVG Radial Progress */}
          <div className="relative h-24 w-24 flex items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-black"
                strokeWidth="9"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-[#fca311] transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(252,163,17,0.5)]"
                strokeWidth="9"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-5 w-5 text-[#fca311]" />
            </div>
          </div>
        </div>

        {/* Card 2: Status Breakdown */}
        <div className="glass-panel rounded-2xl p-5 border border-[#203460] bg-[#14213d]/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#e5e5e5]/70 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#fca311]" />
              Problem States
            </span>
            <span className="text-xs text-[#e5e5e5]/60 font-mono">{stats.totalProblems} total</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-white">
                <span className="h-2 w-2 rounded-full bg-white shadow-sm" /> Solved
              </span>
              <span className="font-bold text-[#fca311]">{stats.solvedCount}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-[#fca311]">
                <span className="h-2 w-2 rounded-full bg-[#fca311]" /> In Progress
              </span>
              <span className="font-semibold text-white">{stats.inProgressCount}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-[#e5e5e5]/60">
                <span className="h-2 w-2 rounded-full bg-[#203460]" /> Unsolved
              </span>
              <span className="font-semibold text-[#e5e5e5]/80">{stats.unsolvedCount}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Revisions & Spaced Repetition */}
        <div className="glass-panel rounded-2xl p-5 border border-[#203460] bg-[#14213d]/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#e5e5e5]/70 flex items-center gap-1.5">
              <RotateCcw className="h-4 w-4 text-[#fca311]" />
              Total Revisions
            </span>
            <span className="p-1.5 rounded-lg bg-[#fca311]/15 text-[#fca311] border border-[#fca311]/30">
              <RotateCcw className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {stats.totalRevisions}
          </div>
          <p className="text-[11px] text-[#e5e5e5]/70">
            Recorded problem revisit reps. Consistency beats intensity!
          </p>
        </div>

        {/* Card 4: Starred & Bookmarked */}
        <div className="glass-panel rounded-2xl p-5 border border-[#203460] bg-[#14213d]/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#e5e5e5]/70 flex items-center gap-1.5">
              <Bookmark className="h-4 w-4 text-[#fca311]" />
              Bookmarked
            </span>
            <span className="p-1.5 rounded-lg bg-[#fca311]/15 text-[#fca311] border border-[#fca311]/30">
              <Bookmark className="h-3.5 w-3.5 fill-[#fca311]" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {stats.bookmarkedCount}
          </div>
          <p className="text-[11px] text-[#e5e5e5]/70">
            Important tricky questions saved for rapid revision before interviews.
          </p>
        </div>
      </div>

      {/* Difficulty Breakdown & Topic Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Difficulty Bars */}
        <div className="glass-panel rounded-2xl p-6 border border-[#203460] bg-[#14213d]/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#fca311]" />
              Difficulty Mastery
            </h3>
            <span className="text-xs text-[#e5e5e5]/60">Progress Breakdown</span>
          </div>

          <div className="space-y-4 pt-1">
            {/* Easy */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-white font-semibold">Easy</span>
                <span className="text-[#e5e5e5]">
                  {stats.difficultyStats.EASY.solved} / {stats.difficultyStats.EASY.total}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-black/60 overflow-hidden border border-[#203460]/60">
                <div
                  className="h-full rounded-full bg-white transition-all duration-700"
                  style={{
                    width: `${
                      stats.difficultyStats.EASY.total > 0
                        ? (stats.difficultyStats.EASY.solved / stats.difficultyStats.EASY.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Medium */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-[#fca311] font-semibold">Medium</span>
                <span className="text-[#e5e5e5]">
                  {stats.difficultyStats.MEDIUM.solved} / {stats.difficultyStats.MEDIUM.total}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-black/60 overflow-hidden border border-[#203460]/60">
                <div
                  className="h-full rounded-full bg-[#fca311] transition-all duration-700"
                  style={{
                    width: `${
                      stats.difficultyStats.MEDIUM.total > 0
                        ? (stats.difficultyStats.MEDIUM.solved / stats.difficultyStats.MEDIUM.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Hard */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-rose-400 font-semibold">Hard</span>
                <span className="text-[#e5e5e5]">
                  {stats.difficultyStats.HARD.solved} / {stats.difficultyStats.HARD.total}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-black/60 overflow-hidden border border-[#203460]/60">
                <div
                  className="h-full rounded-full bg-rose-500 transition-all duration-700"
                  style={{
                    width: `${
                      stats.difficultyStats.HARD.total > 0
                        ? (stats.difficultyStats.HARD.solved / stats.difficultyStats.HARD.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Topic-Wise Distribution */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-[#203460] bg-[#14213d]/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#fca311]" />
              Topic-Wise Proficiency
            </h3>
            <span className="text-xs text-[#e5e5e5]/60">Mastery by Concept</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {stats.topics.map((item) => (
              <div
                key={item.topic}
                className="p-3 rounded-xl bg-black/50 border border-[#203460] hover:border-[#fca311]/40 transition-colors"
              >
                <div className="flex justify-between items-center text-xs font-semibold text-white mb-2">
                  <span className="truncate pr-2">{item.topic}</span>
                  <span className="text-[#fca311] font-mono font-bold">{item.percentage}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-black overflow-hidden border border-[#203460]/40">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#fca311] to-[#ffb74d] transition-all duration-700"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#e5e5e5]/60 mt-1.5">
                  <span>Solved {item.solved} of {item.total}</span>
                  <span>{item.total - item.solved} remaining</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
