"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Trophy,
  Flame,
  Search,
  UserPlus,
  UserCheck,
  Clock,
  Sparkles,
  BookOpen,
  Code2,
  Briefcase,
  Layers,
  MessageSquare,
  Award,
  Crown,
  Medal,
  CheckCircle2,
  ArrowRight,
  Filter,
} from "lucide-react";

interface Peer {
  id: string;
  name: string;
  email: string;
  bio: string;
  targetCompany: string;
  favoriteLanguage: string;
  solvedCount: number;
  streak: number;
  revisionsCount: number;
  avatarBg: string;
  connectionStatus?: "NONE" | "PENDING" | "CONNECTED";
}

interface LeaderboardItem {
  id: string;
  name: string;
  targetCompany: string;
  favoriteLanguage: string;
  solvedCount: number;
  streak: number;
  revisionsCount: number;
  avatarBg: string;
  rank: number;
  isCurrentUser?: boolean;
}

const TARGET_COMPANIES = [
  "ALL",
  "Google",
  "Meta",
  "Amazon",
  "Apple",
  "Microsoft",
  "Netflix",
  "Jane Street",
  "Stripe",
];
const LANGUAGES = ["ALL", "Python", "C++", "Java"];

export default function CommunityPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"buddies" | "leaderboard">("buddies");
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [langFilter, setLangFilter] = useState("ALL");

  // Query peers
  const { data: peersData, isLoading: peersLoading } = useQuery<{ peers: Peer[] }>({
    queryKey: ["peers", { search, company: companyFilter, language: langFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (companyFilter !== "ALL") params.append("company", companyFilter);
      if (langFilter !== "ALL") params.append("language", langFilter);
      const res = await fetch(`/api/community/peers?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch peers");
      return res.json();
    },
  });

  // Query leaderboard
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery<{
    leaderboard: LeaderboardItem[];
  }>({
    queryKey: ["community-leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/community/leaderboard");
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
  });

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async (peerId: string) => {
      const res = await fetch("/api/community/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId }),
      });
      if (!res.ok) throw new Error("Failed to toggle connection");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["peers"] });
    },
  });

  const handleConnectClick = (peer: Peer) => {
    if (!session?.user) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent("/community")}`);
      return;
    }
    connectMutation.mutate(peer.id);
  };

  const peers = peersData?.peers || [];
  const leaderboard = leaderboardData?.leaderboard || [];
  const topStreak =
    leaderboard.length > 0 ? Math.max(...leaderboard.map((u) => u.streak || 0)) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-black min-h-screen">
      {/* Header Banner */}
      <div className="glass-panel-glow rounded-2xl p-6 sm:p-8 border border-[#203460] bg-[#14213d]/70 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fca311]/10 border border-[#fca311]/30 text-[#fca311] text-xs font-semibold">
            <Users className="h-3.5 w-3.5" />
            <span>DSA Peer Network & Study Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Connect With Fellow Engineers
          </h1>
          <p className="text-xs sm:text-sm text-[#e5e5e5]/70 leading-relaxed">
            Finding accountability buddies increases interview prep consistency by 300%. Connect with peers
            targeting the same companies, benchmark your rank, and exchange intuition blueprints.
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-[#203460] pt-4 md:pt-0 md:pl-6">
          <div className="text-center px-2">
            <div className="text-2xl font-extrabold text-white">{peers.length}</div>
            <div className="text-[11px] text-[#e5e5e5]/60">Active Buddies</div>
          </div>
          <div className="h-8 w-px bg-[#203460]" />
          <div className="text-center px-2">
            <div className="text-2xl font-extrabold text-[#fca311] flex items-center justify-center gap-1">
              <Flame className="h-5 w-5 fill-[#fca311]" />
              <span>{topStreak}d</span>
            </div>
            <div className="text-[11px] text-[#e5e5e5]/60">Top Streak</div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-[#203460] pb-3">
        <button
          onClick={() => setActiveTab("buddies")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "buddies"
              ? "bg-[#fca311] text-black shadow-lg shadow-[#fca311]/25"
              : "text-[#e5e5e5] hover:text-white hover:bg-[#14213d]"
          }`}
        >
          <UserPlus className="h-4 w-4 stroke-[2.5]" />
          <span>Find Study Buddies ({peers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "leaderboard"
              ? "bg-[#fca311] text-black shadow-lg shadow-[#fca311]/25"
              : "text-[#e5e5e5] hover:text-white hover:bg-[#14213d]"
          }`}
        >
          <Trophy className="h-4 w-4 stroke-[2.5]" />
          <span>Community Leaderboard</span>
        </button>
      </div>

      {/* TAB 1: STUDY BUDDIES */}
      {activeTab === "buddies" && (
        <div className="space-y-6">
          {/* Filters & Search Toolbar */}
          <div className="glass-panel rounded-2xl p-4 border border-[#203460] space-y-3 bg-[#14213d]/60">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#e5e5e5]/50" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search peers by name, target company, or bio..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/60 border border-[#203460] text-sm text-white placeholder-[#e5e5e5]/40 focus:outline-none focus:border-[#fca311] focus:ring-1 focus:ring-[#fca311] transition-all"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-black/60 border border-[#203460] text-xs font-medium text-[#e5e5e5] focus:outline-none focus:border-[#fca311]"
                >
                  <option value="ALL">All Target Companies</option>
                  {TARGET_COMPANIES.filter((c) => c !== "ALL").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={langFilter}
                  onChange={(e) => setLangFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-black/60 border border-[#203460] text-xs font-medium text-[#e5e5e5] focus:outline-none focus:border-[#fca311]"
                >
                  <option value="ALL">All Languages</option>
                  {LANGUAGES.filter((l) => l !== "ALL").map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>

                {(search || companyFilter !== "ALL" || langFilter !== "ALL") && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setCompanyFilter("ALL");
                      setLangFilter("ALL");
                    }}
                    className="px-3 py-2 rounded-xl text-xs text-[#e5e5e5]/80 hover:text-white bg-[#14213d] border border-[#203460] transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Peer Cards Grid */}
          {peersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-60 rounded-2xl bg-[#14213d]/60 border border-[#203460]" />
              ))}
            </div>
          ) : peers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {peers.map((peer) => (
                <div
                  key={peer.id}
                  className="glass-panel-glow rounded-2xl p-6 border border-[#203460] bg-[#14213d]/60 flex flex-col justify-between space-y-4 hover:border-[#fca311]/50 transition-all group"
                >
                  <div className="space-y-3">
                    {/* Peer Header: Avatar, Name, Language */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-11 w-11 rounded-2xl bg-[#14213d] border border-[#fca311]/50 flex items-center justify-center text-[#fca311] font-extrabold text-sm shadow-md"
                        >
                          {peer.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-[#fca311] transition-colors">
                            {peer.name}
                          </h3>
                          <span className="text-[11px] text-[#e5e5e5]/60 flex items-center gap-1 font-mono">
                            <Code2 className="h-3 w-3 text-[#fca311]" />
                            {peer.favoriteLanguage}
                          </span>
                        </div>
                      </div>

                      {/* Streak Pill */}
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fca311]/10 border border-[#fca311]/30 text-[#fca311] text-xs font-semibold">
                        <Flame className="h-3.5 w-3.5 fill-[#fca311]" />
                        <span>{peer.streak}d</span>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-[#e5e5e5]/80 line-clamp-2 leading-relaxed">
                      {peer.bio}
                    </p>

                    {/* Target Company Badge */}
                    <div className="flex items-center gap-1.5 text-xs text-[#e5e5e5]/70 pt-1">
                      <Briefcase className="h-3.5 w-3.5 text-[#fca311]" />
                      <span>Targeting:</span>
                      <span className="font-semibold text-white">{peer.targetCompany}</span>
                    </div>
                  </div>

                  {/* Metrics & Action Button */}
                  <div className="pt-3 border-t border-[#203460] flex items-center justify-between gap-2">
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-white font-mono">
                        {peer.solvedCount} <span className="text-[#e5e5e5]/50 font-normal text-[11px]">/ 250 solved</span>
                      </div>
                      <div className="text-[10px] text-[#fca311]/90">
                        {peer.revisionsCount} revisions logged
                      </div>
                    </div>

                    {/* Connection Button */}
                    <button
                      onClick={() => handleConnectClick(peer)}
                      disabled={connectMutation.isPending}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        peer.connectionStatus === "CONNECTED"
                          ? "bg-white/15 text-white border border-white/30 hover:bg-white/20"
                          : peer.connectionStatus === "PENDING"
                          ? "bg-[#fca311]/20 text-[#fca311] border border-[#fca311]/40 hover:bg-[#fca311]/25"
                          : "bg-[#fca311] hover:bg-[#e5930e] text-black shadow-md shadow-[#fca311]/20 hover:scale-[1.02] active:scale-[0.98]"
                      }`}
                    >
                      {peer.connectionStatus === "CONNECTED" ? (
                        <>
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Connected</span>
                        </>
                      ) : peer.connectionStatus === "PENDING" ? (
                        <>
                          <Clock className="h-3.5 w-3.5" />
                          <span>Pending</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-[#e5e5e5]/60 glass-panel rounded-2xl border border-[#203460] space-y-3 bg-[#14213d]/40">
              <Users className="h-8 w-8 text-[#e5e5e5]/40 mx-auto" />
              <p className="text-base font-semibold text-white">
                {search || companyFilter !== "ALL" || langFilter !== "ALL"
                  ? "No matching peers found"
                  : "No community peers registered yet"}
              </p>
              <p className="text-xs text-[#e5e5e5]/50 max-w-sm mx-auto">
                {search || companyFilter !== "ALL" || langFilter !== "ALL"
                  ? "Try adjusting your company or language filters."
                  : "When other engineers sign up on LetsCode, they will appear here so you can connect and study together."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMMUNITY LEADERBOARD */}
      {activeTab === "leaderboard" && (
        <div className="space-y-6">
          {/* Top Podium Cards */}
          {leaderboard.length >= 3 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* Silver (2nd) */}
              <div className="glass-panel rounded-2xl p-6 border border-[#e5e5e5]/40 bg-[#14213d]/80 flex flex-col items-center text-center space-y-3 relative order-2 md:order-1">
                <div className="h-10 w-10 rounded-full bg-white/10 text-white border border-white/30 flex items-center justify-center font-bold text-sm">
                  #2
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-slate-400 to-[#e5e5e5] text-black flex items-center justify-center font-extrabold text-xl shadow-lg">
                  {leaderboard[1].name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white">{leaderboard[1].name}</h3>
                  <p className="text-xs text-[#e5e5e5]/70">{leaderboard[1].targetCompany}</p>
                </div>
                <div className="flex items-center gap-3 pt-2 text-xs font-mono">
                  <span className="text-white font-bold">{leaderboard[1].solvedCount} Solved</span>
                  <span className="text-[#fca311] flex items-center gap-0.5">
                    <Flame className="h-3 w-3 fill-[#fca311]" /> {leaderboard[1].streak}d
                  </span>
                </div>
              </div>

              {/* Gold (1st) */}
              <div className="glass-panel-glow rounded-2xl p-6 border-2 border-[#fca311] bg-gradient-to-b from-[#14213d] to-black flex flex-col items-center text-center space-y-3 relative order-1 md:order-2 md:-translate-y-3 shadow-2xl shadow-[#fca311]/20">
                <div className="h-10 w-10 rounded-full bg-[#fca311]/20 text-[#fca311] border border-[#fca311]/50 flex items-center justify-center font-bold text-sm">
                  <Crown className="h-5 w-5 fill-[#fca311]" />
                </div>
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#fca311] to-[#ffb74d] text-black flex items-center justify-center font-extrabold text-2xl shadow-xl shadow-[#fca311]/30">
                  {leaderboard[0].name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{leaderboard[0].name}</h3>
                  <p className="text-xs text-[#fca311] font-semibold">{leaderboard[0].targetCompany}</p>
                </div>
                <div className="flex items-center gap-3 pt-2 text-xs font-mono">
                  <span className="text-white font-bold">{leaderboard[0].solvedCount} Solved</span>
                  <span className="text-[#fca311] flex items-center gap-0.5 font-bold">
                    <Flame className="h-3.5 w-3.5 fill-[#fca311]" /> {leaderboard[0].streak}d
                  </span>
                </div>
              </div>

              {/* Bronze (3rd) */}
              <div className="glass-panel rounded-2xl p-6 border border-[#203460] bg-[#14213d]/60 flex flex-col items-center text-center space-y-3 relative order-3 md:order-3">
                <div className="h-10 w-10 rounded-full bg-[#14213d] text-[#e5e5e5] border border-[#203460] flex items-center justify-center font-bold text-sm">
                  #3
                </div>
                <div className="h-14 w-14 rounded-2xl bg-[#14213d] border border-[#203460] text-[#fca311] flex items-center justify-center font-extrabold text-xl shadow-lg">
                  {leaderboard[2].name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white">{leaderboard[2].name}</h3>
                  <p className="text-xs text-[#e5e5e5]/70">{leaderboard[2].targetCompany}</p>
                </div>
                <div className="flex items-center gap-3 pt-2 text-xs font-mono">
                  <span className="text-white font-bold">{leaderboard[2].solvedCount} Solved</span>
                  <span className="text-[#fca311] flex items-center gap-0.5">
                    <Flame className="h-3 w-3 fill-[#fca311]" /> {leaderboard[2].streak}d
                  </span>
                </div>
              </div>
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="flex justify-center pt-2">
              <div className="glass-panel-glow rounded-2xl p-6 border-2 border-[#fca311] bg-gradient-to-b from-[#14213d] to-black flex flex-col items-center text-center space-y-3 w-full max-w-sm shadow-xl shadow-[#fca311]/20">
                <div className="h-10 w-10 rounded-full bg-[#fca311]/20 text-[#fca311] border border-[#fca311]/50 flex items-center justify-center font-bold text-sm">
                  <Crown className="h-5 w-5 fill-[#fca311]" />
                </div>
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#fca311] to-[#ffb74d] text-black flex items-center justify-center font-extrabold text-2xl shadow-xl shadow-[#fca311]/30">
                  {leaderboard[0].name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{leaderboard[0].name}</h3>
                  <p className="text-xs text-[#fca311] font-semibold">{leaderboard[0].targetCompany}</p>
                </div>
                <div className="flex items-center gap-3 pt-2 text-xs font-mono">
                  <span className="text-white font-bold">{leaderboard[0].solvedCount} Solved</span>
                  <span className="text-[#fca311] flex items-center gap-0.5 font-bold">
                    <Flame className="h-3.5 w-3.5 fill-[#fca311]" /> {leaderboard[0].streak}d
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Full Leaderboard Table */}
          <div className="glass-panel rounded-2xl border border-[#203460] overflow-hidden shadow-xl bg-[#14213d]/40">
            <table className="w-full text-left text-sm text-[#e5e5e5]">
              <thead className="bg-[#14213d] text-[11px] uppercase tracking-wider text-[#e5e5e5]/80 border-b border-[#203460] font-semibold">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4">Engineer</th>
                  <th className="py-3.5 px-4">Target Role</th>
                  <th className="py-3.5 px-4">Language</th>
                  <th className="py-3.5 px-4 text-center">Problems Solved</th>
                  <th className="py-3.5 px-4 text-center">Streak</th>
                  <th className="py-3.5 px-4 text-center">Revisions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#203460]/60">
                {leaderboardLoading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="py-4 px-4 bg-[#14213d]/40" />
                    </tr>
                  ))
                ) : leaderboard.length > 0 ? (
                  leaderboard.map((user) => (
                    <tr
                      key={user.id}
                      className={`hover:bg-[#14213d]/80 transition-colors ${
                        user.isCurrentUser ? "bg-[#fca311]/15 border-l-4 border-[#fca311]" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-[#e5e5e5] font-mono">
                        {user.rank === 1 ? (
                          <span className="text-[#fca311] font-extrabold">🥇 1</span>
                        ) : user.rank === 2 ? (
                          <span className="text-white font-bold">🥈 2</span>
                        ) : user.rank === 3 ? (
                          <span className="text-[#fca311]/80 font-bold">🥉 3</span>
                        ) : (
                          `#${user.rank}`
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-8 w-8 rounded-xl bg-[#14213d] border border-[#203460] text-[#fca311] flex items-center justify-center font-bold text-xs"
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-white">{user.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#e5e5e5]">{user.targetCompany}</td>
                      <td className="py-3.5 px-4 text-xs font-mono text-[#fca311]">
                        {user.favoriteLanguage}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold font-mono text-white">
                        {user.solvedCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold font-mono text-[#fca311]">
                        <span className="inline-flex items-center gap-1">
                          <Flame className="h-3 w-3 fill-[#fca311]" />
                          {user.streak}d
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-[#e5e5e5]/80">
                        {user.revisionsCount}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-[#e5e5e5]/60">
                      <Trophy className="h-6 w-6 text-[#fca311]/60 mx-auto mb-2" />
                      <p className="font-semibold text-white">Leaderboard is waiting for solvers</p>
                      <p className="text-[11px] text-[#e5e5e5]/50 mt-1">
                        Sign in and solve problems to claim your rank on the leaderboard!
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
