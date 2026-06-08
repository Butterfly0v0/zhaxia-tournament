import { getStartGgProfileUrl } from "@/lib/player-lookup";
import { Button } from "@/components/ui/button";

export function StartGgProfileButton({
  uniqueCode,
}: {
  uniqueCode: string | null | undefined;
}) {
  const url = getStartGgProfileUrl(uniqueCode);

  if (!url) {
    return (
      <div className="space-y-1">
        <Button disabled variant="outline">
          前往 start.gg 主页
        </Button>
        <p className="text-xs text-muted-foreground">该选手暂无 start.gg 账号</p>
      </div>
    );
  }

  return (
    <Button variant="outline" asChild>
      <a href={url} target="_blank" rel="noopener noreferrer">
        前往 start.gg 主页
      </a>
    </Button>
  );
}
