# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Terraform-based AWS infrastructure for the WorkFlow application. Uses a modular architecture with a shared `base-infrastructure` module and separate environments (dev/prod).

| Technology | Purpose |
|------------|---------|
| Terraform | Infrastructure as Code |
| AWS CloudFront | CDN + HTTPS |
| AWS ECS Fargate | Container orchestration |
| AWS Aurora Serverless v2 | PostgreSQL database |
| AWS S3 | Static web hosting |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────────────┐
              │    CloudFront CDN    │
              └──────┬──────┬────────┘
                     │      │
        ┌────────────┘      └────────────┐
        │ (path: /)                      │ (path: /api/*)
   ┌─────────┐                   ┌──────────────────┐
   │   S3    │                   │       ALB        │
   │ (Web)   │                   └────────┬─────────┘
   └─────────┘                            │
                              ┌───────────┴───────────┐
                              │   ECS Fargate (API)   │
                              └───────────┬───────────┘
                                          │
                              ┌───────────┴───────────┐
                              │  Aurora Serverless v2 │
                              └───────────────────────┘
```

## Directory Structure

```
apps/iac/
├── envs/                      # Environment configurations
│   ├── dev/                   # Development (main.tf, variables.tf, outputs.tf, backend.tf)
│   └── prod/                  # Production (same structure)
├── modules/
│   ├── base-infrastructure/   # Shared orchestration module (DRY)
│   ├── network/               # VPC, Subnets, NAT, Security Groups
│   ├── alb/                   # Application Load Balancer
│   ├── ecs/                   # ECS Cluster, Service, Task Definition
│   ├── rds/                   # Aurora Serverless v2
│   ├── cloudfront/            # CloudFront + S3
│   ├── ecr/                   # Container Registry
│   ├── secrets/               # Secrets Manager
│   ├── iam/                   # IAM Roles
│   └── cloudwatch/            # Alarms
├── scripts/                   # Deployment scripts
│   ├── deploy.sh              # Terraform wrapper
│   ├── deploy-api.sh          # ECS deployment
│   ├── deploy-frontend.sh     # S3/CloudFront deployment
│   └── setup-backend.sh       # S3/DynamoDB state backend setup
└── Makefile                   # Convenience commands
```

## AWS Login & Prerequisites

### 1. AWS CLI Setup

```bash
# Install AWS CLI (if not installed)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Verify installation
aws --version
```

### 2. AWS Authentication

**Option A: AWS SSO (Recommended for organizations)**
```bash
# Configure SSO profile
aws configure sso
# Follow prompts to set up SSO

# Login to SSO
aws sso login --profile <profile-name>

# Verify credentials
aws sts get-caller-identity --profile <profile-name>

# Set default profile (optional)
export AWS_PROFILE=<profile-name>
```

**Option B: IAM Access Keys (For personal accounts)**
```bash
# Configure with access keys
aws configure
# Enter:
#   AWS Access Key ID: <your-access-key>
#   AWS Secret Access Key: <your-secret-key>
#   Default region: ap-northeast-1
#   Default output format: json

# Verify credentials
aws sts get-caller-identity
```

### 3. Required IAM Permissions

The AWS user/role needs these permissions:
- `ec2:*` - VPC, Subnets, Security Groups
- `ecs:*` - ECS Cluster, Service, Task
- `elasticloadbalancing:*` - ALB
- `rds:*` - Aurora
- `s3:*` - Frontend bucket, Terraform state
- `cloudfront:*` - CDN
- `ecr:*` - Container registry
- `secretsmanager:*` - Secrets
- `iam:*` - Roles and policies
- `logs:*` - CloudWatch Logs
- `cloudwatch:*` - Alarms
- `cognito-idp:*` - Cognito User Pool
- `dynamodb:*` - Terraform state locking (if using remote backend)

Or attach `AdministratorAccess` policy for development.

### 4. Environment Verification

```bash
# Check AWS CLI is authenticated
aws sts get-caller-identity

# Expected output:
# {
#     "UserId": "AIDAXXXXXXXXXXXXXXXXX",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/your-username"
# }

# Verify region
aws configure get region
# Expected: ap-northeast-1
```

## Commands

```bash
# Makefile (recommended)
make plan ENV=dev              # Terraform plan
make apply ENV=dev             # Terraform apply
make destroy ENV=dev           # Terraform destroy
make deploy-api ENV=dev        # Deploy API container
make deploy-frontend ENV=dev   # Deploy frontend to S3
make validate ENV=dev          # Validate configuration
make fmt                       # Format all .tf files

# Direct Terraform (from envs/dev or envs/prod)
terraform init -backend=false  # Local state (development)
terraform init                 # With S3 backend (after setup)
terraform validate
terraform plan -out=tfplan
terraform apply tfplan
```

## Module Dependencies

```
network ──┬──> alb ──────────┬──> ecs
          │                  │
secrets ──┼──> iam ──────────┤
          │                  │
ecr ──────┴──> rds ──────────┘
                             │
cloudfront <─────────────────┤
                             │
cloudwatch <─────────────────┘
```

All modules are orchestrated by `modules/base-infrastructure/`, which is called from each environment's `main.tf`.

## Key Configuration

### Development vs Production

| Resource | Dev | Prod |
|----------|-----|------|
| VPC CIDR | 10.0.0.0/16 | 10.1.0.0/16 |
| NAT Gateway | Single | Multi-AZ |
| Aurora ACU | 0.5-1.0 | 0.5-4.0 |
| ECS CPU/Memory | 256/512 | 512/1024 |
| ECS Tasks | 1-2 | 2-4 |
| Log Retention | 14 days | 90 days |

### Validation Blocks

Variables include validation blocks for:
- `aurora_min_capacity`: 0.5-128 ACU
- `ecs_task_cpu`: Valid Fargate values (256, 512, 1024, etc.)
- `cloudfront_price_class`: PriceClass_100, PriceClass_200, PriceClass_All
- `log_retention_days`: Valid CloudWatch retention periods

## Backend Configuration

`backend.tf` configures remote state storage (S3 + DynamoDB for locking). Currently commented out for local development.

To enable:
1. Run `make setup-backend ENV=dev`
2. Uncomment the backend block in `envs/dev/backend.tf`
3. Run `terraform init -migrate-state`

## Infrastructure Deployment Steps

### First-time Setup

```bash
# 1. Login to AWS
aws sso login --profile <profile-name>
# or
aws configure  # for IAM access keys

# 2. Verify authentication
aws sts get-caller-identity

# 3. Navigate to environment directory
cd apps/iac/envs/dev  # or prod

# 4. Initialize Terraform
terraform init -backend=false  # Local state for first setup

# 5. Validate configuration
terraform validate

# 6. Plan infrastructure
terraform plan -out=tfplan

# 7. Apply infrastructure
terraform apply tfplan

# 8. Note the outputs (CloudFront URL, ECR URL, etc.)
terraform output
```

### Subsequent Deployments

```bash
# 1. Login to AWS (if session expired)
aws sso login --profile <profile-name>

# 2. Navigate and plan
cd apps/iac/envs/dev
terraform plan -out=tfplan

# 3. Review and apply
terraform apply tfplan
```

### Destroy Infrastructure

```bash
# WARNING: This deletes all resources
terraform destroy
```

## Security Groups Flow

```
Internet → ALB (443/80 from CloudFront Prefix List)
             ↓
         ECS (8080 from ALB SG)
             ↓
         RDS (5432 from ECS SG)
```

## Outputs

After `terraform apply`:
- `cloudfront_url`: Main application URL
- `api_url`: API endpoint via CloudFront
- `ecr_repository_url`: Docker push target
- `s3_frontend_bucket`: Frontend deployment bucket
- `ecs_cluster_name`, `ecs_service_name`: For ECS updates
- `deployment_commands`: Ready-to-use CLI commands
- `api_env_config`: Environment variables for API `.env` file
- `web_env_config`: Environment variables for Web `.env` file
- `db_password_retrieval_command`: Command to get DB password from Secrets Manager

## Generating .env Files

After `terraform apply`, generate `.env` files for API and Web:

```bash
# Navigate to environment directory
cd apps/iac/envs/dev  # or prod

# Generate API .env
terraform output -raw api_env_config > ../../../api/.env

# Generate Web .env
terraform output -raw web_env_config > ../../../web/.env

# Retrieve and update database password
DB_PASSWORD=$(eval "$(terraform output -raw db_password_retrieval_command)")
sed -i "s/<DB_PASSWORD>/$DB_PASSWORD/" ../../../api/.env

# Verify .env files
cat ../../../api/.env
cat ../../../web/.env
```

### Generated .env Contents

**API (.env)**
```bash
PORT=8080
NODE_ENV=production
DATABASE_URL=postgresql://postgres:<password>@<aurora-endpoint>:5432/todoapp
COGNITO_ISSUER=https://cognito-idp.ap-northeast-1.amazonaws.com/<pool-id>
COGNITO_CLIENT_ID=<client-id>
COGNITO_JWKS_URI=https://cognito-idp.ap-northeast-1.amazonaws.com/<pool-id>/.well-known/jwks.json
CORS_ALLOWED_ORIGINS=https://<cloudfront-domain>
```

**Web (.env)**
```bash
VITE_API_URL=https://<cloudfront-domain>
VITE_COGNITO_USER_POOL_ID=<pool-id>
VITE_COGNITO_CLIENT_ID=<client-id>
VITE_COGNITO_DOMAIN=<domain>.auth.ap-northeast-1.amazoncognito.com
VITE_COGNITO_REDIRECT_URI=https://<cloudfront-domain>/auth/callback
VITE_COGNITO_LOGOUT_URI=https://<cloudfront-domain>/login
VITE_COGNITO_SCOPE=openid email profile
```

## Adding New Resources

1. Create module in `modules/new-module/` (main.tf, variables.tf, outputs.tf)
2. Add to `modules/base-infrastructure/main.tf`
3. Expose outputs in `modules/base-infrastructure/outputs.tf`
4. Add variables to `modules/base-infrastructure/variables.tf`
5. Add environment variables to `envs/{dev,prod}/variables.tf`

## Troubleshooting

```bash
# ECS Task logs
aws logs tail /ecs/<name-prefix>-api --follow

# Describe failing task
aws ecs describe-tasks --cluster <cluster> --tasks <task-arn>

# Get secret value
aws secretsmanager get-secret-value --secret-id <secret-arn>

# Force unlock state (use with caution)
terraform force-unlock <lock-id>
```

## Related Files

- [README.md](./README.md): Detailed architecture diagrams and AWS resource specifications
- [/workspace/main/CLAUDE.md](/workspace/main/CLAUDE.md): Root project documentation
