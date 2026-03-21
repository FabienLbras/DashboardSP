import { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import { Download, Loader2, RefreshCw, MoreVertical, ChevronDown } from 'lucide-react'

interface HeaderProps {
  handleRefresh: () => void;
  handleExportCSV: () => void;
  handleExportPDF: () => void;
  loading: boolean;
  displayTransactions: any[];
  canExport: boolean;
}

const Header = ({
    handleRefresh,
    handleExportCSV,
    handleExportPDF,
    loading,
    displayTransactions,
    canExport,
}: HeaderProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const disabled = loading || displayTransactions.length === 0;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Transactions</h1>
        <p className="text-muted-foreground text-sm hidden sm:block">Manage and monitor all payment transactions</p>
      </div>

      {/* Desktop: boutons séparés */}
      <div className="hidden sm:flex gap-2 flex-shrink-0">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
        {canExport && (
          <>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={disabled}>
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={disabled}>
              <Download className="h-4 w-4 mr-2" />Export PDF
            </Button>
          </>
        )}
      </div>

      {/* Mobile: bouton Actions dropdown */}
      <div className="relative sm:hidden flex-shrink-0" ref={ref}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          disabled={loading}
          className="flex items-center gap-1"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
          Actions
        </Button>

        {open && (
          <div className="absolute right-0 mt-1 w-44 rounded-lg border border-gray-200 bg-white shadow-lg z-50 dark:border-gray-700 dark:bg-gray-900">
            <button
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 rounded-t-lg"
              onClick={() => { handleRefresh(); setOpen(false); }}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            {canExport && (
              <>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-40"
                  onClick={() => { handleExportCSV(); setOpen(false); }}
                  disabled={disabled}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-40 rounded-b-lg"
                  onClick={() => { handleExportPDF(); setOpen(false); }}
                  disabled={disabled}
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Header
