import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "@/providers/QueryProvider";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "LetsCode DSA | Advanced Progress Tracker & Multi-Approach Learning",
  description:
    "Production-grade Data Structures & Algorithms (DSA) progress tracker and multi-approach learning platform with visual complexity benchmarks and personal markdown scratchpad.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-[#e5e5e5] antialiased selection:bg-[#fca311] selection:text-black">
        <AppProviders>
          <div className="relative min-h-screen flex flex-col bg-black">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-[#14213d] bg-black/95 py-6 text-center text-xs text-[#e5e5e5]/60">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p>© {new Date().getFullYear()} LetsCode DSA Tracker. Crafted for top tier software engineering interviews.</p>
                <div className="flex items-center gap-4 text-[#e5e5e5]/80">
                  <span className="hover:text-[#fca311] transition-colors">Arrays</span>
                  <span>•</span>
                  <span className="hover:text-[#fca311] transition-colors">Two Pointers</span>
                  <span>•</span>
                  <span className="hover:text-[#fca311] transition-colors">Trees & Graphs</span>
                  <span>•</span>
                  <span className="hover:text-[#fca311] transition-colors">Dynamic Programming</span>
                </div>
              </div>
            </footer>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
