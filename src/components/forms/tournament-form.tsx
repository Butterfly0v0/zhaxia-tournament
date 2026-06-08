"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createTournamentAction, updateTournamentAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Game = { id: string; name: string };
type Tier = { id: string; name: string; code: string };

type TournamentData = {
  id?: string;
  title: string;
  description?: string | null;
  gameId: string;
  tierId: string;
  startDate: string | Date;
  regDeadline: string | Date;
  startGgUrl?: string | null;
  startGgEventId?: string | null;
  maxPlayers?: number | null;
  status: "DRAFT" | "OPEN" | "CLOSED" | "COMPLETED";
};

function toLocalDatetime(date: Date | string) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

type PreviewData = {
  title: string;
  description: string;
  startDate: string;
  regDeadline: string;
  numEntrants: number;
  videogameName: string | null;
  tournamentName: string | null;
  eventName?: string | null;
  isCompleted: boolean;
  entrants: Array<{ id: string; name: string }>;
};

type EventOption = {
  id: string;
  name: string;
  numEntrants: number;
  videogameName: string | null;
};

export function TournamentForm({
  games,
  tiers,
  tournament,
}: {
  games: Game[];
  tiers: Tier[];
  tournament?: TournamentData;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const [title, setTitle] = useState(tournament?.title || "");
  const [description, setDescription] = useState(tournament?.description || "");
  const [startDate, setStartDate] = useState(
    tournament ? toLocalDatetime(tournament.startDate) : ""
  );
  const [regDeadline, setRegDeadline] = useState(
    tournament ? toLocalDatetime(tournament.regDeadline) : ""
  );
  const [status, setStatus] = useState(tournament?.status || "DRAFT");
  const [startGgUrl, setStartGgUrl] = useState(tournament?.startGgUrl || "");
  const [startGgEventId, setStartGgEventId] = useState(tournament?.startGgEventId || "");
  const [eventOptions, setEventOptions] = useState<EventOption[]>([]);
  const [tournamentName, setTournamentName] = useState<string | null>(null);

  async function fetchPreview(eventId?: string, multiEvent?: boolean) {
    const res = await fetch("/api/admin/preview-startgg", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startGgUrl,
        eventId: eventId || startGgEventId || null,
        multiEvent: !!multiEvent,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "拉取失败");
    }
    return data.result;
  }

  function applyPreview(p: PreviewData, eventId: string) {
    setPreview(p);
    setStartGgEventId(eventId);
    setTitle(p.title);
    setDescription(p.description);
    setStartDate(toLocalDatetime(p.startDate));
    setRegDeadline(toLocalDatetime(p.regDeadline));
    setEventOptions([]);
    setTournamentName(p.tournamentName);
  }

  async function handlePreviewFromUrl() {
    if (!startGgUrl) {
      setError("请先填写 start.gg 链接");
      return;
    }
    setPreviewing(true);
    setError(null);
    setEventOptions([]);
    setTournamentName(null);
    try {
      const result = await fetchPreview();
      if (result.needsEventSelection) {
        setTournamentName(result.tournamentName);
        setEventOptions(result.events);
        setError(null);
        return;
      }
      applyPreview(result, result.eventId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "拉取失败");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleSelectEvent(eventId: string) {
    setPreviewing(true);
    setError(null);
    try {
      const result = await fetchPreview(eventId, true);
      if (!result.needsEventSelection) {
        applyPreview(result, result.eventId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "拉取失败");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = tournament?.id
      ? await updateTournamentAction(tournament.id, formData)
      : await createTournamentAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result && "id" in result && result.id) {
      router.push(`/admin/tournaments/${result.id}`);
    } else if (tournament?.id) {
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form ref={formRef} action={handleSubmit} className="grid gap-4 max-w-2xl">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <Label>start.gg 链接</Label>
        <div className="flex gap-2">
          <Input
            name="startGgUrl"
            type="url"
            value={startGgUrl}
            onChange={(e) => {
              setStartGgUrl(e.target.value);
              setStartGgEventId("");
              setEventOptions([]);
              setPreview(null);
            }}
            placeholder="https://www.start.gg/tournament/14-29"
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={handlePreviewFromUrl} disabled={previewing}>
            {previewing ? "拉取中..." : "从链接拉取"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          支持锦标赛链接（/tournament/xxx）或具体项目链接（含 /event/）。锦标赛含多个项目时需选择具体比赛。
        </p>
        <input type="hidden" name="startGgEventId" value={startGgEventId} />
      </div>

      {eventOptions.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 space-y-3">
          <p className="text-sm font-medium text-amber-900">
            锦标赛「{tournamentName}」包含多个比赛项目，请选择：
          </p>
          <div className="space-y-2">
            {eventOptions.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => handleSelectEvent(ev.id)}
                disabled={previewing}
                className="w-full text-left rounded-md border bg-white px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium">{ev.name}</span>
                {ev.videogameName && (
                  <span className="text-muted-foreground ml-2">({ev.videogameName})</span>
                )}
                <span className="text-muted-foreground ml-2">· {ev.numEntrants} 人报名</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {preview && (
        <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
          <p className="font-medium">已从 start.gg 拉取预览</p>
          {preview.tournamentName && (
            <p className="text-muted-foreground">所属锦标赛：{preview.tournamentName}</p>
          )}
          {preview.eventName && preview.tournamentName && (
            <p className="text-muted-foreground">比赛项目：{preview.eventName}</p>
          )}
          {preview.videogameName && (
            <p className="text-muted-foreground">游戏：{preview.videogameName}</p>
          )}
          <p className="text-muted-foreground">
            参赛选手：{preview.numEntrants} 人（名单 {preview.entrants.length} 条）
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input type="checkbox" name="syncFromStartGg" id="syncFromStartGg" defaultChecked />
        <Label htmlFor="syncFromStartGg">保存时自动从 start.gg 同步（信息、选手、结果）</Label>
      </div>

      <div className="space-y-2">
        <Label>赛事标题</Label>
        <Input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label>描述</Label>
        <Textarea
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>游戏</Label>
          <select
            name="gameId"
            defaultValue={tournament?.gameId}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">选择游戏</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>等级</Label>
          <select
            name="tierId"
            defaultValue={tournament?.tierId}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">选择等级</option>
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>比赛日期</Label>
          <Input
            name="startDate"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>报名截止</Label>
          <Input
            name="regDeadline"
            type="datetime-local"
            value={regDeadline}
            onChange={(e) => setRegDeadline(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>人数上限（可选）</Label>
          <Input
            name="maxPlayers"
            type="number"
            min={1}
            defaultValue={tournament?.maxPlayers || ""}
          />
        </div>
        <div className="space-y-2">
          <Label>状态</Label>
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TournamentData["status"])}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="DRAFT">草稿</option>
            <option value="OPEN">报名中</option>
            <option value="CLOSED">已截止</option>
            <option value="COMPLETED">已结束</option>
          </select>
        </div>
      </div>

      <Button type="submit" disabled={loading || (eventOptions.length > 0 && !startGgEventId)}>
        {loading ? "保存中..." : tournament?.id ? "更新赛事" : "创建赛事"}
      </Button>
    </form>
  );
}
