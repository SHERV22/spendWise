# SpendWise — College Lab Demonstration & Viva Checklist

This document is prepared for cloud computing students to conduct a live viva demonstration, capture lab report evidence, and answer examiner questions.

---

## 1. Quick Demonstration Flow (5-Minute Viva Plan)

1. **Architecture Pitch (1 min)**:
   - Introduce SpendWise as an event-driven serverless personal finance tracker.
   - Explain the 5 core AWS services: S3 (SPA hosting), Cognito (JWT auth), API Gateway (REST + Authorizer), Lambda (Node.js 20.x compute), and DynamoDB (On-Demand NoSQL).
2. **Frontend UI & Design System (1 min)**:
   - Demonstrate the Mastercard-inspired design system: cream canvas (`#F3F0EE`), stadium hero frame (40px radius), floating pill navbar, Indian numbering format (`en-IN`), and integer paise calculations.
3. **Live Transactions & Budgets (1.5 min)**:
   - Create an income transaction (e.g. `₹85,000` Salary) and an expense (e.g. `₹2,500` Swiggy Food).
   - Show the dynamic budget progress bar shift from Green to Amber/Red.
   - Show the interactive pure SVG 6-month historical trend chart and category donut chart updating instantly.
4. **AWS Serverless Verification & Isolation (1.5 min)**:
   - Demonstrate DynamoDB table items in AWS Console with partition key `userId`.
   - Prove **User Isolation**: Log in as User A and User B to demonstrate that User B cannot see User A's financial transactions.

---

## 2. Lab Report Evidence & Screenshot Guide

Capture these screenshots for your project report or viva slides:

| Evidence Item | Location in AWS Console / App | What Examiner Looks For |
| :--- | :--- | :--- |
| **1. S3 Static Hosting** | Amazon S3 Console > Bucket Properties | Static website hosting status **Enabled**, Bucket policy allows `s3:GetObject`, and live URL loads the React SPA. |
| **2. Cognito User Pool** | Amazon Cognito Console > User Pools | User directory with registered user emails, confirmed status, and App Client ID without client secret. |
| **3. API Gateway Authorizer** | API Gateway Console > Authorizers | Cognito Authorizer configured with Header `Authorization` and linked to User Pool ARN. |
| **4. CloudWatch Lambda Logs** | CloudWatch Console > Log Groups > `/aws/lambda/SpendWiseFunction` | Real execution log streams displaying Cognito `sub` extraction and 200/201 response status codes. |
| **5. DynamoDB Items View** | DynamoDB Console > Explore Items > `SpendWiseTransactions` | Persisted JSON items showing `userId`, `amount` in integer paise, and `DateIndex` GSI. |
| **6. User Isolation Test** | Two separate browser windows (or incognito) | User A (`user-1@demo.edu`) and User B (`user-2@demo.edu`) showing independent balance ledgers. |
| **7. Dashboard Charts** | SpendWise Frontend > Analytics Tab | 6-Month Income vs Outflow SVG bar chart and Category donut distribution. |

---

## 3. Step-by-Step Viva Verification Checklist

### Test Case 1: Public Health Endpoint
- **Action**: Run `curl -i https://{ApiEndpoint}/health` or click "Test Health Endpoint" in Settings.
- **Expected Outcome**: HTTP 200 OK with `{ "status": "healthy", "app": "SpendWise API" }`.
- **Examiner Verification**: Proves API Gateway routes to Lambda without requiring Cognito tokens for health checks.

### Test Case 2: Unauthenticated Access Rejection
- **Action**: Run `curl -i -X GET https://{ApiEndpoint}/transactions` without `Authorization` header.
- **Expected Outcome**: HTTP 401 Unauthorized.
- **Examiner Verification**: Proves the API Gateway Cognito Authorizer defends the backend from unauthenticated requests.

### Test Case 3: Transaction Creation & Integer Paise Math
- **Action**: In the UI, add an expense transaction of `₹149.50`.
- **Expected Outcome**:
  - UI displays `-₹149.50` with Food badge.
  - DynamoDB Console reflects attribute `amount: 14950` (integer paise).
- **Examiner Verification**: Demonstrates elimination of floating-point rounding errors.

### Test Case 4: Category Budget Alerts
- **Action**: Set a monthly budget of `₹1,000` for Entertainment. Add a transaction of `₹1,200` for Movie Tickets.
- **Expected Outcome**: Progress bar turns Red, warning pill displays `Over budget by 20%`.
- **Examiner Verification**: Proves business logic aggregation between transactions and monthly budgets.

### Test Case 5: Multi-User Security Isolation
- **Action**:
  1. Register User A (`alice@demo.edu`), log in, and record a salary of `₹50,000`.
  2. Open an Incognito window, register User B (`bob@demo.edu`), log in.
- **Expected Outcome**: Bob's ledger is completely empty. Bob cannot query or view Alice's `₹50,000` transaction.
- **Examiner Verification**: Proves DynamoDB queries use `KeyConditionExpression: userId = :sub` derived from validated JWT claims.

---

## 4. Frequent Viva Questions & Model Answers

### Q1: Why did you choose DynamoDB over Amazon RDS (PostgreSQL/MySQL)?
> **Answer**: SpendWise uses Amazon DynamoDB because it is a cloud-native, fully managed serverless NoSQL database with zero maintenance overhead. DynamoDB scales to zero with **On-Demand Capacity (PAY_PER_REQUEST)**, costing $0.00 when inactive—ideal for student projects. Additionally, personal finance transactions have a well-defined access pattern partitioned naturally by `userId`.

### Q2: How is user authentication verified securely?
> **Answer**: Authentication is delegated to **Amazon Cognito User Pools**. When a user logs in, Cognito returns a signed JWT. In API Gateway, a Cognito Authorizer checks the token signature against Cognito's public key (JWKS). In AWS Lambda, the user's `sub` (unique ID) is extracted from `event.requestContext.authorizer.claims.sub`. We never accept user IDs from the client body or query string.

### Q3: Why store currency as integer paise instead of floating-point rupees?
> **Answer**: Standard IEEE-754 floating-point arithmetic introduces rounding inaccuracies (e.g., `0.1 + 0.2 = 0.30000000000000004`). In financial systems, storing the smallest monetary unit (paise for INR, cents for USD) as integers guarantees exact addition, subtraction, and auditability without fractional drift.

### Q4: What is the purpose of the DynamoDB Global Secondary Index (`DateIndex`)?
> **Answer**: The primary key for `SpendWiseTransactions` is Partition Key `userId` and Sort Key `transactionId`. To fetch transactions sorted chronologically by date descending without scanning the entire table, we defined a Global Secondary Index with Partition Key `userId` and Sort Key `transactionDate`. This allows efficient, cost-effective queries.

### Q5: How would you scale this architecture to enterprise production?
> **Answer**:
> 1. Place an **Amazon CloudFront CDN** in front of S3 with **Origin Access Control (OAC)** to enforce HTTPS and global edge caching.
> 2. Attach **AWS WAF (Web Application Firewall)** to API Gateway to mitigate DDoS attacks and rate limit IP requests.
> 3. Enable **DynamoDB Point-In-Time Recovery (PITR)** and auto-archival of old transactions to S3 Glacier via DynamoDB Streams.
