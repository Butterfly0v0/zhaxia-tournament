"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, loginUser } from "@/lib/auth";
import { loginSchema, registerSchema, profileSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";

export async function registerAction(formData: FormData) {
  const raw = {
    username: formData.get("username") as string,
    nickname: formData.get("nickname") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (existing) {
    return { error: "该用户名已被注册" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.create({
    data: {
      username: parsed.data.username,
      nickname: parsed.data.nickname,
      passwordHash,
      role: "PLAYER",
    },
  });

  await loginUser(parsed.data.username, parsed.data.password);
  redirect("/player");
}

export async function loginAction(formData: FormData) {
  const raw = {
    username: formData.get("username") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const user = await loginUser(parsed.data.username, parsed.data.password);
  if (!user) {
    return { error: "用户名或密码错误" };
  }

  redirect(user.role === "ADMIN" ? "/admin" : "/player");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireAuth();

  const raw = {
    nickname: formData.get("nickname") as string,
    email: (formData.get("email") as string) || "",
    qq: (formData.get("qq") as string) || "",
    startGgTag: (formData.get("startGgTag") as string) || "",
    startGgUniqueCode: (formData.get("startGgUniqueCode") as string) || "",
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      nickname: parsed.data.nickname,
      email: parsed.data.email || null,
      qq: parsed.data.qq || null,
      startGgTag: parsed.data.startGgTag || null,
      startGgUniqueCode: parsed.data.startGgUniqueCode || null,
    },
  });

  const { getSession } = await import("@/lib/session");
  const session = await getSession();
  session.nickname = parsed.data.nickname;
  await session.save();

  return { success: true };
}
