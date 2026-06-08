import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayerForPublicLookup } from "@/lib/player-lookup";
import { getUserGameStats } from "@/lib/points";
import { StartGgProfileButton } from "@/components/lookup/startgg-profile-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function PlayerLookupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getPlayerForPublicLookup(id);
  if (!user) notFound();

  const stats = await getUserGameStats(user.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/lookup">← 返回查询</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                {user.nickname}
                {user.isVirtual && <Badge variant="warning">虚拟账号</Badge>}
              </CardTitle>
              {user.startGgTag && (
                <p className="text-sm text-muted-foreground mt-1">
                  start.gg 昵称：{user.startGgTag}
                </p>
              )}
            </div>
            <StartGgProfileButton uniqueCode={user.startGgUniqueCode} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-sm">
            <p>
              <span className="text-muted-foreground">总积分：</span>
              <span className="font-medium text-primary">{stats.totalPoints}</span>
            </p>
            <p>
              <span className="text-muted-foreground">完赛场次：</span>
              <span className="font-medium">{stats.tournamentCount}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>比赛成绩</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.placements.length === 0 ? (
            <p className="text-muted-foreground">暂无已完赛的成绩记录</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">赛事</th>
                  <th className="pb-2 pr-4">游戏</th>
                  <th className="pb-2 pr-4">等级</th>
                  <th className="pb-2 pr-4">名次</th>
                  <th className="pb-2 pr-4">积分</th>
                  <th className="pb-2">日期</th>
                </tr>
              </thead>
              <tbody>
                {stats.placements.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <Link
                        href={`/tournaments/${p.tournament.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {p.tournament.title}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{p.tournament.game.name}</td>
                    <td className="py-2 pr-4">{p.tournament.tier.name}</td>
                    <td className="py-2 pr-4 font-bold">#{p.placement}</td>
                    <td className="py-2 pr-4 text-primary font-medium">+{p.pointsAwarded}</td>
                    <td className="py-2">{formatDate(p.tournament.startDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
