// Mock data for the merchant dashboard

export const mockKPIs = {
  todayRevenue: 25432.50,
  yesterdayRevenue: 23100.20,
  monthToDate: 756890.30,
  averageTransactionValue: 45.67,
  refundsCount: 12,
  refundsValue: 1234.50,
  failedTransactionsCount: 8,
  failedTransactionsValue: 890.30
};

const _methods = ["Visa", "Mastercard", "American Express", "Apple Pay", "Google Pay"];
const _statuses = ["completed", "completed", "completed", "completed", "completed", "failed", "refunded"];
const _customers = ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Marc Dupont", "Sophie Martin", "Luca Rossi", "Emma Wilson", "Carlos Garcia", "Yuki Tanaka"];
const _locations = ["Main Reception", "Restaurant", "Spa", "Room Service", "Bar"];
const _terminals = ["TERM-001", "TERM-002", "TERM-003"];

function _txn(id: number, dateStr: string) {
  const r = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const amount = parseFloat((20 + Math.random() * 480).toFixed(2));
  return {
    id: `TXN-${String(id).padStart(3, "0")}`,
    amount,
    paymentMethod: r(_methods),
    status: r(_statuses),
    terminal: r(_terminals),
    date: dateStr,
    customer: r(_customers),
    location: r(_locations),
  };
}

export const mockTransactions = [
  _txn(1,  "2024-01-15T10:30:00Z"),
  _txn(2,  "2024-01-15T11:15:00Z"),
  _txn(3,  "2024-01-15T12:00:00Z"),
  _txn(4,  "2024-01-15T14:30:00Z"),
  _txn(5,  "2024-01-15T09:10:00Z"),
  _txn(6,  "2024-01-14T10:00:00Z"),
  _txn(7,  "2024-01-14T13:20:00Z"),
  _txn(8,  "2024-01-14T15:45:00Z"),
  _txn(9,  "2024-01-13T08:30:00Z"),
  _txn(10, "2024-01-13T11:00:00Z"),
  _txn(11, "2024-01-13T16:00:00Z"),
  _txn(12, "2024-01-12T09:00:00Z"),
  _txn(13, "2024-01-12T14:00:00Z"),
  _txn(14, "2024-01-11T10:30:00Z"),
  _txn(15, "2024-01-11T12:15:00Z"),
  _txn(16, "2024-01-11T17:00:00Z"),
  _txn(17, "2024-01-10T09:45:00Z"),
  _txn(18, "2024-01-10T13:30:00Z"),
  _txn(19, "2024-01-09T11:00:00Z"),
  _txn(20, "2024-01-09T15:00:00Z"),
  _txn(21, "2024-01-08T10:00:00Z"),
  _txn(22, "2024-01-08T14:30:00Z"),
  _txn(23, "2024-01-07T09:00:00Z"),
  _txn(24, "2024-01-07T16:00:00Z"),
  _txn(25, "2024-01-06T11:30:00Z"),
  _txn(26, "2024-01-05T10:00:00Z"),
  _txn(27, "2024-01-05T14:00:00Z"),
  _txn(28, "2024-01-04T09:30:00Z"),
  _txn(29, "2024-01-03T12:00:00Z"),
  _txn(30, "2024-01-02T10:30:00Z"),
];

export const mockTerminals = [
  {
    id: "TERM-001",
    name: "Main Reception",
    status: "online",
    location: "Lobby",
    lastSeen: "2024-01-15T15:30:00Z",
    todayTransactions: 45,
    todayRevenue: 2340.50
  },
  {
    id: "TERM-002",
    name: "Restaurant POS",
    status: "online",
    location: "Restaurant",
    lastSeen: "2024-01-15T15:28:00Z",
    todayTransactions: 78,
    todayRevenue: 4560.20
  },
  {
    id: "TERM-003",
    name: "Spa Counter",
    status: "offline",
    location: "Spa",
    lastSeen: "2024-01-15T12:15:00Z",
    todayTransactions: 12,
    todayRevenue: 890.30
  }
];

export const mockPaymentMethodsData = [
  { name: "Visa", value: 45, amount: 12350.50 },
  { name: "Mastercard", value: 30, amount: 8920.30 },
  { name: "American Express", value: 15, amount: 4560.20 },
  { name: "Apple Pay", value: 7, amount: 1890.40 },
  { name: "Google Pay", value: 3, amount: 780.60 }
];

export const mockRevenueData = [
  { date: "2024-01-01", revenue: 15000, transactions: 120 },
  { date: "2024-01-02", revenue: 18000, transactions: 145 },
  { date: "2024-01-03", revenue: 22000, transactions: 167 },
  { date: "2024-01-04", revenue: 19000, transactions: 134 },
  { date: "2024-01-05", revenue: 25000, transactions: 189 },
  { date: "2024-01-06", revenue: 28000, transactions: 201 },
  { date: "2024-01-07", revenue: 24000, transactions: 178 }
];

export const mockLocationData = [
  { location: "Main Reception", transactions: 156, revenue: 8540.30 },
  { location: "Restaurant", transactions: 298, revenue: 15620.80 },
  { location: "Spa", transactions: 87, revenue: 4320.60 },
  { location: "Room Service", transactions: 145, revenue: 7890.40 },
  { location: "Bar", transactions: 234, revenue: 12450.90 }
];

export const mockInvoices = [
  {
    id: "INV-001",
    number: "2024-001",
    date: "2024-01-15",
    dueDate: "2024-02-15",
    amount: 2500.00,
    status: "paid",
    customer: "Hotel Guest Services"
  },
  {
    id: "INV-002",
    number: "2024-002",
    date: "2024-01-14",
    dueDate: "2024-02-14",
    amount: 1890.50,
    status: "pending",
    customer: "Conference Center"
  },
  {
    id: "INV-003",
    number: "2024-003",
    date: "2024-01-13",
    dueDate: "2024-02-13",
    amount: 3200.75,
    status: "overdue",
    customer: "Catering Services"
  }
];

export const mockUsers = [
  {
    id: "USR-001",
    name: "John Manager",
    email: "john@hotel.com",
    role: "Manager",
    status: "active",
    lastLogin: "2024-01-15T15:30:00Z"
  },
  {
    id: "USR-002",
    name: "Sarah Cashier",
    email: "sarah@hotel.com",
    role: "Cashier",
    status: "active",
    lastLogin: "2024-01-15T14:20:00Z"
  },
  {
    id: "USR-003",
    name: "Mike Support",
    email: "mike@hotel.com",
    role: "Support",
    status: "inactive",
    lastLogin: "2024-01-10T09:15:00Z"
  }
];

// Day-of-week multipliers (Mon=1 low, Fri=5 high, Sat=6 medium, Sun=0 very low)
const _dowMult: Record<number, number> = { 0: 0.62, 1: 0.78, 2: 0.95, 3: 1.0, 4: 1.12, 5: 1.25, 6: 0.88 };
function _eod(id: number, dateStr: string) {
  const d = new Date(dateStr);
  const m = _dowMult[d.getDay()];
  const base = Math.round(120 * m + (Math.random() * 20 - 10));
  const failed = Math.round(base * 0.055 + Math.random() * 3);
  const success = base - failed;
  const avg = 195 + Math.random() * 30;
  return {
    id: `EOD-${String(id).padStart(3, "0")}`,
    date: dateStr,
    totalTransactions: base,
    successTransactions: success,
    failedTransactions: failed,
    totalAmount: parseFloat((base * avg).toFixed(2)),
    averageTransaction: parseFloat(avg.toFixed(2)),
  };
}

export const mockEndOfDay = [
  // Jan 2024 — skip Jan 12 intentionally (missing day alert)
  _eod(1,  "2024-01-15"),
  _eod(2,  "2024-01-14"),
  _eod(3,  "2024-01-13"),
  _eod(5,  "2024-01-11"),
  _eod(6,  "2024-01-10"),
  _eod(7,  "2024-01-09"),
  _eod(8,  "2024-01-08"),
  _eod(9,  "2024-01-07"),
  _eod(10, "2024-01-06"),
  _eod(11, "2024-01-05"),
  _eod(12, "2024-01-04"),
  _eod(13, "2024-01-03"),
  _eod(14, "2024-01-02"),
  _eod(15, "2024-01-01"),
  _eod(16, "2023-12-31"),
  _eod(17, "2023-12-30"),
  _eod(18, "2023-12-29"),
  _eod(19, "2023-12-28"),
  _eod(20, "2023-12-27"),
  _eod(21, "2023-12-26"),
  _eod(22, "2023-12-25"),
  _eod(23, "2023-12-24"),
  _eod(24, "2023-12-23"),
  _eod(25, "2023-12-22"),
  _eod(26, "2023-12-21"),
  _eod(27, "2023-12-20"),
  _eod(28, "2023-12-19"),
  _eod(29, "2023-12-18"),
  _eod(30, "2023-12-17"),
];

export const mockProperties = [
  {
    id: "PROP-001",
    name: "Grand Hotel Downtown",
    address: "123 Main St, Downtown",
    status: "active",
    terminals: 5,
    monthlyRevenue: 125000.50
  },
  {
    id: "PROP-002",
    name: "Seaside Resort",
    address: "456 Beach Ave, Coastal",
    status: "active",
    terminals: 8,
    monthlyRevenue: 189500.30
  },
  {
    id: "PROP-003",
    name: "Mountain Lodge",
    address: "789 Peak Rd, Mountains",
    status: "maintenance",
    terminals: 3,
    monthlyRevenue: 67200.80
  }
];