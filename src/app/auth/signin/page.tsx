"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Code2,
  ShieldCheck,
  ArrowRight,
  LogIn,
  AlertCircle,
  Mail,
  User,
} from "lucide-react";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const urlError = searchParams.get("error");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const getFriendlyErrorMessage = (err: string) => {
    switch (err) {
      case "OAuthSignin":
      case "OAuthCreateAccount":
        return "Unable to sign in with Google. Please try again or sign in with your email.";
      case "OAuthCallback":
        return "Authentication callback failed. Please check your network connection and try again.";
      case "OAuthAccountNotLinked":
        return "An account with this email address already exists. Please sign in using your existing credentials.";
      case "AccessDenied":
        return "Sign in was cancelled or access was denied.";
      case "Configuration":
        return "Authentication service configuration issue. Please contact support.";
      default:
        return "An unexpected authentication error occurred. Please try again.";
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg("");
    try {
      await signIn("google", { callbackUrl });
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Failed to initiate Google sign-in. Please try again."
      );
      setGoogleLoading(false);
    }
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMsg("");

    const result = await signIn("credentials", {
      name: name.trim() || email.trim().split("@")[0],
      email: email.trim().toLowerCase(),
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.ok) {
      router.push(callbackUrl);
      router.refresh();
    } else {
      setErrorMsg("Unable to sign in. Please verify your email address and try again.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-black">
      <div className="w-full max-w-md space-y-6">
        {/* Main Card */}
        <div className="glass-panel-glow rounded-2xl p-8 border border-[#203460] bg-[#14213d]/90 shadow-2xl relative overflow-hidden">
          {/* Top brand ambient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#14213d] via-[#fca311] to-white" />

          {/* Logo & Header */}
          <div className="text-center space-y-2 mb-8">
            <Link href="/" className="inline-flex items-center justify-center">
              <div className="h-12 w-12 rounded-2xl bg-[#fca311] text-black flex items-center justify-center font-bold shadow-lg shadow-[#fca311]/25 mb-1 hover:scale-105 transition-transform">
                <Code2 className="h-6 w-6 stroke-[2.5]" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Sign in to LetsCode
            </h1>
            <p className="text-xs sm:text-sm text-[#e5e5e5]/70 max-w-xs mx-auto">
              Track problem-solving metrics, log revision notes, and connect with peers.
            </p>
          </div>

          {/* Error display */}
          {(urlError || errorMsg) && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <p className="font-medium leading-relaxed">
                {errorMsg || (urlError ? getFriendlyErrorMessage(urlError) : "")}
              </p>
            </div>
          )}

          {/* Google OAuth Section */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              id="google-oauth-btn"
              type="button"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-black/80 hover:bg-black text-white font-semibold text-sm border border-[#203460] hover:border-[#fca311]/50 transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {googleLoading ? (
                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#203460]"></div>
              </div>
              <div className="relative bg-[#14213d] px-3 text-[11px] uppercase tracking-wider text-[#e5e5e5]/60 font-semibold">
                Or continue with email
              </div>
            </div>

            {/* Email / Credentials Form */}
            <form onSubmit={handleCredentialsSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#e5e5e5] mb-1.5">
                  Full Name <span className="text-[#e5e5e5]/40 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#e5e5e5]/40" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/60 border border-[#203460] text-sm text-white focus:outline-none focus:border-[#fca311] focus:ring-1 focus:ring-[#fca311] transition-all placeholder-[#e5e5e5]/30"
                    placeholder="e.g. Jane Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e5e5e5] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#e5e5e5]/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/60 border border-[#203460] text-sm text-white focus:outline-none focus:border-[#fca311] focus:ring-1 focus:ring-[#fca311] transition-all placeholder-[#e5e5e5]/30"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#fca311] hover:bg-[#e5930e] text-black text-sm font-bold shadow-lg shadow-[#fca311]/25 transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] mt-2"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4 stroke-[2.5]" />
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4 ml-1 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t border-[#203460] flex flex-col items-center justify-center gap-2 text-[11px] text-[#e5e5e5]/60 text-center">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#fca311]" />
              <span>Encrypted token sessions via Auth.js v5</span>
            </div>
            <p className="text-[10px] text-[#e5e5e5]/40">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-black">
          <div className="h-96 w-full max-w-md rounded-2xl bg-[#14213d]/60 animate-pulse border border-[#203460]" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
