# =============================================================================
# Root Module Variables
# =============================================================================
# All variables are defined here and passed to child modules.
# Environment-specific values are set in envs/{env}/terraform.tfvars
# =============================================================================

# -----------------------------------------------------------------------------
# General
# -----------------------------------------------------------------------------
variable "project_name" {
  description = "Project name used for resource naming and tagging"
  type        = string
  default     = "todo-app"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ap-northeast-1"
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# Network
# -----------------------------------------------------------------------------
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["ap-northeast-1a", "ap-northeast-1c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (ECS)"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway (cost optimization for non-prod)"
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# ECS
# -----------------------------------------------------------------------------
variable "ecs_task_cpu" {
  description = "CPU units for ECS task (256 = 0.25 vCPU)"
  type        = number
  default     = 256

  validation {
    condition     = contains([256, 512, 1024, 2048, 4096], var.ecs_task_cpu)
    error_message = "CPU must be one of: 256, 512, 1024, 2048, 4096."
  }
}

variable "ecs_task_memory" {
  description = "Memory (MB) for ECS task"
  type        = number
  default     = 512

  validation {
    condition     = var.ecs_task_memory >= 512 && var.ecs_task_memory <= 30720
    error_message = "Memory must be between 512 and 30720 MB."
  }
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_min_capacity" {
  description = "Minimum number of ECS tasks for auto-scaling"
  type        = number
  default     = 1
}

variable "ecs_max_capacity" {
  description = "Maximum number of ECS tasks for auto-scaling"
  type        = number
  default     = 4
}

variable "api_container_port" {
  description = "Container port for API service"
  type        = number
  default     = 8080
}

variable "enable_ecs_exec" {
  description = "Enable ECS Exec for debugging"
  type        = bool
  default     = false
}

# -----------------------------------------------------------------------------
# RDS Aurora
# -----------------------------------------------------------------------------
variable "db_name" {
  description = "Database name"
  type        = string
  default     = "todo_db"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.db_name))
    error_message = "Database name must start with a letter and contain only alphanumeric characters and underscores."
  }
}

variable "db_master_username" {
  description = "Master username for Aurora"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "db_engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "16.4"
}

variable "db_min_capacity" {
  description = "Minimum ACU for Aurora Serverless v2"
  type        = number
  default     = 0.5

  validation {
    condition     = var.db_min_capacity >= 0.5 && var.db_min_capacity <= 128
    error_message = "Minimum capacity must be between 0.5 and 128 ACU."
  }
}

variable "db_max_capacity" {
  description = "Maximum ACU for Aurora Serverless v2"
  type        = number
  default     = 1.0

  validation {
    condition     = var.db_max_capacity >= 0.5 && var.db_max_capacity <= 128
    error_message = "Maximum capacity must be between 0.5 and 128 ACU."
  }
}

variable "db_backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "db_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "db_skip_final_snapshot" {
  description = "Skip final snapshot when destroying"
  type        = bool
  default     = false
}

# -----------------------------------------------------------------------------
# CloudFront & S3
# -----------------------------------------------------------------------------
variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_All"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.cloudfront_price_class)
    error_message = "Price class must be one of: PriceClass_100, PriceClass_200, PriceClass_All."
  }
}

variable "cloudfront_default_ttl" {
  description = "Default TTL for CloudFront cache (seconds)"
  type        = number
  default     = 86400
}

variable "cloudfront_max_ttl" {
  description = "Maximum TTL for CloudFront cache (seconds)"
  type        = number
  default     = 31536000
}

# -----------------------------------------------------------------------------
# Logging & Monitoring
# -----------------------------------------------------------------------------
variable "log_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 7

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention must be a valid CloudWatch Logs retention value."
  }
}

variable "enable_enhanced_monitoring" {
  description = "Enable enhanced monitoring for RDS"
  type        = bool
  default     = true
}

variable "enable_performance_insights" {
  description = "Enable Performance Insights for RDS"
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# Application
# -----------------------------------------------------------------------------
variable "api_bearer_token" {
  description = "Bearer token for API authentication (if not provided, will be auto-generated)"
  type        = string
  default     = ""
  sensitive   = true
}
