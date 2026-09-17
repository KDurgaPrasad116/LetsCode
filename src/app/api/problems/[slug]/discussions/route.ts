import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mockDb } from "@/lib/mockDb";

export const dynamic = "force-dynamic";

const discussionSchema = z.object({
  content: z.string().min(5, "Discussion content must be at least 5 characters"),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    // Try PostgreSQL with Prisma first
    try {
      const problem = await prisma.problem.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (problem) {
        const discussions = await prisma.discussion.findMany({
          where: { problemId: problem.id },
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { upvotes: "desc" },
        });

        const formatted = discussions.map((d) => ({
          id: d.id,
          problemId: d.problemId,
          userId: d.userId,
          userName: d.user.name || "Software Engineer",
          userAvatarBg: "from-blue-600 to-indigo-600",
          content: d.content,
          upvotes: d.upvotes,
          createdAt: d.createdAt.toISOString(),
        }));

        return NextResponse.json({
          discussions: formatted,
          source: "database",
        });
      }
    } catch (dbError) {
      console.warn("Prisma discussions query failed, falling back to mockDb:", (dbError as any)?.message || dbError);
    }

    // Fallback: mockDb
    const mockProblem = mockDb.getProblemBySlug(slug);
    const discussions = mockProblem ? mockDb.getDiscussions(mockProblem.id) : [];

    return NextResponse.json({
      discussions,
      source: "mock_store",
    });
  } catch (error) {
    console.error("GET /api/problems/[slug]/discussions error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be signed in to post discussion insights." },
        { status: 401 }
      );
    }

    const slug = params.slug;
    const body = await request.json();
    const parseResult = discussionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { content } = parseResult.data;

    // Try PostgreSQL with Prisma first
    try {
      const problem = await prisma.problem.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (problem) {
        const created = await prisma.discussion.create({
          data: {
            problemId: problem.id,
            userId: user.id,
            content,
            upvotes: 1,
          },
          include: {
            user: { select: { id: true, name: true } },
          },
        });

        return NextResponse.json({
          success: true,
          discussion: {
            id: created.id,
            problemId: created.problemId,
            userId: created.userId,
            userName: created.user.name || "Developer",
            userAvatarBg: "from-blue-600 to-indigo-600",
            content: created.content,
            upvotes: created.upvotes,
            createdAt: created.createdAt.toISOString(),
          },
          source: "database",
        });
      }
    } catch (dbError) {
      console.warn("Prisma discussion create failed, falling back to mockDb:", (dbError as any)?.message || dbError);
    }

    // Fallback: mockDb
    const mockProblem = mockDb.getProblemBySlug(slug);
    if (!mockProblem) {
      return NextResponse.json({ error: "Not Found", message: "Problem not found" }, { status: 404 });
    }

    const newDisc = mockDb.addDiscussion(
      mockProblem.id,
      user.id,
      user.name || "Developer",
      content
    );

    return NextResponse.json({
      success: true,
      discussion: newDisc,
      source: "mock_store",
    });
  } catch (error) {
    console.error("POST /api/problems/[slug]/discussions error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
