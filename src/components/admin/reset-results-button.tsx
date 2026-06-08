"use client";

import { useRouter } from "next/navigation";
import { resetTournamentResultsAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function ResetResultsButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();

  async function handleReset() {
    if (!confirm("确定要重置该赛事结果吗？所有名次和积分将被清除。")) return;
    await resetTournamentResultsAction(tournamentId);
    router.refresh();
  }

  return (
    <Button type="button" variant="destructive" size="sm" onClick={handleReset}>
      重置结果
    </Button>
  );
}
