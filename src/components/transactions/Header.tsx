import React from 'react'
import { Button } from '../ui/button'
import { Download, Loader2, RefreshCw } from 'lucide-react'

import { useUser } from "../../context/UserContext";
import { checkPermission } from "../../auth/checkPermission";
import { PERMISSIONS } from "../../auth/permissions";

interface HeaderProps {
  handleRefresh: () => void;
  handleExportCSV: () => void;
  handleExportPDF: () => void;
  loading: boolean;
  displayTransactions: any[];
}

const Header = ({
    
    handleRefresh,
    handleExportCSV,
    handleExportPDF,
    loading,
    displayTransactions
}: HeaderProps) => {
     const user = useUser();
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Transactions</h1>
                <p className="text-muted-foreground">Manage and monitor all payment transactions</p>
            </div>
            <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={loading}
                >
                    {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                </Button>
                {checkPermission(user?.role, PERMISSIONS.EXPORT_REPORTS) && (
                <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportCSV}
                disabled={loading || displayTransactions.length === 0}
                >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
                </Button>
                )}
                {checkPermission(user?.role, PERMISSIONS.EXPORT_REPORTS) && (
                <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportPDF}
                disabled={loading || displayTransactions.length === 0}
                >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
                </Button>
)}
            </div>
        </div>
    )
}

export default Header
