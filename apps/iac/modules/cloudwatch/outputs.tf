# =============================================================================
# CloudWatch Module Outputs
# =============================================================================
# Note: Log group outputs removed - log group is created in environment main.tf

output "ecs_cpu_alarm_arn" {
  description = "ECS CPU alarm ARN"
  value       = aws_cloudwatch_metric_alarm.ecs_cpu_high.arn
}

output "ecs_memory_alarm_arn" {
  description = "ECS memory alarm ARN"
  value       = aws_cloudwatch_metric_alarm.ecs_memory_high.arn
}

output "alb_5xx_alarm_arn" {
  description = "ALB 5xx errors alarm ARN"
  value       = aws_cloudwatch_metric_alarm.alb_5xx_errors.arn
}
