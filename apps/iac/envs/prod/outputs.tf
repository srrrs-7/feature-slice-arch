#------------------------------------------------------------------------------
# Production Environment Outputs
#------------------------------------------------------------------------------

#------------------------------------------------------------------------------
# URLs
#------------------------------------------------------------------------------
output "cloudfront_url" {
  description = "CloudFront distribution URL (main entry point)"
  value       = "https://${module.infrastructure.cloudfront_distribution_domain_name}"
}

output "api_url" {
  description = "API URL via CloudFront"
  value       = "https://${module.infrastructure.cloudfront_distribution_domain_name}/api"
}

output "alb_url" {
  description = "ALB URL (direct API access, internal use only)"
  value       = "http://${module.infrastructure.alb_dns_name}"
}

#------------------------------------------------------------------------------
# Resource ARNs
#------------------------------------------------------------------------------
output "ecr_repository_url" {
  description = "ECR repository URL for docker push"
  value       = module.infrastructure.ecr_repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.infrastructure.ecs_cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.infrastructure.ecs_service_name
}

output "rds_cluster_endpoint" {
  description = "RDS cluster endpoint"
  value       = module.infrastructure.rds_cluster_endpoint
  sensitive   = true
}

output "s3_frontend_bucket" {
  description = "S3 bucket for frontend deployment"
  value       = module.infrastructure.s3_bucket_name
}

#------------------------------------------------------------------------------
# Secrets ARNs (for CI/CD)
#------------------------------------------------------------------------------
output "db_secret_arn" {
  description = "ARN of database credentials secret"
  value       = module.infrastructure.db_password_secret_arn
  sensitive   = true
}

output "api_token_secret_arn" {
  description = "ARN of API token secret"
  value       = module.infrastructure.api_token_secret_arn
  sensitive   = true
}

#------------------------------------------------------------------------------
# Network Information
#------------------------------------------------------------------------------
output "vpc_id" {
  description = "VPC ID"
  value       = module.infrastructure.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.infrastructure.private_subnet_ids
}

#------------------------------------------------------------------------------
# Deployment Commands
#------------------------------------------------------------------------------
output "deployment_commands" {
  description = "Useful deployment commands"
  value       = <<-EOT
    # Login to ECR
    aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${module.infrastructure.ecr_repository_url}

    # Build and push API image
    docker build -t ${module.infrastructure.ecr_repository_url}:latest ./apps/api
    docker push ${module.infrastructure.ecr_repository_url}:latest

    # Force ECS deployment
    aws ecs update-service --cluster ${module.infrastructure.ecs_cluster_name} --service ${module.infrastructure.ecs_service_name} --force-new-deployment

    # Deploy frontend to S3
    aws s3 sync ./apps/web/dist s3://${module.infrastructure.s3_bucket_name} --delete

    # Invalidate CloudFront cache
    aws cloudfront create-invalidation --distribution-id ${module.infrastructure.cloudfront_distribution_id} --paths "/*"
  EOT
}
