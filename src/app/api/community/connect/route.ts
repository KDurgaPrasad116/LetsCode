import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mockDb } from "@/lib/mockDb";

export const dynamic = "force-dynamic";

const connectSchema = z.object({
  peerId: z.string().min(1, "peerId is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be signed in to connect with peers." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parseResult = connectSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { peerId } = parseResult.data;

    if (peerId === userId) {
      return NextResponse.json(
        { error: "Bad Request", message: "You cannot connect with yourself." },
        { status: 400 }
      );
    }

    // Try PostgreSQL with Prisma first
    try {
      const existing = await prisma.connection.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: peerId },
            { senderId: peerId, receiverId: userId },
          ],
        },
      });

      if (!existing) {
        const created = await prisma.connection.create({
          data: {
            senderId: userId,
            receiverId: peerId,
            status: "PENDING",
          },
        });
        return NextResponse.json({ success: true, status: "PENDING", data: created });
      } else if (existing.status === "PENDING") {
        const updated = await prisma.connection.update({
          where: { id: existing.id },
          data: { status: "ACCEPTED" },
        });
        return NextResponse.json({ success: true, status: "CONNECTED", data: updated });
      } else {
        await prisma.connection.delete({ where: { id: existing.id } });
        return NextResponse.json({ success: true, status: "NONE" });
      }
    } catch (dbError) {
      console.warn("Prisma connection toggle failed, falling back to mockDb:", (dbError as any)?.message || dbError);
    }

    // Fallback: mockDb
    const result = mockDb.toggleConnection(userId, peerId);
    return NextResponse.json({
      success: true,
      status: result.status,
      source: "mock_store",
    });
  } catch (error) {
    console.error("POST /api/community/connect error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
