# =============================================================================
# Local Auth Environment - Cognito Only
# =============================================================================
# This is a minimal environment for local development that only provisions
# AWS Cognito for authentication testing. No other infrastructure is created.
# =============================================================================

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# =============================================================================
# Provider Configuration
# =============================================================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "local-auth"
      Project     = var.project_name
      ManagedBy   = "terraform"
    }
  }
}

# =============================================================================
# Cognito Module
# =============================================================================

module "cognito" {
  source = "../../modules/cognito"

  name_prefix           = "${var.project_name}-local"
  cognito_domain_prefix = var.cognito_domain_prefix

  # Local development callback URLs
  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  # Token validity
  access_token_validity  = var.access_token_validity
  id_token_validity      = var.id_token_validity
  refresh_token_validity = var.refresh_token_validity

  # Optional MFA
  mfa_configuration = var.mfa_configuration

  # Tags
  tags = var.tags
}
