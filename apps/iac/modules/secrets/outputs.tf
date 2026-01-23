# =============================================================================
# Secrets Manager Module Outputs
# =============================================================================

output "db_credentials_secret_arn" {
  description = "ARN of database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "db_credentials_secret_name" {
  description = "Name of database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.name
}

output "db_password_secret_arn" {
  description = "ARN of database password secret"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "api_token_secret_arn" {
  description = "ARN of API bearer token secret"
  value       = aws_secretsmanager_secret.api_token.arn
}

output "api_token_secret_name" {
  description = "Name of API bearer token secret"
  value       = aws_secretsmanager_secret.api_token.name
}

output "secret_arns" {
  description = "List of all secret ARNs"
  value = [
    aws_secretsmanager_secret.db_credentials.arn,
    aws_secretsmanager_secret.db_password.arn,
    aws_secretsmanager_secret.api_token.arn
  ]
}
