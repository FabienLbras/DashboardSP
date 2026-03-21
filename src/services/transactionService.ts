import { apiService, apiUtils } from "../../services/axios";
import type { Transaction, TransactionFilters, ExportParams, TransactionStats } from "../types/transaction";

export class TransactionService {
  
  /**
   * Fetch all transactions with optional filters
   */
  static async getTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
    try {
      const response = await apiService.transactions.getAll(filters);
      return response.data.items || [];
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw new Error(apiUtils.handleError(error));
    }
  }

  /**
   * Fetch a single transaction by ID
   */
  static async getTransactionById(id: string): Promise<Transaction> {
    try {
      const response = await apiService.transactions.getById(id);
      return response.data;
    } catch (error) {
      console.error("Error fetching transaction:", error);
      throw new Error(apiUtils.handleError(error));
    }
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(transactionData: Partial<Transaction>): Promise<Transaction> {
    try {
      const response = await apiService.transactions.create(transactionData);
      return response.data;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw new Error(apiUtils.handleError(error));
    }
  }

  /**
   * Update an existing transaction
   */
  static async updateTransaction(id: string, transactionData: Partial<Transaction>): Promise<Transaction> {
    try {
      const response = await apiService.transactions.update(id, transactionData);
      return response.data;
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw new Error(apiUtils.handleError(error));
    }
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(id: string): Promise<void> {
    try {
      await apiService.transactions.delete(id);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw new Error(apiUtils.handleError(error));
    }
  }

  /**
   * Export transactions to CSV or PDF
   */
  static async exportTransactions(params: ExportParams): Promise<Blob> {
    try {
      const response = await apiService.transactions.export(params);
      return response.data;
    } catch (error) {
      console.error("Error exporting transactions:", error);
      throw new Error(apiUtils.handleError(error));
    }
  }

  /**
   * Get transaction statistics
   */
  static async getTransactionStats(filters: TransactionFilters = {}): Promise<TransactionStats> {
    try {
      const response = await apiService.transactions.getStats(filters);
      return response.data;
    } catch (error) {
      console.error("Error fetching transaction stats:", error);
      throw new Error(apiUtils.handleError(error));
    }
  }

  /**
   * Process a refund for a transaction
   */
  static async processRefund(transactionId: string, refundAmount?: number): Promise<Transaction> {
    try {
      const response = await apiService.post(`/transactions/${transactionId}/refund`, {
        amount: refundAmount
      });
      return response.data;
    } catch (error) {
      console.error("Error processing refund:", error);
      throw new Error(apiUtils.handleError(error));
    }
  }

  /**
   * Download transaction receipt
   */
  static async downloadReceipt(transactionId: string): Promise<Blob> {
    try {
      const response = await apiService.get(`/transactions/${transactionId}/receipt`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error("Error downloading receipt:", error);
      throw new Error(apiUtils.handleError(error));
    }
  }

  /**
   * Search transactions by query string
   */
  static async searchTransactions(query: string): Promise<Transaction[]> {
    try {
      const response = await apiService.get('/transactions/search', {
        params: { q: query }
      });
      return response.data.transactions || [];
    } catch (error) {
      console.error("Error searching transactions:", error);
      throw new Error(apiUtils.handleError(error));
    }
  }

  /**
   * Get transaction by terminal ID
   */
  static async getTransactionsByTerminal(terminalId: string): Promise<Transaction[]> {
    try {
      const response = await apiService.get(`/transactions/terminal/${terminalId}`);
      return response.data.transactions || [];
    } catch (error) {
      console.error("Error fetching transactions by terminal:", error);
      throw new Error(apiUtils.handleError(error));
    }
  }

  /**
   * Utility function to download a blob as a file
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Format currency value
   */
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Format date for display
   */
  static formatDate(date: string | Date): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get status color class for badges
   */
  static getStatusColor(status: Transaction['state']): string {
    switch (status) {
      case 'completed':
      case 'FULFILL':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-orange-100 text-orange-800';
      case 'pending':
      case 'VOIDED':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}

export default TransactionService;