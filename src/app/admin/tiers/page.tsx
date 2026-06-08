import { prisma } from "@/lib/db";
import { createTierAction } from "@/lib/actions/admin";
import { ActionErrorBanner } from "@/components/admin/action-error-banner";
import { TierPointRulesForm } from "@/components/admin/tier-point-rules-form";
import { DeleteTierButton } from "@/components/admin/delete-tier-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminTiersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const tiers = await prisma.eventTier.findMany({
    include: {
      pointRules: { orderBy: { placement: "asc" } },
      _count: { select: { tournaments: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">等级与积分表</h2>
      <ActionErrorBanner message={error} />

      <Card>
        <CardHeader>
          <CardTitle>添加等级</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTierAction} className="grid gap-4 md:grid-cols-4 max-w-3xl">
            <div className="space-y-2">
              <Label>名称</Label>
              <Input name="name" required placeholder="S级赛事" />
            </div>
            <div className="space-y-2">
              <Label>代码</Label>
              <Input name="code" required placeholder="S" />
            </div>
            <div className="space-y-2">
              <Label>排序</Label>
              <Input name="sortOrder" type="number" defaultValue={1} />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Input name="description" placeholder="最高等级" />
            </div>
            <Button type="submit" className="md:col-span-4 w-fit">添加</Button>
          </form>
        </CardContent>
      </Card>

      {tiers.map((tier) => (
        <Card key={tier.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <CardTitle>
              {tier.name} ({tier.code})
            </CardTitle>
            <DeleteTierButton
              tierId={tier.id}
              tierName={tier.name}
              tournamentCount={tier._count.tournaments}
            />
          </CardHeader>
          <CardContent>
            <TierPointRulesForm
              tierId={tier.id}
              initialRules={tier.pointRules.map((rule) => ({
                placement: rule.placement,
                points: rule.points,
              }))}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
