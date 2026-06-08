"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAccountAction } from "@/lib/actions/player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeleteAccountForm({ placementCount }: { placementCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await deleteAccountAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
    setLoading(false);
  }

  if (!open) {
    return (
      <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
        注销账号
      </Button>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-md">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm space-y-2">
        <p className="font-medium text-destructive">注销后无法恢复登录</p>
        {placementCount > 0 ? (
          <p className="text-muted-foreground">
            你有 {placementCount} 条积分记录。注销后账号将变为虚拟账号，排行榜中的积分与名次会保留，个人资料与联系方式将被清除。
          </p>
        ) : (
          <p className="text-muted-foreground">
            你暂无积分记录。注销后账号及报名数据将被永久删除。
          </p>
        )}
        <p className="text-muted-foreground">进行中的报名将被自动取消。</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="delete-password">当前密码</Label>
        <Input
          id="delete-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="delete-confirm">输入「注销账号」以确认</Label>
        <Input id="delete-confirm" name="confirm" required placeholder="注销账号" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" disabled={loading}>
          {loading ? "处理中..." : "确认注销"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          取消
        </Button>
      </div>
    </form>
  );
}
