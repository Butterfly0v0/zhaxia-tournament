import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const [games, tournaments, users, openTournaments] = await Promise.all([
    prisma.game.count({ where: { isActive: true } }),
    prisma.tournament.count(),
    prisma.user.count({ where: { role: "PLAYER" } }),
    prisma.tournament.count({ where: { status: "OPEN" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">活跃游戏</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{games}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">赛事总数</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{tournaments}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">注册选手</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{users}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">报名中赛事</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{openTournaments}</CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/admin/tournaments/new">创建赛事</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/games">管理游戏</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/tiers">配置积分表</Link>
        </Button>
      </div>
    </div>
  );
}
