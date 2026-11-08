import { Metadata } from "next";
import LoginPageClient from "@/components/auth/LoginPageClient";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";

export const metadata: Metadata = {
  title: "Login | Kastriva",
  robots: "noindex, nofollow",
};

export default function LoginPage() {
  return <LanguageProvider><LoginPageClient /></LanguageProvider>;
}
