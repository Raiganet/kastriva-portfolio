import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin | Kastriva",
  description: "Admin panel Kastriva",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-dark-bg">
        <AdminSidebar />
        <main className="min-w-0 pt-16 lg:pl-64 lg:pt-0">
          <div className="min-w-0 p-3 sm:p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </AdminGuard>
  );
}
