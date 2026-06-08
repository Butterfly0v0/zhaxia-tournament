import Link from "next/link";
import { searchPlayers } from "@/lib/player-lookup";
import { PlayerSearchForm } from "@/components/lookup/player-search-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LookupPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await searchPlayers(query) : [];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">查询成绩</h1>
        <p className="text-muted-foreground">
          通过选手 ID 或昵称查询参赛记录，无需登录。
        </p>
      </div>

      <PlayerSearchForm defaultQuery={query} />

      {query && (
        <Card>
          <CardHeader>
            <CardTitle>
              查询结果{results.length > 0 ? ` (${results.length})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="text-muted-foreground">未找到匹配的选手，请换个关键词试试。</p>
            ) : (
              <ul className="divide-y">
                {results.map((user) => (
                  <li key={user.id} className="py-3 flex items-center justify-between gap-4">
                    <Link
                      href={`/lookup/${user.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {user.nickname}
                    </Link>
                    {user.isVirtual && <Badge variant="warning">虚拟</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
