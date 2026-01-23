#------------------------------------------------------------------------------
# Development Environment Configuration
#------------------------------------------------------------------------------
# This file orchestrates all modules for the development environment.
# Run from this directory: terraform init && terraform plan
#------------------------------------------------------------------------------

terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

#------------------------------------------------------------------------------
# Provider Configuration
#------------------------------------------------------------------------------
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# CloudFront requires ACM certificates in us-east-1
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

#------------------------------------------------------------------------------
# Data Sources
#------------------------------------------------------------------------------
data "aws_caller_identity" "current" {}

#------------------------------------------------------------------------------
# Base Infrastructure Module
#------------------------------------------------------------------------------
module "infrastructure" {
  source = "../../modules/base-infrastructure"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  # General
  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
  account_id   = data.aws_caller_identity.current.account_id

  # Network
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  single_nat_gateway = var.single_nat_gateway

  # ECR
  ecr_image_retention_count = var.ecr_image_retention_count

  # Database
  db_name                        = var.db_name
  db_username                    = var.db_username
  aurora_min_capacity            = var.aurora_min_capacity
  aurora_max_capacity            = var.aurora_max_capacity
  aurora_backup_retention_period = var.aurora_backup_retention_period
  enable_performance_insights    = var.enable_performance_insights
  enable_rds_monitoring          = var.enable_rds_monitoring

  # ECS
  ecs_task_cpu      = var.ecs_task_cpu
  ecs_task_memory   = var.ecs_task_memory
  ecs_desired_count = var.ecs_desired_count
  ecs_min_count     = var.ecs_min_count
  ecs_max_count     = var.ecs_max_count
  container_port    = var.container_port

  # CloudFront
  cloudfront_price_class  = var.cloudfront_price_class
  cloudfront_default_ttl  = var.cloudfront_default_ttl
  cloudfront_max_ttl      = var.cloudfront_max_ttl

  # Monitoring
  log_retention_days            = var.log_retention_days
  alarm_evaluation_periods      = var.alarm_evaluation_periods
  cpu_alarm_threshold           = var.cpu_alarm_threshold
  memory_alarm_threshold        = var.memory_alarm_threshold
  error_alarm_threshold         = var.error_alarm_threshold
  response_time_alarm_threshold = var.response_time_alarm_threshold
}
