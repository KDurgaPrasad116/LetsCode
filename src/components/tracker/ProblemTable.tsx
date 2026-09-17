"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFilterStore } from "@/store/useFilterStore";
import {
  CheckCircle2,
  Circle,
  Clock,
  Bookmark,
  ExternalLink,
  Search,
  Filter,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  BookOpen,
} from "lucide-react";

export interface ProblemListItem {
  id: string;
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topic: string;
  order: number;
  externalLinks: {
    leetcode?: string;
    gfg?: string;
    tuf?: string;
  };
  approachesSummary: {
    approachName: string;
    timeComplexity: string;
    spaceComplexity: string;
  }[];
  userProgress: {
    status: "UNSOLVED" | "IN_PROGRESS" | "SOLVED";
    revisionCount: number;
    isBookmarked: boolean;
    lastSolvedAt: string | null;
    notes: string | null;
  };
}

interface ProblemsApiResponse {
  data: ProblemListItem[];
  availableTopics?: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export default function ProblemTable() {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const {
    search,
    difficulty,
    topic,
    status,
    bookmarkedOnly,
    sortBy,
    sortOrder,
    page,
    limit,
    setSearch,
    setDifficulty,
    setTopic,
    setStatus,
    setBookmarkedOnly,
    setSort,
    setPage,
    resetFilters,
  } = useFilterStore();

  // Query problems with current filter states
  const { data, isLoading, isPlaceholderData } = useQuery<ProblemsApiResponse>({
    queryKey: [
      "problems",
      { search, difficulty, topic, status, bookmarkedOnly, sortBy, sortOrder, page, limit },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        difficulty,
        topic,
        status,
        bookmarked: bookmarkedOnly ? "true" : "false",
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/problems?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch problems");
      return res.json();
    },
    placeholderData: (previousData) => previousData,
  });

  // Optimistic Mutation for Progress
  const progressMutation = useMutation({
    mutationFn: async (payload: {
      problemId: string;
      status?: "UNSOLVED" | "IN_PROGRESS" | "SOLVED";
      incrementRevision?: boolean;
      revisionCount?: number;
      isBookmarked?: boolean;
    }) => {
      const res = await fetch("/api/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update progress");
      return res.json();
    },
    onMutate: async (updatedPayload) => {
      await queryClient.cancelQueries({ queryKey: ["problems"] });

      // Snapshot previous cache queries
      const queryFilter = { queryKey: ["problems"] };
      const previousData = queryClient.getQueryData<ProblemsApiResponse>(
        queryClient.getQueryCache().findAll(queryFilter)[0]?.queryKey
      );

      // Optimistically update all problems queries in cache
      queryClient.setQueriesData<ProblemsApiResponse>(
        { queryKey: ["problems"] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((item) => {
              if (item.id === updatedPayload.problemId) {
                let nextRev = item.userProgress.revisionCount;
                if (updatedPayload.incrementRevision) {
                  nextRev += 1;
                } else if (typeof updatedPayload.revisionCount === "number") {
                  nextRev = updatedPayload.revisionCount;
                }

                return {
                  ...item,
                  userProgress: {
                    ...item.userProgress,
                    status: updatedPayload.status ?? item.userProgress.status,
                    isBookmarked:
                      updatedPayload.isBookmarked ?? item.userProgress.isBookmarked,
                    revisionCount: nextRev,
                  },
                };
              }
              return item;
            }),
          };
        }
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueriesData({ queryKey: ["problems"] }, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["problems"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
  });

  const requireAuth = () => {
    if (!session?.user) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent("/problems")}`);
      return false;
    }
    return true;
  };

  // Cycle status: UNSOLVED -> IN_PROGRESS -> SOLVED -> UNSOLVED
  const handleCycleStatus = (item: ProblemListItem) => {
    if (!requireAuth()) return;
    const cycleMap: Record<string, "UNSOLVED" | "IN_PROGRESS" | "SOLVED"> = {
      UNSOLVED: "IN_PROGRESS",
      IN_PROGRESS: "SOLVED",
      SOLVED: "UNSOLVED",
    };
    const nextStatus = cycleMap[item.userProgress.status];
    progressMutation.mutate({
      problemId: item.id,
      status: nextStatus,
    });
  };

  const handleToggleBookmark = (item: ProblemListItem) => {
    if (!requireAuth()) return;
    progressMutation.mutate({
      problemId: item.id,
      isBookmarked: !item.userProgress.isBookmarked,
    });
  };

  const handleRevisionChange = (item: ProblemListItem, delta: number) => {
    if (!requireAuth()) return;
    const newCount = Math.max(0, item.userProgress.revisionCount + delta);
    progressMutation.mutate({
      problemId: item.id,
      revisionCount: newCount,
    });
  };

  const difficultyBadge = (diff: "EASY" | "MEDIUM" | "HARD") => {
    switch (diff) {
      case "EASY":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "HARD":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }
  };

  const statusBadge = (stat: "UNSOLVED" | "IN_PROGRESS" | "SOLVED") => {
    switch (stat) {
      case "SOLVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Solved
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="h-3.5 w-3.5" />
            Attempting
          </span>
        );
      case "UNSOLVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Circle className="h-3.5 w-3.5" />
            Unsolved
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="glass-panel rounded-2xl p-4 border border-[#203460] space-y-3 bg-[#14213d]/70">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#e5e5e5]/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems by title, keywords or topic..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/60 border border-[#203460] text-sm text-white placeholder-[#e5e5e5]/40 focus:outline-none focus:border-[#fca311] focus:ring-1 focus:ring-[#fca311] transition-all"
            />
          </div>

          {/* Quick Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Difficulty Filter */}
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-black/60 border border-[#203460] text-xs font-medium text-[#e5e5e5] focus:outline-none focus:border-[#fca311]"
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-black/60 border border-[#203460] text-xs font-medium text-[#e5e5e5] focus:outline-none focus:border-[#fca311]"
            >
              <option value="ALL">All States</option>
              <option value="SOLVED">Solved</option>
              <option value="IN_PROGRESS">Attempting</option>
              <option value="UNSOLVED">Unsolved</option>
            </select>

            {/* Bookmarked toggle button */}
            <button
              onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                bookmarkedOnly
                  ? "bg-[#fca311]/20 text-[#fca311] border-[#fca311]/40 shadow-sm"
                  : "bg-black/60 text-[#e5e5e5] border-[#203460] hover:border-[#fca311]/30 hover:text-white"
              }`}
            >
              <Bookmark
                className={`h-3.5 w-3.5 ${bookmarkedOnly ? "fill-[#fca311]" : ""}`}
              />
              <span>Starred</span>
            </button>

            {/* Reset Button */}
            {(search || difficulty !== "ALL" || topic !== "ALL" || status !== "ALL" || bookmarkedOnly) && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 rounded-xl text-xs text-[#e5e5e5]/80 hover:text-white bg-[#14213d] hover:bg-[#1a2c52] border border-[#203460] transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Topic Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-[#fca311] uppercase tracking-wider pr-1">
            Topics:
          </span>
          {["ALL", ...(data?.availableTopics || [])].map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                topic === t
                  ? "bg-[#fca311] text-black font-extrabold shadow-md shadow-[#fca311]/25"
                  : "bg-black/60 text-[#e5e5e5] hover:text-white hover:bg-[#14213d] border border-[#203460]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Table */}
      <div className="glass-panel rounded-2xl border border-[#203460] overflow-hidden shadow-xl bg-[#14213d]/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#e5e5e5]">
            <thead className="bg-[#14213d] text-[11px] uppercase tracking-wider text-[#e5e5e5]/80 border-b border-[#203460] select-none font-semibold">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">Status</th>
                <th
                  onClick={() => setSort("title")}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#fca311] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Problem</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => setSort("difficulty")}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#fca311] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Difficulty</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Topic</th>
                <th className="py-3.5 px-4">Solution Blueprints</th>
                <th
                  onClick={() => setSort("revisionCount")}
                  className="py-3.5 px-4 text-center cursor-pointer hover:text-[#fca311] transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Revisions</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">Platforms</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#203460]/60">
              {isLoading ? (
                // Skeletons
                [1, 2, 3, 4, 5].map((idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4 text-center">
                      <div className="h-5 w-5 rounded-full bg-[#14213d] mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-48 rounded bg-[#14213d]" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-16 rounded bg-[#14213d]" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-24 rounded bg-[#14213d]" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-32 rounded bg-[#14213d]" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-12 rounded bg-[#14213d] mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-16 rounded bg-[#14213d] mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-8 w-20 rounded bg-[#14213d] ml-auto" />
                    </td>
                  </tr>
                ))
              ) : data?.data && data.data.length > 0 ? (
                data.data.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#14213d]/80 transition-colors group"
                  >
                    {/* Status Checkbox / Pill Toggle */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleCycleStatus(item)}
                        title={`Current: ${item.userProgress.status} (Click to toggle)`}
                        className="transition-transform active:scale-90"
                      >
                        {item.userProgress.status === "SOLVED" ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400 fill-emerald-500/20" />
                        ) : item.userProgress.status === "IN_PROGRESS" ? (
                          <Clock className="h-5 w-5 text-[#fca311]" />
                        ) : (
                          <Circle className="h-5 w-5 text-[#e5e5e5]/40 hover:text-[#fca311]" />
                        )}
                      </button>
                    </td>

                    {/* Problem Title & Bookmark */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleBookmark(item)}
                          className="text-[#e5e5e5]/40 hover:text-[#fca311] transition-colors"
                          title="Bookmark for revision"
                        >
                          <Bookmark
                            className={`h-4 w-4 ${
                              item.userProgress.isBookmarked
                                ? "text-[#fca311] fill-[#fca311]"
                                : ""
                            }`}
                          />
                        </button>
                        <Link
                          href={`/problems/${item.slug}`}
                          className="font-semibold text-white hover:text-[#fca311] transition-colors flex items-center gap-1.5"
                        >
                          <span>{item.title}</span>
                        </Link>
                      </div>
                    </td>

                    {/* Difficulty Badge */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${difficultyBadge(
                          item.difficulty
                        )}`}
                      >
                        {item.difficulty}
                      </span>
                    </td>

                    {/* Topic Badge */}
                    <td className="py-4 px-4">
                      <span className="text-xs text-[#e5e5e5] font-medium bg-black/60 px-2.5 py-1 rounded-lg border border-[#203460]">
                        {item.topic}
                      </span>
                    </td>

                    {/* Approaches Pill Breakdown */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.approachesSummary.map((ap, i) => (
                          <span
                            key={i}
                            className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#fca311]/10 text-[#fca311] border border-[#fca311]/25"
                            title={`${ap.approachName} | Time: ${ap.timeComplexity} | Space: ${ap.spaceComplexity}`}
                          >
                            {ap.timeComplexity}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Revision Counter Stepper */}
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex items-center gap-1 rounded-lg bg-black/60 border border-[#203460] p-0.5">
                        <button
                          onClick={() => handleRevisionChange(item, -1)}
                          disabled={item.userProgress.revisionCount <= 0}
                          className="p-1 text-[#e5e5e5]/60 hover:text-[#fca311] disabled:opacity-30 rounded hover:bg-[#14213d] transition-colors"
                          title="Decrease revision count"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-white font-mono">
                          {item.userProgress.revisionCount}
                        </span>
                        <button
                          onClick={() => handleRevisionChange(item, 1)}
                          className="p-1 text-[#e5e5e5]/60 hover:text-[#fca311] rounded hover:bg-[#14213d] transition-colors"
                          title="Increment revision count"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </td>

                    {/* External Platform Links */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {item.externalLinks.leetcode && (
                          <a
                            href={item.externalLinks.leetcode}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#14213d] hover:bg-[#fca311]/20 hover:text-[#fca311] text-[#e5e5e5] border border-[#203460] transition-colors"
                            title="Open on LeetCode"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {item.externalLinks.tuf && (
                          <a
                            href={item.externalLinks.tuf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#14213d] hover:bg-[#fca311]/20 hover:text-[#fca311] text-[#e5e5e5] border border-[#203460] transition-colors"
                            title="Take U Forward Striver's Guide"
                          >
                            <span className="text-[10px] font-black">TUF</span>
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Solve / View Guide Button */}
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/problems/${item.slug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fca311]/15 hover:bg-[#fca311] text-[#fca311] hover:text-black border border-[#fca311]/35 text-xs font-bold transition-all shadow-sm group-hover:border-[#fca311]"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Guide</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#e5e5e5]/60">
                    <div className="space-y-2">
                      <Sparkles className="h-8 w-8 text-[#e5e5e5]/30 mx-auto" />
                      <p className="text-base font-semibold text-white">
                        No matching problems found
                      </p>
                      <p className="text-xs text-[#e5e5e5]/50">
                        Try loosening your search filters or click Reset.
                      </p>
                      <button
                        onClick={resetFilters}
                        className="mt-2 px-4 py-1.5 rounded-lg text-xs font-bold text-black bg-[#fca311] hover:bg-[#e5930e] shadow-md transition-colors"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="px-4 py-3 bg-[#14213d] border-t border-[#203460] flex items-center justify-between text-xs text-[#e5e5e5]/70">
            <div>
              Showing{" "}
              <span className="font-semibold text-white">
                {(data.pagination.page - 1) * limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-white">
                {Math.min(data.pagination.page * limit, data.pagination.total)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#fca311]">{data.pagination.total}</span>{" "}
              problems
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/60 text-[#e5e5e5] hover:bg-[#14213d] hover:text-white border border-[#203460] disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <span className="px-2 font-mono text-[#e5e5e5]">
                Page <strong className="text-white">{page}</strong> of {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!data.pagination.hasMore}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/60 text-[#e5e5e5] hover:bg-[#14213d] hover:text-white border border-[#203460] disabled:opacity-40 transition-colors"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
