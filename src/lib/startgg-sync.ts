import { prisma } from "@/lib/db";
import { applyTournamentPlacements } from "@/lib/placements";
import {
  fetchStartGgEntrants,
  fetchStartGgEventDetails,
  fetchStartGgStandings,
  fetchStartGgTournamentBySlug,
  formatStartGgTournamentTitle,
  isEventCompleted,
  mapStartGgStateToTournamentStatus,
  matchEntrantsToUsers,
  matchStandingsToUsers,
  parseStartGgEventId,
  parseStartGgTournamentSlug,
  resolveStartGgEventId,
  resolveEventDates,
  type StartGgEntrant,
  type StartGgEventDetails,
} from "@/lib/startgg";

export type StartGgSyncSummary = {
  event: {
    id: string;
    name: string;
    state: number;
    numEntrants: number;
    isCompleted: boolean;
    videogameName: string | null;
  };
  updated: {
    title: boolean;
    startDate: boolean;
    regDeadline: boolean;
    status: boolean;
    description: boolean;
  };
  entrants: {
    total: number;
    matched: number;
    registrationsAdded: number;
    unmatched: string[];
  };
  results: {
    synced: boolean;
    placementsApplied: number;
    unmatched: string[];
  } | null;
};

async function syncRegistrationsFromEntrants(
  tournamentId: string,
  entrantMatches: ReturnType<typeof matchEntrantsToUsers>
) {
  let added = 0;

  for (const match of entrantMatches) {
    if (!match.matchedUserId) continue;

    const existing = await prisma.registration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: match.matchedUserId,
        },
      },
    });

    if (existing) {
      if (existing.status === "CANCELLED") {
        await prisma.registration.update({
          where: { id: existing.id },
          data: { status: "CONFIRMED", registeredAt: new Date() },
        });
        added += 1;
      }
    } else {
      await prisma.registration.create({
        data: {
          tournamentId,
          userId: match.matchedUserId,
          status: "CONFIRMED",
        },
      });
      added += 1;
    }
  }

  return added;
}

async function syncResultsFromStandings(
  tournamentId: string,
  tierId: string,
  standings: Awaited<ReturnType<typeof fetchStartGgStandings>>
) {
  const users = await prisma.user.findMany({
    where: { role: "PLAYER", isBanned: false, isVirtual: false },
    select: { id: true, nickname: true, startGgTag: true },
  });

  const registrations = await prisma.registration.findMany({
    where: { tournamentId, status: { not: "CANCELLED" } },
    select: { userId: true },
  });
  const registeredUserIds = new Set(registrations.map((r) => r.userId));

  const usersWithRegistration = users.map((u) => ({
    ...u,
    registeredForTournament: registeredUserIds.has(u.id),
  }));

  const matches = matchStandingsToUsers(standings, usersWithRegistration);

  const result = await applyTournamentPlacements(
    tournamentId,
    tierId,
    matches.map((m) => ({
      placement: m.placement,
      userId: m.matchedUserId || undefined,
      playerName: m.matchedUserId ? undefined : m.entrantName,
    })),
    { markCompleted: true }
  );

  return {
    placementsApplied: result.total,
    virtualCount: result.virtualCount,
    unmatched: matches.filter((m) => !m.matchedUserId).map((m) => m.entrantName),
  };
}

export async function buildStartGgPreview(
  event: StartGgEventDetails,
  entrants: StartGgEntrant[],
  options?: { multiEvent?: boolean }
) {
  const { startDate, regDeadline } = resolveEventDates(event);

  return {
    title: formatStartGgTournamentTitle(event, options?.multiEvent),
    description: event.rulesMarkdown || "",
    startDate: startDate.toISOString(),
    regDeadline: regDeadline.toISOString(),
    numEntrants: event.numEntrants,
    videogameName: event.videogame?.name ?? null,
    tournamentName: event.tournament?.name ?? null,
    eventName: event.name,
    isCompleted: isEventCompleted(event.state),
    entrants: entrants.map((e) => ({ id: e.id, name: e.name })),
  };
}

export async function syncTournamentFromStartGg(
  tournamentId: string,
  options?: { applyResults?: boolean; skipTitleAndStatus?: boolean }
): Promise<StartGgSyncSummary> {
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) throw new Error("赛事不存在");
  if (!tournament.startGgEventId && !tournament.startGgUrl) {
    throw new Error("未配置 start.gg 链接");
  }

  let eventId = tournament.startGgEventId;
  if (!eventId && tournament.startGgUrl) {
    eventId = await resolveStartGgEventId(tournament.startGgUrl);
  }
  if (!eventId) throw new Error("无法解析 start.gg Event ID，请重新选择比赛项目");

  const event = await fetchStartGgEventDetails(eventId);
  if (!event) throw new Error("未找到 start.gg 赛事");

  const [entrants, standings] = await Promise.all([
    fetchStartGgEntrants(eventId),
    isEventCompleted(event.state)
      ? fetchStartGgStandings(eventId).catch(() => [])
      : Promise.resolve([]),
  ]);

  const { startDate, regDeadline } = resolveEventDates(event);
  const status = mapStartGgStateToTournamentStatus(
    event.state,
    event.tournament?.isRegistrationOpen ?? null
  );

  const users = await prisma.user.findMany({
    where: { role: "PLAYER", isBanned: false },
    select: { id: true, nickname: true, startGgTag: true },
  });

  const entrantMatches = matchEntrantsToUsers(entrants, users);
  const registrationsAdded = await syncRegistrationsFromEntrants(tournamentId, entrantMatches);

  const existingPlacements = await prisma.placement.count({ where: { tournamentId } });
  const shouldApplyResults =
    options?.applyResults !== false &&
    isEventCompleted(event.state) &&
    standings.length > 0 &&
    tournament.status !== "COMPLETED" &&
    existingPlacements === 0;

  let resultsSummary: StartGgSyncSummary["results"] = null;
  if (shouldApplyResults) {
    const result = await syncResultsFromStandings(tournamentId, tournament.tierId, standings);
    resultsSummary = {
      synced: true,
      placementsApplied: result.placementsApplied,
      unmatched: result.unmatched,
    };
  } else if (isEventCompleted(event.state) && standings.length > 0) {
    resultsSummary = { synced: false, placementsApplied: 0, unmatched: [] };
  }

  const finalStatus = resultsSummary?.synced ? "COMPLETED" : status;
  const skipMeta = options?.skipTitleAndStatus && !resultsSummary?.synced;

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      ...(skipMeta
        ? {}
        : {
            title: formatStartGgTournamentTitle(event),
            status: finalStatus,
          }),
      description: event.rulesMarkdown || tournament.description,
      startDate,
      regDeadline,
      startGgEventId: eventId,
      startGgEntrantsCache: entrants,
      lastSyncedAt: new Date(),
    },
  });

  return {
    event: {
      id: event.id,
      name: event.name,
      state: event.state,
      numEntrants: event.numEntrants,
      isCompleted: isEventCompleted(event.state),
      videogameName: event.videogame?.name ?? null,
    },
    updated: {
      title: true,
      startDate: true,
      regDeadline: true,
      status: true,
      description: !!event.rulesMarkdown,
    },
    entrants: {
      total: entrants.length,
      matched: entrantMatches.filter((m) => m.matchedUserId).length,
      registrationsAdded,
      unmatched: entrantMatches.filter((m) => !m.matchedUserId).map((m) => m.entrantName),
    },
    results: resultsSummary,
  };
}

export type StartGgPreviewResult =
  | {
      needsEventSelection: true;
      tournamentName: string;
      tournamentSlug: string;
      events: Array<{
        id: string;
        name: string;
        numEntrants: number;
        videogameName: string | null;
      }>;
    }
  | ({
      needsEventSelection: false;
      eventId: string;
    } & Awaited<ReturnType<typeof buildStartGgPreview>>);

export async function previewStartGgFromUrl(
  url: string,
  selectedEventId?: string | null,
  options?: { multiEvent?: boolean }
): Promise<StartGgPreviewResult> {
  const slug = parseStartGgTournamentSlug(url);
  const hasEventInUrl = /\/event\//i.test(url) && parseStartGgEventId(url);
  let multiEvent = options?.multiEvent ?? false;

  if (!selectedEventId && slug && !hasEventInUrl) {
    const tournament = await fetchStartGgTournamentBySlug(slug);
    if (!tournament) {
      throw new Error(`未找到锦标赛，请检查链接：https://www.start.gg/tournament/${slug}`);
    }
    if (tournament.events.length === 0) {
      throw new Error(`锦标赛「${tournament.name}」下暂无比赛项目`);
    }
    if (tournament.events.length > 1) {
      return {
        needsEventSelection: true,
        tournamentName: tournament.name,
        tournamentSlug: tournament.slug,
        events: tournament.events.map((e) => ({
          id: e.id,
          name: e.name,
          numEntrants: e.numEntrants,
          videogameName: e.videogameName,
        })),
      };
    }
    selectedEventId = tournament.events[0].id;
    multiEvent = false;
  }

  const eventId = await resolveStartGgEventId(url, selectedEventId);
  const [event, entrants] = await Promise.all([
    fetchStartGgEventDetails(eventId),
    fetchStartGgEntrants(eventId),
  ]);

  if (!event) throw new Error("未找到 start.gg 赛事");

  if (!options?.multiEvent && selectedEventId && slug && !hasEventInUrl) {
    multiEvent = (event.tournament?.events?.length ?? 0) > 1;
  }

  const preview = await buildStartGgPreview(event, entrants, { multiEvent });
  return { needsEventSelection: false, eventId, ...preview };
}
