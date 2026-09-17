import { NextResponse } from "next/server";
import { isGoogleConfigured } from "@/auth";

export async function GET() {
  const rawUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const appUrl = rawUrl.startsWith("http")
    ? rawUrl.replace(/\/+$/, "")
    : `https://${rawUrl.replace(/\/+$/, "")}`;

  return NextResponse.json({
    google: {
      configured: isGoogleConfigured,
      callbackUrl: `${appUrl}/api/auth/callback/google`,
      clientIdConfigured: Boolean(
        process.env.AUTH_GOOGLE_ID &&
          !process.env.AUTH_GOOGLE_ID.startsWith("mock-") &&
          process.env.AUTH_GOOGLE_ID.trim().length > 0
      ),
      secretConfigured: Boolean(
        process.env.AUTH_GOOGLE_SECRET &&
          !process.env.AUTH_GOOGLE_SECRET.startsWith("mock-") &&
          process.env.AUTH_GOOGLE_SECRET.trim().length > 0
      ),
    },
  });
}
