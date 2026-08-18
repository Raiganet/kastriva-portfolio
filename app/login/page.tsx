import { Metadata } from "next";
import LoginPageClient from "@/components/auth/LoginPageClient";

export const metadata: Metadata = {
  title: "Login | Kastriva",
  robots: "noindex, nofollow",
};

export default function LoginPage() {
  return <LoginPageClient />;
}
