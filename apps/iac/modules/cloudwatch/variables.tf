# =============================================================================
# CloudWatch Module Variables
# =============================================================================

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 7
}

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "ecs_service_name" {
  description = "ECS service name"
  type        = string
}

variable "alb_arn_suffix" {
  description = "ALB ARN suffix"
  type        = string
}

variable "target_group_arn_suffix" {
  description = "Target group ARN suffix"
  type        = string
}

variable "alarm_evaluation_periods" {
  description = "Number of evaluation periods for alarms"
  type        = number
  default     = 2
}

variable "cpu_threshold" {
  description = "CPU utilization threshold for alarm"
  type        = number
  default     = 80
}

variable "memory_threshold" {
  description = "Memory utilization threshold for alarm"
  type        = number
  default     = 80
}

variable "error_threshold" {
  description = "5xx error count threshold for alarm"
  type        = number
  default     = 10
}

variable "response_time_threshold" {
  description = "Response time threshold in seconds"
  type        = number
  default     = 3.0
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
