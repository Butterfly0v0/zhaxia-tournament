import Link from "next/link";
import { RegisterForm } from "@/components/forms/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>选手注册</CardTitle>
          <CardDescription>注册后即可报名赛事、查看积分排名</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <p className="text-sm text-muted-foreground mt-4 text-center">
            已有账号？{" "}
            <Link href="/login" className="text-primary hover:underline">
              去登录
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
