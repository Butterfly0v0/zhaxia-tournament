"use client";

import { useState } from "react";
import { updateProfileAction } from "@/lib/actions/auth";
import { StartGgUniqueCodeHelp } from "@/components/startgg-unique-code-help";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  defaultNickname,
  defaultEmail,
  defaultQq,
  defaultStartGgTag,
  defaultStartGgUniqueCode,
}: {
  defaultNickname: string;
  defaultEmail: string;
  defaultQq: string;
  defaultStartGgTag: string;
  defaultStartGgUniqueCode: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(false);
    const result = await updateProfileAction(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-md">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-600">保存成功</p>}
      <div className="space-y-2">
        <Label htmlFor="nickname">昵称</Label>
        <Input id="nickname" name="nickname" defaultValue={defaultNickname} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">邮箱（选填）</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultEmail}
          placeholder="example@email.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="qq">QQ 号（选填）</Label>
        <Input
          id="qq"
          name="qq"
          defaultValue={defaultQq}
          placeholder="仅数字"
          inputMode="numeric"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="startGgTag">start.gg 昵称</Label>
        <Input
          id="startGgTag"
          name="startGgTag"
          defaultValue={defaultStartGgTag}
          placeholder="与 start.gg 参赛名完全一致"
        />
        <p className="text-xs text-muted-foreground">
          绑定后可提高赛后名次自动匹配成功率
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="startGgUniqueCode">start.gg 唯一代码</Label>
        <Input
          id="startGgUniqueCode"
          name="startGgUniqueCode"
          defaultValue={defaultStartGgUniqueCode}
          placeholder="如 76ccc81d"
        />
        <StartGgUniqueCodeHelp />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "保存中..." : "保存资料"}
      </Button>
    </form>
  );
}
