"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ApproachGuide from "@/components/problem/ApproachGuide";
import NotesEditor from "@/components/problem/NotesEditor";
import PeerDiscussions from "@/components/problem/PeerDiscussions";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  FileText,
  FileEdit,
  MessageSquare,
  RotateCcw,
  Plus,
  Minus,
  Sparkles,
} from "lucide-react";

export default function ProblemDetailPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const params = useParams();
  const slug = params?.slug as string;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"overview" | "approaches" | "notes" | "discussions">("overview");
  const [openHints, setOpenHints] = useState<Record<number, boolean>>({});

  // Query single problem
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["problem", slug],
    queryFn: async () => {
      const res = await fetch(`/api/problems/${slug}`);
      if (!res.ok) throw new Error("Problem not found");
      return res.json();
    },
    enabled: !!slug,
  });

  const problem = response?.data;

  // Mutation to update progress
  const progressMutation = useMutation({
    mutationFn: async (payload: {
      problemId: string;
      status?: "UNSOLVED" | "IN_PROGRESS" | "SOLVED";
      incrementRevision?: boolean;
      revisionCount?: number;
      isBookmarked?: boolean;
      notes?: string;
    }) => {
      const res = await fetch("/api/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update progress");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["problem", slug] });
      queryClient.invalidateQueries({ queryKey: ["problems"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
  });

  const toggleHint = (idx: number) => {
    setOpenHints((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const requireAuth = () => {
    if (!session?.user) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/problems/${slug}`)}`);
      return false;
    }
    return true;
  };

  const handleCycleStatus = () => {
    if (!problem || !requireAuth()) return;
    const current = problem.userProgress?.status || "UNSOLVED";
    const nextMap: Record<string, "UNSOLVED" | "IN_PROGRESS" | "SOLVED"> = {
      UNSOLVED: "IN_PROGRESS",
      IN_PROGRESS: "SOLVED",
      SOLVED: "UNSOLVED",
    };
    progressMutation.mutate({
      problemId: problem.id,
      status: nextMap[current],
    });
  };

  const handleToggleBookmark = () => {
    if (!problem || !requireAuth()) return;
    progressMutation.mutate({
      problemId: problem.id,
      isBookmarked: !problem.userProgress?.isBookmarked,
    });
  };

  const handleRevisionDelta = (delta: number) => {
    if (!problem || !requireAuth()) return;
    const curr = problem.userProgress?.revisionCount || 0;
    progressMutation.mutate({
      problemId: problem.id,
      revisionCount: Math.max(0, curr + delta),
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 space-y-6 animate-pulse bg-black min-h-screen">
        <div className="h-6 w-32 bg-[#14213d] rounded" />
        <div className="h-20 bg-[#14213d]/60 rounded-2xl border border-[#203460]" />
        <div className="h-96 bg-[#14213d]/60 rounded-2xl border border-[#203460]" />
      </div>
    );
  }

  if (isError || !problem) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-4 bg-black min-h-screen">
        <h2 className="text-2xl font-bold text-white">Problem not found</h2>
        <p className="text-sm text-[#e5e5e5]/70">
          The requested problem could not be found or has not been loaded.
        </p>
        <Link
          href="/problems"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fca311] text-black text-xs font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Problem Tracker
        </Link>
      </div>
    );
  }

  const difficultyClass =
    problem.difficulty === "EASY"
      ? "bg-white/10 text-white border-white/20"
      : problem.difficulty === "MEDIUM"
      ? "bg-[#fca311]/15 text-[#fca311] border-[#fca311]/30"
      : "bg-rose-500/15 text-rose-400 border-rose-500/30";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-black min-h-screen">
      {/* Back link */}
      <div>
        <Link
          href="/problems"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#e5e5e5]/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Problems Tracker
        </Link>
      </div>

      {/* Main Problem Header & Quick Actions Bar */}
      <div className="glass-panel-glow rounded-2xl p-6 border border-[#203460] bg-[#14213d]/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold border ${difficultyClass}`}
            >
              {problem.difficulty}
            </span>
            <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-black/60 text-[#e5e5e5] border border-[#203460]">
              {problem.topic}
            </span>
            <span className="text-xs text-[#e5e5e5]/50">Problem #{problem.order}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {problem.title}
          </h1>
        </div>

        {/* User Progress Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Toggle Button */}
          <button
            onClick={handleCycleStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              problem.userProgress?.status === "SOLVED"
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                : problem.userProgress?.status === "IN_PROGRESS"
                ? "bg-[#fca311]/20 text-[#fca311] border-[#fca311]/40"
                : "bg-black/60 text-[#e5e5e5] border-[#203460] hover:border-[#fca311]/30"
            }`}
          >
            {problem.userProgress?.status === "SOLVED" ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Solved</span>
              </>
            ) : problem.userProgress?.status === "IN_PROGRESS" ? (
              <>
                <Clock className="h-4 w-4 text-[#fca311]" />
                <span>In Progress</span>
              </>
            ) : (
              <>
                <Circle className="h-4 w-4 text-[#e5e5e5]/40" />
                <span>Mark as Solved</span>
              </>
            )}
          </button>

          {/* Bookmark Button */}
          <button
            onClick={handleToggleBookmark}
            className={`p-2 rounded-xl border transition-all ${
              problem.userProgress?.isBookmarked
                ? "bg-[#fca311]/20 text-[#fca311] border-[#fca311]/40"
                : "bg-black/60 text-[#e5e5e5]/50 border-[#203460] hover:text-white hover:border-[#fca311]/30"
            }`}
            title="Toggle Bookmark"
          >
            <Bookmark
              className={`h-4 w-4 ${
                problem.userProgress?.isBookmarked ? "fill-[#fca311] text-[#fca311]" : ""
              }`}
            />
          </button>

          {/* Revision Stepper */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-[#203460] text-xs">
            <RotateCcw className="h-3.5 w-3.5 text-[#fca311]" />
            <span className="text-[#e5e5e5]/70">Revisions:</span>
            <span className="font-bold text-white font-mono px-1">
              {problem.userProgress?.revisionCount || 0}
            </span>
            <div className="flex items-center gap-1 pl-1">
              <button
                onClick={() => handleRevisionDelta(-1)}
                disabled={(problem.userProgress?.revisionCount || 0) <= 0}
                className="p-1 rounded bg-[#14213d] hover:bg-[#1a2c52] text-[#e5e5e5]/70 hover:text-white disabled:opacity-30"
              >
                <Minus className="h-2.5 w-2.5" />
              </button>
              <button
                onClick={() => handleRevisionDelta(1)}
                className="p-1 rounded bg-[#14213d] hover:bg-[#1a2c52] text-[#e5e5e5]/70 hover:text-white"
              >
                <Plus className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#203460] pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "overview"
              ? "bg-[#fca311] text-black shadow-md shadow-[#fca311]/25"
              : "text-[#e5e5e5] hover:text-white hover:bg-[#14213d]"
          }`}
        >
          <FileText className="h-4 w-4 stroke-[2.5]" />
          <span>Tab 1: Problem Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("approaches")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "approaches"
              ? "bg-[#fca311] text-black shadow-md shadow-[#fca311]/25"
              : "text-[#e5e5e5] hover:text-white hover:bg-[#14213d]"
          }`}
        >
          <Layers className="h-4 w-4 stroke-[2.5]" />
          <span>Tab 2: Solution Blueprint & Approaches ({problem.approaches?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("notes")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "notes"
              ? "bg-[#fca311] text-black shadow-md shadow-[#fca311]/25"
              : "text-[#e5e5e5] hover:text-white hover:bg-[#14213d]"
          }`}
        >
          <FileEdit className="h-4 w-4 stroke-[2.5]" />
          <span>Tab 3: Personal Scratchpad</span>
        </button>

        <button
          onClick={() => setActiveTab("discussions")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "discussions"
              ? "bg-[#fca311] text-black shadow-md shadow-[#fca311]/25"
              : "text-[#e5e5e5] hover:text-white hover:bg-[#14213d]"
          }`}
        >
          <MessageSquare className="h-4 w-4 stroke-[2.5]" />
          <span>Tab 4: Peer Discussion</span>
        </button>
      </div>

      {/* Tab 1: Problem Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Description Card */}
          <div className="glass-panel rounded-2xl p-6 border border-[#203460] space-y-4 bg-[#14213d]/60">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#fca311]">
              Problem Description
            </h3>
            <div className="text-sm text-[#e5e5e5] leading-relaxed whitespace-pre-wrap font-sans">
              {problem.description}
            </div>

            {/* External Platform Links */}
            <div className="pt-4 border-t border-[#203460] flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-[#e5e5e5]/70">External Platforms:</span>
              {problem.externalLinks?.leetcode && (
                <a
                  href={problem.externalLinks.leetcode}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fca311]/15 hover:bg-[#fca311]/25 text-[#fca311] border border-[#fca311]/30 text-xs font-bold transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  LeetCode
                </a>
              )}
              {problem.externalLinks?.tuf && (
                <a
                  href={problem.externalLinks.tuf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14213d] hover:bg-[#1a2c52] text-white border border-[#203460] text-xs font-semibold transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Take U Forward (TUF)
                </a>
              )}
              {problem.externalLinks?.gfg && (
                <a
                  href={problem.externalLinks.gfg}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  GeeksforGeeks
                </a>
              )}
            </div>
          </div>

          {/* Hints Accordion */}
          {problem.hints && problem.hints.length > 0 && (
            <div className="glass-panel rounded-2xl p-6 border border-[#203460] space-y-3 bg-[#14213d]/60">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#fca311]" />
                Problem Hints ({problem.hints.length})
              </h3>
              <div className="space-y-2">
                {problem.hints.map((hint: string, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#203460] bg-black/60 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleHint(idx)}
                      className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-white hover:bg-[#14213d]/60 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#fca311]/20 text-[#fca311] text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>Hint #{idx + 1}</span>
                      </span>
                      {openHints[idx] ? (
                        <ChevronUp className="h-4 w-4 text-[#fca311]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#e5e5e5]/50" />
                      )}
                    </button>
                    {openHints[idx] && (
                      <div className="p-3.5 pt-0 text-xs text-[#e5e5e5]/80 leading-relaxed border-t border-[#203460]/40">
                        {hint}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Approach Guide */}
      {activeTab === "approaches" && (
        <ApproachGuide approaches={problem.approaches || []} />
      )}

      {/* Tab 3: Personal Scratchpad */}
      {activeTab === "notes" && (
        <NotesEditor
          problemId={problem.id}
          initialNotes={problem.userProgress?.notes}
          onSave={async (notes: string) => {
            await progressMutation.mutateAsync({
              problemId: problem.id,
              notes,
            });
          }}
        />
      )}

      {/* Tab 4: Peer Discussions */}
      {activeTab === "discussions" && <PeerDiscussions slug={slug} />}
    </div>
  );
}
