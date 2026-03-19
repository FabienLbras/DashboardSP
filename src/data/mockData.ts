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

export const mockTransactions = [
  {
    id: "TXN-001",
    amount: 120.50,
    paymentMethod: "Visa",
    status: "completed",
    terminal: "TERM-001",
    date: "2024-01-15T10:30:00Z",
    customer: "John Doe",
    location: "Main Reception"
  },
  {
    id: "TXN-002",
    amount: 89.20,
    paymentMethod: "Mastercard",
    status: "completed",
    terminal: "TERM-002",
    date: "2024-01-15T11:15:00Z",
    customer: "Jane Smith",
    location: "Restaurant"
  },
  {
    id: "TXN-003",
    amount: 45.75,
    paymentMethod: "Apple Pay",
    status: "failed",
    terminal: "TERM-001",
    date: "2024-01-15T12:00:00Z",
    customer: "Bob Johnson",
    location: "Spa"
  },
  {
    id: "TXN-004",
    amount: 200.00,
    paymentMethod: "Visa",
    status: "refunded",
    terminal: "TERM-003",
    date: "2024-01-15T14:30:00Z",
    customer: "Alice Brown",
    location: "Room Service"
  }
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

export const mockEndOfDay = [
  {
    id: "EOD-001",
    date: "2024-01-15",
    totalTransactions: 134,
    successTransactions: 126,
    failedTransactions: 8,
    totalAmount: 25432.50,
    averageTransaction: 201.85,
  },
  {
    id: "EOD-002",
    date: "2024-01-14",
    totalTransactions: 118,
    successTransactions: 110,
    failedTransactions: 8,
    totalAmount: 23100.20,
    averageTransaction: 210.00,
  },
  {
    id: "EOD-003",
    date: "2024-01-13",
    totalTransactions: 145,
    successTransactions: 140,
    failedTransactions: 5,
    totalAmount: 28900.75,
    averageTransaction: 206.43,
  },
  {
    id: "EOD-004",
    date: "2024-01-12",
    totalTransactions: 89,
    successTransactions: 82,
    failedTransactions: 7,
    totalAmount: 17650.30,
    averageTransaction: 215.25,
  },
  {
    id: "EOD-005",
    date: "2024-01-11",
    totalTransactions: 162,
    successTransactions: 155,
    failedTransactions: 7,
    totalAmount: 32100.00,
    averageTransaction: 207.10,
  },
  {
    id: "EOD-006",
    date: "2024-01-10",
    totalTransactions: 101,
    successTransactions: 95,
    failedTransactions: 6,
    totalAmount: 19800.60,
    averageTransaction: 208.43,
  },
  {
    id: "EOD-007",
    date: "2024-01-09",
    totalTransactions: 78,
    successTransactions: 71,
    failedTransactions: 7,
    totalAmount: 15200.40,
    averageTransaction: 214.09,
  },
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