import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mockDb } from "@/lib/mockDb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;

    // Try PostgreSQL with Prisma first
    try {
      const dbUsers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          targetCompany: true,
          favoriteLanguage: true,
          progress: {
            where: { status: "SOLVED" },
            select: { id: true, revisionCount: true, lastSolvedAt: true },
          },
        },
      });

      if (dbUsers.length > 0) {
        const rankings = dbUsers.map((u) => {
          const solved = u.progress.length;
          const revisions = u.progress.reduce((acc, curr) => acc + curr.revisionCount, 0);
          return {
            id: u.id,
            name: u.id === user?.id ? `${u.name || "Developer"} (You)` : u.name || "Engineer",
            targetCompany: u.targetCompany || "FAANG & Tier 1 Tech",
            favoriteLanguage: u.favoriteLanguage || "Python",
            solvedCount: solved,
            streak: solved > 0 ? Math.min(30, Math.ceil(solved / 3)) : 0,
            revisionsCount: revisions,
            avatarBg: "from-blue-600 to-indigo-600",
            isCurrentUser: u.id === user?.id,
          };
        });

        rankings.sort((a, b) => b.solvedCount - a.solvedCount);

        const formatted = rankings.map((item, index) => ({
          ...item,
          rank: index + 1,
        }));

        return NextResponse.json({
          leaderboard: formatted,
          source: "database",
        });
      }
    } catch (dbError) {
      console.warn("Prisma leaderboard query failed, falling back to mockDb:", (dbError as any)?.message || dbError);
    }

    // Fallback: mockDb
    const leaderboard = mockDb.getLeaderboard(
      user?.id
        ? {
            id: user.id,
            name: user.name || "Developer",
          }
        : undefined
    );

    return NextResponse.json({
      leaderboard,
      source: "mock_store",
    });
  } catch (error) {
    console.error("GET /api/community/leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
