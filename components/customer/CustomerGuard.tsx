"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";
import { LoadingSpinner } from "@/components/ui";

export default function CustomerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === "/customer/login") {
      setChecking(false);
      return;
    }
    let active = true;
    setChecking(true);
    const expire = () => { setChecking(true); router.replace("/login?role=customer"); };
    window.addEventListener("kastriva-session-expired", expire);
    CustomerAuthService.refresh().then(ok => {
      if (!active) return;
      if (ok) setChecking(false); else expire();
    });
    return () => { active = false; window.removeEventListener("kastriva-session-expired", expire); };
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
