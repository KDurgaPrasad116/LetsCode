"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, ThumbsUp, Send, Sparkles, User, HelpCircle } from "lucide-react";

interface Discussion {
  id: string;
  problemId: string;
  userId: string;
  userName: string;
  userAvatarBg?: string;
  content: string;
  upvotes: number;
  createdAt: string;
}

interface PeerDiscussionsProps {
  slug: string;
}

export default function PeerDiscussions({ slug }: PeerDiscussionsProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [newContent, setNewContent] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { data, isLoading } = useQuery<{ discussions: Discussion[] }>({
    queryKey: ["discussions", slug],
    queryFn: async () => {
      const res = await fetch(`/api/problems/${slug}/discussions`);
      if (!res.ok) throw new Error("Failed to load discussions");
      return res.json();
    },
  });

  const postMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/problems/${slug}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to post discussion");
      }
      return res.json();
    },
    onSuccess: () => {
      setNewContent("");
      setErrorMsg("");
      queryClient.invalidateQueries({ queryKey: ["discussions", slug] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to submit discussion");
    },
  });

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    postMutation.mutate(newContent);
  };

  const discussions = data?.discussions || [];

  return (
    <div className="space-y-6">
      {/* New Post Card */}
      <div className="glass-panel rounded-2xl p-6 border border-[#203460] space-y-4 bg-[#14213d]/60">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#fca311]/15 text-[#fca311] border border-[#fca311]/30">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Peer Discussion & Mental Models</h3>
            <p className="text-xs text-[#e5e5e5]/70">
              Share interview observations, ask peers how they handled edge cases, or discuss optimal trade-offs.
            </p>
          </div>
        </div>

        {session?.user ? (
          <form onSubmit={handlePostSubmit} className="space-y-3">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Post an algorithmic insight, interview tip, or clarify an edge case for your fellow peers..."
              rows={3}
              className="w-full rounded-xl bg-black/80 border border-[#203460] p-3.5 text-xs text-white placeholder-[#e5e5e5]/40 focus:outline-none focus:border-[#fca311] focus:ring-1 focus:ring-[#fca311] transition-all resize-y"
              required
            />
            {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={postMutation.isPending || !newContent.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#fca311] hover:bg-[#e5930e] text-black text-xs font-bold shadow-md shadow-[#fca311]/20 transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
              >
                <Send className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>{postMutation.isPending ? "Posting..." : "Share with Peers"}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-xl bg-[#14213d] border border-[#fca311]/40 text-[#e5e5e5] text-xs flex items-center justify-between">
            <span>Sign in to post questions or share solution models with fellow peers.</span>
            <Link
              href={`/auth/signin?callbackUrl=${encodeURIComponent(
                typeof window !== "undefined" ? window.location.pathname : `/problems/${slug}`
              )}`}
              className="px-3.5 py-1.5 rounded-lg bg-[#fca311] hover:bg-[#e5930e] text-black font-bold transition-colors whitespace-nowrap ml-3 shadow-sm"
            >
              Sign In to Participate
            </Link>
          </div>
        )}
      </div>

      {/* Discussion List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#fca311] flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#fca311]" />
          Peer Community Insights ({discussions.length})
        </h4>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-[#14213d]/60 border border-[#203460]" />
            ))}
          </div>
        ) : discussions.length > 0 ? (
          discussions.map((disc) => (
            <div
              key={disc.id}
              className="glass-panel rounded-2xl p-5 border border-[#203460] bg-[#14213d]/60 space-y-3 hover:border-[#fca311]/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-7 w-7 rounded-xl bg-[#14213d] border border-[#fca311]/50 flex items-center justify-center text-[#fca311] font-bold text-xs"
                  >
                    {disc.userName.charAt(0)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white">{disc.userName}</span>
                    <span className="text-[10px] text-[#e5e5e5]/60 ml-2">
                      {new Date(disc.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 border border-[#203460] text-[11px] text-[#fca311] font-semibold">
                  <ThumbsUp className="h-3 w-3" />
                  <span>{disc.upvotes}</span>
                </div>
              </div>

              <p className="text-xs text-[#e5e5e5] leading-relaxed whitespace-pre-wrap font-sans">
                {disc.content}
              </p>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-[#e5e5e5]/60 glass-panel rounded-2xl border border-[#203460] space-y-2 bg-[#14213d]/40">
            <HelpCircle className="h-6 w-6 text-[#e5e5e5]/40 mx-auto" />
            <p className="text-xs text-white font-medium">No community discussions posted yet.</p>
            <p className="text-[11px] text-[#e5e5e5]/60">
              Be the first to share your intuition or ask peers for clarification!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
