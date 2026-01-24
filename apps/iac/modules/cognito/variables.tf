# =============================================================================
# Cognito Module Variables
# =============================================================================

# -----------------------------------------------------------------------------
# General
# -----------------------------------------------------------------------------
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "cognito_domain_prefix" {
  description = "Cognito Hosted UI domain prefix (must be globally unique)"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$", var.cognito_domain_prefix))
    error_message = "Domain prefix must be lowercase alphanumeric with hyphens, 3-63 characters."
  }
}

# -----------------------------------------------------------------------------
# OAuth2 URLs
# -----------------------------------------------------------------------------
variable "callback_urls" {
  description = "List of allowed callback URLs for OAuth"
  type        = list(string)
  default     = ["http://localhost:3000/auth/callback"]

  validation {
    condition     = length(var.callback_urls) > 0
    error_message = "At least one callback URL must be specified."
  }
}

variable "logout_urls" {
  description = "List of allowed logout URLs"
  type        = list(string)
  default     = ["http://localhost:3000/login"]

  validation {
    condition     = length(var.logout_urls) > 0
    error_message = "At least one logout URL must be specified."
  }
}

# -----------------------------------------------------------------------------
# MFA Configuration
# -----------------------------------------------------------------------------
variable "mfa_configuration" {
  description = "MFA configuration: OFF, ON, OPTIONAL"
  type        = string
  default     = "OFF"

  validation {
    condition     = contains(["OFF", "ON", "OPTIONAL"], var.mfa_configuration)
    error_message = "mfa_configuration must be OFF, ON, or OPTIONAL."
  }
}

# -----------------------------------------------------------------------------
# Token Validity
# -----------------------------------------------------------------------------
variable "access_token_validity" {
  description = "Access token validity in minutes"
  type        = number
  default     = 60

  validation {
    condition     = var.access_token_validity >= 5 && var.access_token_validity <= 1440
    error_message = "Access token validity must be between 5 and 1440 minutes."
  }
}

variable "id_token_validity" {
  description = "ID token validity in minutes"
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

  validation {
    condition     = var.refresh_token_validity >= 1 && var.refresh_token_validity <= 3650
    error_message = "Refresh token validity must be between 1 and 3650 days."
  }
}

# -----------------------------------------------------------------------------
# Security
# -----------------------------------------------------------------------------
variable "allow_admin_create_user_only" {
  description = "Only allow administrators to create users"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Enable deletion protection for the user pool"
  type        = bool
  default     = false
}

# -----------------------------------------------------------------------------
# User Groups
# -----------------------------------------------------------------------------
variable "create_user_groups" {
  description = "Create default user groups (admin, member, viewer)"
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# Tags
# -----------------------------------------------------------------------------
variable "tags" {
  description = "Tags for resources"
  type        = map(string)
  default     = {}
}
