import { OrderStatus, STATUS_LABELS, STATUS_COLORS } from "@/lib/types/order";
import { CheckCircle2 } from "lucide-react";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: "sm" | "md" | "lg";
}

export default function OrderStatusBadge({ status, size = "md" }: OrderStatusBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${STATUS_COLORS[status]} ${sizeClasses[size]}`}
    >
      <CheckCircle2 size={size === "sm" ? 12 : size === "md" ? 14 : 16} />
      {STATUS_LABELS[status]}
    </span>
  );
}
