# =============================================================================
# Main Terraform Configuration
# =============================================================================
# This file orchestrates all modules to create the complete infrastructure.
# Module dependencies are managed through explicit references.
# =============================================================================

# -----------------------------------------------------------------------------
# Provider Configuration
# -----------------------------------------------------------------------------
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge(
      {
        Project     = var.project_name
        Environment = var.environment
        ManagedBy   = "terraform"
      },
      var.tags
    )
  }
}

# Provider for CloudFront (must be us-east-1 for ACM certificates)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = merge(
      {
        Project     = var.project_name
        Environment = var.environment
        ManagedBy   = "terraform"
      },
      var.tags
    )
  }
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# -----------------------------------------------------------------------------
# Local Values
# -----------------------------------------------------------------------------
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  account_id  = data.aws_caller_identity.current.account_id
  region      = data.aws_region.current.name

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# -----------------------------------------------------------------------------
# Network Module
# -----------------------------------------------------------------------------
module "network" {
  source = "./modules/network"

  name_prefix           = local.name_prefix
  vpc_cidr              = var.vpc_cidr
  availability_zones    = var.availability_zones
  public_subnet_cidrs   = var.public_subnet_cidrs
  private_subnet_cidrs  = var.private_subnet_cidrs
  database_subnet_cidrs = var.database_subnet_cidrs
  enable_nat_gateway    = var.enable_nat_gateway
  single_nat_gateway    = var.single_nat_gateway

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# IAM Module
# -----------------------------------------------------------------------------
module "iam" {
  source = "./modules/iam"

  name_prefix = local.name_prefix
  account_id  = local.account_id
  region      = local.region

  ecr_repository_arn   = module.ecr.repository_arn
  secrets_arns         = module.secrets.secret_arns
  cloudwatch_log_group = module.cloudwatch.ecs_log_group_arn
  enable_ecs_exec      = var.enable_ecs_exec

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# ECR Module
# -----------------------------------------------------------------------------
module "ecr" {
  source = "./modules/ecr"

  name_prefix = local.name_prefix

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Secrets Manager Module
# -----------------------------------------------------------------------------
module "secrets" {
  source = "./modules/secrets"

  name_prefix      = local.name_prefix
  db_username      = var.db_master_username
  api_bearer_token = var.api_bearer_token

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# RDS Aurora Module
# -----------------------------------------------------------------------------
module "rds" {
  source = "./modules/rds"

  name_prefix     = local.name_prefix
  vpc_id          = module.network.vpc_id
  subnet_ids      = module.network.database_subnet_ids
  security_groups = [module.network.rds_security_group_id]

  db_name                     = var.db_name
  master_username             = var.db_master_username
  master_password_secret_arn  = module.secrets.db_password_secret_arn
  engine_version              = var.db_engine_version
  min_capacity                = var.db_min_capacity
  max_capacity                = var.db_max_capacity
  backup_retention_period     = var.db_backup_retention_period
  deletion_protection         = var.db_deletion_protection
  skip_final_snapshot         = var.db_skip_final_snapshot
  enable_enhanced_monitoring  = var.enable_enhanced_monitoring
  enable_performance_insights = var.enable_performance_insights

  tags = local.common_tags

  depends_on = [module.secrets]
}

# -----------------------------------------------------------------------------
# ALB Module
# -----------------------------------------------------------------------------
module "alb" {
  source = "./modules/alb"

  name_prefix     = local.name_prefix
  vpc_id          = module.network.vpc_id
  subnet_ids      = module.network.public_subnet_ids
  security_groups = [module.network.alb_security_group_id]

  container_port = var.api_container_port

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# CloudWatch Module
# -----------------------------------------------------------------------------
module "cloudwatch" {
  source = "./modules/cloudwatch"

  name_prefix        = local.name_prefix
  log_retention_days = var.log_retention_days

  ecs_cluster_name        = "${local.name_prefix}-cluster"
  ecs_service_name        = "${local.name_prefix}-api"
  alb_arn_suffix          = module.alb.alb_arn_suffix
  target_group_arn_suffix = module.alb.target_group_arn_suffix

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# ECS Module
# -----------------------------------------------------------------------------
module "ecs" {
  source = "./modules/ecs"

  name_prefix     = local.name_prefix
  vpc_id          = module.network.vpc_id
  subnet_ids      = module.network.private_subnet_ids
  security_groups = [module.network.ecs_security_group_id]

  task_cpu        = var.ecs_task_cpu
  task_memory     = var.ecs_task_memory
  desired_count   = var.ecs_desired_count
  min_capacity    = var.ecs_min_capacity
  max_capacity    = var.ecs_max_capacity
  container_port  = var.api_container_port
  enable_ecs_exec = var.enable_ecs_exec

  ecr_repository_url = module.ecr.repository_url
  execution_role_arn = module.iam.ecs_execution_role_arn
  task_role_arn      = module.iam.ecs_task_role_arn
  target_group_arn   = module.alb.target_group_arn
  log_group_name     = module.cloudwatch.ecs_log_group_name

  # Environment variables for the container
  db_secret_arn        = module.secrets.db_credentials_secret_arn
  api_token_secret_arn = module.secrets.api_token_secret_arn

  tags = local.common_tags

  depends_on = [module.alb, module.rds]
}

# -----------------------------------------------------------------------------
# CloudFront & S3 Module
# -----------------------------------------------------------------------------
module "cloudfront" {
  source = "./modules/cloudfront"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  name_prefix   = local.name_prefix
  alb_dns_name  = module.alb.alb_dns_name
  alb_origin_id = "alb-api"
  s3_origin_id  = "s3-frontend"

  price_class = var.cloudfront_price_class
  default_ttl = var.cloudfront_default_ttl
  max_ttl     = var.cloudfront_max_ttl

  tags = local.common_tags
}
