# =============================================================================
# Cognito Module
# =============================================================================
# Creates Cognito User Pool and App Client for PKCE authentication.
# =============================================================================

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------
data "aws_region" "current" {}

# -----------------------------------------------------------------------------
# Cognito User Pool
# -----------------------------------------------------------------------------
resource "aws_cognito_user_pool" "main" {
  name = "${var.name_prefix}-user-pool"

  # Username settings
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Username configuration
  username_configuration {
    case_sensitive = false
  }

  # Password policy
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  # MFA configuration
  mfa_configuration = var.mfa_configuration

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Verification message
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "[${var.name_prefix}] Verification Code"
    email_message        = "Your verification code is {####}"
  }

  # Schema attributes
  schema {
    name                     = "email"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                     = "name"
    attribute_data_type      = "String"
    required                 = false
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Admin create user config
  admin_create_user_config {
    allow_admin_create_user_only = var.allow_admin_create_user_only

    invite_message_template {
      email_subject = "[${var.name_prefix}] Your temporary password"
      email_message = "Your username is {username} and temporary password is {####}."
      sms_message   = "Your username is {username} and temporary password is {####}."
    }
  }

  # User attribute update settings
  user_attribute_update_settings {
    attributes_require_verification_before_update = ["email"]
  }

  # Deletion protection (prod only)
  deletion_protection = var.deletion_protection ? "ACTIVE" : "INACTIVE"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-user-pool"
  })
}

# -----------------------------------------------------------------------------
# Cognito User Pool Client (SPA - PKCE)
# -----------------------------------------------------------------------------
resource "aws_cognito_user_pool_client" "spa" {
  name         = "${var.name_prefix}-spa-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # PKCE configuration (no client secret)
  generate_secret = false

  # OAuth2 settings
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  # Callback URLs
  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  # Supported identity providers
  supported_identity_providers = ["COGNITO"]

  # Token validity
  access_token_validity  = var.access_token_validity
  id_token_validity      = var.id_token_validity
  refresh_token_validity = var.refresh_token_validity

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  # Explicit auth flows
  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  # Token revocation
  enable_token_revocation = true

  # Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"

  # Read/Write attributes
  read_attributes  = ["email", "email_verified", "name", "picture"]
  write_attributes = ["email", "name", "picture"]
}

# -----------------------------------------------------------------------------
# Cognito User Pool Domain (Hosted UI)
# -----------------------------------------------------------------------------
resource "aws_cognito_user_pool_domain" "main" {
  domain       = var.cognito_domain_prefix
  user_pool_id = aws_cognito_user_pool.main.id
}

# -----------------------------------------------------------------------------
# Optional: User Pool Groups
# -----------------------------------------------------------------------------
resource "aws_cognito_user_group" "admin" {
  count        = var.create_user_groups ? 1 : 0
  name         = "admin"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Administrator group with full access"
  precedence   = 1
}

resource "aws_cognito_user_group" "member" {
  count        = var.create_user_groups ? 1 : 0
  name         = "member"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Member group with standard access"
  precedence   = 10
}

resource "aws_cognito_user_group" "viewer" {
  count        = var.create_user_groups ? 1 : 0
  name         = "viewer"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Viewer group with read-only access"
  precedence   = 20
}
