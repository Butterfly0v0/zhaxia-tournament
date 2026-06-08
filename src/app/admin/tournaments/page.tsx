import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { TournamentStatusBadge } from "@/components/tournament-status-badge";
import { DeleteTournamentButton } from "@/components/admin/delete-tournament-button";
import { formatDate } from "@/lib/utils";

export default async function AdminTournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    include: { game: true, tier: true, _count: { select: { registrations: true, placements: true } } },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">赛事管理</h2>
        <Button asChild>
          <Link href="/admin/tournaments/new">创建赛事</Link>
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-3 pr-4">赛事</th>
              <th className="pb-3 pr-4">游戏</th>
              <th className="pb-3 pr-4">等级</th>
              <th className="pb-3 pr-4">日期</th>
              <th className="pb-3 pr-4">报名</th>
              <th className="pb-3 pr-4">状态</th>
              <th className="pb-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="py-3 pr-4 font-medium">{t.title}</td>
                <td className="py-3 pr-4">{t.game.name}</td>
                <td className="py-3 pr-4">{t.tier.code}</td>
                <td className="py-3 pr-4">{formatDate(t.startDate)}</td>
                <td className="py-3 pr-4">{t._count.registrations}</td>
                <td className="py-3 pr-4">
                  <TournamentStatusBadge status={t.status} />
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/tournaments/${t.id}`}>管理</Link>
                    </Button>
                    <DeleteTournamentButton
                      tournamentId={t.id}
                      tournamentTitle={t.title}
                      hasPlacements={t._count.placements > 0}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
