import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mockDb } from "@/lib/mockDb";

export const dynamic = "force-dynamic";

const progressSchema = z.object({
  problemId: z.string().min(1, "problemId is required"),
  status: z.enum(["UNSOLVED", "IN_PROGRESS", "SOLVED"]).optional(),
  incrementRevision: z.boolean().optional(),
  revisionCount: z.number().int().min(0).optional(),
  isBookmarked: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "You must be signed in to save problem progress, bookmarks, and notes.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parseResult = progressSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      problemId,
      status,
      incrementRevision,
      revisionCount,
      isBookmarked,
      notes,
    } = parseResult.data;

    // Try PostgreSQL Prisma first
    try {
      // Check if existing record exists
      const existing = await prisma.userProblemProgress.findUnique({
        where: {
          userId_problemId: {
            userId,
            problemId,
          },
        },
      });

      const nextStatus = status ?? existing?.status ?? "UNSOLVED";
      const nextBookmarked = isBookmarked ?? existing?.isBookmarked ?? false;
      const nextNotes = notes !== undefined ? notes : (existing?.notes ?? null);

      let nextRevision = existing ? existing.revisionCount : 0;
      if (incrementRevision) {
        nextRevision += 1;
      } else if (typeof revisionCount === "number") {
        nextRevision = Math.max(0, revisionCount);
      }

      const nextLastSolved = nextStatus === "SOLVED" ? new Date() : existing?.lastSolvedAt;

      const updated = await prisma.userProblemProgress.upsert({
        where: {
          userId_problemId: {
            userId,
            problemId,
          },
        },
        create: {
          userId,
          problemId,
          status: nextStatus,
          isBookmarked: nextBookmarked,
          revisionCount: nextRevision,
          notes: nextNotes,
          lastSolvedAt: nextLastSolved,
        },
        update: {
          status: nextStatus,
          isBookmarked: nextBookmarked,
          revisionCount: nextRevision,
          notes: nextNotes,
          lastSolvedAt: nextLastSolved,
        },
      });

      // Also ensure Note entry is kept in sync if notes are provided
      if (notes !== undefined) {
        await prisma.note.upsert({
          where: {
            userId_problemId: {
              userId,
              problemId,
            },
          },
          create: {
            userId,
            problemId,
            content: notes,
          },
          update: {
            content: notes,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: updated,
        source: "database",
      });
    } catch (dbError) {
      console.warn("Prisma progress upsert failed, using mock store fallback:", (dbError as any)?.message || dbError);
    }

    // Fallback: mockDb
    const record = mockDb.upsertProgress(userId, problemId, {
      status,
      incrementRevision,
      revisionCount,
      isBookmarked,
      notes,
    });

    return NextResponse.json({
      success: true,
      data: record,
      source: "mock_store",
    });
  } catch (error) {
    console.error("PATCH /api/progress error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
