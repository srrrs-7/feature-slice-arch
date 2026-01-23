# =============================================================================
# ALB Module Outputs
# =============================================================================

output "alb_id" {
  description = "ALB ID"
  value       = aws_lb.main.id
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone ID"
  value       = aws_lb.main.zone_id
}

output "alb_arn_suffix" {
  description = "ALB ARN suffix for CloudWatch"
  value       = aws_lb.main.arn_suffix
}

output "target_group_arn" {
  description = "Target group ARN"
  value       = aws_lb_target_group.api.arn
}

output "target_group_arn_suffix" {
  description = "Target group ARN suffix for CloudWatch"
  value       = aws_lb_target_group.api.arn_suffix
}

output "http_listener_arn" {
  description = "HTTP listener ARN"
  value       = aws_lb_listener.http.arn
}

output "api_listener_arn" {
  description = "API listener ARN"
  value       = aws_lb_listener.api.arn
}
