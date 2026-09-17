import { NextResponse } from "next/server";
import { initKeepAlive } from "@/lib/keepAlive";

export const dynamic = "force-dynamic";

const startTime = Date.now();

export async function GET() {
  initKeepAlive();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  return NextResponse.json(
    {
      status: "healthy",
      service: "letscode-backend",
      uptimeSeconds,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      render: {
        isRender: Boolean(process.env.RENDER || process.env.RENDER_EXTERNAL_URL),
        externalUrl: process.env.RENDER_EXTERNAL_URL || null,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
