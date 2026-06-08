import { RankingEntry } from "@/lib/points";
import { Badge } from "@/components/ui/badge";

export function RankingsTable({
  rankings,
  highlightUserId,
}: {
  rankings: RankingEntry[];
  highlightUserId?: string;
}) {
  if (rankings.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">暂无排名数据</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">排名</th>
            <th className="pb-3 pr-4 font-medium">选手</th>
            <th className="pb-3 pr-4 font-medium">总积分</th>
            <th className="pb-3 font-medium">参赛场次</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((entry) => (
            <tr
              key={entry.userId}
              className={`border-b last:border-0 ${
                entry.userId === highlightUserId ? "bg-primary/5" : ""
              }`}
            >
              <td className="py-3 pr-4 font-bold">
                {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
              </td>
              <td className="py-3 pr-4">
                <div className="font-medium flex items-center gap-2">
                  {entry.nickname}
                  {entry.isVirtual && (
                    <Badge variant="warning" className="text-xs">虚拟</Badge>
                  )}
                </div>
                {entry.startGgTag && (
                  <div className="text-xs text-muted-foreground">{entry.startGgTag}</div>
                )}
              </td>
              <td className="py-3 pr-4 font-semibold text-primary">{entry.totalPoints}</td>
              <td className="py-3">{entry.tournamentCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
