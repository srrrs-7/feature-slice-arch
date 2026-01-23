# =============================================================================
# ECR Module
# =============================================================================
# Creates ECR repository with lifecycle policy and scanning.
# =============================================================================

resource "aws_ecr_repository" "api" {
  name                 = "${var.name_prefix}-api"
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api"
  })
}

# Lifecycle Policy - Keep last N images
resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.image_count_to_keep} images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = var.image_count_to_keep
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Repository Policy (optional - for cross-account access)
resource "aws_ecr_repository_policy" "api" {
  count      = var.repository_policy != "" ? 1 : 0
  repository = aws_ecr_repository.api.name
  policy     = var.repository_policy
}
