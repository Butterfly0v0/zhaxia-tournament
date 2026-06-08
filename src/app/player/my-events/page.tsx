import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TournamentStatusBadge } from "@/components/tournament-status-badge";
import { formatDate } from "@/lib/utils";

export default async function MyEventsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const registrations = await prisma.registration.findMany({
    where: { userId: user.id, status: { not: "CANCELLED" } },
    include: {
      tournament: {
        include: {
          game: true,
          tier: true,
          placements: { where: { userId: user.id } },
        },
      },
    },
    orderBy: { registeredAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">我的赛事</h1>

      {registrations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">你还没有报名任何赛事</p>
          <Button asChild>
            <Link href="/player/tournaments">去报名</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((r) => {
            const placement = r.tournament.placements[0];
            return (
              <Card key={r.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>{r.tournament.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {r.tournament.game.name} · {r.tournament.tier.name}
                    </p>
                  </div>
                  <TournamentStatusBadge status={r.tournament.status} />
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-sm">
                    <p>比赛日：{formatDate(r.tournament.startDate)}</p>
                    {placement ? (
                      <p className="font-medium text-primary mt-1">
                        第{placement.placement}名 · +{placement.pointsAwarded} 积分
                      </p>
                    ) : (
                      <p className="text-muted-foreground mt-1">等待比赛结果</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/tournaments/${r.tournament.id}`}>详情</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
