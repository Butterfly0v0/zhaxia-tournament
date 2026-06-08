"use client";

import { useRouter } from "next/navigation";
import { deleteTournamentAction } from "@/lib/actions/admin";
import { ConfirmDestructiveAction } from "@/components/admin/confirm-destructive-action";

export function DeleteTournamentButton({
  tournamentId,
  tournamentTitle,
  hasPlacements,
  redirectTo = "/admin/tournaments",
}: {
  tournamentId: string;
  tournamentTitle: string;
  hasPlacements?: boolean;
  redirectTo?: string;
}) {
  const router = useRouter();

  const description = hasPlacements
    ? "该赛事已有比赛结果和积分记录，删除后相关积分将从排行榜中移除，此操作不可恢复。"
    : "删除后报名记录与赛事信息将一并移除，此操作不可恢复。";

  return (
    <ConfirmDestructiveAction
      triggerLabel="删除赛事"
      title={`确定删除「${tournamentTitle}」？`}
      description={description}
      onConfirm={() => deleteTournamentAction(tournamentId)}
      onSuccess={() => {
        router.push(redirectTo);
        router.refresh();
      }}
    />
  );
}
