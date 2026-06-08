import { prisma } from "@/lib/db";
import { createAdminUserAction, toggleBanUserAction } from "@/lib/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      nickname: true,
      startGgTag: true,
      role: true,
      isBanned: true,
      createdAt: true,
      _count: { select: { registrations: true, placements: true } },
    },
  });

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">用户管理</h2>

      <Card>
        <CardHeader>
          <CardTitle>创建用户</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAdminUserAction} className="grid gap-4 md:grid-cols-2 max-w-2xl">
            <div className="space-y-2">
              <Label>用户名</Label>
              <Input name="username" required />
            </div>
            <div className="space-y-2">
              <Label>昵称</Label>
              <Input name="nickname" required />
            </div>
            <div className="space-y-2">
              <Label>密码</Label>
              <Input name="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <select
                name="role"
                defaultValue="PLAYER"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="PLAYER">选手</option>
                <option value="ADMIN">管理员</option>
              </select>
            </div>
            <Button type="submit" className="w-fit">创建</Button>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-3 pr-4">用户名</th>
              <th className="pb-3 pr-4">昵称</th>
              <th className="pb-3 pr-4">start.gg</th>
              <th className="pb-3 pr-4">角色</th>
              <th className="pb-3 pr-4">报名/成绩</th>
              <th className="pb-3 pr-4">状态</th>
              <th className="pb-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-3 pr-4">{u.username}</td>
                <td className="py-3 pr-4">{u.nickname}</td>
                <td className="py-3 pr-4 text-muted-foreground">{u.startGgTag || "-"}</td>
                <td className="py-3 pr-4">
                  <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                    {u.role === "ADMIN" ? "管理员" : "选手"}
                  </Badge>
                </td>
                <td className="py-3 pr-4">
                  {u._count.registrations} / {u._count.placements}
                </td>
                <td className="py-3 pr-4">
                  {u.isBanned ? (
                    <Badge variant="destructive">已封禁</Badge>
                  ) : (
                    <Badge variant="success">正常</Badge>
                  )}
                </td>
                <td className="py-3">
                  {u.role !== "ADMIN" && (
                    <form
                      action={async () => {
                        "use server";
                        await toggleBanUserAction(u.id, !u.isBanned);
                      }}
                    >
                      <Button type="submit" variant="outline" size="sm">
                        {u.isBanned ? "解封" : "封禁"}
                      </Button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
