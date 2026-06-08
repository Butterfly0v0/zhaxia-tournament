import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TournamentStatusBadge } from "@/components/tournament-status-badge";
import { TournamentRegisterButtons } from "@/components/tournament-register-buttons";
import { formatDate } from "@/lib/utils";

export default async function PlayerTournamentsPage() {
  const user = await getCurrentUser();

  const tournaments = await prisma.tournament.findMany({
    where: { status: "OPEN" },
    include: {
      game: true,
      tier: true,
      registrations: {
        where: { status: { not: "CANCELLED" } },
        include: { user: { select: { nickname: true } } },
        orderBy: { registeredAt: "asc" },
      },
    },
    orderBy: { regDeadline: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">可报名赛事</h1>

      {tournaments.length === 0 ? (
        <p className="text-muted-foreground">当前没有开放报名的赛事</p>
      ) : (
        <div className="space-y-4">
          {tournaments.map((t) => {
            const myRegistration = user
              ? t.registrations.find((r) => r.userId === user.id)
              : null;
            const canRegister =
              !!user &&
              user.role === "PLAYER" &&
              new Date() <= t.regDeadline &&
              !myRegistration;
            const canCancel =
              !!user &&
              !!myRegistration &&
              new Date() <= t.regDeadline;
            const isFull =
              t.maxPlayers !== null && t.registrations.length >= t.maxPlayers;

            return (
              <Card key={t.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>{t.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t.game.name} · {t.tier.name} · 截止 {formatDate(t.regDeadline)}
                    </p>
                  </div>
                  <TournamentStatusBadge status={t.status} />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {!user && (
                      <Button asChild>
                        <Link href="/login">登录后报名</Link>
                      </Button>
                    )}
                    {user?.role === "PLAYER" && (
                      <TournamentRegisterButtons
                        tournamentId={t.id}
                        canRegister={canRegister}
                        canCancel={canCancel}
                        isFull={isFull}
                      />
                    )}
                    {myRegistration && (
                      <span className="text-sm text-emerald-600 font-medium">你已报名</span>
                    )}
                    <Button variant="outline" asChild>
                      <Link href={`/tournaments/${t.id}`}>查看详情</Link>
                    </Button>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">
                      本站报名选手 ({t.registrations.length}
                      {t.maxPlayers ? ` / ${t.maxPlayers}` : ""})
                    </p>
                    {t.registrations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">暂无报名</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {t.registrations.map((r) => (
                          <span
                            key={r.id}
                            className="rounded-full bg-muted px-3 py-1 text-sm"
                          >
                            {r.user.nickname}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
