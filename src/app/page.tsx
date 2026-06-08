import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGameRankings } from "@/lib/points";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TournamentStatusBadge } from "@/components/tournament-status-badge";
import { RankingsTable } from "@/components/rankings-table";
import { formatDate } from "@/lib/utils";

export default async function HomePage() {
  const user = await getCurrentUser();

  const [games, upcomingTournaments] = await Promise.all([
    prisma.game.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.tournament.findMany({
      where: { status: { in: ["OPEN", "CLOSED"] } },
      include: { game: true, tier: true },
      orderBy: { startDate: "asc" },
      take: 6,
    }),
  ]);

  const topRankingsByGame = await Promise.all(
    games.slice(0, 3).map(async (game) => ({
      game,
      rankings: await getGameRankings(game.id, 5),
    }))
  );

  return (
    <div className="space-y-10">
      <section className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold">
          <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
            炸虾格斗会
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          格斗游戏赛事报名、积分排名一站式平台。在 start.gg 征战，在这里积累荣耀。
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          {user ? (
            <Button asChild size="lg">
              <Link href={user.role === "ADMIN" ? "/admin" : "/player"}>
                {user.role === "ADMIN" ? "管理后台" : "个人中心"}
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link href="/register">选手注册</Link>
            </Button>
          )}
          <Button variant="outline" size="lg" asChild>
            <Link href="/rankings">查看排行榜</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/lookup">查询成绩</Link>
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">近期赛事</h2>
        {upcomingTournaments.length === 0 ? (
          <p className="text-muted-foreground">暂无开放赛事，敬请期待。</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingTournaments.map((t) => (
              <Card key={t.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{t.title}</CardTitle>
                    <TournamentStatusBadge status={t.status} />
                  </div>
                  <CardDescription>
                    {t.game.name} · {t.tier.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{formatDate(t.startDate)}</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/tournaments/${t.id}`}>查看详情</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">游戏项目</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {games.map((game) => (
            <Card key={game.id}>
              <CardHeader>
                <CardTitle>{game.name}</CardTitle>
                <CardDescription>{game.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/games/${game.slug}`}>赛事与排名</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {topRankingsByGame.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4">榜单速览</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {topRankingsByGame.map(({ game, rankings }) => (
              <Card key={game.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{game.name} Top 5</CardTitle>
                </CardHeader>
                <CardContent>
                  <RankingsTable rankings={rankings} />
                  <Button variant="link" className="mt-2 px-0" asChild>
                    <Link href={`/games/${game.slug}`}>查看完整榜单</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
