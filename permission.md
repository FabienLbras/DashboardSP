# Permission Matrix

This document describes the role-based access model currently implemented in the frontend and backend of the Success Payment Dashboard.

## Roles 

- `admin` 
- `hotel_manager` 
- `financial_manager` 
- `front_office_manager` 
- `front_office_operator` 

## Permission Keys

- `view_payment_data`
- `view_transactions`
- `generate_reports`
- `export_reports`
- `view_eod_reports`
- `use_virtual_terminal`
- `view_terminals`
- `manage_terminals`
- `access_ecommerce_data`
- `access_standard_premium`
- `manage_users`
- `modify_system_config`
- `modify_global_settings`

## Role Access Summary

| Role | Access Level |
| --- | --- |
| `admin` | Full access to all permissions |
| `hotel_manager` | Full access to all permissions |
| `financial_manager` | Full access to all permissions |
| `front_office_manager` | Operational access to payments, transactions, reports, EOD reports, and the virtual terminal |
| `front_office_operator` | Read access to payment data and transactions only |

## Detailed Matrix

| Permission | Admin | Hotel Manager | Financial Manager | Front Office Manager | Front Office Operator |
| --- | --- | --- | --- | --- | --- |
| `view_payment_data` | Yes | Yes | Yes | Yes | Yes |
| `view_transactions` | Yes | Yes | Yes | Yes | Yes |
| `generate_reports` | Yes | Yes | Yes | Yes | No |
| `export_reports` | Yes | Yes | Yes | Yes | No |
| `view_eod_reports` | Yes | Yes | Yes | Yes | No |
| `use_virtual_terminal` | Yes | Yes | Yes | Yes | No |
| `view_terminals` | Yes | Yes | Yes | No | No |
| `manage_terminals` | Yes | Yes | Yes | No | No |
| `access_ecommerce_data` | Yes | Yes | Yes | No | No |
| `access_standard_premium` | Yes | Yes | Yes | No | No |
| `manage_users` | Yes | Yes | Yes | No | No |
| `modify_system_config` | Yes | Yes | Yes | No | No |
| `modify_global_settings` | Yes | Yes | Yes | No | No |

## Route and Feature Mapping

### Dashboard

- `GET /api/dashboard/overview`: `view_payment_data`
- `GET /api/dashboard/stats`: `generate_reports`
- `GET /api/dashboard/recent-activity`: `view_payment_data`

### Transactions

- `GET /api/payment/transactions`: `view_transactions`
- `GET /api/payment/transactions/:id`: `view_transactions`
- `GET /api/payment/transactions/stats`: `view_payment_data`
- `POST /api/payment/transactions`: `use_virtual_terminal`
- `PUT /api/payment/transactions/:id`: `use_virtual_terminal`
- `DELETE /api/payment/transactions/:id`: `modify_system_config`

### Terminals

- `GET /api/terminals`: `view_terminals`
- `GET /api/terminals/:id`: `view_terminals`
- `POST /api/terminals`: `manage_terminals`
- `PUT /api/terminals/:id`: `manage_terminals`
- `DELETE /api/terminals/:id`: `manage_terminals`

### Frontend Navigation and Guards

- Dashboard reporting widgets rely on `generate_reports`
- Transactions export actions rely on `export_reports`
- Virtual terminal actions rely on `use_virtual_terminal`
- Terminals page visibility relies on `view_terminals`
- Terminal management actions rely on `manage_terminals`
- Ecommerce navigation relies on `access_ecommerce_data`

## Source of Truth

The current permission mapping is implemented in:

- `src/lib/permissions.ts`
- `SuccessPaymentDashboard-main/backend/src/index.js`
