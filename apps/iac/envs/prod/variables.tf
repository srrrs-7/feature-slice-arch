#------------------------------------------------------------------------------
# Production Environment Variables
#------------------------------------------------------------------------------

#------------------------------------------------------------------------------
# General
#------------------------------------------------------------------------------
variable "project_name" {
  description = "Project name for resource naming"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "prod", "staging"], var.environment)
    error_message = "Environment must be one of: dev, prod, staging."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))
    error_message = "AWS region must be a valid region format (e.g., ap-northeast-1)."
  }
}

#------------------------------------------------------------------------------
# Network
#------------------------------------------------------------------------------
variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.1.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid CIDR block."
  }
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["ap-northeast-1a", "ap-northeast-1c"]

  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "At least 2 availability zones are required for high availability."
  }
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway (false for HA in prod)"
  type        = bool
  default     = false
}

#------------------------------------------------------------------------------
# ECR
#------------------------------------------------------------------------------
variable "ecr_image_retention_count" {
  description = "Number of images to retain in ECR"
  type        = number
  default     = 20

  validation {
    condition     = var.ecr_image_retention_count >= 1 && var.ecr_image_retention_count <= 1000
    error_message = "ECR image retention count must be between 1 and 1000."
  }
}

#------------------------------------------------------------------------------
# Database
#------------------------------------------------------------------------------
variable "db_name" {
  description = "Database name"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.db_name))
    error_message = "Database name must start with a letter and contain only alphanumeric characters and underscores."
  }
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.db_username))
    error_message = "Database username must start with a letter and contain only alphanumeric characters and underscores."
  }
}

variable "aurora_min_capacity" {
  description = "Aurora Serverless v2 minimum ACU"
  type        = number
  default     = 0.5

  validation {
    condition     = var.aurora_min_capacity >= 0.5 && var.aurora_min_capacity <= 128
    error_message = "Aurora min capacity must be between 0.5 and 128 ACU."
  }
}

variable "aurora_max_capacity" {
  description = "Aurora Serverless v2 maximum ACU"
  type        = number
  default     = 4.0

  validation {
    condition     = var.aurora_max_capacity >= 0.5 && var.aurora_max_capacity <= 128
    error_message = "Aurora max capacity must be between 0.5 and 128 ACU."
  }
}

variable "aurora_backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 35

  validation {
    condition     = var.aurora_backup_retention_period >= 1 && var.aurora_backup_retention_period <= 35
    error_message = "Aurora backup retention period must be between 1 and 35 days."
  }
}

variable "enable_performance_insights" {
  description = "Enable RDS Performance Insights"
  type        = bool
  default     = true
}

variable "enable_rds_monitoring" {
  description = "Enable Enhanced Monitoring for RDS"
  type        = bool
  default     = true
}

#------------------------------------------------------------------------------
# ECS
#------------------------------------------------------------------------------
variable "ecs_task_cpu" {
  description = "ECS task CPU units"
  type        = number
  default     = 512

  validation {
    condition     = contains([256, 512, 1024, 2048, 4096, 8192, 16384], var.ecs_task_cpu)
    error_message = "ECS task CPU must be one of: 256, 512, 1024, 2048, 4096, 8192, 16384."
  }
}

variable "ecs_task_memory" {
  description = "ECS task memory in MB"
  type        = number
  default     = 1024

  validation {
    condition     = var.ecs_task_memory >= 512 && var.ecs_task_memory <= 122880
    error_message = "ECS task memory must be between 512 and 122880 MB."
  }
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2

  validation {
    condition     = var.ecs_desired_count >= 0
    error_message = "ECS desired count must be 0 or greater."
  }
}

variable "ecs_min_count" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 2

  validation {
    condition     = var.ecs_min_count >= 0
    error_message = "ECS min count must be 0 or greater."
  }
}

variable "ecs_max_count" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 4

  validation {
    condition     = var.ecs_max_count >= 1
    error_message = "ECS max count must be 1 or greater."
  }
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 8080

  validation {
    condition     = var.container_port >= 1 && var.container_port <= 65535
    error_message = "Container port must be between 1 and 65535."
  }
}

#------------------------------------------------------------------------------
# CloudFront
#------------------------------------------------------------------------------
variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_200"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.cloudfront_price_class)
    error_message = "CloudFront price class must be one of: PriceClass_100, PriceClass_200, PriceClass_All."
  }
}

variable "cloudfront_default_ttl" {
  description = "Default TTL for CloudFront cache"
  type        = number
  default     = 86400

  validation {
    condition     = var.cloudfront_default_ttl >= 0 && var.cloudfront_default_ttl <= 31536000
    error_message = "CloudFront default TTL must be between 0 and 31536000 seconds (1 year)."
  }
}

variable "cloudfront_max_ttl" {
  description = "Maximum TTL for CloudFront cache"
  type        = number
  default     = 604800

  validation {
    condition     = var.cloudfront_max_ttl >= 0 && var.cloudfront_max_ttl <= 31536000
    error_message = "CloudFront max TTL must be between 0 and 31536000 seconds (1 year)."
  }
}

#------------------------------------------------------------------------------
# Monitoring
#------------------------------------------------------------------------------
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 90

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch retention period."
  }
}

variable "alarm_evaluation_periods" {
  description = "Number of periods to evaluate alarms"
  type        = number
  default     = 3

  validation {
    condition     = var.alarm_evaluation_periods >= 1 && var.alarm_evaluation_periods <= 100
    error_message = "Alarm evaluation periods must be between 1 and 100."
  }
}

variable "cpu_alarm_threshold" {
  description = "CPU utilization threshold for alarm"
  type        = number
  default     = 70

  validation {
    condition     = var.cpu_alarm_threshold >= 1 && var.cpu_alarm_threshold <= 100
    error_message = "CPU alarm threshold must be between 1 and 100 percent."
  }
}

variable "memory_alarm_threshold" {
  description = "Memory utilization threshold for alarm"
  type        = number
  default     = 70

  validation {
    condition     = var.memory_alarm_threshold >= 1 && var.memory_alarm_threshold <= 100
    error_message = "Memory alarm threshold must be between 1 and 100 percent."
  }
}

variable "error_alarm_threshold" {
  description = "5xx error count threshold for alarm"
  type        = number
  default     = 5

  validation {
    condition     = var.error_alarm_threshold >= 1
    error_message = "Error alarm threshold must be at least 1."
  }
}

variable "response_time_alarm_threshold" {
  description = "Response time threshold in seconds"
  type        = number
  default     = 2.0

  validation {
    condition     = var.response_time_alarm_threshold > 0
    error_message = "Response time alarm threshold must be greater than 0."
  }
}
