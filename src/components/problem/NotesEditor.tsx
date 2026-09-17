"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  FileEdit,
  Save,
  CheckCircle,
  Clock,
  Eye,
  Edit3,
  HelpCircle,
  Sparkles,
} from "lucide-react";

interface NotesEditorProps {
  problemId: string;
  initialNotes?: string | null;
  onSave?: (notes: string) => Promise<void>;
}

export default function NotesEditor({
  problemId,
  initialNotes = "",
  onSave,
}: NotesEditorProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState(initialNotes || "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setContent(initialNotes || "");
  }, [initialNotes]);

  // Debounced auto-save handler
  const handleContentChange = (val: string) => {
    setContent(val);
    setSaveStatus("idle");

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      await triggerSave(val);
    }, 1200);
  };

  const triggerSave = async (textToSave: string) => {
    if (!session?.user) {
      setSaveStatus("idle");
      return;
    }

    try {
      setSaveStatus("saving");
      if (onSave) {
        await onSave(textToSave);
      } else {
        const res = await fetch("/api/progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            problemId,
            notes: textToSave,
          }),
        });
        if (!res.ok) throw new Error("Failed to save note");
      }
      setSaveStatus("saved");
      setLastSavedTime(new Date());
    } catch (e) {
      console.error("Auto-save error:", e);
      setSaveStatus("idle");
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-[#203460] p-6 space-y-4 shadow-lg bg-[#14213d]/60">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#203460]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#fca311]/15 text-[#fca311] border border-[#fca311]/30">
            <FileEdit className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Personal Learning Scratchpad</h3>
            <p className="text-xs text-[#e5e5e5]/70">
              Auto-saved key takeaways, edge cases, and personal interview traps
            </p>
          </div>
        </div>

        {/* Action Controls & Autosave badge */}
        <div className="flex items-center gap-3">
          {/* Status badge */}
          <div className="text-xs flex items-center gap-1.5">
            {saveStatus === "saving" ? (
              <span className="flex items-center gap-1 text-[#fca311]">
                <Clock className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </span>
            ) : saveStatus === "saved" ? (
              <span className="flex items-center gap-1 text-[#fca311] font-bold">
                <CheckCircle className="h-3.5 w-3.5" />
                Saved {lastSavedTime ? `at ${lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ""}
              </span>
            ) : (
              <span className="text-[#e5e5e5]/50">Auto-save enabled</span>
            )}
          </div>

          {/* Edit / Preview Toggle */}
          <div className="flex items-center rounded-lg bg-black/60 p-0.5 border border-[#203460] text-xs">
            <button
              onClick={() => setMode("edit")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                mode === "edit"
                  ? "bg-[#fca311] text-black font-bold"
                  : "text-[#e5e5e5] hover:text-white"
              }`}
            >
              <Edit3 className="h-3 w-3" />
              Write
            </button>
            <button
              onClick={() => setMode("preview")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                mode === "preview"
                  ? "bg-[#fca311] text-black font-bold"
                  : "text-[#e5e5e5] hover:text-white"
              }`}
            >
              <Eye className="h-3 w-3" />
              Preview
            </button>
          </div>

          {/* Manual Save Button */}
          <button
            onClick={() => triggerSave(content)}
            disabled={saveStatus === "saving"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14213d] hover:bg-[#1a2c52] text-white border border-[#203460] text-xs font-semibold transition-colors disabled:opacity-50 hover:border-[#fca311]/40"
          >
            <Save className="h-3.5 w-3.5 text-[#fca311]" />
            Save Now
          </button>
        </div>
      </div>

      {/* Unauthenticated notice */}
      {!session?.user && (
        <div className="p-3 rounded-xl bg-[#14213d] border border-[#fca311]/40 text-[#e5e5e5] text-xs flex items-center justify-between">
          <span>Sign in to automatically save and sync your personal scratchpad notes across devices.</span>
          <Link
            href={`/auth/signin?callbackUrl=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.pathname : "/problems"
            )}`}
            className="font-bold underline ml-2 text-[#fca311] hover:text-[#ffb74d] whitespace-nowrap"
          >
            Sign In
          </Link>
        </div>
      )}

      {/* Editor / Preview Area */}
      {mode === "edit" ? (
        <div className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Write your personal intuition notes, common bugs, edge cases to watch out for, or time complexity trade-offs..."
            rows={10}
            className="w-full rounded-xl bg-black/80 border border-[#203460] p-4 font-mono text-sm text-white placeholder-[#e5e5e5]/40 focus:outline-none focus:border-[#fca311] focus:ring-1 focus:ring-[#fca311] transition-all resize-y leading-relaxed"
          />
          <div className="flex items-center justify-between text-[11px] text-[#e5e5e5]/60">
            <span>Markdown supported (headings, lists, backticks)</span>
            <span>{content.length} characters</span>
          </div>
        </div>
      ) : (
        <div className="min-h-[220px] rounded-xl bg-black/80 border border-[#203460] p-5 text-sm text-[#e5e5e5] leading-relaxed overflow-y-auto whitespace-pre-wrap font-sans">
          {content.trim() ? (
            content
          ) : (
            <span className="italic text-[#e5e5e5]/50">
              No notes entered yet. Switch to Write mode to jot down your findings.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
