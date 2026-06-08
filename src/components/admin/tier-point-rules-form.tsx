"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePointRulesAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RuleRow = { placement: number; points: number };

function findDuplicatePlacements(rows: RuleRow[]) {
  const seen = new Set<number>();
  const duplicates = new Set<number>();

  for (const row of rows) {
    const placement = Number(row.placement);
    if (!Number.isFinite(placement) || placement <= 0) continue;
    if (seen.has(placement)) duplicates.add(placement);
    seen.add(placement);
  }

  return [...duplicates].sort((a, b) => a - b);
}

export function TierPointRulesForm({
  tierId,
  initialRules,
}: {
  tierId: string;
  initialRules: RuleRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<RuleRow[]>(
    initialRules.length > 0 ? initialRules : [{ placement: 1, points: 0 }]
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateRow(index: number, field: keyof RuleRow, value: string) {
    const num = value === "" ? 0 : Number(value);
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: num } : row))
    );
  }

  function addRow() {
    const nextPlacement =
      rows.reduce((max, row) => Math.max(max, Number(row.placement) || 0), 0) + 1;
    setRows((prev) => [...prev, { placement: nextPlacement, points: 0 }]);
  }

  function removeRow(index: number) {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const duplicates = findDuplicatePlacements(rows);
    if (duplicates.length > 0) {
      setError(`名次 ${duplicates.join("、")} 重复，请修改后再保存`);
      return;
    }

    const formData = new FormData();
    formData.set("tierId", tierId);
    for (const row of rows) {
      const placement = Number(row.placement);
      const points = Number(row.points);
      if (!Number.isFinite(placement) || placement <= 0) continue;
      if (!Number.isFinite(points) || points < 0) continue;
      formData.append("placement", String(placement));
      formData.append("points", String(points));
    }

    setLoading(true);
    const result = await updatePointRulesAction(formData);
    if (result && "error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-4">名次</th>
              <th className="pb-2 pr-4">积分</th>
              <th className="pb-2 w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b">
                <td className="py-2 pr-4">
                  <Input
                    type="number"
                    value={row.placement}
                    onChange={(e) => updateRow(idx, "placement", e.target.value)}
                    className="w-20"
                    min={1}
                    required
                  />
                </td>
                <td className="py-2 pr-4">
                  <Input
                    type="number"
                    value={row.points}
                    onChange={(e) => updateRow(idx, "points", e.target.value)}
                    className="w-24"
                    min={0}
                    required
                  />
                </td>
                <td className="py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(idx)}
                    disabled={rows.length <= 1}
                  >
                    删除
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          添加名次
        </Button>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "保存中..." : "保存积分表"}
        </Button>
      </div>
    </form>
  );
}
