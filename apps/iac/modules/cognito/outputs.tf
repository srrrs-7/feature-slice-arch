# =============================================================================
# Cognito Module Outputs
# =============================================================================

# -----------------------------------------------------------------------------
# User Pool
# -----------------------------------------------------------------------------
output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.main.arn
}

output "user_pool_endpoint" {
  description = "Cognito User Pool endpoint"
  value       = aws_cognito_user_pool.main.endpoint
}

# -----------------------------------------------------------------------------
# App Client
# -----------------------------------------------------------------------------
output "client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.spa.id
}

# -----------------------------------------------------------------------------
# Domain
# -----------------------------------------------------------------------------
output "domain" {
  description = "Cognito Hosted UI domain"
  value       = "${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
}

output "hosted_ui_url" {
  description = "Cognito Hosted UI base URL"
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
}

# -----------------------------------------------------------------------------
# JWT Verification
# -----------------------------------------------------------------------------
output "issuer" {
  description = "Cognito Issuer URL (for JWT validation)"
  value       = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

output "jwks_uri" {
  description = "JWKS URI for JWT verification"
  value       = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}/.well-known/jwks.json"
}

# -----------------------------------------------------------------------------
# OAuth2 Endpoints
# -----------------------------------------------------------------------------
output "authorize_endpoint" {
  description = "OAuth2 authorize endpoint"
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com/oauth2/authorize"
}

output "token_endpoint" {
  description = "OAuth2 token endpoint"
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com/oauth2/token"
}

output "userinfo_endpoint" {
  description = "OAuth2 userinfo endpoint"
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com/oauth2/userInfo"
}

output "logout_endpoint" {
  description = "OAuth2 logout endpoint"
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com/logout"
}

# -----------------------------------------------------------------------------
# Configuration for Frontend
# -----------------------------------------------------------------------------
output "frontend_config" {
  description = "Configuration object for frontend .env"
  value = {
    user_pool_id       = aws_cognito_user_pool.main.id
    client_id          = aws_cognito_user_pool_client.spa.id
    domain             = "${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
    scope              = "openid email profile"
    issuer             = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}"
    jwks_uri           = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}/.well-known/jwks.json"
  }
}
