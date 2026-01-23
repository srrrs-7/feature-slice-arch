# =============================================================================
# ECS Module Variables
# =============================================================================

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for ECS tasks"
  type        = list(string)
}

variable "security_groups" {
  description = "Security group IDs"
  type        = list(string)
}

variable "task_cpu" {
  description = "CPU units for task"
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Memory (MB) for task"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 2
}

variable "min_capacity" {
  description = "Minimum number of tasks"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of tasks"
  type        = number
  default     = 4
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 8080
}

variable "enable_ecs_exec" {
  description = "Enable ECS Exec"
  type        = bool
  default     = false
}

variable "ecr_repository_url" {
  description = "ECR repository URL"
  type        = string
}

variable "execution_role_arn" {
  description = "ECS task execution role ARN"
  type        = string
}

variable "task_role_arn" {
  description = "ECS task role ARN"
  type        = string
}

variable "target_group_arn" {
  description = "ALB target group ARN"
  type        = string
}

variable "log_group_name" {
  description = "CloudWatch log group name"
  type        = string
}

variable "db_secret_arn" {
  description = "Database credentials secret ARN"
  type        = string
}

variable "api_token_secret_arn" {
  description = "API token secret ARN"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
