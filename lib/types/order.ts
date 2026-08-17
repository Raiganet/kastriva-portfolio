export type OrderStatus =
  | "Submitted"
  | "Reviewing"
  | "Discussing"
  | "Quotation"
  | "Approved"
  | "In Progress"
  | "Revision"
  | "Completed"
  | "Cancelled";

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  name: string;
  business: string;
  email: string;
  whatsapp: string;
  projectType: string;
  serviceId?: string;
  portfolioId?: string;
  portfolioTitle?: string;
  budget: string;
  deadline: string;
  description: string;
  features: string;
  referenceUrl?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  orderId: string;
  customerId: string;
  projectName: string;
  description: string;
  status: string;
  progress: number;
  startDate?: string;
  deadline?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  title: string;
  description: string;
  progress: number;
  status: string;
  createdAt: string;
  createdBy: string;
}

export interface OrderTrackingResult {
  order: Order;
  project?: Project;
  updates: ProjectUpdate[];
}

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "Submitted",
  "Reviewing",
  "Discussing",
  "Quotation",
  "Approved",
  "In Progress",
  "Completed",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  Submitted: "Diterima",
  Reviewing: "Dalam Review",
  Discussing: "Diskusi",
  Quotation: "Penawaran",
  Approved: "Disetujui",
  "In Progress": "Sedang Dikerjakan",
  Revision: "Revisi",
  Completed: "Selesai",
  Cancelled: "Dibatalkan",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  Submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Reviewing: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  Discussing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  Quotation: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "In Progress": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  Revision: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};
