export type DecimalValue = number | string;

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface OrderSummary {
  orderNumber: number;
  invoiceNumber: number;
  deliveryDate: string;
  invoiceIssueDate: string;
  orderValue: DecimalValue;
  totalHectoliters: DecimalValue;
}

export interface InvoiceItem {
  productCode: number;
  productName: string;
  quantity: DecimalValue;
}

export interface ReturnAlertContext {
  customerId: number;
  invoiceNumber: number;
  orderValue: DecimalValue;
  totalHectoliters: DecimalValue;
}

export type OccurrenceStatus = "OPEN" | "RETURNED" | "REVERTED";

export interface Occurrence {
  id: number;
  customerId: number;
  invoiceNumber: number;
  type: "RETURN";
  status: OccurrenceStatus;
  problemResolved: boolean;
  createdAt: string;
  updatedAt: string;
  returnConfirmedAt: string | null;
  revertedAt: string | null;
}
