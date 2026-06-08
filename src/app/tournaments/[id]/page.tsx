import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TournamentStatusBadge } from "@/components/tournament-status-badge";
import { TournamentRegisterButtons } from "@/components/tournament-register-buttons";
import { PlayerLink } from "@/components/player-link";
import { formatDate } from "@/lib/utils";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      game: true,
      tier: true,
      registrations: {
        where: { status: { not: "CANCELLED" } },
        include: { user: { select: { nickname: true } } },
      },
      placements: {
        include: { user: { select: { nickname: true } } },
        orderBy: { placement: "asc" },
      },
    },
  });

  if (!tournament) notFound();

  const myRegistration = user
    ? tournament.registrations.find((r) => r.userId === user.id)
    : null;

  const canRegister =
    user &&
    user.role === "PLAYER" &&
    tournament.status === "OPEN" &&
    new Date() <= tournament.regDeadline &&
    !myRegistration;

  const canCancel =
    user &&
    myRegistration &&
    tournament.status === "OPEN" &&
    new Date() <= tournament.regDeadline;

  const isFull =
    tournament.maxPlayers !== null &&
    tournament.registrations.length >= tournament.maxPlayers;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{tournament.title}</CardTitle>
              <CardDescription className="mt-2">
                <Link href={`/games/${tournament.game.slug}`} className="hover:underline">
                  {tournament.game.name}
                </Link>
                {" · "}
                {tournament.tier.name}
              </CardDescription>
            </div>
            <TournamentStatusBadge status={tournament.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tournament.description && <p>{tournament.description}</p>}

          <div className="grid gap-2 text-sm">
            <p><span className="text-muted-foreground">比赛日期：</span>{formatDate(tournament.startDate)}</p>
            <p><span className="text-muted-foreground">报名截止：</span>{formatDate(tournament.regDeadline)}</p>
            {tournament.maxPlayers && (
              <p>
                <span className="text-muted-foreground">人数上限：</span>
                {tournament.registrations.length} / {tournament.maxPlayers}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!user && tournament.status === "OPEN" && (
              <Button asChild>
                <Link href="/login">登录后报名</Link>
              </Button>
            )}
            {user?.role === "PLAYER" && tournament.status === "OPEN" && (
              <TournamentRegisterButtons
                tournamentId={id}
                canRegister={!!canRegister}
                canCancel={!!canCancel}
                isFull={isFull}
              />
            )}
            {myRegistration && tournament.status !== "COMPLETED" && (
              <span className="text-emerald-600 text-sm font-medium">你已报名本赛事</span>
            )}
          </div>

          {tournament.startGgUrl && tournament.status === "OPEN" && (
            <div className="rounded-md bg-blue-50 border border-blue-200 p-4 text-sm">
              <p className="font-medium text-blue-800 mb-2">报名说明</p>
              <p className="text-blue-700">
                请在本站完成报名，管理员将根据你的资料在 start.gg 中添加参赛选手。对阵与赛程以 start.gg 为准。
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <a href={tournament.startGgUrl} target="_blank" rel="noopener noreferrer">
                  查看 start.gg 赛事页面
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {tournament.status === "COMPLETED" && tournament.placements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>比赛结果</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">名次</th>
                  <th className="pb-2 pr-4">选手</th>
                  <th className="pb-2">积分</th>
                </tr>
              </thead>
              <tbody>
                {tournament.placements.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-bold">#{p.placement}</td>
                    <td className="py-2 pr-4">
                      <PlayerLink userId={p.userId} nickname={p.user.nickname} />
                    </td>
                    <td className="py-2 text-primary font-medium">+{p.pointsAwarded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {Array.isArray(tournament.startGgEntrantsCache) &&
        (tournament.startGgEntrantsCache as Array<{ id: string; name: string }>).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              start.gg 参赛选手 (
              {(tournament.startGgEntrantsCache as Array<{ id: string; name: string }>).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(tournament.startGgEntrantsCache as Array<{ id: string; name: string }>).map((e) => (
                <span key={e.id} className="rounded-full bg-muted px-3 py-1 text-sm">
                  {e.name}
                </span>
              ))}
            </div>
            {tournament.lastSyncedAt && (
              <p className="text-xs text-muted-foreground mt-3">
                数据同步自 start.gg · {formatDate(tournament.lastSyncedAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {tournament.status !== "COMPLETED" && (
        <Card>
          <CardHeader>
            <CardTitle>
              本站报名选手 ({tournament.registrations.length}
              {tournament.maxPlayers ? ` / ${tournament.maxPlayers}` : ""})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tournament.registrations.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无报名</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tournament.registrations.map((r) => (
                  <PlayerLink
                    key={r.id}
                    userId={r.userId}
                    nickname={r.user.nickname}
                    variant="chip"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
