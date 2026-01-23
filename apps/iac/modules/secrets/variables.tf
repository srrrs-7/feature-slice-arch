# =============================================================================
# Secrets Manager Module Variables
# =============================================================================

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "api_bearer_token" {
  description = "API bearer token (if empty, will be auto-generated)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "recovery_window_in_days" {
  description = "Recovery window for deleted secrets"
  type        = number
  default     = 7
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
