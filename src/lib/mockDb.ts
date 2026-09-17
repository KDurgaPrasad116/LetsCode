import { SEED_PROBLEMS, SeedProblem } from "../../prisma/seedData";

export interface MockUserProgress {
  id: string;
  userId: string;
  problemId: string;
  status: "UNSOLVED" | "IN_PROGRESS" | "SOLVED";
  revisionCount: number;
  isBookmarked: boolean;
  notes: string | null;
  lastSolvedAt: Date | null;
  updatedAt: Date;
}

export interface MockPeer {
  id: string;
  name: string;
  email: string;
  bio: string;
  targetCompany: string;
  favoriteLanguage: string;
  solvedCount: number;
  streak: number;
  revisionsCount: number;
  avatarBg: string;
  connectionStatus?: "NONE" | "PENDING" | "CONNECTED";
}

export interface MockDiscussion {
  id: string;
  problemId: string;
  userId: string;
  userName: string;
  userAvatarBg: string;
  content: string;
  upvotes: number;
  createdAt: string;
}

class MockDbManager {
  private problems: (SeedProblem & { id: string })[] = [];
  private progressMap: Map<string, MockUserProgress> = new Map(); // key: `${userId}_${problemId}`
  private connections: Map<string, "PENDING" | "CONNECTED"> = new Map(); // key: `${sender}_${receiver}`
  private peers: MockPeer[] = [];
  private discussions: MockDiscussion[] = [];

  constructor() {
    this.problems = SEED_PROBLEMS.map((p, idx) => ({
      ...p,
      id: `prob_${idx + 1}_${p.slug}`,
    }));
  }

  getProblems() {
    return this.problems;
  }

  getProblemBySlug(slug: string) {
    return this.problems.find((p) => p.slug === slug);
  }

  getProblemById(id: string) {
    return this.problems.find((p) => p.id === id);
  }

  getUserProgress(userId: string, problemId: string): MockUserProgress | null {
    return this.progressMap.get(`${userId}_${problemId}`) || null;
  }

  getAllUserProgress(userId: string): MockUserProgress[] {
    const list: MockUserProgress[] = [];
    this.progressMap.forEach((val, key) => {
      if (key.startsWith(`${userId}_`)) {
        list.push(val);
      }
    });
    return list;
  }

  upsertProgress(
    userId: string,
    problemId: string,
    data: {
      status?: "UNSOLVED" | "IN_PROGRESS" | "SOLVED";
      incrementRevision?: boolean;
      revisionCount?: number;
      isBookmarked?: boolean;
      notes?: string;
    }
  ): MockUserProgress {
    const key = `${userId}_${problemId}`;
    const existing = this.progressMap.get(key);

    let nextRevision = existing ? existing.revisionCount : 0;
    if (data.incrementRevision) {
      nextRevision += 1;
    } else if (typeof data.revisionCount === "number") {
      nextRevision = Math.max(0, data.revisionCount);
    }

    const nextStatus = data.status ?? existing?.status ?? "UNSOLVED";
    const nextBookmarked = data.isBookmarked ?? existing?.isBookmarked ?? false;
    const nextNotes = data.notes !== undefined ? data.notes : (existing?.notes ?? null);
    const nextLastSolved = nextStatus === "SOLVED" ? new Date() : (existing?.lastSolvedAt ?? null);

    const record: MockUserProgress = {
      id: existing?.id || `prog_${Date.now()}`,
      userId,
      problemId,
      status: nextStatus,
      revisionCount: nextRevision,
      isBookmarked: nextBookmarked,
      notes: nextNotes,
      lastSolvedAt: nextLastSolved,
      updatedAt: new Date(),
    };

    this.progressMap.set(key, record);
    return record;
  }

  // --- Community Peer & Connection Methods ---

  registerOrUpdateUser(user: {
    id: string;
    name?: string | null;
    email?: string | null;
    bio?: string | null;
    targetCompany?: string | null;
    favoriteLanguage?: string | null;
  }) {
    const existingIndex = this.peers.findIndex((p) => p.id === user.id);
    const existing = existingIndex >= 0 ? this.peers[existingIndex] : null;

    const userProgress = this.getAllUserProgress(user.id);
    const solved = userProgress.filter((p) => p.status === "SOLVED").length;
    const revisions = userProgress.reduce((acc, curr) => acc + curr.revisionCount, 0);

    const updatedPeer: MockPeer = {
      id: user.id,
      name: user.name || existing?.name || "Developer",
      email: user.email || existing?.email || "",
      bio: user.bio || existing?.bio || "Preparing for top tier software engineering interviews.",
      targetCompany: user.targetCompany || existing?.targetCompany || "FAANG & Tier 1 Tech",
      favoriteLanguage: user.favoriteLanguage || existing?.favoriteLanguage || "Python",
      solvedCount: solved,
      streak: solved > 0 ? 1 : 0,
      revisionsCount: revisions,
      avatarBg: existing?.avatarBg || "from-blue-600 to-indigo-600",
    };

    if (existingIndex >= 0) {
      this.peers[existingIndex] = updatedPeer;
    } else {
      this.peers.push(updatedPeer);
    }
  }

  getPeers(currentUserId: string | null): MockPeer[] {
    return this.peers
      .filter((peer) => !currentUserId || peer.id !== currentUserId)
      .map((peer) => {
        let status: "NONE" | "PENDING" | "CONNECTED" = "NONE";
        if (currentUserId) {
          const key1 = `${currentUserId}_${peer.id}`;
          const key2 = `${peer.id}_${currentUserId}`;
          if (this.connections.get(key1) === "CONNECTED" || this.connections.get(key2) === "CONNECTED") {
            status = "CONNECTED";
          } else if (this.connections.get(key1) === "PENDING" || this.connections.get(key2) === "PENDING") {
            status = "PENDING";
          }
        }

        const userProgress = this.getAllUserProgress(peer.id);
        const solved = userProgress.filter((p) => p.status === "SOLVED").length;
        const revisions = userProgress.reduce((acc, curr) => acc + curr.revisionCount, 0);

        return {
          ...peer,
          solvedCount: solved,
          streak: solved > 0 ? 1 : 0,
          revisionsCount: revisions,
          connectionStatus: status,
        };
      });
  }

  toggleConnection(senderId: string, receiverId: string): { status: "NONE" | "PENDING" | "CONNECTED" } {
    const key = `${senderId}_${receiverId}`;
    const revKey = `${receiverId}_${senderId}`;

    const existing = this.connections.get(key) || this.connections.get(revKey);
    if (!existing) {
      this.connections.set(key, "PENDING");
      return { status: "PENDING" };
    } else if (existing === "PENDING") {
      this.connections.set(key, "CONNECTED");
      return { status: "CONNECTED" };
    } else {
      this.connections.delete(key);
      this.connections.delete(revKey);
      return { status: "NONE" };
    }
  }

  getLeaderboard(currentUser?: { id: string; name: string }) {
    const userMap = new Map<string, MockPeer>();

    for (const peer of this.peers) {
      const userProgress = this.getAllUserProgress(peer.id);
      const solved = userProgress.filter((p) => p.status === "SOLVED").length;
      const revisions = userProgress.reduce((acc, curr) => acc + curr.revisionCount, 0);
      userMap.set(peer.id, {
        ...peer,
        solvedCount: solved,
        streak: solved > 0 ? 1 : 0,
        revisionsCount: revisions,
      });
    }

    if (currentUser) {
      const userProgress = this.getAllUserProgress(currentUser.id);
      const solved = userProgress.filter((p) => p.status === "SOLVED").length;
      const revisions = userProgress.reduce((acc, curr) => acc + curr.revisionCount, 0);
      const existing = userMap.get(currentUser.id);

      userMap.set(currentUser.id, {
        id: currentUser.id,
        name: `${currentUser.name} (You)`,
        email: existing?.email || "",
        bio: existing?.bio || "Your personal progress profile",
        targetCompany: existing?.targetCompany || "Top Tier Tech",
        favoriteLanguage: existing?.favoriteLanguage || "Python",
        solvedCount: solved,
        streak: solved > 0 ? 1 : 0,
        revisionsCount: revisions,
        avatarBg: existing?.avatarBg || "from-blue-600 to-indigo-600",
      });
    }

    const all = Array.from(userMap.values());
    all.sort((a, b) => b.solvedCount - a.solvedCount);

    return all.map((item, index) => ({
      ...item,
      rank: index + 1,
      isCurrentUser: Boolean(currentUser && item.id === currentUser.id),
    }));
  }

  // --- Community Discussions Methods ---

  getDiscussions(problemId: string): MockDiscussion[] {
    return this.discussions
      .filter((d) => d.problemId === problemId)
      .sort((a, b) => b.upvotes - a.upvotes);
  }

  getAllDiscussions(): MockDiscussion[] {
    return [...this.discussions].sort((a, b) => b.upvotes - a.upvotes);
  }

  addDiscussion(problemId: string, userId: string, userName: string, content: string): MockDiscussion {
    const newDisc: MockDiscussion = {
      id: `disc_${Date.now()}`,
      problemId,
      userId,
      userName,
      userAvatarBg: "from-blue-500 to-indigo-500",
      content,
      upvotes: 1,
      createdAt: new Date().toISOString(),
    };
    this.discussions.unshift(newDisc);
    return newDisc;
  }

  upvoteDiscussion(discussionId: string): number {
    const item = this.discussions.find((d) => d.id === discussionId);
    if (item) {
      item.upvotes += 1;
      return item.upvotes;
    }
    return 0;
  }
}

const globalMockDb = globalThis as unknown as { mockDb?: MockDbManager };
export const mockDb = globalMockDb.mockDb ?? new MockDbManager();
if (process.env.NODE_ENV !== "production") {
  globalMockDb.mockDb = mockDb;
}
