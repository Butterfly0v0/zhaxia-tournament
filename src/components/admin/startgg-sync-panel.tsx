"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmSyncPlacementsAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PreviewItem = {
  entrantName: string;
  entrantId: string;
  placement: number;
  matchedUserId: string | null;
  matchedNickname: string | null;
  matchStatus: "matched" | "pending" | "ignored";
  estimatedPoints: number;
};

type UserOption = { id: string; nickname: string; startGgTag: string | null };

type SyncSummary = {
  event: {
    name: string;
    numEntrants: number;
    isCompleted: boolean;
    videogameName: string | null;
  };
  entrants: {
    total: number;
    matched: number;
    registrationsAdded: number;
    unmatched: string[];
  };
  results: {
    synced: boolean;
    placementsApplied: number;
    unmatched: string[];
  } | null;
};

export function StartGgSyncPanel({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [showManualPreview, setShowManualPreview] = useState(false);
  const [manualPreview, setManualPreview] = useState<{
    eventInfo: { name: string; isCompleted: boolean };
    preview: PreviewItem[];
    allUsers: UserOption[];
  } | null>(null);
  const [overrides, setOverrides] = useState<Record<string, { userId: string; ignored: boolean }>>({});

  async function handleFullSync() {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const res = await fetch("/api/admin/sync-startgg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId, mode: "full" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "同步失败");
        return;
      }
      setSummary(data.summary);
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  async function handleManualPreview() {
    setLoading(true);
    setError(null);
    setManualPreview(null);
    setShowManualPreview(true);

    try {
      const res = await fetch("/api/admin/sync-startgg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId, mode: "results-preview" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "拉取失败");
        return;
      }
      setManualPreview(data);
      const initial: Record<string, { userId: string; ignored: boolean }> = {};
      for (const item of data.preview) {
        initial[item.entrantName] = {
          userId: item.matchedUserId || "",
          ignored: false,
        };
      }
      setOverrides(initial);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmManual() {
    if (!manualPreview) return;
    setConfirming(true);
    setError(null);

    const items = manualPreview.preview.map((item) => ({
      entrantName: item.entrantName,
      placement: item.placement,
      userId: overrides[item.entrantName]?.ignored
        ? undefined
        : overrides[item.entrantName]?.userId || item.matchedUserId || undefined,
      ignored: overrides[item.entrantName]?.ignored,
    }));

    const result = await confirmSyncPlacementsAction(tournamentId, items);
    if (result?.error) {
      setError(result.error);
      setConfirming(false);
      return;
    }

    setManualPreview(null);
    setShowManualPreview(false);
    router.refresh();
    setConfirming(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleFullSync} disabled={loading}>
          {loading && !showManualPreview ? "同步中..." : "一键同步 start.gg 数据"}
        </Button>
        <Button variant="outline" onClick={handleManualPreview} disabled={loading}>
          手动确认名次（备用）
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        一键同步将自动更新赛事信息、参赛选手与比赛结果。未匹配到本站账号的选手将记入虚拟账号，可在比赛结果中转移到真实账号。
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {summary && (
        <div className="rounded-lg border p-4 space-y-3 text-sm">
          <p className="font-medium">同步完成：{summary.event.name}</p>
          <div className="grid gap-2 md:grid-cols-2">
            <p>参赛人数：{summary.event.numEntrants}</p>
            {summary.event.videogameName && <p>游戏：{summary.event.videogameName}</p>}
            <p>
              选手匹配：{summary.entrants.matched}/{summary.entrants.total}，
              新增报名 {summary.entrants.registrationsAdded} 人
            </p>
            {summary.results?.synced && (
              <p className="text-primary font-medium">
                已自动入账 {summary.results.placementsApplied} 条比赛结果
              </p>
            )}
          </div>
          {summary.entrants.unmatched.length > 0 && (
            <p className="text-amber-700">
              未匹配选手（{summary.entrants.unmatched.length}）：
              {summary.entrants.unmatched.slice(0, 8).join("、")}
              {summary.entrants.unmatched.length > 8 ? "..." : ""}
            </p>
          )}
        </div>
      )}

      {showManualPreview && manualPreview && (
        <div className="space-y-4 border rounded-lg p-4">
          <div className="text-sm">
            <p className="font-medium">{manualPreview.eventInfo.name}</p>
            {!manualPreview.eventInfo.isCompleted && (
              <span className="text-amber-600">（赛事可能尚未结束）</span>
            )}
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-3">start.gg 选手</th>
                <th className="pb-2 pr-3">名次</th>
                <th className="pb-2 pr-3">匹配本站账号</th>
                <th className="pb-2 pr-3">预估积分</th>
                <th className="pb-2">状态</th>
              </tr>
            </thead>
            <tbody>
              {manualPreview.preview.map((item) => {
                const override = overrides[item.entrantName];
                const status = override?.ignored
                  ? "ignored"
                  : override?.userId || item.matchedUserId
                    ? "matched"
                    : "pending";

                return (
                  <tr key={item.entrantId} className="border-b">
                    <td className="py-2 pr-3">{item.entrantName}</td>
                    <td className="py-2 pr-3 font-bold">#{item.placement}</td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <select
                          className="h-9 rounded-md border px-2 text-sm min-w-[140px]"
                          value={override?.ignored ? "" : override?.userId || item.matchedUserId || ""}
                          disabled={override?.ignored}
                          onChange={(e) =>
                            setOverrides((prev) => ({
                              ...prev,
                              [item.entrantName]: { userId: e.target.value, ignored: false },
                            }))
                          }
                        >
                          <option value="">选择选手...</option>
                          {manualPreview.allUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.nickname}
                              {u.startGgTag ? ` (${u.startGgTag})` : ""}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={override?.ignored || false}
                            onChange={(e) =>
                              setOverrides((prev) => ({
                                ...prev,
                                [item.entrantName]: { userId: "", ignored: e.target.checked },
                              }))
                            }
                          />
                          忽略
                        </label>
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-primary font-medium">
                      {override?.ignored ? "-" : `+${item.estimatedPoints}`}
                    </td>
                    <td className="py-2">
                      <Badge
                        variant={
                          status === "matched" ? "success" : status === "ignored" ? "secondary" : "warning"
                        }
                      >
                        {status === "matched" ? "已匹配" : status === "ignored" ? "已忽略" : "将用虚拟账号"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <Button onClick={handleConfirmManual} disabled={confirming}>
            {confirming ? "入账中..." : "确认入账"}
          </Button>
        </div>
      )}
    </div>
  );
}
