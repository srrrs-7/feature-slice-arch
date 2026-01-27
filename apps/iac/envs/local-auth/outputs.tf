# =============================================================================
# Outputs - Local Auth Environment
# =============================================================================

# =============================================================================
# Cognito Outputs
# =============================================================================

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = module.cognito.client_id
}

output "cognito_domain" {
  description = "Cognito domain for Hosted UI"
  value       = module.cognito.domain
}

output "cognito_issuer" {
  description = "Cognito token issuer URL (for JWT verification)"
  value       = module.cognito.issuer
}

output "cognito_jwks_uri" {
  description = "Cognito JWKS URI (for JWT verification)"
  value       = module.cognito.jwks_uri
}

output "cognito_hosted_ui_url" {
  description = "Cognito Hosted UI login URL"
  value       = module.cognito.hosted_ui_url
}

# =============================================================================
# Frontend Configuration
# =============================================================================

output "frontend_env_vars" {
  description = "Environment variables for frontend (.env)"
  value       = <<-EOT
# Cognito Configuration for local development
# Add these to apps/web/.env

VITE_COGNITO_USER_POOL_ID=${module.cognito.user_pool_id}
VITE_COGNITO_CLIENT_ID=${module.cognito.client_id}
VITE_COGNITO_DOMAIN=${module.cognito.domain}
VITE_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_COGNITO_LOGOUT_URI=http://localhost:3000/login
VITE_COGNITO_SCOPE=openid email profile
EOT
}

# =============================================================================
# Backend Configuration
# =============================================================================

output "backend_env_vars" {
  description = "Environment variables for backend (.env)"
  value       = <<-EOT
# Cognito Configuration for API JWT verification
# Add these to apps/api/.env

COGNITO_USER_POOL_ID=${module.cognito.user_pool_id}
COGNITO_CLIENT_ID=${module.cognito.client_id}
COGNITO_ISSUER=${module.cognito.issuer}
COGNITO_JWKS_URI=${module.cognito.jwks_uri}
EOT
}
