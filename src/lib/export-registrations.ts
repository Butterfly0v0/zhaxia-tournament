type ExportRegistrationRow = {
  nickname: string;
  startGgTag: string | null;
  startGgUniqueCode: string | null;
  email: string | null;
  qq: string | null;
  registeredAt: Date;
  status: string;
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "已确认",
  PENDING: "待确认",
  CANCELLED: "已取消",
};

function csvCell(value: string | null | undefined) {
  const text = value ?? "";
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function formatExportDate(date: Date) {
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function sanitizeFilename(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "_").trim() || "tournament";
}

export function buildRegistrationsCsv(
  tournament: {
    title: string;
    game: { name: string };
    tier: { name: string };
    startDate: Date;
    regDeadline: Date;
  },
  registrations: ExportRegistrationRow[]
) {
  const lines: string[] = [
    `赛事名称,${csvCell(tournament.title)}`,
    `游戏,${csvCell(tournament.game.name)}`,
    `等级,${csvCell(tournament.tier.name)}`,
    `比赛日期,${csvCell(formatExportDate(tournament.startDate))}`,
    `报名截止,${csvCell(formatExportDate(tournament.regDeadline))}`,
    `导出时间,${csvCell(formatExportDate(new Date()))}`,
    "",
    "序号,选手昵称,start.gg 昵称,start.gg 唯一代码,邮箱,QQ,报名时间,状态",
  ];

  registrations.forEach((row, index) => {
    lines.push(
      [
        String(index + 1),
        csvCell(row.nickname),
        csvCell(row.startGgTag),
        csvCell(row.startGgUniqueCode),
        csvCell(row.email),
        csvCell(row.qq),
        csvCell(formatExportDate(row.registeredAt)),
        csvCell(STATUS_LABELS[row.status] ?? row.status),
      ].join(",")
    );
  });

  return `\uFEFF${lines.join("\r\n")}`;
}
