import { Badge } from "@/components/ui/badge";

const statusMap = {
  DRAFT: { label: "草稿", variant: "secondary" as const },
  OPEN: { label: "报名中", variant: "success" as const },
  CLOSED: { label: "已截止", variant: "warning" as const },
  COMPLETED: { label: "已结束", variant: "default" as const },
};

export function TournamentStatusBadge({ status }: { status: keyof typeof statusMap }) {
  const config = statusMap[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
