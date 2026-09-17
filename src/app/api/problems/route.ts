import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mockDb } from "@/lib/mockDb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const difficulty = searchParams.get("difficulty") || "ALL";
    const topic = searchParams.get("topic") || "ALL";
    const status = searchParams.get("status") || "ALL";
    const bookmarkedOnly = searchParams.get("bookmarked") === "true";
    const sortBy = searchParams.get("sortBy") || "order"; // 'order', 'title', 'difficulty', 'revisionCount'
    const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";

    // Try PostgreSQL with Prisma first
    try {
      // Fetch dynamic available topics from database
      const topicRecords = await prisma.problem.findMany({
        distinct: ["topic"],
        select: { topic: true },
        orderBy: { topic: "asc" },
      });
      const availableTopics = topicRecords.map((t) => t.topic);

      // Build Prisma where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { topic: { contains: search, mode: "insensitive" } },
        ];
      }

      if (difficulty !== "ALL") {
        where.difficulty = difficulty;
      }

      if (topic !== "ALL") {
        where.topic = { equals: topic, mode: "insensitive" };
      }

      if (bookmarkedOnly) {
        if (!userId) {
          return NextResponse.json({
            data: [],
            availableTopics,
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 1,
              hasMore: false,
            },
            source: "database",
          });
        }
        where.userProgress = {
          some: {
            userId,
            isBookmarked: true,
          },
        };
      }

      if (status !== "ALL") {
        if (!userId) {
          if (status !== "UNSOLVED") {
            return NextResponse.json({
              data: [],
              availableTopics,
              pagination: {
                page,
                limit,
                total: 0,
                totalPages: 1,
                hasMore: false,
              },
              source: "database",
            });
          }
          // If UNSOLVED for guest, all problems qualify
        } else {
          if (status === "UNSOLVED") {
            where.OR = [
              { userProgress: { none: { userId } } },
              { userProgress: { some: { userId, status: "UNSOLVED" } } },
            ];
          } else {
            where.userProgress = {
              some: {
                userId,
                status: status as any,
              },
            };
          }
        }
      }

      const totalCount = await prisma.problem.count({ where });

      const problems = await prisma.problem.findMany({
        where,
        include: {
          userProgress: userId
            ? {
                where: { userId },
                take: 1,
              }
            : false,
          approaches: {
            select: {
              id: true,
              approachName: true,
              order: true,
              timeComplexity: true,
              spaceComplexity: true,
            },
            orderBy: { order: "asc" },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy === "order" ? { order: sortOrder } : { [sortBy]: sortOrder },
      });

      const formatted = problems.map((p) => {
        const progress = (p.userProgress && p.userProgress[0]) || null;
        return {
          id: p.id,
          slug: p.slug,
          title: p.title,
          difficulty: p.difficulty,
          topic: p.topic,
          description: p.description,
          externalLinks: p.externalLinks,
          hints: p.hints,
          order: p.order,
          approachesSummary: p.approaches,
          userProgress: progress
            ? {
                status: progress.status,
                revisionCount: progress.revisionCount,
                isBookmarked: progress.isBookmarked,
                lastSolvedAt: progress.lastSolvedAt,
                notes: progress.notes,
              }
            : {
                status: "UNSOLVED",
                revisionCount: 0,
                isBookmarked: false,
                lastSolvedAt: null,
                notes: null,
              },
        };
      });

      return NextResponse.json({
        data: formatted,
        availableTopics,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
          hasMore: page * limit < totalCount,
        },
        source: "database",
      });
    } catch (dbError) {
      console.warn("Database query skipped or failed, using mock store fallback:", (dbError as any)?.message || dbError);
    }

    // Fallback: mockDb
    const allSeedProblems = mockDb.getProblems();
    const availableTopics = Array.from(new Set(allSeedProblems.map((p) => p.topic))).sort();

    let allProblems = allSeedProblems.map((p) => {
      const progress = userId ? mockDb.getUserProgress(userId, p.id) : null;
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        difficulty: p.difficulty,
        topic: p.topic,
        description: p.description,
        externalLinks: p.externalLinks,
        hints: p.hints,
        order: p.order,
        approachesSummary: p.approaches.map((a) => ({
          approachName: a.approachName,
          order: a.order,
          timeComplexity: a.timeComplexity,
          spaceComplexity: a.spaceComplexity,
        })),
        userProgress: progress
          ? {
              status: progress.status,
              revisionCount: progress.revisionCount,
              isBookmarked: progress.isBookmarked,
              lastSolvedAt: progress.lastSolvedAt,
              notes: progress.notes,
            }
          : {
              status: "UNSOLVED" as const,
              revisionCount: 0,
              isBookmarked: false,
              lastSolvedAt: null,
              notes: null,
            },
      };
    });

    // Apply filtering
    if (search) {
      allProblems = allProblems.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.topic.toLowerCase().includes(search)
      );
    }

    if (difficulty !== "ALL") {
      allProblems = allProblems.filter((p) => p.difficulty === difficulty);
    }

    if (topic !== "ALL") {
      allProblems = allProblems.filter(
        (p) => p.topic.toLowerCase() === topic.toLowerCase()
      );
    }

    if (status !== "ALL") {
      allProblems = allProblems.filter(
        (p) => p.userProgress.status === status
      );
    }

    if (bookmarkedOnly) {
      allProblems = allProblems.filter((p) => p.userProgress.isBookmarked);
    }

    // Apply sorting
    allProblems.sort((a, b) => {
      if (sortBy === "revisionCount") {
        const revA = a.userProgress.revisionCount;
        const revB = b.userProgress.revisionCount;
        return sortOrder === "desc" ? revB - revA : revA - revB;
      }
      if (sortBy === "title") {
        return sortOrder === "desc"
          ? b.title.localeCompare(a.title)
          : a.title.localeCompare(b.title);
      }
      if (sortBy === "difficulty") {
        const rank = { EASY: 1, MEDIUM: 2, HARD: 3 };
        return sortOrder === "desc"
          ? rank[b.difficulty] - rank[a.difficulty]
          : rank[a.difficulty] - rank[b.difficulty];
      }
      return sortOrder === "desc" ? b.order - a.order : a.order - b.order;
    });

    const total = allProblems.length;
    const paginated = allProblems.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      data: paginated,
      availableTopics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: page * limit < total,
      },
      source: "mock_store",
    });
  } catch (error) {
    console.error("GET /api/problems error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
