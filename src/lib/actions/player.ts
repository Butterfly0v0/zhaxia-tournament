"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function registerForTournamentAction(tournamentId: string) {
  const user = await requireAuth();

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { _count: { select: { registrations: true } } },
  });

  if (!tournament) return { error: "赛事不存在" };
  if (tournament.status !== "OPEN") return { error: "该赛事当前不接受报名" };
  if (new Date() > tournament.regDeadline) return { error: "报名已截止" };

  if (tournament.maxPlayers) {
    const count = await prisma.registration.count({
      where: { tournamentId, status: { not: "CANCELLED" } },
    });
    if (count >= tournament.maxPlayers) return { error: "报名人数已满" };
  }

  const existing = await prisma.registration.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: user.id } },
  });

  if (existing && existing.status !== "CANCELLED") {
    return { error: "你已经报名过该赛事" };
  }

  if (existing) {
    await prisma.registration.update({
      where: { id: existing.id },
      data: { status: "CONFIRMED", registeredAt: new Date() },
    });
  } else {
    await prisma.registration.create({
      data: { tournamentId, userId: user.id, status: "CONFIRMED" },
    });
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/player/tournaments");
  revalidatePath("/player/my-events");
  return { success: true };
}

export async function cancelRegistrationAction(tournamentId: string) {
  const user = await requireAuth();

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return { error: "赛事不存在" };
  if (tournament.status !== "OPEN") return { error: "无法取消报名" };
  if (new Date() > tournament.regDeadline) return { error: "报名已截止，无法取消" };

  await prisma.registration.updateMany({
    where: { tournamentId, userId: user.id },
    data: { status: "CANCELLED" },
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/player/tournaments");
  revalidatePath("/player/my-events");
  return { success: true };
}
