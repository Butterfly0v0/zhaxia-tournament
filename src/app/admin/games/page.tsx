import { prisma } from "@/lib/db";
import { createGameAction, updateGameAction } from "@/lib/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function AdminGamesPage() {
  const games = await prisma.game.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">游戏管理</h2>

      <Card>
        <CardHeader>
          <CardTitle>添加游戏</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createGameAction} className="grid gap-4 md:grid-cols-2 max-w-2xl">
            <div className="space-y-2">
              <Label>名称</Label>
              <Input name="name" required placeholder="街霸6" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input name="slug" required placeholder="street-fighter-6" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>描述</Label>
              <Textarea name="description" placeholder="游戏全称" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="isActive" defaultChecked id="new-active" />
              <Label htmlFor="new-active">启用</Label>
            </div>
            <Button type="submit">添加</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {games.map((game) => (
          <Card key={game.id}>
            <CardContent className="pt-6">
              <form action={updateGameAction.bind(null, game.id)} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>名称</Label>
                  <Input name="name" defaultValue={game.name} required />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input name="slug" defaultValue={game.slug} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>描述</Label>
                  <Textarea name="description" defaultValue={game.description || ""} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="isActive" defaultChecked={game.isActive} id={`active-${game.id}`} />
                  <Label htmlFor={`active-${game.id}`}>启用</Label>
                </div>
                <Button type="submit" size="sm">保存</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
