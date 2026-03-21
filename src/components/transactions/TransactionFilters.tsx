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
import { useLanguage } from '../../context/LanguageContext'

const TransactionFilters = ({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    terminalFilter,
    setTerminalFilter,
    dateFilter,
    setDateFilter,
    loading,
    propertyFilter
}: any) => {
    const { t } = useLanguage();
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{t("filter")}</CardTitle>
            </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-48">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchIdCustomer")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses2")}</SelectItem>
                <SelectItem value="FULFILL">{t("fulfilled")}</SelectItem>
                <SelectItem value="FAILED">{t("failed")}</SelectItem>
                <SelectItem value="VOIDED">{t("voided")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={terminalFilter} onValueChange={setTerminalFilter} disabled={true}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("filterByTerminal")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allTerminalsRec")}</SelectItem>
                <SelectItem value="TERM-001">Main Reception</SelectItem>
                <SelectItem value="TERM-002">Restaurant POS</SelectItem>
                <SelectItem value="TERM-003">Spa Counter</SelectItem>
                <SelectItem value="TERM-004">Gift Shop</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter} disabled={loading}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("dateRange")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allTime")}</SelectItem>
                <SelectItem value="today">{t("today")}</SelectItem>
                <SelectItem value="yesterday">{t("yesterday")}</SelectItem>
                <SelectItem value="week">{t("thisWeek")}</SelectItem>
                <SelectItem value="month">{t("thisMonth")}</SelectItem>
                <SelectItem value="quarter">{t("thisQuarterShort")}</SelectItem>
              </SelectContent>
            </Select>
            {propertyFilter && propertyFilter}
          </div>
        </CardContent>
      </Card>
    )
}

export default TransactionFilters
