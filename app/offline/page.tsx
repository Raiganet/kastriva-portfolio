import OfflinePageContent from "@/components/pwa/OfflinePageContent";

export const metadata = {
  title: "Offline | Kastriva",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return <OfflinePageContent />;
}
