"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { ensureAdminAction } from "@/lib/admin-action";
import { gameSchema, tierSchema, tournamentSchema } from "@/lib/validators";
import { resolveStartGgEventId } from "@/lib/startgg";
import { syncTournamentFromStartGg } from "@/lib/startgg-sync";
import { applyTournamentPlacements } from "@/lib/placements";
import { cleanupVirtualUserIfOrphaned } from "@/lib/virtual-user";
import { assertNicknameAvailable } from "@/lib/nickname";

function redirectAdminError(path: string, message: string): never {
  if (message.includes("登录") || message.includes("管理员权限")) {
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createGameAction(formData: FormData) {
  const authError = await ensureAdminAction();
  if (authError) redirectAdminError("/admin/games", authError.error);

  const raw = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    description: (formData.get("description") as string) || undefined,
    isActive: formData.get("isActive") === "on",
  };

  const parsed = gameSchema.safeParse(raw);
  if (!parsed.success) redirectAdminError("/admin/games", parsed.error.errors[0].message);

  try {
    await prisma.game.create({ data: parsed.data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "添加失败";
    redirectAdminError("/admin/games", message);
  }
  revalidatePath("/admin/games");
}

export async function updateGameAction(formData: FormData) {
  const authError = await ensureAdminAction();
  if (authError) redirectAdminError("/admin/games", authError.error);

  const id = formData.get("gameId") as string;
  if (!id) redirectAdminError("/admin/games", "无效的游戏 ID");

  const raw = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    description: (formData.get("description") as string) || undefined,
    isActive: formData.get("isActive") === "on",
  };

  const parsed = gameSchema.safeParse(raw);
  if (!parsed.success) redirectAdminError("/admin/games", parsed.error.errors[0].message);

  try {
    await prisma.game.update({ where: { id }, data: parsed.data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "保存失败";
    redirectAdminError("/admin/games", message);
  }
  revalidatePath("/admin/games");
}

export async function createTierAction(formData: FormData) {
  const authError = await ensureAdminAction();
  if (authError) redirectAdminError("/admin/tiers", authError.error);

  const raw = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    description: (formData.get("description") as string) || undefined,
    sortOrder: formData.get("sortOrder") as string,
  };

  const parsed = tierSchema.safeParse(raw);
  if (!parsed.success) redirectAdminError("/admin/tiers", parsed.error.errors[0].message);

  try {
    await prisma.eventTier.create({ data: parsed.data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "添加失败";
    redirectAdminError("/admin/tiers", message);
  }
  revalidatePath("/admin/tiers");
}

export async function updatePointRulesAction(formData: FormData) {
  const authError = await ensureAdminAction();
  if (authError) redirectAdminError("/admin/tiers", authError.error);

  const tierId = formData.get("tierId") as string;
  if (!tierId) redirectAdminError("/admin/tiers", "无效的等级 ID");

  const placements = formData.getAll("placement").map((v) => parseInt(v as string, 10));
  const points = formData.getAll("points").map((v) => parseInt(v as string, 10));

  await prisma.pointRule.deleteMany({ where: { tierId } });

  for (let i = 0; i < placements.length; i++) {
    if (placements[i] > 0 && points[i] >= 0) {
      await prisma.pointRule.create({
        data: { tierId, placement: placements[i], points: points[i] },
      });
    }
  }

  revalidatePath("/admin/tiers");
}

export async function createTournamentAction(formData: FormData) {
  const authError = await ensureAdminAction();
  if (authError) return authError;

  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    gameId: formData.get("gameId") as string,
    tierId: formData.get("tierId") as string,
    startDate: formData.get("startDate") as string,
    regDeadline: formData.get("regDeadline") as string,
    startGgUrl: (formData.get("startGgUrl") as string) || "",
    maxPlayers: (formData.get("maxPlayers") as string) || "",
    status: formData.get("status") as "DRAFT" | "OPEN" | "CLOSED" | "COMPLETED",
  };

  const parsed = tournamentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  let startGgEventId: string | null = null;
  if (parsed.data.startGgUrl) {
    try {
      startGgEventId = await resolveStartGgEventId(
        parsed.data.startGgUrl,
        (formData.get("startGgEventId") as string) || null
      );
    } catch (e) {
      return { error: e instanceof Error ? e.message : "无法解析 start.gg 链接" };
    }
  }

  const tournament = await prisma.tournament.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      gameId: parsed.data.gameId,
      tierId: parsed.data.tierId,
      startDate: new Date(parsed.data.startDate),
      regDeadline: new Date(parsed.data.regDeadline),
      startGgUrl: parsed.data.startGgUrl || null,
      startGgEventId,
      status: parsed.data.status,
      maxPlayers: parsed.data.maxPlayers ? Number(parsed.data.maxPlayers) : null,
    },
  });

  if (parsed.data.startGgUrl && formData.get("syncFromStartGg") === "on") {
    try {
      await syncTournamentFromStartGg(tournament.id, {
        applyResults: true,
        skipTitleAndStatus: true,
      });
    } catch {
      // 创建成功但同步失败，不阻断流程
    }
  }

  revalidatePath("/admin/tournaments");
  revalidatePath(`/admin/tournaments/${tournament.id}`);
  return { success: true, id: tournament.id };
}

export async function updateTournamentAction(id: string, formData: FormData) {
  const authError = await ensureAdminAction();
  if (authError) return authError;

  const existing = await prisma.tournament.findUnique({ where: { id } });
  if (!existing) return { error: "赛事不存在" };
  if (existing.status === "COMPLETED") return { error: "已完成的赛事不可编辑" };

  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    gameId: formData.get("gameId") as string,
    tierId: formData.get("tierId") as string,
    startDate: formData.get("startDate") as string,
    regDeadline: formData.get("regDeadline") as string,
    startGgUrl: (formData.get("startGgUrl") as string) || "",
    maxPlayers: (formData.get("maxPlayers") as string) || "",
    status: formData.get("status") as "DRAFT" | "OPEN" | "CLOSED" | "COMPLETED",
  };

  const parsed = tournamentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  let startGgEventId: string | null = null;
  if (parsed.data.startGgUrl) {
    try {
      startGgEventId = await resolveStartGgEventId(
        parsed.data.startGgUrl,
        (formData.get("startGgEventId") as string) || existing.startGgEventId
      );
    } catch (e) {
      return { error: e instanceof Error ? e.message : "无法解析 start.gg 链接" };
    }
  }

  await prisma.tournament.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      gameId: parsed.data.gameId,
      tierId: parsed.data.tierId,
      startDate: new Date(parsed.data.startDate),
      regDeadline: new Date(parsed.data.regDeadline),
      startGgUrl: parsed.data.startGgUrl || null,
      startGgEventId,
      status: parsed.data.status,
      maxPlayers: parsed.data.maxPlayers ? Number(parsed.data.maxPlayers) : null,
    },
  });

  if (parsed.data.startGgUrl && formData.get("syncFromStartGg") === "on") {
    try {
      await syncTournamentFromStartGg(id, {
        applyResults: true,
        skipTitleAndStatus: true,
      });
    } catch {
      // 更新成功但同步失败，不阻断流程
    }
  }

  revalidatePath("/admin/tournaments");
  revalidatePath(`/admin/tournaments/${id}`);
  return { success: true };
}

export async function deleteTournamentAction(tournamentId: string) {
  await requireAdmin();

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { _count: { select: { placements: true } } },
  });
  if (!tournament) return { error: "赛事不存在" };

  await prisma.tournament.delete({ where: { id: tournamentId } });

  revalidatePath("/admin/tournaments");
  revalidatePath("/rankings");
  revalidatePath("/");
  return { success: true, hadPlacements: tournament._count.placements > 0 };
}

export async function syncTournamentFromStartGgAction(tournamentId: string) {
  await requireAdmin();
  const summary = await syncTournamentFromStartGg(tournamentId, { applyResults: true });
  revalidatePath("/admin/tournaments");
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/rankings");
  return { success: true, summary };
}

export async function updateRegistrationStatusAction(
  registrationId: string,
  status: "CONFIRMED" | "CANCELLED"
) {
  await requireAdmin();
  await prisma.registration.update({
    where: { id: registrationId },
    data: { status },
  });
  revalidatePath("/admin/tournaments");
  return { success: true };
}

export async function submitManualPlacementsAction(
  tournamentId: string,
  placements: Array<{ userId?: string; playerName?: string; placement: number }>
) {
  await requireAdmin();

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return { error: "赛事不存在" };
  if (tournament.status === "COMPLETED") return { error: "赛事已完成" };

  try {
    const result = await applyTournamentPlacements(
      tournamentId,
      tournament.tierId,
      placements.map((p) => ({
        placement: p.placement,
        userId: p.userId,
        playerName: p.playerName,
      }))
    );
    revalidatePath(`/admin/tournaments/${tournamentId}`);
    revalidatePath("/rankings");
    return { success: true, ...result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "录入失败" };
  }
}

export async function resetTournamentResultsAction(tournamentId: string) {
  await requireAdmin();

  await prisma.placement.deleteMany({ where: { tournamentId } });
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "CLOSED", lastSyncedAt: null },
  });

  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath("/rankings");
  return { success: true };
}

export async function confirmSyncPlacementsAction(
  tournamentId: string,
  items: Array<{ entrantName: string; placement: number; userId?: string; ignored?: boolean }>
) {
  await requireAdmin();

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return { error: "赛事不存在" };
  if (tournament.status === "COMPLETED") return { error: "赛事已完成" };

  try {
    const result = await applyTournamentPlacements(
      tournamentId,
      tournament.tierId,
      items.map((item) => ({
        placement: item.placement,
        userId: item.userId,
        playerName: item.userId ? undefined : item.entrantName,
        ignored: item.ignored,
      })),
      { updateLastSynced: true }
    );

    revalidatePath(`/admin/tournaments/${tournamentId}`);
    revalidatePath("/rankings");
    return { success: true, ...result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "入账失败" };
  }
}

export async function transferPlacementAction(placementId: string, targetUserId: string) {
  await requireAdmin();

  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
    include: { user: { select: { id: true, isVirtual: true, nickname: true } } },
  });
  if (!placement) return { error: "成绩记录不存在" };

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, isVirtual: true, nickname: true },
  });
  if (!target || target.isVirtual) return { error: "请选择真实选手账号" };
  if (!placement.user.isVirtual) return { error: "该成绩已绑定真实账号" };

  const conflict = await prisma.placement.findUnique({
    where: {
      tournamentId_userId: {
        tournamentId: placement.tournamentId,
        userId: targetUserId,
      },
    },
  });
  if (conflict) return { error: `${target.nickname} 在本赛事已有成绩记录` };

  const oldUserId = placement.userId;

  await prisma.placement.update({
    where: { id: placementId },
    data: { userId: targetUserId },
  });

  await cleanupVirtualUserIfOrphaned(oldUserId);

  revalidatePath(`/admin/tournaments/${placement.tournamentId}`);
  revalidatePath("/rankings");
  return { success: true };
}

export async function createAdminUserAction(formData: FormData) {
  const authError = await ensureAdminAction();
  if (authError) redirectAdminError("/admin/users", authError.error);

  const username = formData.get("username") as string;
  const nickname = formData.get("nickname") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "PLAYER" | "ADMIN";

  if (!username || !nickname || !password) {
    redirectAdminError("/admin/users", "请填写完整信息");
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) redirectAdminError("/admin/users", "用户名已存在");

  try {
    await assertNicknameAvailable(nickname);
    await prisma.user.create({
      data: {
        username,
        nickname,
        passwordHash: await hashPassword(password),
        role: role || "PLAYER",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "创建用户失败";
    redirectAdminError("/admin/users", message);
  }

  revalidatePath("/admin/users");
}

export async function toggleBanUserAction(userId: string, isBanned: boolean) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { isBanned } });
  revalidatePath("/admin/users");
  return { success: true };
}
