import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getPointRulesMap } from "@/lib/points";
import { TournamentForm } from "@/components/forms/tournament-form";
import { ManualPlacementsForm } from "@/components/admin/manual-placements-form";
import { StartGgSyncPanel } from "@/components/admin/startgg-sync-panel";
import { CancelRegistrationButton } from "@/components/admin/registration-actions";
import { ExportRegistrationsButton } from "@/components/admin/export-registrations-button";
import { ResetResultsButton } from "@/components/admin/reset-results-button";
import { DeleteTournamentButton } from "@/components/admin/delete-tournament-button";
import { TransferPlacementButton } from "@/components/admin/transfer-placement-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TournamentStatusBadge } from "@/components/tournament-status-badge";
import { formatDate } from "@/lib/utils";
import { decryptSensitiveUserFields } from "@/lib/user-sensitive-fields";

export default async function AdminTournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      game: true,
      tier: true,
      registrations: {
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              email: true,
              qq: true,
              startGgTag: true,
              startGgUniqueCode: true,
            },
          },
        },
        orderBy: { registeredAt: "asc" },
      },
      placements: {
        include: { user: { select: { id: true, nickname: true, isVirtual: true } } },
        orderBy: { placement: "asc" },
      },
    },
  });

  if (!tournament) notFound();

  const [games, tiers, pointRulesMap, realUsers] = await Promise.all([
    prisma.game.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.eventTier.findMany({ orderBy: { sortOrder: "asc" } }),
    getPointRulesMap(tournament.tierId),
    prisma.user.findMany({
      where: { role: "PLAYER", isBanned: false, isVirtual: false },
      select: { id: true, nickname: true },
      orderBy: { nickname: "asc" },
    }),
  ]);

  const pointRules = Object.fromEntries(pointRulesMap);

  const registrations = tournament.registrations.map((r) => ({
    ...r,
    user: decryptSensitiveUserFields(r.user),
  }));
  const activeRegistrations = registrations.filter((r) => r.status !== "CANCELLED");
  const isCompleted = tournament.status === "COMPLETED";

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{tournament.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {tournament.game.name} · {tournament.tier.name} · {formatDate(tournament.startDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TournamentStatusBadge status={tournament.status} />
          <DeleteTournamentButton
            tournamentId={id}
            tournamentTitle={tournament.title}
            hasPlacements={tournament.placements.length > 0}
          />
        </div>
      </div>

      {tournament.startGgUrl && (
        <div className="text-sm space-y-2">
          <div>
            <a
              href={tournament.startGgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              start.gg 赛事链接
            </a>
            {tournament.startGgEventId && (
              <span className="text-muted-foreground ml-2">Event ID: {tournament.startGgEventId}</span>
            )}
            {tournament.lastSyncedAt && (
              <span className="text-muted-foreground ml-2">
                上次同步: {formatDate(tournament.lastSyncedAt)}
              </span>
            )}
          </div>
        </div>
      )}

      {tournament.startGgUrl && (
        <Card>
          <CardHeader>
            <CardTitle>start.gg 同步</CardTitle>
          </CardHeader>
          <CardContent>
            <StartGgSyncPanel tournamentId={id} />
          </CardContent>
        </Card>
      )}

      {!isCompleted && (
        <Card>
          <CardHeader>
            <CardTitle>编辑赛事</CardTitle>
          </CardHeader>
          <CardContent>
            <TournamentForm games={games} tiers={tiers} tournament={tournament} />
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
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>本站报名名单 ({activeRegistrations.length})</CardTitle>
          <ExportRegistrationsButton
            tournamentId={id}
            disabled={registrations.length === 0}
          />
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <p className="text-muted-foreground">暂无报名</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">选手</th>
                    <th className="pb-2 pr-4">start.gg 昵称</th>
                    <th className="pb-2 pr-4">唯一代码</th>
                    <th className="pb-2 pr-4">邮箱</th>
                    <th className="pb-2 pr-4">QQ</th>
                    <th className="pb-2 pr-4">报名时间</th>
                    <th className="pb-2 pr-4">状态</th>
                    <th className="pb-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="py-2 pr-4">{r.user.nickname}</td>
                      <td className="py-2 pr-4">{r.user.startGgTag || "—"}</td>
                      <td className="py-2 pr-4 font-mono text-xs">
                        {r.user.startGgUniqueCode || "—"}
                      </td>
                      <td className="py-2 pr-4">{r.user.email || "—"}</td>
                      <td className="py-2 pr-4">{r.user.qq || "—"}</td>
                      <td className="py-2 pr-4">{formatDate(r.registeredAt)}</td>
                      <td className="py-2 pr-4">{r.status}</td>
                      <td className="py-2">
                        {!isCompleted && r.status !== "CANCELLED" && (
                          <CancelRegistrationButton registrationId={r.id} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {isCompleted ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>比赛结果</CardTitle>
            <ResetResultsButton tournamentId={id} />
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">名次</th>
                  <th className="pb-2 pr-4">选手</th>
                  <th className="pb-2 pr-4">积分</th>
                  <th className="pb-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {tournament.placements.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="py-2 pr-4 font-bold">#{p.placement}</td>
                    <td className="py-2 pr-4">
                      <span>{p.user.nickname}</span>
                      {p.user.isVirtual && (
                        <Badge variant="warning" className="ml-2 text-xs">虚拟账号</Badge>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-primary font-medium">+{p.pointsAwarded}</td>
                    <td className="py-2">
                      {p.user.isVirtual && (
                        <TransferPlacementButton
                          placementId={p.id}
                          virtualNickname={p.user.nickname}
                          realUsers={realUsers}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>手动录入名次（备用）</CardTitle>
            </CardHeader>
            <CardContent>
              <ManualPlacementsForm
                tournamentId={id}
                registrations={activeRegistrations.map((r) => ({
                  userId: r.user.id,
                  nickname: r.user.nickname,
                }))}
                pointRules={pointRules}
                startGgEntrants={
                  Array.isArray(tournament.startGgEntrantsCache)
                    ? (tournament.startGgEntrantsCache as Array<{ id: string; name: string }>)
                    : undefined
                }
              />
            </CardContent>
          </Card>
        </>
      )}

      <Button variant="outline" asChild>
        <Link href="/admin/tournaments">返回列表</Link>
      </Button>
    </div>
  );
}
