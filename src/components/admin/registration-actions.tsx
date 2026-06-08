"use client";

import { useRouter } from "next/navigation";
import { updateRegistrationStatusAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function CancelRegistrationButton({ registrationId }: { registrationId: string }) {
  const router = useRouter();

  async function handleCancel() {
    await updateRegistrationStatusAction(registrationId, "CANCELLED");
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
      取消
    </Button>
  );
}
