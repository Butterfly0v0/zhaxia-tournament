"use server";

import { redirect } from "next/navigation";
import { logoutUser } from "@/lib/auth";

export async function logoutAction() {
  await logoutUser();
  redirect("/");
}
