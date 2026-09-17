import { NextResponse } from "next/server";

const publicAppUrl =
  process.env.RENDER_EXTERNAL_URL ||
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

const canonicalUrl = publicAppUrl.startsWith("http")
  ? publicAppUrl.replace(/\/+$/, "")
  : `https://${publicAppUrl.replace(/\/+$/, "")}`;

process.env.AUTH_URL = canonicalUrl;
process.env.NEXTAUTH_URL = canonicalUrl;

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "letscode_dsa_tracker_super_secret_jwt_key_2026_dev_prod";
}

import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard");

  if (isDashboardRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
