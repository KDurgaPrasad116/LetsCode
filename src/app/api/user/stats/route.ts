import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mockDb } from "@/lib/mockDb";

export const dynamic = "force-dynamic";

function calculateDailyStreak(dates: (Date | string | null | undefined)[]): number {
  const validDates = dates
    .filter((d): d is Date | string => Boolean(d))
    .map((d) => {
      const dateObj = typeof d === "string" ? new Date(d) : d;
      return dateObj.toISOString().slice(0, 10); // "YYYY-MM-DD"
    });

  if (validDates.length === 0) return 0;

  const uniqueDates = Array.from(new Set(validDates)).sort().reverse();

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const latestDate = uniqueDates[0];
  if (latestDate !== todayStr && latestDate !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let expectedDate = new Date(latestDate);

  for (const dateStr of uniqueDates) {
    const expectedStr = expectedDate.toISOString().slice(0, 10);
    if (dateStr === expectedStr) {
      streak += 1;
      expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    // Try PostgreSQL Prisma first
    try {
      const [totalProblems, problems, userProgressList] = await Promise.all([
        prisma.problem.count(),
        prisma.problem.findMany({
          select: { id: true, difficulty: true, topic: true },
        }),
        userId
          ? prisma.userProblemProgress.findMany({
              where: { userId },
              include: { problem: { select: { difficulty: true, topic: true } } },
            })
          : Promise.resolve([]),
      ]);

      const solvedList = userProgressList.filter((p) => p.status === "SOLVED");
      const inProgressList = userProgressList.filter((p) => p.status === "IN_PROGRESS");
      const bookmarkedList = userProgressList.filter((p) => p.isBookmarked);
      const totalRevisions = userProgressList.reduce((acc, curr) => acc + curr.revisionCount, 0);

      const streak = calculateDailyStreak(
        solvedList.map((p) => p.lastSolvedAt || p.updatedAt)
      );

      // Difficulty breakdown
      const difficultyStats = {
        EASY: {
          total: problems.filter((p) => p.difficulty === "EASY").length,
          solved: solvedList.filter((p) => p.problem.difficulty === "EASY").length,
        },
        MEDIUM: {
          total: problems.filter((p) => p.difficulty === "MEDIUM").length,
          solved: solvedList.filter((p) => p.problem.difficulty === "MEDIUM").length,
        },
        HARD: {
          total: problems.filter((p) => p.difficulty === "HARD").length,
          solved: solvedList.filter((p) => p.problem.difficulty === "HARD").length,
        },
      };

      // Topic distribution
      const topicMap: Record<string, { total: number; solved: number }> = {};
      for (const p of problems) {
        if (!topicMap[p.topic]) {
          topicMap[p.topic] = { total: 0, solved: 0 };
        }
        topicMap[p.topic].total += 1;
      }
      for (const p of solvedList) {
        if (topicMap[p.problem.topic]) {
          topicMap[p.problem.topic].solved += 1;
        }
      }

      const topics = Object.entries(topicMap).map(([topic, counts]) => ({
        topic,
        total: counts.total,
        solved: counts.solved,
        percentage: counts.total > 0 ? Math.round((counts.solved / counts.total) * 100) : 0,
      }));

      return NextResponse.json({
        totalProblems,
        solvedCount: solvedList.length,
        inProgressCount: inProgressList.length,
        unsolvedCount: Math.max(0, totalProblems - solvedList.length - inProgressList.length),
        bookmarkedCount: bookmarkedList.length,
        totalRevisions,
        streak,
        completionRate: totalProblems > 0 ? Math.round((solvedList.length / totalProblems) * 100) : 0,
        difficultyStats,
        topics,
        isAuthenticated: Boolean(userId),
        source: "database",
      });
    } catch (dbError) {
      console.warn("Prisma stats failed, using mock store fallback:", (dbError as any)?.message || dbError);
    }

    // Fallback: mockDb
    const mockProblems = mockDb.getProblems();
    const mockProgress = userId ? mockDb.getAllUserProgress(userId) : [];

    const solvedList = mockProgress.filter((p) => p.status === "SOLVED");
    const inProgressList = mockProgress.filter((p) => p.status === "IN_PROGRESS");
    const bookmarkedList = mockProgress.filter((p) => p.isBookmarked);
    const totalRevisions = mockProgress.reduce((acc, curr) => acc + curr.revisionCount, 0);

    const streak = calculateDailyStreak(
      solvedList.map((p) => p.lastSolvedAt || p.updatedAt)
    );

    const problemMap = new Map(mockProblems.map((p) => [p.id, p]));

    const difficultyStats = {
      EASY: {
        total: mockProblems.filter((p) => p.difficulty === "EASY").length,
        solved: solvedList.filter((p) => problemMap.get(p.problemId)?.difficulty === "EASY").length,
      },
      MEDIUM: {
        total: mockProblems.filter((p) => p.difficulty === "MEDIUM").length,
        solved: solvedList.filter((p) => problemMap.get(p.problemId)?.difficulty === "MEDIUM").length,
      },
      HARD: {
        total: mockProblems.filter((p) => p.difficulty === "HARD").length,
        solved: solvedList.filter((p) => problemMap.get(p.problemId)?.difficulty === "HARD").length,
      },
    };

    const topicMap: Record<string, { total: number; solved: number }> = {};
    for (const p of mockProblems) {
      if (!topicMap[p.topic]) {
        topicMap[p.topic] = { total: 0, solved: 0 };
      }
      topicMap[p.topic].total += 1;
    }
    for (const p of solvedList) {
      const prob = problemMap.get(p.problemId);
      if (prob && topicMap[prob.topic]) {
        topicMap[prob.topic].solved += 1;
      }
    }

    const topics = Object.entries(topicMap).map(([topic, counts]) => ({
      topic,
      total: counts.total,
      solved: counts.solved,
      percentage: counts.total > 0 ? Math.round((counts.solved / counts.total) * 100) : 0,
    }));

    return NextResponse.json({
      totalProblems: mockProblems.length,
      solvedCount: solvedList.length,
      inProgressCount: inProgressList.length,
      unsolvedCount: Math.max(0, mockProblems.length - solvedList.length - inProgressList.length),
      bookmarkedCount: bookmarkedList.length,
      totalRevisions,
      streak,
      completionRate:
        mockProblems.length > 0 ? Math.round((solvedList.length / mockProblems.length) * 100) : 0,
      difficultyStats,
      topics,
      isAuthenticated: Boolean(userId),
      source: "mock_store",
    });
  } catch (error) {
    console.error("GET /api/user/stats error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
