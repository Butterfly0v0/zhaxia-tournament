"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { transferPlacementAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

type UserOption = { id: string; nickname: string };

export function TransferPlacementButton({
  placementId,
  virtualNickname,
  realUsers,
}: {
  placementId: string;
  virtualNickname: string;
  realUsers: UserOption[];
}) {
  const router = useRouter();
  const [targetUserId, setTargetUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTransfer() {
    if (!targetUserId) {
      setError("请选择目标选手");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await transferPlacementAction(placementId, targetUserId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <select
          className="h-8 rounded-md border px-2 text-xs min-w-[120px]"
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
        >
          <option value="">转移到...</option>
          {realUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nickname}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" size="sm" onClick={handleTransfer} disabled={loading}>
          {loading ? "..." : "转移"}
        </Button>
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
      <span className="text-xs text-muted-foreground">虚拟：{virtualNickname}</span>
    </div>
  );
}
