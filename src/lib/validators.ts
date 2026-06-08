import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(2, "用户名至少2个字符").max(32),
  password: z.string().min(6, "密码至少6个字符"),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(2, "用户名至少2个字符")
    .max(32)
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fff]+$/, "用户名只能包含字母、数字、下划线和中文"),
  nickname: z.string().min(1, "昵称不能为空").max(32),
  password: z.string().min(6, "密码至少6个字符"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次密码不一致",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "请输入当前密码"),
    newPassword: z.string().min(6, "新密码至少6个字符"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "两次新密码不一致",
    path: ["confirmPassword"],
  });

export const adminResetPasswordSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(6, "新密码至少6个字符"),
});

export const profileSchema = z.object({
  nickname: z.string().min(1).max(32),
  email: z
    .string()
    .email("请输入有效的邮箱地址")
    .max(128)
    .optional()
    .or(z.literal("")),
  qq: z
    .string()
    .max(20)
    .regex(/^[0-9]*$/, "QQ 号只能包含数字")
    .optional()
    .or(z.literal("")),
  startGgTag: z.string().max(64).optional().or(z.literal("")),
  startGgUniqueCode: z
    .string()
    .max(32)
    .regex(/^[a-zA-Z0-9]*$/, "唯一代码只能包含字母和数字")
    .optional()
    .or(z.literal("")),
});

export const gameSchema = z.object({
  name: z.string().min(1, "游戏名称不能为空"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "slug 只能包含小写字母、数字和连字符"),
  description: z.string().optional(),
  isActive: z.boolean(),
});

export const tierSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(8),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0),
});

export const pointRuleSchema = z.object({
  placement: z.coerce.number().int().min(1),
  points: z.coerce.number().int().min(0),
});

export const tournamentSchema = z.object({
  title: z.string().min(1, "赛事标题不能为空"),
  description: z.string().optional(),
  gameId: z.string().min(1, "请选择游戏"),
  tierId: z.string().min(1, "请选择等级"),
  startDate: z.string().min(1),
  regDeadline: z.string().min(1),
  startGgUrl: z.string().url("请输入有效的 start.gg 链接").optional().or(z.literal("")),
  maxPlayers: z.coerce.number().int().positive().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "COMPLETED"]),
});

export const manualPlacementSchema = z.object({
  userId: z.string(),
  placement: z.coerce.number().int().min(1),
});

export const syncConfirmSchema = z.object({
  items: z.array(
    z.object({
      entrantName: z.string(),
      placement: z.coerce.number().int().min(1),
      userId: z.string().optional(),
      ignored: z.boolean().optional(),
    })
  ),
});
