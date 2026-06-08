"use client";

import { useState } from "react";
import { resetUserPasswordAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetUserPasswordForm({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    await resetUserPasswordAction(formData);
    setLoading(false);
    setOpen(false);
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        重置密码
      </Button>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Input
        name="newPassword"
        type="password"
        placeholder={`${username} 的新密码`}
        required
        minLength={6}
        className="h-8 w-36 text-xs"
      />
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "..." : "确认"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(false)}
        disabled={loading}
      >
        取消
      </Button>
    </form>
  );
}
