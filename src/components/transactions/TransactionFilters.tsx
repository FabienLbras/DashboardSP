import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Search } from 'lucide-react'
import { Input } from '../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../components/ui/select";

const TransactionFilters = ({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    terminalFilter,
    setTerminalFilter,
    dateFilter,
    setDateFilter,
    loading
}: any) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by ID or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="FULFILL">FulFilled</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="VOIDED">Voided</SelectItem>
              </SelectContent>
            </Select>
            <Select value={terminalFilter} onValueChange={setTerminalFilter} disabled={true}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by terminal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terminals</SelectItem>
                <SelectItem value="TERM-001">Main Reception</SelectItem>
                <SelectItem value="TERM-002">Restaurant POS</SelectItem>
                <SelectItem value="TERM-003">Spa Counter</SelectItem>
                <SelectItem value="TERM-004">Gift Shop</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter} disabled={loading}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    )
}

export default TransactionFilters
