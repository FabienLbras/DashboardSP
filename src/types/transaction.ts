// Transaction-related type definitions

export interface Transaction {
  id: string;
  amount: number;
  paymentMethod: string;
  state: any;
  terminal: string;
  createdOn: string;
  customerName: string;
  location: string;
  description?: string;
  currency?: string;
  fees?: number;
  refundAmount?: number;
  receiptUrl?: string;
  metadata?: Record<string, any>;
  rawPayload?: Record<string, any>;
}

export interface TransactionFilters {
  status?: string;
  terminal?: string;
  dateRange?: string;
  search?: string;
}

export interface TransactionStats {
  totalAmount: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
  averageTransactionAmount: number;
}

export interface ExportParams {
  format: 'csv' | 'pdf';
  status?: string;
  terminal?: string;
  dateRange?: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  stats?: TransactionStats;
}
