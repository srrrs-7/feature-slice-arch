# =============================================================================
# Root Module Outputs
# =============================================================================
# These outputs provide essential information for deployment and configuration.
# Sensitive values are marked appropriately.
# =============================================================================

# -----------------------------------------------------------------------------
# Network
# -----------------------------------------------------------------------------
output "vpc_id" {
  description = "VPC ID"
  value       = module.network.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs (ECS)"
  value       = module.network.private_subnet_ids
}

output "database_subnet_ids" {
  description = "Database subnet IDs"
  value       = module.network.database_subnet_ids
}

# -----------------------------------------------------------------------------
# ECR
# -----------------------------------------------------------------------------
output "ecr_repository_url" {
  description = "ECR repository URL for API container"
  value       = module.ecr.repository_url
}

output "ecr_repository_arn" {
  description = "ECR repository ARN"
  value       = module.ecr.repository_arn
}

# -----------------------------------------------------------------------------
# ECS
# -----------------------------------------------------------------------------
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = module.ecs.cluster_arn
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs.service_name
}

# -----------------------------------------------------------------------------
# ALB
# -----------------------------------------------------------------------------
output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone ID"
  value       = module.alb.alb_zone_id
}

output "alb_arn" {
  description = "ALB ARN"
  value       = module.alb.alb_arn
}

# -----------------------------------------------------------------------------
# RDS Aurora
# -----------------------------------------------------------------------------
output "rds_cluster_endpoint" {
  description = "Aurora cluster endpoint (writer)"
  value       = module.rds.cluster_endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = module.rds.cluster_reader_endpoint
}

output "rds_cluster_port" {
  description = "Aurora cluster port"
  value       = module.rds.cluster_port
}

output "rds_cluster_database_name" {
  description = "Aurora database name"
  value       = module.rds.database_name
}

# -----------------------------------------------------------------------------
# CloudFront & S3
# -----------------------------------------------------------------------------
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.distribution_id
}

output "cloudfront_distribution_domain" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.distribution_domain_name
}

output "cloudfront_distribution_url" {
  description = "CloudFront distribution URL (HTTPS)"
  value       = "https://${module.cloudfront.distribution_domain_name}"
}

output "s3_bucket_name" {
  description = "S3 bucket name for frontend"
  value       = module.cloudfront.s3_bucket_name
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = module.cloudfront.s3_bucket_arn
}

# -----------------------------------------------------------------------------
# Secrets Manager
# -----------------------------------------------------------------------------
output "db_credentials_secret_arn" {
  description = "ARN of database credentials secret"
  value       = module.secrets.db_credentials_secret_arn
  sensitive   = true
}

output "api_token_secret_arn" {
  description = "ARN of API bearer token secret"
  value       = module.secrets.api_token_secret_arn
  sensitive   = true
}

# -----------------------------------------------------------------------------
# CloudWatch
# -----------------------------------------------------------------------------
output "ecs_log_group_name" {
  description = "CloudWatch log group name for ECS"
  value       = module.cloudwatch.ecs_log_group_name
}

# -----------------------------------------------------------------------------
# Deployment Information
# -----------------------------------------------------------------------------
output "deployment_info" {
  description = "Information needed for deployment"
  value = {
    # URLs
    app_url = "https://${module.cloudfront.distribution_domain_name}"
    api_url = "https://${module.cloudfront.distribution_domain_name}/api"
    alb_url = "http://${module.alb.alb_dns_name}"

    # ECR
    ecr_repository = module.ecr.repository_url

    # ECS
    ecs_cluster = module.ecs.cluster_name
    ecs_service = module.ecs.service_name

    # S3
    frontend_bucket = module.cloudfront.s3_bucket_name

    # CloudFront
    distribution_id = module.cloudfront.distribution_id

    # Database
    db_host = module.rds.cluster_endpoint
    db_port = module.rds.cluster_port
    db_name = module.rds.database_name

    # Region
    region = var.aws_region
  }
}
