"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmDestructiveAction({
  triggerLabel,
  title,
  description,
  confirmLabel = "确认删除",
  onConfirm,
  onSuccess,
  size = "sm",
  canConfirm = true,
}: {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => Promise<{ error?: string; success?: boolean } | void>;
  onSuccess?: () => void;
  size?: "sm" | "default";
  canConfirm?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    const result = await onConfirm();
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setOpen(false);
    setLoading(false);
    onSuccess?.();
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="destructive"
        size={size}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>
    );
  }

  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-3 min-w-[220px]">
      <div>
        <p className="text-sm font-medium text-destructive">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">
          {description}
        </p>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {canConfirm && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "删除中..." : confirmLabel}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={loading}
        >
          {canConfirm ? "取消" : "知道了"}
        </Button>
      </div>
    </div>
  );
}
