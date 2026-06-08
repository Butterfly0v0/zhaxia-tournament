"use client";

import { useRouter } from "next/navigation";
import { deleteTierAction } from "@/lib/actions/admin";
import { ConfirmDestructiveAction } from "@/components/admin/confirm-destructive-action";

export function DeleteTierButton({
  tierId,
  tierName,
  tournamentCount,
}: {
  tierId: string;
  tierName: string;
  tournamentCount: number;
}) {
  const router = useRouter();

  const description =
    tournamentCount > 0
      ? `该等级下还有 ${tournamentCount} 场赛事，无法删除。请先将相关赛事改为其他等级或删除赛事。`
      : "删除后该等级及其积分表配置将一并移除，此操作不可恢复。";

  return (
    <ConfirmDestructiveAction
      triggerLabel="删除等级"
      title={
        tournamentCount > 0
          ? `无法删除「${tierName}」`
          : `确定删除「${tierName}」？`
      }
      description={description}
      canConfirm={tournamentCount === 0}
      onConfirm={async () => {
        const formData = new FormData();
        formData.set("tierId", tierId);
        return deleteTierAction(formData);
      }}
      onSuccess={() => router.refresh()}
    />
  );
}
