# =============================================================================
# IAM Module Variables
# =============================================================================

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "ecr_repository_arn" {
  description = "ECR repository ARN"
  type        = string
}

variable "secrets_arns" {
  description = "List of Secrets Manager ARNs"
  type        = list(string)
}

variable "cloudwatch_log_group_arn" {
  description = "CloudWatch log group ARN for ECS logs"
  type        = string
}

variable "enable_ecs_exec" {
  description = "Enable ECS Exec for debugging"
  type        = bool
  default     = false
}

variable "s3_uploads_bucket_arn" {
  description = "S3 uploads bucket ARN for presigned URL access"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
