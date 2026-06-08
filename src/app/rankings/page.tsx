import Link from "next/link";
import { prisma } from "@/lib/db";
import { getGameRankings } from "@/lib/points";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankingsTable } from "@/components/rankings-table";
import { getCurrentUser } from "@/lib/auth";

export default async function RankingsPage() {
  const [games, user] = await Promise.all([
    prisma.game.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    getCurrentUser(),
  ]);

  const rankingsByGame = await Promise.all(
    games.map(async (game) => ({
      game,
      rankings: await getGameRankings(game.id, 20),
    }))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">排行榜</h1>
        <p className="text-muted-foreground mt-2">按游戏独立排名，积分来自已完成赛事的最终名次</p>
      </div>

      {rankingsByGame.map(({ game, rankings }) => (
        <Card key={game.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{game.name}</CardTitle>
            <Link href={`/games/${game.slug}`} className="text-sm text-primary hover:underline">
              查看赛事
            </Link>
          </CardHeader>
          <CardContent>
            <RankingsTable rankings={rankings} highlightUserId={user?.id} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
