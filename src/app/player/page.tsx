import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getUserGameStats } from "@/lib/points";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function PlayerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [stats, openCount, myRegistrations] = await Promise.all([
    getUserGameStats(user.id),
    prisma.tournament.count({ where: { status: "OPEN" } }),
    prisma.registration.count({
      where: { userId: user.id, status: { not: "CANCELLED" }, tournament: { status: { in: ["OPEN", "CLOSED"] } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">欢迎，{user.nickname}</h1>
        <p className="text-muted-foreground mt-2">选手中心</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>累计积分</CardDescription>
            <CardTitle className="text-3xl text-primary">{stats.totalPoints}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>参赛场次</CardDescription>
            <CardTitle className="text-3xl">{stats.tournamentCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>进行中报名</CardDescription>
            <CardTitle className="text-3xl">{myRegistrations}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/player/tournaments">浏览可报名赛事 ({openCount})</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/player/my-events">我的赛事</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/player/profile">个人资料</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/rankings">查看排行榜</Link>
        </Button>
      </div>

      {stats.placements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近成绩</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.placements.slice(0, 5).map((p) => (
                <div key={p.id} className="flex justify-between text-sm border-b pb-2 last:border-0">
                  <span>
                    {p.tournament.title} ({p.tournament.game.name})
                  </span>
                  <span className="font-medium">
                    第{p.placement}名 · +{p.pointsAwarded}分
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
