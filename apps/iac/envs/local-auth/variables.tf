# =============================================================================
# Variables - Local Auth Environment
# =============================================================================

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "workflow"
}

# =============================================================================
# Cognito Configuration
# =============================================================================

variable "cognito_domain_prefix" {
  description = "Cognito Hosted UI domain prefix (must be globally unique)"
  type        = string
}

variable "callback_urls" {
  description = "Allowed callback URLs for OAuth2 flow"
  type        = list(string)
  default = [
    "http://localhost:3000/auth/callback",
  ]
}

variable "logout_urls" {
  description = "Allowed logout URLs"
  type        = list(string)
  default = [
    "http://localhost:3000/login",
  ]
}

variable "access_token_validity" {
  description = "Access token validity in minutes (5-1440)"
  type        = number
  default     = 60

  validation {
    condition     = var.access_token_validity >= 5 && var.access_token_validity <= 1440
    error_message = "Access token validity must be between 5 and 1440 minutes."
  }
}

variable "id_token_validity" {
  description = "ID token validity in minutes (5-1440)"
  type        = number
  default     = 60

  validation {
    condition     = var.id_token_validity >= 5 && var.id_token_validity <= 1440
    error_message = "ID token validity must be between 5 and 1440 minutes."
  }
}

variable "refresh_token_validity" {
  description = "Refresh token validity in days"
  type        = number
  default     = 30
}

variable "mfa_configuration" {
  description = "MFA configuration (OFF, ON, OPTIONAL)"
  type        = string
  default     = "OFF"

  validation {
    condition     = contains(["OFF", "ON", "OPTIONAL"], var.mfa_configuration)
    error_message = "MFA configuration must be OFF, ON, or OPTIONAL."
  }
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
