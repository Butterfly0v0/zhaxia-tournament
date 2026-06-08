import { prisma } from "@/lib/db";
import { TournamentForm } from "@/components/forms/tournament-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewTournamentPage() {
  const [games, tiers] = await Promise.all([
    prisma.game.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.eventTier.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>创建赛事</CardTitle>
      </CardHeader>
      <CardContent>
        <TournamentForm games={games} tiers={tiers} />
      </CardContent>
    </Card>
  );
}
