/**
 * Render Keep-Alive Background Service
 *
 * Render Free Tier services spin down after 14 minutes of HTTP inactivity.
 * This background pinger sends an external HTTP request to the service's own
 * public URL every 10 minutes, keeping the container warm and responsive 24/7.
 */

let isPingerActive = false;
let pingInterval: NodeJS.Timeout | null = null;

export function initKeepAlive() {
  if (isPingerActive || typeof window !== "undefined") {
    return;
  }

  // Determine external URL from Render or custom app URL
  const targetUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL;

  if (!targetUrl || !targetUrl.startsWith("http")) {
    return;
  }

  // Do not self-ping in development localhost
  if (targetUrl.includes("localhost") || targetUrl.includes("127.0.0.1")) {
    return;
  }

  isPingerActive = true;
  const endpoint = `${targetUrl.replace(/\/+$/, "")}/api/health`;

  console.log(`[KeepAlive] Initiating 24/7 keep-alive monitor for: ${endpoint}`);

  // Ping every 10 minutes (600,000 ms)
  const PING_INTERVAL_MS = 10 * 60 * 1000;

  pingInterval = setInterval(async () => {
    try {
      const response = await fetch(endpoint, {
        headers: { "User-Agent": "Render-KeepAlive-Worker/1.0" },
        cache: "no-store",
      });
      if (response.ok) {
        console.log(`[KeepAlive] Heartbeat ping successful at ${new Date().toISOString()}`);
      } else {
        console.warn(`[KeepAlive] Heartbeat returned status ${response.status}`);
      }
    } catch (err: any) {
      console.warn(`[KeepAlive] Heartbeat ping failed:`, err?.message || err);
    }
  }, PING_INTERVAL_MS);

  // Prevent interval from keeping the process alive during clean shutdown
  if (pingInterval.unref) {
    pingInterval.unref();
  }
}
