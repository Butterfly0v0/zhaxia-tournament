const STARTGG_API_URL = "https://api.start.gg/gql/alpha";

export type StartGgStanding = {
  placement: number;
  entrantName: string;
  entrantId: string;
};

export type StartGgEntrant = {
  id: string;
  name: string;
};

export type StartGgEventDetails = {
  id: string;
  name: string;
  slug: string;
  state: number;
  numEntrants: number;
  startAt: number | null;
  rulesMarkdown: string | null;
  tournament: {
    id: number;
    name: string;
    slug: string;
    startAt: number | null;
    registrationClosesAt: number | null;
    eventRegistrationClosesAt: number | null;
    isRegistrationOpen: boolean | null;
    state: number;
    events: Array<{ id: number }>;
  } | null;
  videogame: {
    id: number;
    name: string;
    slug: string;
  } | null;
};

export type StartGgUrlParts = {
  eventId: string | null;
  tournamentSlug: string | null;
};

export type StartGgTournamentEvent = {
  id: string;
  name: string;
  slug: string;
  numEntrants: number;
  videogameName: string | null;
};

export type StartGgTournamentInfo = {
  id: number;
  name: string;
  slug: string;
  events: StartGgTournamentEvent[];
};

export function parseStartGgTournamentSlug(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/\/tournament\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

export function parseStartGgUrl(url: string): StartGgUrlParts | null {
  if (!url) return null;
  const trimmed = url.trim();
  const tournamentSlug = parseStartGgTournamentSlug(trimmed);
  const eventId = parseStartGgEventId(trimmed);

  if (!tournamentSlug && !eventId) return null;

  return { eventId, tournamentSlug };
}

export function parseStartGgEventId(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();

  // /event/12345 或 /event/some-slug-12345
  const eventIdMatch = trimmed.match(/\/event\/(?:[^/]*-)?(\d+)/i);
  if (eventIdMatch) return eventIdMatch[1];

  if (/^\d+$/.test(trimmed)) return trimmed;

  return null;
}

const TOURNAMENT_EVENTS_QUERY = `
  query TournamentBySlug($slug: String!) {
    tournament(slug: $slug) {
      id
      name
      slug
      events {
        id
        name
        slug
        numEntrants
        videogame {
          name
        }
      }
    }
  }
`;

export async function fetchStartGgTournamentBySlug(
  slug: string
): Promise<StartGgTournamentInfo | null> {
  const data = await startGgQuery<{
    tournament: {
      id: number;
      name: string;
      slug: string;
      events: Array<{
        id: number;
        name: string;
        slug: string;
        numEntrants: number;
        videogame: { name: string } | null;
      }>;
    } | null;
  }>(TOURNAMENT_EVENTS_QUERY, { slug });

  if (!data.tournament) return null;

  return {
    id: data.tournament.id,
    name: data.tournament.name,
    slug: data.tournament.slug,
    events: data.tournament.events.map((e) => ({
      id: String(e.id),
      name: e.name,
      slug: e.slug,
      numEntrants: e.numEntrants,
      videogameName: e.videogame?.name ?? null,
    })),
  };
}

/** 从链接或已选项目 ID 解析出 start.gg Event ID */
export async function resolveStartGgEventId(
  url: string,
  selectedEventId?: string | null
): Promise<string> {
  if (selectedEventId) return selectedEventId;

  const eventIdFromUrl = parseStartGgEventId(url);
  if (eventIdFromUrl && /\/event\//i.test(url)) {
    return eventIdFromUrl;
  }

  const slug = parseStartGgTournamentSlug(url);
  if (!slug) {
    throw new Error(
      "无法识别的 start.gg 链接。请填写锦标赛链接（如 https://www.start.gg/tournament/xxx）或具体项目链接（含 /event/）"
    );
  }

  const tournament = await fetchStartGgTournamentBySlug(slug);
  if (!tournament) {
    throw new Error(`未找到锦标赛「${slug}」，请检查链接是否正确`);
  }

  if (tournament.events.length === 0) {
    throw new Error(`锦标赛「${tournament.name}」下暂无比赛项目`);
  }

  if (tournament.events.length === 1) {
    return tournament.events[0].id;
  }

  throw new Error(
    `锦标赛「${tournament.name}」包含 ${tournament.events.length} 个项目，请先选择具体比赛项目`
  );
}

export function startGgTimestampToDate(ts: number | null | undefined): Date | null {
  if (!ts) return null;
  return new Date(ts * 1000);
}

// start.gg event/tournament states: 1=created, 2=active, 3=completed
export function isEventCompleted(state: number) {
  return state === 3;
}

export function mapStartGgStateToTournamentStatus(
  eventState: number,
  isRegistrationOpen: boolean | null
): "DRAFT" | "OPEN" | "CLOSED" | "COMPLETED" {
  if (eventState === 3) return "COMPLETED";
  if (isRegistrationOpen) return "OPEN";
  if (eventState === 2) return "CLOSED";
  return "DRAFT";
}

async function startGgQuery<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const token = process.env.STARTGG_API_TOKEN;
  if (!token) {
    throw new Error("未配置 STARTGG_API_TOKEN，请在 .env 中设置");
  }

  const res = await fetch(STARTGG_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (res.status === 401) {
    throw new Error("start.gg API Token 无效或已过期，请更新 .env 中的 STARTGG_API_TOKEN");
  }

  const json = await res.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0].message || "start.gg API 请求失败");
  }

  return json.data as T;
}

const EVENT_DETAILS_QUERY = `
  query EventDetails($eventId: ID!) {
    event(id: $eventId) {
      id
      name
      slug
      state
      numEntrants
      startAt
      rulesMarkdown
      videogame {
        id
        name
        slug
      }
      tournament {
        id
        name
        slug
        startAt
        registrationClosesAt
        eventRegistrationClosesAt
        isRegistrationOpen
        state
        events {
          id
        }
      }
    }
  }
`;

export function isMultiEventTournament(event: StartGgEventDetails) {
  return (event.tournament?.events?.length ?? 0) > 1;
}

/** 单项目用锦标赛名；多项目用「锦标赛名 - 项目名」 */
export function formatStartGgTournamentTitle(
  event: StartGgEventDetails,
  multiEvent?: boolean
) {
  const tournamentName = event.tournament?.name?.trim();
  const eventName = event.name.trim();
  const useMultiFormat = multiEvent ?? isMultiEventTournament(event);

  if (!tournamentName) return eventName;
  if (useMultiFormat) return `${tournamentName} - ${eventName}`;
  return tournamentName;
}

const STANDINGS_QUERY = `
  query EventStandings($eventId: ID!, $page: Int!, $perPage: Int!) {
    event(id: $eventId) {
      id
      name
      standings(query: { page: $page, perPage: $perPage }) {
        nodes {
          placement
          entrant {
            id
            name
          }
        }
      }
    }
  }
`;

const ENTRANTS_QUERY = `
  query EventEntrants($eventId: ID!, $page: Int!, $perPage: Int!) {
    event(id: $eventId) {
      id
      entrants(query: { page: $page, perPage: $perPage }) {
        nodes {
          id
          name
        }
      }
    }
  }
`;

export async function fetchStartGgEventDetails(eventId: string): Promise<StartGgEventDetails | null> {
  const data = await startGgQuery<{ event: StartGgEventDetails | null }>(EVENT_DETAILS_QUERY, {
    eventId: parseInt(eventId, 10),
  });
  return data.event;
}

export async function fetchStartGgEventDetailsFromUrl(
  url: string,
  selectedEventId?: string | null
): Promise<StartGgEventDetails | null> {
  const eventId = await resolveStartGgEventId(url, selectedEventId);
  const event = await fetchStartGgEventDetails(eventId);
  if (!event) throw new Error("未找到该 start.gg 赛事");
  return event;
}

export async function fetchStartGgEntrants(eventId: string): Promise<StartGgEntrant[]> {
  const perPage = 64;
  let page = 1;
  const all: StartGgEntrant[] = [];

  while (true) {
    const data = await startGgQuery<{
      event: {
        entrants: {
          nodes: Array<{ id: string; name: string }>;
        };
      } | null;
    }>(ENTRANTS_QUERY, {
      eventId: parseInt(eventId, 10),
      page,
      perPage,
    });

    if (!data.event) {
      throw new Error("未找到该 start.gg 赛事");
    }

    const nodes = data.event.entrants?.nodes ?? [];
    for (const node of nodes) {
      all.push({ id: node.id, name: node.name });
    }

    if (nodes.length < perPage) break;
    page += 1;
  }

  return all;
}

export async function fetchStartGgStandings(eventId: string): Promise<StartGgStanding[]> {
  const perPage = 64;
  let page = 1;
  const all: StartGgStanding[] = [];

  while (true) {
    const data = await startGgQuery<{
      event: {
        standings: {
          nodes: Array<{
            placement: number;
            entrant: { id: string; name: string };
          }>;
        };
      } | null;
    }>(STANDINGS_QUERY, {
      eventId: parseInt(eventId, 10),
      page,
      perPage,
    });

    if (!data.event) {
      throw new Error("未找到该 start.gg 赛事，请检查链接或 Event ID");
    }

    const nodes = data.event.standings?.nodes ?? [];
    for (const node of nodes) {
      all.push({
        placement: node.placement,
        entrantName: node.entrant.name,
        entrantId: node.entrant.id,
      });
    }

    if (nodes.length < perPage) break;
    page += 1;
  }

  return all.sort((a, b) => a.placement - b.placement);
}

export type MatchResult = {
  entrantName: string;
  entrantId: string;
  placement: number;
  matchedUserId: string | null;
  matchedNickname: string | null;
  matchStatus: "matched" | "pending" | "ignored";
};

export type EntrantMatchResult = {
  entrantId: string;
  entrantName: string;
  matchedUserId: string | null;
  matchedNickname: string | null;
  matchStatus: "matched" | "pending";
};

export function matchEntrantsToUsers(
  entrants: StartGgEntrant[],
  users: Array<{
    id: string;
    nickname: string;
    startGgTag: string | null;
  }>
): EntrantMatchResult[] {
  const usedUserIds = new Set<string>();

  return entrants.map((entrant) => {
    const normalizedName = entrant.name.trim().toLowerCase();
    const matched = users.find(
      (u) =>
        u.startGgTag &&
        u.startGgTag.trim().toLowerCase() === normalizedName &&
        !usedUserIds.has(u.id)
    );

    if (matched) {
      usedUserIds.add(matched.id);
      return {
        entrantId: entrant.id,
        entrantName: entrant.name,
        matchedUserId: matched.id,
        matchedNickname: matched.nickname,
        matchStatus: "matched" as const,
      };
    }

    return {
      entrantId: entrant.id,
      entrantName: entrant.name,
      matchedUserId: null,
      matchedNickname: null,
      matchStatus: "pending" as const,
    };
  });
}

export function matchStandingsToUsers(
  standings: StartGgStanding[],
  users: Array<{
    id: string;
    nickname: string;
    startGgTag: string | null;
    registeredForTournament: boolean;
  }>
): MatchResult[] {
  const usedUserIds = new Set<string>();

  return standings.map((standing) => {
    const normalizedName = standing.entrantName.trim().toLowerCase();

    const candidates = users.filter(
      (u) => u.startGgTag && u.startGgTag.trim().toLowerCase() === normalizedName
    );

    let matched = candidates.find((u) => u.registeredForTournament && !usedUserIds.has(u.id));
    if (!matched) {
      matched = candidates.find((u) => !usedUserIds.has(u.id));
    }

    if (matched) {
      usedUserIds.add(matched.id);
      return {
        entrantName: standing.entrantName,
        entrantId: standing.entrantId,
        placement: standing.placement,
        matchedUserId: matched.id,
        matchedNickname: matched.nickname,
        matchStatus: "matched" as const,
      };
    }

    return {
      entrantName: standing.entrantName,
      entrantId: standing.entrantId,
      placement: standing.placement,
      matchedUserId: null,
      matchedNickname: null,
      matchStatus: "pending" as const,
    };
  });
}

export function resolveEventDates(event: StartGgEventDetails) {
  const startDate =
    startGgTimestampToDate(event.startAt) ??
    startGgTimestampToDate(event.tournament?.startAt) ??
    new Date();

  const regDeadline =
    startGgTimestampToDate(event.tournament?.eventRegistrationClosesAt) ??
    startGgTimestampToDate(event.tournament?.registrationClosesAt) ??
    startDate;

  return { startDate, regDeadline };
}
