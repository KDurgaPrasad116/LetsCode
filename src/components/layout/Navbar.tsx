"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Code2,
  LayoutDashboard,
  ListTodo,
  Users,
  Sparkles,
  LogOut,
  LogIn,
  User as UserIcon,
  Flame,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const { data: stats } = useQuery<{ streak?: number }>({
    queryKey: ["user-stats"],
    queryFn: async () => {
      const res = await fetch("/api/user/stats");
      if (!res.ok) return { streak: 0 };
      return res.json();
    },
    enabled: status === "authenticated",
  });

  const streakCount = stats?.streak ?? 0;

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/problems", label: "Problems Sheet", icon: ListTodo },
    { href: "/community", label: "Community", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#14213d] bg-black/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#fca311] to-[#ffb74d] text-black shadow-lg shadow-[#fca311]/25 group-hover:scale-105 transition-transform font-bold">
              <Code2 className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                LetsCode <span className="text-black text-xs font-extrabold px-1.5 py-0.5 rounded bg-[#fca311] shadow-sm">DSA</span>
              </span>
              <p className="text-[10px] text-[#e5e5e5]/60 font-medium leading-none">Mastery & Progress Hub</p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#fca311]/15 text-[#fca311] border border-[#fca311]/35 font-semibold"
                      : "text-[#e5e5e5] hover:text-white hover:bg-[#14213d]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Dynamic Streak indicator for authenticated users */}
          {status === "authenticated" ? (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fca311]/10 border border-[#fca311]/30 text-[#fca311] text-xs font-semibold">
              <Flame
                className={`h-3.5 w-3.5 ${
                  streakCount > 0
                    ? "fill-[#fca311] text-[#fca311] animate-pulse"
                    : "text-[#fca311]/60"
                }`}
              />
              <span>
                {streakCount > 0
                  ? `Daily Streak: ${streakCount} Day${streakCount > 1 ? "s" : ""}`
                  : "Streak: 0 Days"}
              </span>
            </div>
          ) : (
            <Link
              href="/problems"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#14213d] border border-[#203460] hover:border-[#fca311]/50 text-[#e5e5e5] hover:text-white text-xs font-medium transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#fca311]" />
              <span>Explore Sheet</span>
            </Link>
          )}

          {/* User Auth state */}
          {status === "loading" ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-[#14213d]" />
          ) : session?.user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 pl-2">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User Avatar"}
                    className="h-8 w-8 rounded-full border border-[#fca311]/60 object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#14213d] text-[#fca311] border border-[#203460] font-bold text-xs">
                    {session.user.name
                      ? session.user.name.charAt(0).toUpperCase()
                      : <UserIcon className="h-4 w-4" />}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-white leading-tight">
                    {session.user.name || "Developer"}
                  </p>
                  <p className="text-[10px] text-[#e5e5e5]/70 leading-tight">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Sign out"
                className="flex items-center gap-1 p-2 text-[#e5e5e5]/70 hover:text-[#fca311] hover:bg-[#14213d] rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/signin"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-black bg-[#fca311] hover:bg-[#e5930e] rounded-lg transition-all shadow-md shadow-[#fca311]/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
