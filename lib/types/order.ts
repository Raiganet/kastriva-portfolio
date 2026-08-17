/**
 * Interface untuk data order
 */
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  name: string;
  business: string;
  email: string;
  whatsapp: string;
  projectType: string;
  serviceId: string;
  portfolioId?: string;
  portfolioTitle?: string;
  budget: string;
  deadline: string;
  description: string;
  features: string;
  referenceUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface untuk status order
 */
export type OrderStatus = 
  | 'Submitted'
  | 'Reviewing'
  | 'Discussing'
  | 'Quotation'
  | 'Approved'
  | 'In Progress'
  | 'Revision'
  | 'Completed'
  | 'Cancelled';

/**
 * Interface untuk data customer
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  business: string;
  avatar?: string;
  status: string;
  createdAt: string;
  lastActivity: string;
}
