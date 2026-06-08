import { NextResponse } from "next/server";
import { logoutUser } from "@/lib/auth";

export async function POST() {
  await logoutUser();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"));
}
