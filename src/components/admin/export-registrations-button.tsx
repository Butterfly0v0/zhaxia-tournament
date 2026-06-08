"use client";

import { Button } from "@/components/ui/button";

export function ExportRegistrationsButton({
  tournamentId,
  disabled,
}: {
  tournamentId: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <Button variant="outline" size="sm" disabled>
        导出报名名单
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" asChild>
      <a href={`/api/admin/tournaments/${tournamentId}/export-registrations`}>
        导出报名名单
      </a>
    </Button>
  );
}
