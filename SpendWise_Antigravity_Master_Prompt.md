# Master Prompt: Build SpendWise — AWS Cloud Finance Tracker

Copy the prompt below into Antigravity. Have the agent inspect its environment, build the application, run it, test it, and provide clear AWS deployment instructions.

---

## PROMPT START

You are a senior full-stack engineer and AWS serverless architect. Build a polished, working, college-level cloud computing mini-project called **SpendWise**, a personal finance tracker. The project must be more than a static UI: implement real frontend functionality, a real serverless backend, persistent database storage, and user authentication.

## 1. Main goal

Create a responsive personal finance web app that lets each user:
- Register, log in, and log out.
- View a dashboard with total income, total expenses, current net balance, savings rate, and recent transactions.
- Create, view, edit, delete, search, filter, and sort income/expense transactions.
- Categorize transactions (e.g., Food, Transport, Shopping, Education, Bills, Health, Entertainment, Salary, Other).
- Set monthly budgets by category and see used/remaining amounts and progress indicators.
- View spending analytics using charts (category breakdown and month-by-month income vs. expenses).
- Filter analytics and transactions by date range and category.
- See useful empty states, loading states, validation messages, and error states.
- Use INR (₹) as the default currency and Indian number formatting.

Use realistic demo data only if it is clearly labelled as sample data and provide a way to clear/reset it. Never pretend demo data is persisted in AWS.

## 2. Required AWS services

Use these services in the actual architecture, not just in documentation:

1. **Amazon S3** — host the built frontend assets. Document an appropriate static website hosting setup for a lab/demo. Also explain the more production-appropriate option of CloudFront with a private S3 origin.
2. **Amazon API Gateway** — expose the backend REST API.
3. **AWS Lambda** — run backend logic using Node.js.
4. **Amazon DynamoDB** — persist transactions and monthly category budgets.
5. **Amazon Cognito** — user registration/sign-in and token-based authentication.

Recommended stack:
- Frontend: React + Vite + TypeScript.
- Styling: Tailwind CSS if setup is reliable; otherwise use clean, maintainable CSS.
- Charts: Recharts.
- Backend: Node.js + TypeScript where practical, using AWS Lambda.
- AWS infrastructure: AWS SAM preferred for a beginner-friendly reproducible deployment. CloudFormation is acceptable if SAM is not suitable.
- Tests: use the lightest sensible test setup available in the environment.

Use the AWS SDK v3 in Lambda. Keep the app easy for a student to understand, demonstrate, and explain in a viva.

## 3. Architecture and security requirements

Implement this flow:

React app hosted on S3 → API Gateway → Lambda → DynamoDB.

Use Cognito User Pool authentication. The frontend should sign users in through Cognito and send the access/ID token required by the chosen API Gateway authorizer in the `Authorization: Bearer <token>` header. Configure the authorizer correctly and verify tokens at the API boundary. Do not trust a user ID sent in a request body or query string. Derive the user identity from validated JWT claims and scope every database operation to that identity.

Security requirements:
- Never hard-code AWS access keys, secret keys, passwords, tokens, or other credentials.
- Never put AWS credentials in frontend code or `.env` files exposed to Vite.
- Use IAM least privilege for Lambda permissions.
- Configure CORS to allow only the deployed frontend origin (and localhost during development where needed), not `*` in production.
- Validate all inputs server-side, including amount, currency, date, category, transaction type, and required fields.
- Amounts must be positive finite numbers. Avoid unsafe floating-point accumulation for money; store monetary values as integer paise where practical, and format as rupees in the UI.
- Ensure users can only access their own transactions and budgets.
- Return useful HTTP status codes and safe error messages; do not expose secrets or stack traces to clients.
- Do not store bank credentials or connect to real bank accounts. This is a manual-entry educational tracker, not a financial advice product.
- Add a clear note that data is personal and users should not enter sensitive bank details.

## 4. Data model

Design a simple DynamoDB schema that is easy to explain and supports user-specific queries efficiently. You may use one table with partition/sort keys or separate tables if that makes the implementation clearer. Include:
- Transactions: transaction ID, authenticated user ID, type (`income` or `expense`), amount in paise, category, description, transaction date, created/updated timestamps.
- Budgets: authenticated user ID, month (`YYYY-MM`), category, budget amount in paise, created/updated timestamps.

Use query patterns rather than table scans for normal user requests. Ensure transaction reads, updates and deletes are scoped by authenticated user. Use conditional writes or equivalent ownership checks where needed. Document the schema and access patterns.

## 5. API functionality

Implement and document a sensible REST API, such as:
- `GET /transactions` — list the current user's transactions; support filters and pagination if feasible.
- `POST /transactions` — create a transaction.
- `GET /transactions/{id}` — get one transaction owned by the current user.
- `PUT /transactions/{id}` — update a transaction owned by the current user.
- `DELETE /transactions/{id}` — delete a transaction owned by the current user.
- `GET /budgets?month=YYYY-MM` — list budgets for a month.
- `POST /budgets` or `PUT /budgets/{category}` — create/update a category budget for a month.
- `GET /analytics?month=YYYY-MM` — return or calculate the summary data needed for dashboard charts.

If a single endpoint design makes analytics simpler, that is acceptable, but keep the API organized. Use a consistent response format and provide an API reference in the README.

## 6. User interface and design direction

Make the interface look like a credible modern fintech dashboard, not a generic tutorial page.

Design direction:
- App name: **SpendWise**.
- Visual style: clean, premium, calm, readable; navy/charcoal text, neutral backgrounds, tasteful green for positive values and restrained red for expenses.
- Responsive sidebar or compact mobile navigation.
- Dashboard cards for balance, income, expenses, and savings rate.
- Clear transactions table/list with category icons or badges.
- Add-transaction form in a modal or dedicated panel with inline validation.
- Budget cards with progress bars and clear warnings when near or over budget.
- Analytics section with legible charts, date/month filters, and useful labels.
- Profile/account menu and sign-out action.
- Accessible contrast, keyboard-friendly controls, semantic HTML, and responsive layouts for desktop and mobile.
- Use consistent spacing, typography, border radius, and hover/focus states.
- Avoid excessive gradients, clutter, fake buttons, nonfunctional controls, and placeholder charts.
- All visible buttons, navigation items, forms, filters, and chart controls must work.

Provide a polished sign-in/sign-up experience that matches the main app. Show meaningful feedback when authentication is not configured yet; do not silently fake a successful login.

## 7. Required pages or views

At minimum:
1. Sign in / Sign up.
2. Dashboard overview.
3. Transactions list and add/edit transaction flow.
4. Budgets view.
5. Analytics view.
6. Account/help or a small settings area containing currency, data/privacy note, and sign-out.

## 8. Development experience and configuration

- Inspect the existing workspace before changing files. Preserve useful existing work if present.
- Create a clean, understandable folder structure separating frontend, backend, infrastructure, and docs.
- Provide `.env.example` files containing placeholders only, never real secrets.
- Include `.gitignore` for build outputs, dependencies, local env files, credentials, and generated artifacts.
- Add clear scripts for local development, build, lint/type-check if configured, and tests.
- Add a local development mode using a clearly labelled mock data adapter only if AWS configuration is absent. The app must clearly indicate **Demo mode — data is stored locally/not in AWS**. Never present mock data as cloud-backed.
- Keep a clean boundary between mock and AWS-backed modes so real AWS mode cannot silently fall back to mock data on errors.
- Explain exactly which Cognito, API Gateway, DynamoDB, and S3 values must be supplied through environment variables.
- Do not deploy resources, create paid infrastructure, modify AWS accounts, or run commands that incur cloud costs without first asking for explicit approval. You may build and test locally without that approval.
- Do not run destructive commands or delete user files. Inspect before overwriting.
- If AWS credentials or access are unavailable, finish the application and infrastructure templates, run local checks, and provide exact deployment steps rather than claiming deployment succeeded.

## 9. AWS infrastructure and deployment

Provide reproducible infrastructure-as-code using AWS SAM or CloudFormation that defines as much as practical:
- Lambda functions and their execution roles/policies.
- API Gateway routes and Cognito authorizer.
- DynamoDB tables and key schema.
- Cognito User Pool and app client (without embedding secrets).
- Environment variables and CORS configuration.
- Outputs listing the API endpoint, User Pool ID, App Client ID, and other required deployment values.
- S3 bucket or clear instructions for creating the frontend hosting bucket. Avoid unsafe public access configurations without clearly explaining the lab-only trade-off.
- Document how to build the frontend and upload its output to S3.

Write a beginner-friendly `README.md` with:
1. Project overview and features.
2. Architecture diagram using Mermaid.
3. AWS services and why each is used.
4. Prerequisites.
5. Local setup and environment configuration.
6. How to run in demo/mock mode.
7. How to deploy backend infrastructure.
8. How to build and deploy the frontend.
9. How to configure Cognito and test sign-in.
10. API endpoints and example requests.
11. Testing steps and screenshots the student should capture for a cloud computing lab report.
12. Common errors and troubleshooting.
13. Cleanup instructions to remove resources and avoid ongoing charges.
14. Limitations and possible future enhancements.

Also create:
- `docs/architecture.md`
- `docs/api.md`
- `docs/aws-deployment.md`
- `docs/lab-demo-checklist.md`

The lab demo checklist should include evidence for:
- S3 frontend deployment.
- Cognito sign-in.
- API Gateway endpoint invocation.
- Lambda execution/logs.
- DynamoDB records appearing after creating transactions.
- Dashboard charts and budgets updating from persisted data.
- Isolation between two test users.

## 10. Testing and acceptance criteria

Before finishing:
- Install dependencies using the project's package manager if allowed and available.
- Run frontend build and type-check/lint where configured.
- Run backend unit tests and infrastructure template validation where available.
- Fix errors you can reproduce.
- Test form validation, transaction CRUD, budget updates, chart calculations, empty states, and API error states.
- Confirm that all database queries and mutations are user-scoped.
- Check mobile and desktop layout if browser tools are available.
- Do not claim a test, deployment, or AWS integration succeeded unless you actually verified it.
- If a test cannot be run, state why and give the exact command the user should run.

## 11. Work process

Proceed in this order:
1. Inspect the workspace and summarize the plan briefly.
2. Implement the app and infrastructure.
3. Run available checks and fix issues.
4. Review for security and broken or fake UI elements.
5. Update all documentation.
6. Finish with a concise summary of created files, features, commands to run locally, deployment steps, AWS services used, tests actually run, and any remaining manual setup.

Do not stop after generating a plan or just the frontend. Continue through implementation and verification within the available environment. Make sensible choices without repeatedly asking questions. If a genuinely blocking decision arises, ask one focused question; otherwise proceed.

**Success means:** a working, polished, understandable finance tracker; a real AWS serverless architecture represented in code; safe user-scoped data access; reproducible deployment instructions; and a project suitable for a college cloud computing lab demonstration.

## PROMPT END
