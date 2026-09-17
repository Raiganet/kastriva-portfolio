export function buildWhatsAppLink(number: string, message: string): string {
  const clean = String(number || "").replace(/[^0-9]/g, "");
  if (!clean) return "#";
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
