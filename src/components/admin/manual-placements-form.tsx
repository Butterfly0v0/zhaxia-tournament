"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitManualPlacementsAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Registration = {
  userId: string;
  nickname: string;
  existingPlacement?: number;
};

type ExternalRow = {
  id: string;
  playerName: string;
  placement: string;
};

export function ManualPlacementsForm({
  tournamentId,
  registrations,
  pointRules,
  startGgEntrants,
}: {
  tournamentId: string;
  registrations: Registration[];
  pointRules: Record<number, number>;
  startGgEntrants?: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [placements, setPlacements] = useState<Record<string, string>>(
    Object.fromEntries(
      registrations.map((r) => [r.userId, r.existingPlacement?.toString() || ""])
    )
  );
  const [externalRows, setExternalRows] = useState<ExternalRow[]>(() => {
    if (registrations.length > 0) return [];
    return (startGgEntrants ?? []).slice(0, 8).map((e) => ({
      id: e.id,
      playerName: e.name,
      placement: "",
    }));
  });

  function addExternalRow(name = "") {
    setExternalRows((prev) => [
      ...prev,
      { id: `new_${Date.now()}`, playerName: name, placement: "" },
    ]);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const registeredData = registrations
      .filter((r) => placements[r.userId])
      .map((r) => ({
        userId: r.userId,
        placement: parseInt(placements[r.userId], 10),
      }));

    const externalData = externalRows
      .filter((r) => r.playerName.trim() && r.placement)
      .map((r) => ({
        playerName: r.playerName.trim(),
        placement: parseInt(r.placement, 10),
      }));

    const data = [...registeredData, ...externalData];

    const result = await submitManualPlacementsAction(tournamentId, data);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        未匹配到本站账号的选手将自动记入虚拟账号，后续可在比赛结果中转移到真实账号。
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {registrations.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-4">本站报名选手</th>
              <th className="pb-2 pr-4">名次</th>
              <th className="pb-2">预估积分</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((r) => {
              const placement = parseInt(placements[r.userId] || "", 10);
              const points = pointRules[placement] ?? 0;
              return (
                <tr key={r.userId} className="border-b">
                  <td className="py-2 pr-4">{r.nickname}</td>
                  <td className="py-2 pr-4">
                    <Input
                      type="number"
                      min={1}
                      className="w-20"
                      value={placements[r.userId] || ""}
                      onChange={(e) =>
                        setPlacements((prev) => ({ ...prev, [r.userId]: e.target.value }))
                      }
                    />
                  </td>
                  <td className="py-2 text-primary font-medium">
                    {placement > 0 ? `+${points}` : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">其他选手（虚拟账号）</p>
          <Button type="button" variant="outline" size="sm" onClick={() => addExternalRow()}>
            添加选手
          </Button>
        </div>
        {externalRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">可添加 start.gg 选手名或其他未报名选手</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">选手名</th>
                <th className="pb-2 pr-4">名次</th>
                <th className="pb-2">预估积分</th>
              </tr>
            </thead>
            <tbody>
              {externalRows.map((row) => {
                const placement = parseInt(row.placement || "", 10);
                const points = pointRules[placement] ?? 0;
                return (
                  <tr key={row.id} className="border-b">
                    <td className="py-2 pr-4">
                      <Input
                        value={row.playerName}
                        onChange={(e) =>
                          setExternalRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, playerName: e.target.value } : r
                            )
                          )
                        }
                        placeholder="start.gg 选手名"
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <Input
                        type="number"
                        min={1}
                        className="w-20"
                        value={row.placement}
                        onChange={(e) =>
                          setExternalRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, placement: e.target.value } : r
                            )
                          )
                        }
                      />
                    </td>
                    <td className="py-2 text-primary font-medium">
                      {placement > 0 ? `+${points}` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "提交中..." : "确认录入并结算积分"}
      </Button>
    </div>
  );
}
