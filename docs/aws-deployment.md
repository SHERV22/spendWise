# SpendWise — AWS Deployment & Hosting Guide

This guide walks you through deploying the SpendWise Serverless architecture to AWS using **AWS SAM (Serverless Application Model)** or the **AWS Management Console**.

---

## 1. Prerequisites

Before starting, ensure you have:
1. An **AWS Account** with administrative or appropriate developer permissions.
2. **AWS CLI** installed and configured (`aws configure`).
3. **AWS SAM CLI** installed (`sam --version` ≥ 1.100.0).
4. **Node.js** (v20.x or higher) and **npm** (`node -v`).

---

## 2. Deploying Backend Infrastructure (AWS SAM)

The SAM template (`infrastructure/template.yaml`) defines:
- Amazon Cognito User Pool & App Client
- Amazon DynamoDB Tables (`SpendWiseTransactions`, `SpendWiseBudgets`)
- Amazon API Gateway REST API with Cognito Authorizer
- AWS Lambda Function (Node.js 20.x) with least-privilege IAM policies
- Amazon S3 Bucket configured for frontend static website hosting

### Step 2.1: Build the SAM Application
From the project root:
```bash
sam build -t infrastructure/template.yaml
```

### Step 2.2: Deploy the Stack
Deploy interactively using guided mode:
```bash
sam deploy --guided
```

Provide the following prompt values:
- **Stack Name**: `spendwise-backend`
- **AWS Region**: `ap-south-1` (Mumbai) or your preferred region (e.g. `us-east-1`)
- **Parameter Stage**: `prod`
- **Parameter AllowedOrigin**: `*` *(or your S3 website domain after deployment)*
- **Confirm changes before deploy**: `Y`
- **Allow SAM CLI to create IAM roles**: `Y`
- **Disable rollback**: `N`
- **Save arguments to configuration file**: `Y`
- **SAM configuration file**: `samconfig.toml`
- **SAM configuration environment**: `default`

### Step 2.3: Record Stack Outputs
When deployment completes, SAM outputs the required values:

```text
-------------------------------------------------------------------------------------------------
Outputs
-------------------------------------------------------------------------------------------------
Key                 ApiEndpoint
Description         Base API Gateway endpoint URL for SpendWise REST API
Value               https://a1b2c3d4e5.execute-api.ap-south-1.amazonaws.com/prod

Key                 CognitoUserPoolId
Description         Cognito User Pool ID for client authentication
Value               ap-south-1_aBcDeFgHi

Key                 CognitoClientId
Description         Cognito App Client ID for React web client
Value               1a2b3c4d5e6f7g8h9i0jklmnop

Key                 FrontendWebsiteURL
Description         S3 Static Website Hosting URL for SpendWise Frontend
Value               http://spendwise-frontend-prod-123456789012.s3-website.ap-south-1.amazonaws.com
-------------------------------------------------------------------------------------------------
```

> 💡 **Keep these values handy!** You will supply them in `.env` and the SpendWise Settings view.

---

## 3. Building & Deploying the Frontend to Amazon S3

### Step 3.1: Configure Environment Variables
Create a `.env` file in the project root:
```env
VITE_API_ENDPOINT=https://a1b2c3d4e5.execute-api.ap-south-1.amazonaws.com/prod
VITE_COGNITO_USER_POOL_ID=ap-south-1_aBcDeFgHi
VITE_COGNITO_CLIENT_ID=1a2b3c4d5e6f7g8h9i0jklmnop
VITE_AWS_REGION=ap-south-1
```

### Step 3.2: Build Production Bundle
Run Vite build:
```bash
npm run build
```
This generates the optimized bundle in the `dist/` directory.

### Step 3.3: Upload Assets to S3 Hosting Bucket
Using your bucket name from SAM output `FrontendWebsiteURL`:
```bash
aws s3 sync dist/ s3://spendwise-frontend-prod-<YOUR-ACCOUNT-ID> --delete
```

### Step 3.4: Open the Live Application
Visit your S3 Website URL in any browser:
```text
http://spendwise-frontend-prod-<YOUR-ACCOUNT-ID>.s3-website.ap-south-1.amazonaws.com
```

---

## 4. Alternative: Deploying via AWS Management Console

If SAM CLI is not available in your lab environment:

1. **Deploy CloudFormation Template**:
   - Open AWS CloudFormation Console.
   - Choose **Create Stack** > **With new resources (standard)**.
   - Select **Upload a template file** and choose `infrastructure/cloudformation.yaml`.
   - Name the stack `spendwise-prod` and proceed through the prompts.
2. **Deploy Lambda Code**:
   - Package `backend/src` into a `.zip` archive:
     ```bash
     cd backend && zip -r spendwise-lambda.zip src package.json
     ```
   - In AWS Lambda console, upload the zip to `SpendWiseFunction` and verify runtime is **Node.js 20.x**.
3. **Configure API Gateway**:
   - Create REST API with `/transactions`, `/budgets`, `/analytics`, `/health` endpoints.
   - Add Cognito User Pool Authorizer.
   - Enable CORS with `Allow-Origin: *`.
   - Deploy API to stage `prod`.

---

## 5. Security & Cost Optimization Checklist

- [x] **No hardcoded credentials**: All AWS keys and secret tokens are strictly absent from code and Git.
- [x] **Least Privilege IAM**: The Lambda execution role has access *only* to the specific DynamoDB tables.
- [x] **Cognito SRP Auth**: Passwords are never sent across network in cleartext; SRP (Secure Remote Password) protocol handles cryptographic negotiation.
- [x] **DynamoDB On-Demand Billing**: Using `PAY_PER_REQUEST` ensures $0.00 idle cost when not actively processing requests.

---

## 6. Resource Cleanup (Avoid Unexpected AWS Charges)

When your lab demo or grading is finished, remove all cloud resources:

### Step 6.1: Empty and Delete the S3 Frontend Bucket
```bash
aws s3 rm s3://spendwise-frontend-prod-<YOUR-ACCOUNT-ID> --recursive
```

### Step 6.2: Delete the SAM Stack
```bash
sam delete --stack-name spendwise-backend --no-prompts
```
Verify in the AWS CloudFormation Console that the stack status changes to `DELETE_COMPLETE`.
