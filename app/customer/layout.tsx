import CustomerGuard from "@/components/customer/CustomerGuard";
import CustomerNav from "@/components/customer/CustomerNav";

export const metadata = {
  title: "Customer Dashboard | Kastriva",
  robots: "noindex, nofollow",
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomerGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-dark-bg">
        <CustomerNav />
        <main className="pt-16">
          <div className="container mx-auto px-4 md:px-6 py-8">{children}</div>
        </main>
      </div>
    </CustomerGuard>
  );
}
