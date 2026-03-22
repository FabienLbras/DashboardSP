# SP Dashboard — Terminal API

API used by Android payment terminals to push transactions and end-of-day reports to the dashboard.

---

## Authentication

Every request must include the terminal's API key in the header:

```
X-Terminal-Key: <your_terminal_api_key>
```

The API key is generated per terminal by a super_admin from the dashboard.
If the key is missing, invalid, or the terminal is inactive → `401` / `403`.

---

## Base URL

```
https://successpaymentdashboard.onrender.com/api
```

---

## Endpoints

---

### GET /api/terminal/config

Fetch the terminal's own configuration (name, location, customer, property).
Call this once on app startup to verify connectivity and retrieve context.

**Request**
```http
GET /api/terminal/config
X-Terminal-Key: abc123...
```

**Response 200**
```json
{
  "terminal": {
    "id": 1,
    "name": "Reception POS",
    "serial_number": "TRM-00123",
    "model": "Ingenico Move 5000",
    "location": "Main Reception",
    "status": "active"
  },
  "property": {
    "id": 2,
    "name": "Grand Hôtel Paris",
    "type": "hotel",
    "address": "12 Rue de Rivoli, Paris"
  },
  "customer": {
    "id": 1,
    "name": "Acme Hotels Ltd.",
    "email": "contact@acme.com"
  }
}
```

---

### POST /api/terminal/transaction

Push a completed transaction to the dashboard.
Call this after each payment is processed on the terminal.

**Request**
```http
POST /api/terminal/transaction
X-Terminal-Key: abc123...
Content-Type: application/json
```

**Body**
```json
{
  "reference": "TXN-20240315-001",
  "amount": 125.50,
  "currency": "EUR",
  "state": "FULFILL",
  "payment_method": "Visa",
  "customer_name": "Jean Dupont",
  "customer_email": "jean@example.com",
  "description": "Room 204 - Dinner",
  "transaction_at": "2024-03-15T20:45:00Z"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `amount` | number | **yes** | Transaction amount |
| `state` | string | **yes** | `FULFILL`, `FAILED`, `pending`, `refunded` |
| `reference` | string | no | Your internal reference ID |
| `currency` | string | no | ISO 4217 code. Default: `EUR` |
| `payment_method` | string | no | `Visa`, `Mastercard`, `Apple Pay`, etc. |
| `customer_name` | string | no | Cardholder name |
| `customer_email` | string | no | Cardholder email |
| `description` | string | no | Free text description |
| `transaction_at` | string | no | ISO 8601 datetime. Default: server time |

**Response 201**
```json
{
  "success": true,
  "transaction": {
    "id": 42,
    "reference": "TXN-20240315-001",
    "amount": "125.50",
    "currency": "EUR",
    "state": "FULFILL",
    "payment_method": "Visa",
    "customer_name": "Jean Dupont",
    "created_at": "2024-03-15T20:45:00.000Z"
  }
}
```

---

### POST /api/terminal/eod

Push an end-of-day summary report.
Call this once per day at closing time with the daily totals.

**Request**
```http
POST /api/terminal/eod
X-Terminal-Key: abc123...
Content-Type: application/json
```

**Body**
```json
{
  "report_date": "2024-03-15",
  "total_transactions": 48,
  "successful_transactions": 45,
  "failed_transactions": 3,
  "total_amount": 6820.00,
  "avg_amount": 151.56,
  "currency": "EUR",
  "raw_data": {
    "by_method": {
      "Visa": 30,
      "Mastercard": 12,
      "Apple Pay": 6
    },
    "peak_hour": "12:00-13:00"
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `report_date` | string | **yes** | Date in `YYYY-MM-DD` format |
| `total_transactions` | integer | no | Total number of transactions |
| `successful_transactions` | integer | no | Successful (FULFILL) count |
| `failed_transactions` | integer | no | Failed count |
| `total_amount` | number | no | Total revenue for the day |
| `avg_amount` | number | no | Average transaction amount |
| `currency` | string | no | ISO 4217. Default: `EUR` |
| `raw_data` | object | no | Any extra data (breakdown by method, etc.) |

> If a report for the same `terminal_id` + `report_date` already exists, it is **updated** (upsert).

**Response 201**
```json
{
  "success": true,
  "eod": {
    "id": 7,
    "report_date": "2024-03-15",
    "total_transactions": 48,
    "successful_transactions": 45,
    "failed_transactions": 3,
    "total_amount": "6820.00",
    "avg_amount": "151.56",
    "currency": "EUR",
    "created_at": "2024-03-15T23:00:00.000Z"
  }
}
```

---

## Error Responses

| HTTP | Code | Meaning |
|---|---|---|
| `401` | `Missing X-Terminal-Key header` | Header not sent |
| `401` | `Invalid terminal key` | Key not found in DB |
| `403` | `Terminal is not active` | Terminal disabled in dashboard |
| `403` | `Customer account is inactive` | Customer account suspended |
| `400` | `amount and state are required` | Missing required fields |
| `400` | `state must be one of: ...` | Invalid state value |
| `400` | `report_date (YYYY-MM-DD) is required` | Missing date |
| `500` | `Server error` | Internal error |

---

## Generating an API Key (Super Admin)

From the dashboard, a super_admin can generate a key for any terminal:

```http
POST /api/admin/terminals/:id/generate-key
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "success": true,
  "terminal": {
    "id": 1,
    "name": "Reception POS",
    "serial_number": "TRM-00123",
    "api_key": "a3f8c2e1d4b7..."
  }
}
```

> Each call generates a **new key** and invalidates the previous one. Store it securely in your APK (Android Keystore or EncryptedSharedPreferences).

To view the current key:
```http
GET /api/admin/terminals/:id/key
Authorization: Bearer <jwt_token>
```

---

## Android Integration Tips

### Store the API key securely
```kotlin
// Use EncryptedSharedPreferences
val masterKey = MasterKey.Builder(context)
    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
    .build()

val prefs = EncryptedSharedPreferences.create(
    context, "sp_secure_prefs", masterKey,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
)
prefs.edit().putString("terminal_api_key", "your_key_here").apply()
```

### Add the header to every request (Retrofit)
```kotlin
class TerminalAuthInterceptor(private val apiKey: String) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request().newBuilder()
            .addHeader("X-Terminal-Key", apiKey)
            .addHeader("Content-Type", "application/json")
            .build()
        return chain.proceed(request)
    }
}
```

### Retrofit interface example
```kotlin
interface TerminalApi {
    @GET("terminal/config")
    suspend fun getConfig(): TerminalConfig

    @POST("terminal/transaction")
    suspend fun pushTransaction(@Body tx: TransactionRequest): TransactionResponse

    @POST("terminal/eod")
    suspend fun pushEod(@Body eod: EodRequest): EodResponse
}
```

### Recommended flow
1. On app start → call `GET /api/terminal/config` to verify key and get context
2. After each payment → call `POST /api/terminal/transaction` immediately
3. If offline → queue locally and send when connection restored
4. At end of day → call `POST /api/terminal/eod` with daily totals
