"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerForTournamentAction, cancelRegistrationAction } from "@/lib/actions/player";
import { Button } from "@/components/ui/button";

export function TournamentRegisterButtons({
  tournamentId,
  canRegister,
  canCancel,
  isFull,
}: {
  tournamentId: string;
  canRegister: boolean;
  canCancel: boolean;
  isFull: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    setError(null);
    const result = await registerForTournamentAction(tournamentId);
    if (result?.error) setError(result.error);
    else router.refresh();
    setLoading(false);
  }

  async function handleCancel() {
    setLoading(true);
    setError(null);
    const result = await cancelRegistrationAction(tournamentId);
    if (result?.error) setError(result.error);
    else router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {canRegister && !isFull && (
        <Button onClick={handleRegister} disabled={loading}>
          {loading ? "处理中..." : "立即报名"}
        </Button>
      )}
      {canRegister && isFull && (
        <p className="text-destructive text-sm">报名人数已满</p>
      )}
      {canCancel && (
        <Button onClick={handleCancel} variant="outline" size="sm" disabled={loading}>
          取消报名
        </Button>
      )}
    </div>
  );
}
