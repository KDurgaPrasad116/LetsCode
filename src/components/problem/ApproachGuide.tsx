"use client";

import React, { useState } from "react";
import {
  Code,
  Check,
  Copy,
  Lightbulb,
  Cpu,
  HardDrive,
  FileCode2,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export interface SolutionApproachItem {
  id?: string;
  approachName: string;
  order: number;
  intuition: string;
  timeComplexity: string;
  spaceComplexity: string;
  pseudoCode: string;
  codeSnippets: {
    python?: string;
    cpp?: string;
    java?: string;
    [key: string]: string | undefined;
  };
}

interface ApproachGuideProps {
  approaches: SolutionApproachItem[];
}

export default function ApproachGuide({ approaches }: ApproachGuideProps) {
  const [selectedApproachIndex, setSelectedApproachIndex] = useState(0);
  const [activeLang, setActiveLang] = useState<"python" | "cpp" | "java">("python");
  const [copied, setCopied] = useState(false);

  if (!approaches || approaches.length === 0) {
    return (
      <div className="p-8 text-center text-[#e5e5e5]/60 glass-panel rounded-2xl border border-[#203460] bg-[#14213d]/60">
        No formal approach blueprints recorded for this problem yet.
      </div>
    );
  }

  const currentApproach = approaches[selectedApproachIndex] || approaches[0];
  const code = currentApproach.codeSnippets[activeLang] || "";

  const handleCopyCode = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Approach Tabs (Brute Force -> Optimal) */}
      <div className="glass-panel rounded-2xl p-2 border border-[#203460] bg-[#14213d]/60">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {approaches.map((ap, idx) => {
            const isSelected = idx === selectedApproachIndex;
            return (
              <button
                key={idx}
                onClick={() => setSelectedApproachIndex(idx)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-[#fca311] text-black shadow-lg shadow-[#fca311]/25 border border-[#fca311]"
                    : "text-[#e5e5e5] hover:text-white hover:bg-[#14213d] border border-transparent"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold ${
                    isSelected
                      ? "bg-black text-[#fca311]"
                      : "bg-[#14213d] text-[#e5e5e5]"
                  }`}
                >
                  {idx + 1}
                </span>
                <span>{ap.approachName}</span>
                {idx < approaches.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 opacity-40 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Approach Detail Card */}
      <div className="glass-panel rounded-2xl p-6 border border-[#203460] bg-[#14213d]/60 space-y-6">
        {/* Header & Complexity Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#203460]">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#fca311]" />
              <h3 className="text-lg font-bold text-white">
                {currentApproach.approachName}
              </h3>
            </div>
            <p className="text-xs text-[#e5e5e5]/60 mt-0.5">
              Step {selectedApproachIndex + 1} of {approaches.length} in algorithm progression
            </p>
          </div>

          {/* Complexity Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-[#203460] text-xs">
              <Cpu className="h-3.5 w-3.5 text-[#fca311]" />
              <span className="text-[#e5e5e5]/60">Time:</span>
              <span className="font-mono font-bold text-[#fca311]">
                {currentApproach.timeComplexity}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-[#203460] text-xs">
              <HardDrive className="h-3.5 w-3.5 text-white" />
              <span className="text-[#e5e5e5]/60">Space:</span>
              <span className="font-mono font-bold text-white">
                {currentApproach.spaceComplexity}
              </span>
            </div>
          </div>
        </div>

        {/* Intuition / Thought Process */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#fca311] flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-[#fca311]" />
            Core Intuition & Logic
          </h4>
          <div className="p-4 rounded-xl bg-black/60 border border-[#203460] text-sm leading-relaxed text-[#e5e5e5]">
            {currentApproach.intuition}
          </div>
        </div>

        {/* Pseudo-Code Section */}
        {currentApproach.pseudoCode && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#e5e5e5]/80 flex items-center gap-1.5">
              <FileCode2 className="h-3.5 w-3.5 text-[#fca311]" />
              Algorithmic Pseudocode
            </h4>
            <div className="rounded-xl bg-black p-4 border border-[#203460] overflow-x-auto font-mono text-xs text-[#fca311] leading-relaxed">
              <pre>{currentApproach.pseudoCode}</pre>
            </div>
          </div>
        )}

        {/* Multi-Language Code Snippet Viewer */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Code className="h-3.5 w-3.5 text-[#fca311]" />
              Implementation Snippet
            </h4>

            {/* Language Switcher & Copy */}
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg bg-black/60 p-0.5 border border-[#203460] text-xs font-medium">
                {(["python", "cpp", "java"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={`px-2.5 py-1 rounded-md capitalize transition-all ${
                      activeLang === lang
                        ? "bg-[#fca311] text-black font-bold"
                        : "text-[#e5e5e5] hover:text-white"
                    }`}
                  >
                    {lang === "cpp" ? "C++" : lang}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#14213d] hover:bg-[#1a2c52] text-white text-xs font-medium border border-[#203460] transition-colors"
                title="Copy code to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#fca311]" />
                    <span className="text-[#fca311] font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-[#e5e5e5]/60" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code Container */}
          <div className="relative rounded-2xl bg-black border border-[#203460] p-4 font-mono text-xs overflow-x-auto text-white shadow-inner">
            <pre className="leading-relaxed">
              <code>{code || "// Implementation available"}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
