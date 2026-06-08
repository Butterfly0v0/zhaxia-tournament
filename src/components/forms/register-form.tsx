"use client";

import { useState } from "react";
import { registerAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await registerAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="username">用户名（用于登录）</Label>
        <Input id="username" name="username" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nickname">昵称（公开显示）</Label>
        <Input id="nickname" name="nickname" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">确认密码</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "注册中..." : "注册"}
      </Button>
    </form>
  );
}
