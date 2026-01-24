# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with CI/CD workflows in this repository.

## Overview

GitHub Actions CI/CD pipeline for the WorkFlow application. Supports automated testing, building, and deployment to AWS infrastructure.

| Component | Purpose |
|-----------|---------|
| CI Job | Install, type check, lint, test |
| Deploy Frontend | Build Svelte app → S3 → CloudFront invalidation |
| DB Migration | Build migration image → ECR → ECS task |
| Deploy Backend | Build API image → ECR → ECS service update |

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Triggers                                       │
│  push (main/develop) | pull_request | workflow_dispatch (manual)        │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              CI Job                                      │
│  ┌─────────┐  ┌────────────┐  ┌─────────────┐  ┌───────┐  ┌──────────┐ │
│  │ Install │→ │ DB Generate│→ │ DB Migrate  │→ │ Check │→ │   Test   │ │
│  └─────────┘  └────────────┘  └─────────────┘  └───────┘  └──────────┘ │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │ (not PR)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            Setup Job                                     │
│  Determine: environment (dev/prd), deploy_frontend, deploy_backend      │
└──────────────┬──────────────────────────────────┬───────────────────────┘
               │                                  │
               ▼                                  ▼
┌──────────────────────────────┐    ┌─────────────────────────────────────┐
│      Deploy Frontend         │    │           DB Migration               │
│  ┌───────┐  ┌─────┐  ┌────┐ │    │  ┌───────┐  ┌──────┐  ┌───────────┐ │
│  │ Build │→ │ S3  │→ │ CF │ │    │  │ Build │→ │ Push │→ │ ECS Task  │ │
│  └───────┘  └─────┘  └────┘ │    │  │ Image │  │ ECR  │  │ (migrate) │ │
└──────────────────────────────┘    └─────────────────────────┬───────────┘
                                                              │
                                                              ▼
                                    ┌─────────────────────────────────────┐
                                    │         Deploy Backend               │
                                    │  ┌───────┐  ┌──────┐  ┌───────────┐ │
                                    │  │ Build │→ │ Push │→ │ ECS Update│ │
                                    │  │ Image │  │ ECR  │  │  Service  │ │
                                    │  └───────┘  └──────┘  └───────────┘ │
                                    └─────────────────────────────────────┘
```

## Triggers

| Trigger | Condition | Deployment |
|---------|-----------|------------|
| `push` | `main` or `develop` branch | Auto deploy to `dev` |
| `pull_request` | `main` or `develop` branch | CI only (no deploy) |
| `workflow_dispatch` | Manual trigger | Choose `dev` or `prd` |

### Branch Restrictions

- **workflow_dispatch**: Only `main` or `develop` branches allowed
- **prd deployment**: Only `main` branch allowed

## Jobs

### 1. CI Job
Runs on all triggers. Uses devcontainer for consistent environment.

```yaml
runCmd: |
  bun install --frozen-lockfile
  bun run db:generate
  bun run db:migrate:deploy
  bun run check
  bun run test:run
```

### 2. Setup Job
Determines deployment parameters. Skipped for pull requests.

**Outputs:**
- `environment`: `dev` or `prd`
- `deploy_frontend`: `true` or `false`
- `deploy_backend`: `true` or `false`

### 3. Deploy Frontend Job
Builds and deploys web app to S3 + CloudFront.

**Steps:**
1. Install dependencies
2. Build with Vite (`bun run build:web`)
3. Sync to S3 with cache headers
4. Invalidate CloudFront cache

### 4. DB Migration Job
Builds migration image and runs as ECS task.

**Steps:**
1. Build migration Docker image
2. Push to ECR with `:migration` tag
3. Run ECS task with migration image
4. Wait for completion and verify exit code

### 5. Deploy Backend Job
Builds and deploys API to ECS Fargate.

**Steps:**
1. Build API Docker image
2. Push to ECR with `:latest` and `:<sha>` tags
3. Update ECS service (force new deployment)
4. Wait for service to stabilize

## GitHub Configuration

### Environments

Create two environments in GitHub repository settings:

1. **dev** - Development environment
2. **prd** - Production environment

Path: `Settings` → `Environments` → `New environment`

### Secrets (Repository Level)

| Name | Description | Example |
|------|-------------|---------|
| `AWS_ROLE_ARN` | IAM Role ARN for OIDC authentication | `arn:aws:iam::123456789012:role/github-actions` |
| `AUTH_TOKEN` | API Bearer authentication token | `your-secret-token` |

### Variables (Per Environment)

Configure these for each environment (dev/prd):

#### Required Variables

| Name | Description | Dev Example | Prd Example |
|------|-------------|-------------|-------------|
| `API_URL` | API endpoint URL | `https://dev-api.example.com` | `https://api.example.com` |
| `S3_BUCKET_NAME` | Frontend S3 bucket | `myapp-dev-frontend` | `myapp-prd-frontend` |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID | `E1234567890ABC` | `E0987654321XYZ` |
| `ECR_REPOSITORY_NAME` | ECR repository name | `myapp-dev` | `myapp-prd` |
| `ECS_CLUSTER_NAME` | ECS cluster name | `myapp-dev-cluster` | `myapp-prd-cluster` |
| `ECS_SERVICE_NAME` | ECS API service name | `myapp-dev-api` | `myapp-prd-api` |
| `ECS_MIGRATION_TASK_DEFINITION` | Migration task definition | `myapp-dev-migration` | `myapp-prd-migration` |
| `PRIVATE_SUBNET_IDS` | Private subnet IDs (comma-separated) | `subnet-aaa,subnet-bbb` | `subnet-xxx,subnet-yyy` |
| `ECS_SECURITY_GROUP_ID` | ECS security group ID | `sg-dev123` | `sg-prd456` |

#### Optional Variables

| Name | Description | Default |
|------|-------------|---------|
| `TIMEZONE` | Application timezone | `Asia/Tokyo` |

### IAM Role for OIDC

Create an IAM role with trust policy for GitHub Actions OIDC:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:*"
        }
      }
    }
  ]
}
```

**Required permissions:**
- `ecr:GetAuthorizationToken`
- `ecr:BatchCheckLayerAvailability`
- `ecr:GetDownloadUrlForLayer`
- `ecr:BatchGetImage`
- `ecr:PutImage`
- `ecr:InitiateLayerUpload`
- `ecr:UploadLayerPart`
- `ecr:CompleteLayerUpload`
- `ecs:RunTask`
- `ecs:DescribeTasks`
- `ecs:UpdateService`
- `ecs:DescribeServices`
- `s3:PutObject`
- `s3:DeleteObject`
- `s3:ListBucket`
- `cloudfront:CreateInvalidation`
- `iam:PassRole` (for ECS task execution role)

## Docker Images

### API Image
- **Dockerfile**: `apps/api/.image/Dockerfile`
- **Tags**: `latest`, `<commit-sha>`
- **Purpose**: Run API server on ECS

### Migration Image
- **Dockerfile**: `apps/api/src/lib/db/.image/Dockerfile`
- **Tags**: `migration`, `migration-<commit-sha>`
- **Purpose**: Run Prisma migrations as one-shot ECS task

## Environment Variables (Build Time)

Frontend build uses these environment variables:

```yaml
env:
  VITE_API_URL: ${{ vars.API_URL }}
  VITE_AUTH_TOKEN: ${{ secrets.AUTH_TOKEN }}
  VITE_TIMEZONE: ${{ vars.TIMEZONE || 'Asia/Tokyo' }}
```

## Manual Deployment

To manually trigger a deployment:

1. Go to `Actions` → `CICD` workflow
2. Click `Run workflow`
3. Select branch (`main` or `develop`)
4. Choose environment (`dev` or `prd`)
5. Toggle frontend/backend deployment
6. Click `Run workflow`

## Troubleshooting

### CI Job Fails

```bash
# Check devcontainer build logs
# Common issues:
# - bun.lock out of sync: run `bun install` locally and commit
# - Database connection: check DATABASE_URL in devcontainer
```

### Migration Fails

```bash
# Check ECS task logs
aws logs tail /ecs/myapp-migration --follow

# Describe failed task
aws ecs describe-tasks \
  --cluster $CLUSTER \
  --tasks $TASK_ARN \
  --query 'tasks[0].stoppedReason'
```

### Frontend Deploy Fails

```bash
# Check S3 bucket permissions
aws s3 ls s3://$BUCKET_NAME/

# Check CloudFront distribution status
aws cloudfront get-distribution --id $DISTRIBUTION_ID
```

### Backend Deploy Fails

```bash
# Check ECS service events
aws ecs describe-services \
  --cluster $CLUSTER \
  --services $SERVICE \
  --query 'services[0].events[:5]'

# Check task logs
aws logs tail /ecs/myapp-api --follow
```

## Related Files

- [Root CLAUDE.md](/workspace/main/CLAUDE.md) - Project overview
- [API CLAUDE.md](/workspace/main/apps/api/CLAUDE.md) - API documentation
- [Web CLAUDE.md](/workspace/main/apps/web/CLAUDE.md) - Web documentation
- [IaC CLAUDE.md](/workspace/main/apps/iac/CLAUDE.md) - Infrastructure documentation
- [API Dockerfile](/workspace/main/apps/api/.image/Dockerfile) - API container
- [Migration Dockerfile](/workspace/main/apps/api/src/lib/db/.image/Dockerfile) - Migration container
