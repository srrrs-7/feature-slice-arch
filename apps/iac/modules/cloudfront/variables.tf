# =============================================================================
# CloudFront Module Variables
# =============================================================================

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "alb_dns_name" {
  description = "ALB DNS name for API origin"
  type        = string
}

variable "alb_origin_id" {
  description = "Origin ID for ALB"
  type        = string
  default     = "alb-api"
}

variable "s3_origin_id" {
  description = "Origin ID for S3"
  type        = string
  default     = "s3-frontend"
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_All"
}

variable "default_ttl" {
  description = "Default TTL for cache (seconds)"
  type        = number
  default     = 86400
}

variable "max_ttl" {
  description = "Maximum TTL for cache (seconds)"
  type        = number
  default     = 31536000
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
