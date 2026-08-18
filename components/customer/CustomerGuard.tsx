"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";
import { LoadingSpinner } from "@/components/ui";

export default function CustomerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const isLoginPage = pathname === "/customer/login";

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      return;
    }
    if (!CustomerAuthService.isLoggedIn()) {
      router.replace("/customer/login");
    } else {
      setChecking(false);
    }
  }, [router, pathname, isLoginPage]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
