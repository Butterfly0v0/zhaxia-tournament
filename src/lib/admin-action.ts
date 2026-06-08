import { requireAdmin } from "@/lib/auth";

export async function ensureAdminAction(): Promise<{ error: string } | null> {
  try {
    await requireAdmin();
    return null;
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "UNAUTHORIZED") {
        return { error: "登录已失效，请重新登录后再试" };
      }
      if (e.message === "FORBIDDEN") {
        return { error: "需要管理员权限" };
      }
      return { error: e.message };
    }
    return { error: "操作失败，请稍后重试" };
  }
}
