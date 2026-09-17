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
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const language = searchParams.get("language") || "ALL";
    const company = searchParams.get("company") || "ALL";

    // Try PostgreSQL with Prisma first
    try {
      const dbUsers = await prisma.user.findMany({
        where: userId ? { id: { not: userId } } : {},
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          targetCompany: true,
          favoriteLanguage: true,
          progress: {
            where: { status: "SOLVED" },
            select: { id: true, revisionCount: true, lastSolvedAt: true },
          },
          receivedConnections: userId
            ? {
                where: { senderId: userId },
                select: { status: true },
              }
            : false,
          sentConnections: userId
            ? {
                where: { receiverId: userId },
                select: { status: true },
              }
            : false,
        },
        take: 50,
      });

      if (dbUsers.length > 0) {
        let peers = dbUsers.map((u) => {
          let connectionStatus: "NONE" | "PENDING" | "CONNECTED" = "NONE";
          if (u.receivedConnections && u.receivedConnections.length > 0) {
            connectionStatus = u.receivedConnections[0].status === "ACCEPTED" ? "CONNECTED" : "PENDING";
          } else if (u.sentConnections && u.sentConnections.length > 0) {
            connectionStatus = u.sentConnections[0].status === "ACCEPTED" ? "CONNECTED" : "PENDING";
          }

          const solved = u.progress.length;
          const revisions = u.progress.reduce((acc, curr) => acc + curr.revisionCount, 0);

          return {
            id: u.id,
            name: u.name || "Software Engineer",
            email: u.email || "",
            bio: u.bio || "Preparing for top tier software engineering interviews.",
            targetCompany: u.targetCompany || "FAANG & High Growth Startups",
            favoriteLanguage: u.favoriteLanguage || "Python",
            solvedCount: solved,
            streak: solved > 0 ? Math.min(30, Math.ceil(solved / 3)) : 0,
            revisionsCount: revisions,
            avatarBg: "from-blue-600 to-indigo-600",
            connectionStatus,
          };
        });

        if (search) {
          peers = peers.filter(
            (p) =>
              p.name.toLowerCase().includes(search) ||
              p.targetCompany.toLowerCase().includes(search) ||
              p.bio.toLowerCase().includes(search)
          );
        }

        if (language !== "ALL") {
          peers = peers.filter((p) => p.favoriteLanguage.toLowerCase() === language.toLowerCase());
        }

        if (company !== "ALL") {
          peers = peers.filter((p) => p.targetCompany.toLowerCase().includes(company.toLowerCase()));
        }

        return NextResponse.json({
          peers,
          source: "database",
        });
      }
    } catch (dbError) {
      console.warn("Prisma peers query failed, falling back to mockDb:", (dbError as any)?.message || dbError);
    }

    // Fallback: mockDb
    let peers = mockDb.getPeers(userId);

    if (search) {
      peers = peers.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.targetCompany.toLowerCase().includes(search) ||
          p.bio.toLowerCase().includes(search)
      );
    }

    if (language !== "ALL") {
      peers = peers.filter((p) => p.favoriteLanguage.toLowerCase() === language.toLowerCase());
    }

    if (company !== "ALL") {
      peers = peers.filter((p) => p.targetCompany.toLowerCase().includes(company.toLowerCase()));
    }

    return NextResponse.json({
      peers,
      source: "mock_store",
    });
  } catch (error) {
    console.error("GET /api/community/peers error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
