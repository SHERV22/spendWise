# SpendWise REST API Reference

The SpendWise REST API is exposed via Amazon API Gateway and executed by AWS Lambda (Node.js 20.x). All protected endpoints require a valid Amazon Cognito JWT Bearer token.

---

## 1. General Conventions

- **Base URL**: `https://{ApiId}.execute-api.{Region}.amazonaws.com/{Stage}`
- **Content-Type**: `application/json`
- **Authentication**: `Authorization: Bearer <Cognito_ID_or_Access_Token>`
- **Monetary Units**: Amounts returned by database payloads are in **integer paise** (`100 paise = ₹1.00`). Endpoints accepting `POST /transactions` accept standard rupee values (e.g. `149.50`) and automatically convert them to integer paise for storage.

---

## 2. API Endpoints Summary

| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/health` | No | Public service health check |
| `GET` | `/transactions` | Yes | List transactions for authenticated user |
| `POST` | `/transactions` | Yes | Record a new transaction |
| `GET` | `/transactions/{id}` | Yes | Fetch one transaction by ID |
| `PUT` | `/transactions/{id}` | Yes | Update an existing transaction |
| `DELETE` | `/transactions/{id}` | Yes | Delete a transaction |
| `GET` | `/budgets` | Yes | List category budgets for a month |
| `POST` | `/budgets` | Yes | Set or update a monthly category budget |
| `DELETE` | `/budgets/{month}/{category}` | Yes | Remove a monthly category budget |
| `GET` | `/analytics` | Yes | Get monthly breakdown, savings rate, and trends |

---

## 3. Endpoints Specification

### 3.1. Public Health Check

```http
GET /health
```

#### Response (200 OK)
```json
{
  "status": "healthy",
  "app": "SpendWise API",
  "timestamp": "2026-10-27T12:00:00.000Z",
  "environment": "production"
}
```

---

### 3.2. List Transactions

```http
GET /transactions?category=Food&type=expense&startDate=2026-10-01&endDate=2026-10-31&limit=50
```

#### Query Parameters:
- `category` *(optional)*: Filter by category (`Food`, `Bills`, `Transport`, etc.)
- `type` *(optional)*: `income` or `expense`
- `startDate` *(optional)*: Format `YYYY-MM-DD`
- `endDate` *(optional)*: Format `YYYY-MM-DD`
- `limit` *(optional)*: Max number of items to return (1 to 100, default: 50)

#### Response (200 OK)
```json
{
  "count": 1,
  "data": [
    {
      "id": "tx-8f2a-431c",
      "transactionId": "tx-8f2a-431c",
      "userId": "3c98f4e2-9b51-4091-a1e6-8e5048d08cb2",
      "type": "expense",
      "amount": 14950,
      "category": "Food",
      "description": "South Indian Thali Lunch",
      "transactionDate": "2026-10-27",
      "createdAt": "2026-10-27T12:30:00.000Z",
      "updatedAt": "2026-10-27T12:30:00.000Z"
    }
  ]
}
```

---

### 3.3. Create Transaction

```http
POST /transactions
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "expense",
  "amount": 149.50,
  "category": "Food",
  "description": "South Indian Thali Lunch",
  "transactionDate": "2026-10-27"
}
```

#### Request Body Fields:
- `type` *(required)*: `'income'` or `'expense'`
- `amount` *(required)*: Positive number > 0
- `category` *(required)*: One of `Food`, `Transport`, `Shopping`, `Education`, `Bills`, `Health`, `Entertainment`, `Salary`, `Investment`, `Other`
- `description` *(required)*: String (1 to 250 characters)
- `transactionDate` *(required)*: String in `YYYY-MM-DD` format

#### Response (201 Created)
```json
{
  "message": "Transaction recorded successfully",
  "data": {
    "id": "tx-8f2a-431c",
    "transactionId": "tx-8f2a-431c",
    "userId": "3c98f4e2-9b51-4091-a1e6-8e5048d08cb2",
    "type": "expense",
    "amount": 14950,
    "category": "Food",
    "description": "South Indian Thali Lunch",
    "transactionDate": "2026-10-27",
    "createdAt": "2026-10-27T12:30:00.000Z",
    "updatedAt": "2026-10-27T12:30:00.000Z"
  }
}
```

---

### 3.4. Update Transaction

```http
PUT /transactions/{id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 175.00,
  "description": "Special Thali Lunch with Sweet"
}
```

#### Response (200 OK)
```json
{
  "message": "Transaction updated successfully",
  "data": {
    "id": "tx-8f2a-431c",
    "amount": 17500,
    "description": "Special Thali Lunch with Sweet",
    "updatedAt": "2026-10-27T13:00:00.000Z"
  }
}
```

---

### 3.5. Delete Transaction

```http
DELETE /transactions/{id}
Authorization: Bearer <token>
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Transaction deleted successfully",
  "transactionId": "tx-8f2a-431c"
}
```

---

### 3.6. List Budgets

```http
GET /budgets?month=2026-10
Authorization: Bearer <token>
```

#### Response (200 OK)
```json
{
  "count": 2,
  "data": [
    {
      "userId": "3c98f4e2-9b51-4091-a1e6-8e5048d08cb2",
      "month": "2026-10",
      "category": "Food",
      "monthCategory": "2026-10#Food",
      "amount": 1200000,
      "createdAt": "2026-10-01T00:00:00.000Z"
    },
    {
      "userId": "3c98f4e2-9b51-4091-a1e6-8e5048d08cb2",
      "month": "2026-10",
      "category": "Bills",
      "monthCategory": "2026-10#Bills",
      "amount": 2600000,
      "createdAt": "2026-10-01T00:00:00.000Z"
    }
  ]
}
```

---

### 3.7. Set Category Budget

```http
POST /budgets
Content-Type: application/json
Authorization: Bearer <token>

{
  "month": "2026-10",
  "category": "Food",
  "amount": 12000
}
```

#### Response (200 OK)
```json
{
  "message": "Budget allocated successfully",
  "data": {
    "userId": "3c98f4e2-9b51-4091-a1e6-8e5048d08cb2",
    "month": "2026-10",
    "category": "Food",
    "monthCategory": "2026-10#Food",
    "amount": 1200000,
    "updatedAt": "2026-10-27T12:00:00.000Z"
  }
}
```

---

### 3.8. Delete Budget

```http
DELETE /budgets/2026-10/Food
Authorization: Bearer <token>
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Budget for Food (2026-10) removed"
}
```

---

### 3.9. Analytics & Monthly Insights

```http
GET /analytics?month=2026-10
Authorization: Bearer <token>
```

#### Response (200 OK)
```json
{
  "data": {
    "month": "2026-10",
    "totalIncomeInPaise": 10350000,
    "totalExpenseInPaise": 4924900,
    "netBalanceInPaise": 5425100,
    "savingsRate": 52.4,
    "transactionCount": 11,
    "categoryBreakdown": [
      {
        "category": "Bills",
        "spentInPaise": 2480000,
        "budgetInPaise": 2600000,
        "remainingInPaise": 120000,
        "percentageOfExpense": 50,
        "percentageUsed": 95,
        "isOverBudget": false
      },
      {
        "category": "Food",
        "spentInPaise": 1090000,
        "budgetInPaise": 1200000,
        "remainingInPaise": 110000,
        "percentageOfExpense": 22,
        "percentageUsed": 91,
        "isOverBudget": false
      }
    ],
    "monthlyTrend": [
      { "month": "2026-05", "label": "May", "incomeInPaise": 8500000, "expenseInPaise": 4200000 },
      { "month": "2026-10", "label": "Oct", "incomeInPaise": 10350000, "expenseInPaise": 4924900 }
    ],
    "topExpenses": [
      {
        "description": "Apartment Monthly Rent & Maintenance",
        "amount": 2200000,
        "category": "Bills",
        "transactionDate": "2026-10-02"
      }
    ]
  }
}
```

---

## 4. Error Responses

All error responses return standard JSON envelopes with descriptive errors:

### 400 Bad Request
```json
{
  "error": "ValidationError",
  "message": "Amount must be a positive number greater than 0; Transaction date is required in YYYY-MM-DD format"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid Cognito authorization token. Please sign in via Amazon Cognito."
}
```

### 404 Not Found
```json
{
  "error": "NotFound",
  "message": "Transaction not found or not authorized"
}
```
