#------------------------------------------------------------------------------
# Base Infrastructure Module Variables
#------------------------------------------------------------------------------

#------------------------------------------------------------------------------
# General
#------------------------------------------------------------------------------
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, prod, staging)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "account_id" {
  description = "AWS account ID"
  type        = string
}

#------------------------------------------------------------------------------
# Network
#------------------------------------------------------------------------------
variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway for cost savings"
  type        = bool
  default     = true
}

#------------------------------------------------------------------------------
# ECR
#------------------------------------------------------------------------------
variable "ecr_image_retention_count" {
  description = "Number of images to retain in ECR"
  type        = number
  default     = 10
}

#------------------------------------------------------------------------------
# Database
#------------------------------------------------------------------------------
variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"
}

variable "aurora_min_capacity" {
  description = "Aurora Serverless v2 minimum ACU"
  type        = number
  default     = 0.5
}

variable "aurora_max_capacity" {
  description = "Aurora Serverless v2 maximum ACU"
  type        = number
  default     = 1.0
}

variable "aurora_backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "enable_performance_insights" {
  description = "Enable RDS Performance Insights"
  type        = bool
  default     = false
}

variable "enable_rds_monitoring" {
  description = "Enable Enhanced Monitoring for RDS"
  type        = bool
  default     = false
}

#------------------------------------------------------------------------------
# ECS
#------------------------------------------------------------------------------
variable "ecs_task_cpu" {
  description = "ECS task CPU units"
  type        = number
  default     = 256
}

variable "ecs_task_memory" {
  description = "ECS task memory in MB"
  type        = number
  default     = 512
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1
}

variable "ecs_min_count" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 1
}

variable "ecs_max_count" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 2
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 8080
}

#------------------------------------------------------------------------------
# CloudFront
#------------------------------------------------------------------------------
variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_200"
}

variable "cloudfront_default_ttl" {
  description = "Default TTL for CloudFront cache"
  type        = number
  default     = 86400
}

variable "cloudfront_max_ttl" {
  description = "Maximum TTL for CloudFront cache"
  type        = number
  default     = 604800
}

#------------------------------------------------------------------------------
# Monitoring
#------------------------------------------------------------------------------
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

variable "alarm_evaluation_periods" {
  description = "Number of periods to evaluate alarms"
  type        = number
  default     = 2
}

variable "cpu_alarm_threshold" {
  description = "CPU utilization threshold for alarm"
  type        = number
  default     = 80
}

variable "memory_alarm_threshold" {
  description = "Memory utilization threshold for alarm"
  type        = number
  default     = 80
}

variable "error_alarm_threshold" {
  description = "5xx error count threshold for alarm"
  type        = number
  default     = 10
}

variable "response_time_alarm_threshold" {
  description = "Response time threshold in seconds"
  type        = number
  default     = 3.0
}

#------------------------------------------------------------------------------
# Cognito
#------------------------------------------------------------------------------
variable "cognito_domain_prefix" {
  description = "Cognito Hosted UI domain prefix (must be globally unique)"
  type        = string
}

variable "cognito_additional_callback_urls" {
  description = "Additional callback URLs (besides CloudFront)"
  type        = list(string)
  default     = ["http://localhost:5173/auth/callback"]
}

variable "cognito_additional_logout_urls" {
  description = "Additional logout URLs (besides CloudFront)"
  type        = list(string)
  default     = ["http://localhost:5173/login"]
}

variable "cognito_mfa_configuration" {
  description = "MFA configuration: OFF, ON, OPTIONAL"
  type        = string
  default     = "OFF"
}

variable "cognito_access_token_validity" {
  description = "Access token validity in minutes"
  type        = number
  default     = 60
}

variable "cognito_id_token_validity" {
  description = "ID token validity in minutes"
  type        = number
  default     = 60
}

variable "cognito_refresh_token_validity" {
  description = "Refresh token validity in days"
  type        = number
  default     = 30
}

variable "cognito_allow_admin_create_user_only" {
  description = "Only allow administrators to create users"
  type        = bool
  default     = false
}

variable "cognito_deletion_protection" {
  description = "Enable deletion protection for the user pool"
  type        = bool
  default     = false
}

variable "cognito_create_user_groups" {
  description = "Create default user groups (admin, member, viewer)"
  type        = bool
  default     = true
}
