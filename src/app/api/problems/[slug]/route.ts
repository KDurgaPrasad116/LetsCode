import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mockDb } from "@/lib/mockDb";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;
    const slug = params.slug;

    // Try PostgreSQL Prisma first
    try {
      const problem = await prisma.problem.findUnique({
        where: { slug },
        include: {
          approaches: {
            orderBy: { order: "asc" },
          },
          userProgress: userId
            ? {
                where: { userId },
                take: 1,
              }
            : false,
        },
      });

      if (problem) {
        const progress = (problem.userProgress && problem.userProgress[0]) || null;
        return NextResponse.json({
          data: {
            ...problem,
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
          },
          source: "database",
        });
      }
    } catch (dbError) {
      console.warn("Prisma fetch problem by slug failed, checking mockDb fallback:", (dbError as any)?.message || dbError);
    }

    // Fallback: mockDb
    const mockProblem = mockDb.getProblemBySlug(slug);
    if (!mockProblem) {
      return NextResponse.json(
        { error: "Not Found", message: `Problem with slug '${slug}' not found` },
        { status: 404 }
      );
    }

    const progress = userId ? mockDb.getUserProgress(userId, mockProblem.id) : null;

    return NextResponse.json({
      data: {
        ...mockProblem,
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
      },
      source: "mock_store",
    });
  } catch (error) {
    console.error("GET /api/problems/[slug] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
