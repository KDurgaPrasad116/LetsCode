import { NextResponse } from "next/server";
import { isGoogleConfigured } from "@/auth";

export async function GET() {
  const appUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

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
