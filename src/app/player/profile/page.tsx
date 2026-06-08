import { getCurrentUser } from "@/lib/auth";
import { getUserGameStats } from "@/lib/points";
import { ProfileForm } from "@/components/forms/profile-form";
import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { DeleteAccountForm } from "@/components/forms/delete-account-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PlayerProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const stats = await getUserGameStats(user.id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">个人资料</h1>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaultNickname={user.nickname}
            defaultEmail={user.email || ""}
            defaultQq={user.qq || ""}
            defaultStartGgTag={user.startGgTag || ""}
            defaultStartGgUniqueCode={user.startGgUniqueCode || ""}
          />
        </CardContent>
      </Card>

      <Card id="password">
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>积分历史</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.placements.length === 0 ? (
            <p className="text-muted-foreground">暂无参赛记录</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">赛事</th>
                  <th className="pb-2 pr-4">游戏</th>
                  <th className="pb-2 pr-4">名次</th>
                  <th className="pb-2">积分</th>
                </tr>
              </thead>
              <tbody>
                {stats.placements.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{p.tournament.title}</td>
                    <td className="py-2 pr-4">{p.tournament.game.name}</td>
                    <td className="py-2 pr-4">#{p.placement}</td>
                    <td className="py-2 font-medium text-primary">+{p.pointsAwarded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">注销账号</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteAccountForm placementCount={stats.placements.length} />
        </CardContent>
      </Card>
    </div>
  );
}
