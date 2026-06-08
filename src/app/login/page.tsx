import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";
import { ActionErrorBanner } from "@/components/admin/action-error-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>登录</CardTitle>
          <CardDescription>使用用户名和密码登录炸虾格斗会</CardDescription>
        </CardHeader>
        <CardContent>
          <ActionErrorBanner message={error} />
          <LoginForm />
          <p className="text-sm text-muted-foreground mt-4 text-center">
            还没有账号？{" "}
            <Link href="/register" className="text-primary hover:underline">
              立即注册
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
