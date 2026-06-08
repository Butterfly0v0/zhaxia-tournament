import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { syncTournamentFromStartGg } from "@/lib/startgg-sync";
import { prisma } from "@/lib/db";
import { getPointRulesMap } from "@/lib/points";
import {
  fetchStartGgEventDetails,
  fetchStartGgStandings,
  isEventCompleted,
  matchStandingsToUsers,
} from "@/lib/startgg";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { tournamentId, mode } = body as {
      tournamentId?: string;
      mode?: "full" | "results-preview";
    };

    if (!tournamentId) {
      return NextResponse.json({ error: "缺少 tournamentId" }, { status: 400 });
    }

    // 全量同步：赛事信息 + 选手 + 结果（若已结束）
    if (mode !== "results-preview") {
      const summary = await syncTournamentFromStartGg(tournamentId, { applyResults: true });
      return NextResponse.json({ mode: "full", summary });
    }

    // 仅预览名次（用于手动确认入账的备用流程）
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: {
          where: { status: { not: "CANCELLED" } },
          select: { userId: true },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "赛事不存在" }, { status: 404 });
    }

    const eventId = tournament.startGgEventId;
    if (!eventId) {
      return NextResponse.json({ error: "未配置 start.gg Event ID" }, { status: 400 });
    }

    const eventInfo = await fetchStartGgEventDetails(eventId);
    if (!eventInfo) {
      return NextResponse.json({ error: "未找到 start.gg 赛事" }, { status: 404 });
    }

    const standings = await fetchStartGgStandings(eventId);
    const registeredUserIds = new Set(tournament.registrations.map((r) => r.userId));

    const users = await prisma.user.findMany({
      where: { role: "PLAYER", isBanned: false },
      select: { id: true, nickname: true, startGgTag: true },
    });

    const usersWithRegistration = users.map((u) => ({
      ...u,
      registeredForTournament: registeredUserIds.has(u.id),
    }));

    const matches = matchStandingsToUsers(standings, usersWithRegistration);
    const pointRules = await getPointRulesMap(tournament.tierId);

    const preview = matches.map((m) => ({
      ...m,
      estimatedPoints: pointRules.get(m.placement) ?? 0,
    }));

    return NextResponse.json({
      mode: "results-preview",
      eventInfo: {
        name: eventInfo.name,
        state: eventInfo.state,
        numEntrants: eventInfo.numEntrants,
        isCompleted: isEventCompleted(eventInfo.state),
      },
      preview,
      allUsers: users.map((u) => ({ id: u.id, nickname: u.nickname, startGgTag: u.startGgTag })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "同步失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
