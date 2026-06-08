import { prisma } from "@/lib/db";
import { createTierAction, updatePointRulesAction } from "@/lib/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminTiersPage() {
  const tiers = await prisma.eventTier.findMany({
    include: { pointRules: { orderBy: { placement: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">等级与积分表</h2>

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

      {tiers.map((tier) => {
        const rules = tier.pointRules.length > 0
          ? tier.pointRules
          : Array.from({ length: 8 }, (_, i) => ({ placement: i + 1, points: 0 }));

        return (
          <Card key={tier.id}>
            <CardHeader>
              <CardTitle>{tier.name} ({tier.code})</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updatePointRulesAction.bind(null, tier.id)}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 pr-4">名次</th>
                        <th className="pb-2">积分</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((rule, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2 pr-4">
                            <Input
                              name="placement"
                              type="number"
                              defaultValue={rule.placement}
                              className="w-20"
                              min={1}
                            />
                          </td>
                          <td className="py-2">
                            <Input
                              name="points"
                              type="number"
                              defaultValue={rule.points}
                              className="w-24"
                              min={0}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  可修改行数：留空名次的行将被忽略。需要更多名次请保存后再次编辑添加。
                </p>
                <Button type="submit" size="sm">保存积分表</Button>
              </form>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
