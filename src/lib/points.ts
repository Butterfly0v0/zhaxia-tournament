import { prisma } from "./db";

export async function getPointsForPlacement(tierId: string, placement: number) {
  const rule = await prisma.pointRule.findUnique({
    where: { tierId_placement: { tierId, placement } },
  });
  return rule?.points ?? 0;
}

export async function getPointRulesMap(tierId: string) {
  const rules = await prisma.pointRule.findMany({
    where: { tierId },
    orderBy: { placement: "asc" },
  });
  return new Map(rules.map((r) => [r.placement, r.points]));
}

export type RankingEntry = {
  userId: string;
  nickname: string;
  username: string;
  startGgTag: string | null;
  isVirtual: boolean;
  totalPoints: number;
  tournamentCount: number;
  rank: number;
};

export async function getGameRankings(gameId: string, limit = 50): Promise<RankingEntry[]> {
  const placements = await prisma.placement.findMany({
    where: {
      tournament: {
        gameId,
        status: "COMPLETED",
      },
    },
    include: {
      user: { select: { id: true, nickname: true, username: true, startGgTag: true, isVirtual: true } },
    },
  });

  const map = new Map<
    string,
    {
      nickname: string;
      username: string;
      startGgTag: string | null;
      isVirtual: boolean;
      totalPoints: number;
      tournamentCount: number;
    }
  >();

  for (const p of placements) {
    const existing = map.get(p.userId);
    if (existing) {
      existing.totalPoints += p.pointsAwarded;
      existing.tournamentCount += 1;
    } else {
      map.set(p.userId, {
        nickname: p.user.nickname,
        username: p.user.username,
        startGgTag: p.user.startGgTag,
        isVirtual: p.user.isVirtual,
        totalPoints: p.pointsAwarded,
        tournamentCount: 1,
      });
    }
  }

  const sorted = [...map.entries()]
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.tournamentCount - a.tournamentCount;
    })
    .slice(0, limit);

  return sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export async function getUserGameStats(userId: string, gameId?: string) {
  const placements = await prisma.placement.findMany({
    where: {
      userId,
      tournament: {
        status: "COMPLETED",
        ...(gameId ? { gameId } : {}),
      },
    },
    include: {
      tournament: {
        include: { game: true, tier: true },
      },
    },
    orderBy: { recordedAt: "desc" },
  });

  const totalPoints = placements.reduce((sum, p) => sum + p.pointsAwarded, 0);
  return { placements, totalPoints, tournamentCount: placements.length };
}
