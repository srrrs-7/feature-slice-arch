# =============================================================================
# Secrets Manager Module
# =============================================================================
# Creates secrets for database credentials and API authentication.
# =============================================================================

# -----------------------------------------------------------------------------
# Random Password for Database
# -----------------------------------------------------------------------------
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Random API Bearer Token
resource "random_password" "api_token" {
  count   = var.api_bearer_token == "" ? 1 : 0
  length  = 64
  special = false
}

locals {
  api_bearer_token = var.api_bearer_token != "" ? var.api_bearer_token : random_password.api_token[0].result
}

# -----------------------------------------------------------------------------
# Database Credentials Secret
# -----------------------------------------------------------------------------
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.name_prefix}/db-credentials"
  description             = "Database credentials for Aurora PostgreSQL"
  recovery_window_in_days = var.recovery_window_in_days

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db-credentials"
  })
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}

# -----------------------------------------------------------------------------
# Database Password Secret (for RDS)
# -----------------------------------------------------------------------------
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${var.name_prefix}/db-password"
  description             = "Database master password for Aurora PostgreSQL"
  recovery_window_in_days = var.recovery_window_in_days

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db-password"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

# -----------------------------------------------------------------------------
# API Bearer Token Secret
# -----------------------------------------------------------------------------
resource "aws_secretsmanager_secret" "api_token" {
  name                    = "${var.name_prefix}/api-bearer-token"
  description             = "Bearer token for API authentication"
  recovery_window_in_days = var.recovery_window_in_days

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-bearer-token"
  })
}

resource "aws_secretsmanager_secret_version" "api_token" {
  secret_id = aws_secretsmanager_secret.api_token.id
  secret_string = jsonencode({
    token = local.api_bearer_token
  })
}

# -----------------------------------------------------------------------------
# Secret Rotation (optional - for database credentials)
# -----------------------------------------------------------------------------
# Note: Requires a rotation Lambda function
# resource "aws_secretsmanager_secret_rotation" "db_credentials" {
#   secret_id           = aws_secretsmanager_secret.db_credentials.id
#   rotation_lambda_arn = var.rotation_lambda_arn
#
#   rotation_rules {
#     automatically_after_days = 30
#   }
# }
