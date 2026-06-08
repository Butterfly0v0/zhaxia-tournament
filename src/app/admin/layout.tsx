import { AdminNav } from "@/components/layout/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">管理后台</h1>
      <AdminNav />
      {children}
    </div>
  );
}
