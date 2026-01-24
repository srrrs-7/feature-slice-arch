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
