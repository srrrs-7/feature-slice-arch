#------------------------------------------------------------------------------
# Base Infrastructure Module Outputs
#------------------------------------------------------------------------------

#------------------------------------------------------------------------------
# URLs
#------------------------------------------------------------------------------
output "cloudfront_distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.distribution_domain_name
}

output "alb_dns_name" {
  description = "ALB DNS name (direct API access, internal use only)"
  value       = module.alb.alb_dns_name
}

#------------------------------------------------------------------------------
# Resource ARNs / IDs
#------------------------------------------------------------------------------
output "ecr_repository_url" {
  description = "ECR repository URL for docker push"
  value       = module.ecr.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs.service_name
}

output "rds_cluster_endpoint" {
  description = "RDS cluster endpoint"
  value       = module.rds.cluster_endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket for frontend deployment"
  value       = module.cloudfront.s3_bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.distribution_id
}

#------------------------------------------------------------------------------
# Secrets ARNs (for CI/CD)
#------------------------------------------------------------------------------
output "db_password_secret_arn" {
  description = "ARN of database credentials secret"
  value       = module.secrets.db_password_secret_arn
  sensitive   = true
}

output "api_token_secret_arn" {
  description = "ARN of API token secret"
  value       = module.secrets.api_token_secret_arn
  sensitive   = true
}

#------------------------------------------------------------------------------
# Network Information
#------------------------------------------------------------------------------
output "vpc_id" {
  description = "VPC ID"
  value       = module.network.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.network.private_subnet_ids
}

#------------------------------------------------------------------------------
# Monitoring
#------------------------------------------------------------------------------
output "ecs_cpu_alarm_arn" {
  description = "ECS CPU alarm ARN"
  value       = module.cloudwatch.ecs_cpu_alarm_arn
}

output "ecs_memory_alarm_arn" {
  description = "ECS memory alarm ARN"
  value       = module.cloudwatch.ecs_memory_alarm_arn
}

output "alb_5xx_alarm_arn" {
  description = "ALB 5xx errors alarm ARN"
  value       = module.cloudwatch.alb_5xx_alarm_arn
}
