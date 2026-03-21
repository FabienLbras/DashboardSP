import { useState, useEffect, useCallback } from 'react';
import { TransactionService } from '../services/transactionService';
import type { Transaction, TransactionFilters } from '../types/transaction';

interface UseTransactionsOptions {
  initialFilters?: TransactionFilters;
}

interface UseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string;
  refreshing: boolean;
  fetchTransactions: (propertyId?: number) => Promise<void>;
  refetch: () => void;
  clearError: () => void;
}

export function useTransactions(options: UseTransactionsOptions = {}): UseTransactionsReturn {
  const { initialFilters = {} } = options;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);

  const fetchTransactions = useCallback(async (propertyId?: number) => {
    try {
      setLoading(true);
      setError("");

      const params = propertyId ? { property_id: propertyId } : {};
      const transactionsData = await TransactionService.getTransactions({ ...filters, ...params });
      setTransactions(transactionsData);
    } catch (err) {
      console.error("useTransactions: Failed to fetch transactions:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch transactions";
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  const refetch = useCallback(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  // Fetch transactions when filters change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refreshing,
    fetchTransactions,
    refetch,
    clearError
  };
}

export default useTransactions;