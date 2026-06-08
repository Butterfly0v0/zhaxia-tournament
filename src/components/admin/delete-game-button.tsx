"use client";

import { useRouter } from "next/navigation";
import { deleteGameAction } from "@/lib/actions/admin";
import { ConfirmDestructiveAction } from "@/components/admin/confirm-destructive-action";

export function DeleteGameButton({
  gameId,
  gameName,
  tournamentCount,
}: {
  gameId: string;
  gameName: string;
  tournamentCount: number;
}) {
  const router = useRouter();

  const description =
    tournamentCount > 0
      ? `该游戏下还有 ${tournamentCount} 场赛事，无法删除。请先删除相关赛事。`
      : "删除后该游戏将从游戏库中移除，此操作不可恢复。";

  return (
    <ConfirmDestructiveAction
      triggerLabel="删除"
      title={
        tournamentCount > 0
          ? `无法删除「${gameName}」`
          : `确定删除「${gameName}」？`
      }
      description={description}
      canConfirm={tournamentCount === 0}
      onConfirm={async () => {
        const formData = new FormData();
        formData.set("gameId", gameId);
        return deleteGameAction(formData);
      }}
      onSuccess={() => router.refresh()}
    />
  );
}
