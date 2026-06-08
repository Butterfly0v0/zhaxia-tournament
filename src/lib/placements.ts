import { prisma } from "@/lib/db";
import { getPointsForPlacement } from "@/lib/points";
import { findOrCreateVirtualUser } from "@/lib/virtual-user";

export type PlacementInput = {
  placement: number;
  userId?: string;
  playerName?: string;
  ignored?: boolean;
};

export async function applyTournamentPlacements(
  tournamentId: string,
  tierId: string,
  items: PlacementInput[],
  options?: { markCompleted?: boolean; updateLastSynced?: boolean }
) {
  const activeItems = items.filter((i) => !i.ignored && i.placement > 0);
  if (activeItems.length === 0) {
    throw new Error("请至少录入一条有效名次");
  }

  const userSet = new Set<string>();

  const resolved: Array<{ userId: string; placement: number; playerName?: string }> = [];

  for (const item of activeItems) {
    let userId = item.userId;
    if (!userId) {
      const name = item.playerName?.trim();
      if (!name) {
        throw new Error(`第 ${item.placement} 名缺少选手信息`);
      }
      const virtualUser = await findOrCreateVirtualUser(name);
      userId = virtualUser.id;
    }

    if (userSet.has(userId)) {
      throw new Error("同一选手不能有两个名次");
    }
    userSet.add(userId);

    resolved.push({
      userId,
      placement: item.placement,
      playerName: item.playerName,
    });
  }

  await prisma.placement.deleteMany({ where: { tournamentId } });

  let virtualCount = 0;
  for (const item of resolved) {
    const user = await prisma.user.findUnique({
      where: { id: item.userId },
      select: { isVirtual: true },
    });
    if (user?.isVirtual) virtualCount += 1;

    const points = await getPointsForPlacement(tierId, item.placement);
    await prisma.placement.create({
      data: {
        tournamentId,
        userId: item.userId,
        placement: item.placement,
        pointsAwarded: points,
      },
    });
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      status: "COMPLETED",
      ...(options?.updateLastSynced ? { lastSyncedAt: new Date() } : {}),
    },
  });

  return {
    total: resolved.length,
    virtualCount,
    realCount: resolved.length - virtualCount,
  };
}
