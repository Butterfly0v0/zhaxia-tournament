"use client";

import { useRouter } from "next/navigation";
import { deleteTournamentAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function DeleteTournamentButton({
  tournamentId,
  tournamentTitle,
  hasPlacements,
}: {
  tournamentId: string;
  tournamentTitle: string;
  hasPlacements?: boolean;
}) {
  const router = useRouter();

  async function handleDelete() {
    const warning = hasPlacements
      ? `确定要删除赛事「${tournamentTitle}」吗？\n\n该赛事已有比赛结果和积分记录，删除后相关积分将从排行榜中移除，此操作不可恢复。`
      : `确定要删除赛事「${tournamentTitle}」吗？\n\n此操作不可恢复。`;

    if (!confirm(warning)) return;

    const result = await deleteTournamentAction(tournamentId);
    if (result?.error) {
      alert(result.error);
      return;
    }

    router.push("/admin/tournaments");
    router.refresh();
  }

  return (
    <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
      删除赛事
    </Button>
  );
}
