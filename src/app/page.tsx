import React from "react";
import Link from "next/link";
import {
  Code2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Bookmark,
  Terminal,
  ShieldCheck,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Glow ambient background with navy and golden amber */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-[#fca311]/12 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[300px] bg-[#14213d]/80 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fca311]/10 border border-[#fca311]/30 text-[#fca311] text-xs font-semibold shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Master DSA for Top Tier Tech Interviews</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Track Your DSA Journey with{" "}
            <span className="bg-gradient-to-r from-white via-[#e5e5e5] to-[#fca311] bg-clip-text text-transparent">
              Mathematical Precision
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-base sm:text-lg text-[#e5e5e5]/80 max-w-2xl mx-auto leading-relaxed">
            Stop losing track of which problems you solved and when to revise. Explore multi-tiered
            blueprints (Brute Force $\to$ Optimal), log your personalized intuition notes, and benchmark your
            readiness.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/problems"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#fca311] hover:bg-[#e5930e] text-black font-bold shadow-lg shadow-[#fca311]/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Terminal className="h-4 w-4 stroke-[2.5]" />
              <span>Explore Problems Tracker</span>
              <ArrowRight className="h-4 w-4 ml-1 stroke-[2.5]" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#14213d] hover:bg-[#1a2c52] text-white font-semibold border border-[#203460] transition-all hover:border-[#fca311]/40"
            >
              <span>View User Dashboard</span>
            </Link>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
            <div className="glass-panel-glow rounded-2xl p-6 border border-[#203460] space-y-3 bg-[#14213d]/60">
              <div className="h-10 w-10 rounded-xl bg-[#fca311]/15 text-[#fca311] border border-[#fca311]/30 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Multi-Tiered Blueprints</h3>
              <p className="text-xs text-[#e5e5e5]/70 leading-relaxed">
                Step-by-step evolution from Brute Force $\to$ Better $\to$ Optimal two-pointer/hash map solutions with clear time & space trade-offs.
              </p>
            </div>

            <div className="glass-panel-glow rounded-2xl p-6 border border-[#203460] space-y-3 bg-[#14213d]/60">
              <div className="h-10 w-10 rounded-xl bg-white/10 text-white border border-white/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Spaced Repetition & Revisions</h3>
              <p className="text-xs text-[#e5e5e5]/70 leading-relaxed">
                Track how many times you’ve revisited tricky questions, star problems for rapid mock interview prep, and retain concepts longer.
              </p>
            </div>

            <div className="glass-panel-glow rounded-2xl p-6 border border-[#203460] space-y-3 bg-[#14213d]/60">
              <div className="h-10 w-10 rounded-xl bg-[#fca311]/15 text-[#fca311] border border-[#fca311]/30 flex items-center justify-center">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Personal Markdown Scratchpad</h3>
              <p className="text-xs text-[#e5e5e5]/70 leading-relaxed">
                Auto-saved private notes and edge case logs for every problem. Never forget that off-by-one error or hash map key clash again.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
