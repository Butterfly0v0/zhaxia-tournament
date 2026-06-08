import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGameRankings } from "@/lib/points";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TournamentStatusBadge } from "@/components/tournament-status-badge";
import { RankingsTable } from "@/components/rankings-table";
import { formatDate } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = await prisma.game.findUnique({ where: { slug } });
  if (!game || !game.isActive) notFound();

  const [tournaments, rankings, user] = await Promise.all([
    prisma.tournament.findMany({
      where: { gameId: game.id },
      include: { tier: true },
      orderBy: { startDate: "desc" },
    }),
    getGameRankings(game.id, 20),
    getCurrentUser(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{game.name}</h1>
        {game.description && <p className="text-muted-foreground mt-2">{game.description}</p>}
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">赛事列表</h2>
        {tournaments.length === 0 ? (
          <p className="text-muted-foreground">暂无赛事</p>
        ) : (
          <div className="space-y-3">
            {tournaments.map((t) => (
              <Card key={t.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.title}</span>
                      <TournamentStatusBadge status={t.status} />
                      <span className="text-xs text-muted-foreground">{t.tier.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatDate(t.startDate)}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/tournaments/${t.id}`}>详情</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">{game.name} 排行榜</h2>
        <Card>
          <CardHeader>
            <CardTitle>Top 20</CardTitle>
          </CardHeader>
          <CardContent>
            <RankingsTable rankings={rankings} highlightUserId={user?.id} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
