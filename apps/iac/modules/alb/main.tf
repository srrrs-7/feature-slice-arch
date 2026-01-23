# =============================================================================
# ALB Module
# =============================================================================
# Creates Application Load Balancer, Target Group, and Listeners.
# =============================================================================

# -----------------------------------------------------------------------------
# Application Load Balancer
# -----------------------------------------------------------------------------
resource "aws_lb" "main" {
  name               = "${var.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = var.security_groups
  subnets            = var.subnet_ids

  enable_deletion_protection = var.enable_deletion_protection

  # Access logs (optional)
  dynamic "access_logs" {
    for_each = var.access_logs_bucket != "" ? [1] : []
    content {
      bucket  = var.access_logs_bucket
      prefix  = var.access_logs_prefix
      enabled = true
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-alb"
  })
}

# -----------------------------------------------------------------------------
# Target Group
# -----------------------------------------------------------------------------
resource "aws_lb_target_group" "api" {
  name        = "${var.name_prefix}-api-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = var.health_check_path
    protocol            = "HTTP"
    matcher             = "200"
  }

  # Deregistration delay
  deregistration_delay = 30

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-tg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# -----------------------------------------------------------------------------
# HTTP Listener (Redirect to HTTPS)
# -----------------------------------------------------------------------------
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-http-listener"
  })
}

# -----------------------------------------------------------------------------
# HTTPS Listener
# -----------------------------------------------------------------------------
# Note: For production, use ACM certificate
# For now, use HTTP listener for API (CloudFront handles HTTPS)
resource "aws_lb_listener" "api" {
  load_balancer_arn = aws_lb.main.arn
  port              = 8080
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-listener"
  })
}
