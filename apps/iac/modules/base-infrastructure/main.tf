#------------------------------------------------------------------------------
# Base Infrastructure Module
#------------------------------------------------------------------------------
# This module orchestrates all infrastructure components.
# Used by both dev and prod environments to reduce duplication.
#------------------------------------------------------------------------------

#------------------------------------------------------------------------------
# Local Variables
#------------------------------------------------------------------------------
locals {
  name_prefix        = "${var.project_name}-${var.environment}"
  ecs_log_group_name = "/ecs/${local.name_prefix}-api"
  ecs_log_group_arn  = "arn:aws:logs:${var.aws_region}:${var.account_id}:log-group:${local.ecs_log_group_name}"

  # Subnet CIDRs derived from VPC CIDR
  public_subnet_cidrs   = [for i, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 8, i + 1)]
  private_subnet_cidrs  = [for i, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 8, i + 11)]
  database_subnet_cidrs = [for i, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 8, i + 21)]
}

#------------------------------------------------------------------------------
# Module: Network (VPC, Subnets, Security Groups)
#------------------------------------------------------------------------------
module "network" {
  source = "../network"

  name_prefix           = local.name_prefix
  vpc_cidr              = var.vpc_cidr
  availability_zones    = var.availability_zones
  public_subnet_cidrs   = local.public_subnet_cidrs
  private_subnet_cidrs  = local.private_subnet_cidrs
  database_subnet_cidrs = local.database_subnet_cidrs
  single_nat_gateway    = var.single_nat_gateway
}

#------------------------------------------------------------------------------
# Module: ECR (Container Registry)
#------------------------------------------------------------------------------
module "ecr" {
  source = "../ecr"

  name_prefix         = local.name_prefix
  image_count_to_keep = var.ecr_image_retention_count
}

#------------------------------------------------------------------------------
# Module: Secrets Manager
#------------------------------------------------------------------------------
module "secrets" {
  source = "../secrets"

  name_prefix = local.name_prefix
  db_username = var.db_username
}

#------------------------------------------------------------------------------
# Module: IAM Roles
#------------------------------------------------------------------------------
module "iam" {
  source = "../iam"

  name_prefix              = local.name_prefix
  ecr_repository_arn       = module.ecr.repository_arn
  secrets_arns             = [module.secrets.db_password_secret_arn, module.secrets.api_token_secret_arn]
  cloudwatch_log_group_arn = local.ecs_log_group_arn
}

#------------------------------------------------------------------------------
# Module: ALB (Application Load Balancer)
#------------------------------------------------------------------------------
module "alb" {
  source = "../alb"

  name_prefix     = local.name_prefix
  vpc_id          = module.network.vpc_id
  subnet_ids      = module.network.public_subnet_ids
  security_groups = [module.network.alb_security_group_id]
}

#------------------------------------------------------------------------------
# Module: RDS Aurora Serverless v2
#------------------------------------------------------------------------------
module "rds" {
  source = "../rds"

  name_prefix                 = local.name_prefix
  vpc_id                      = module.network.vpc_id
  subnet_ids                  = module.network.database_subnet_ids
  security_groups             = [module.network.rds_security_group_id]
  db_name                     = var.db_name
  master_username             = var.db_username
  master_password_secret_arn  = module.secrets.db_password_secret_arn
  min_capacity                = var.aurora_min_capacity
  max_capacity                = var.aurora_max_capacity
  backup_retention_period     = var.aurora_backup_retention_period
  enable_performance_insights = var.enable_performance_insights
  enable_enhanced_monitoring  = var.enable_rds_monitoring

  depends_on = [module.secrets, module.iam]
}

#------------------------------------------------------------------------------
# CloudWatch Log Group (created before ECS to avoid circular dependency)
#------------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "ecs" {
  name              = local.ecs_log_group_name
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${local.name_prefix}-ecs-logs"
  }
}

#------------------------------------------------------------------------------
# Module: ECS (Fargate)
#------------------------------------------------------------------------------
module "ecs" {
  source = "../ecs"

  name_prefix          = local.name_prefix
  vpc_id               = module.network.vpc_id
  subnet_ids           = module.network.private_subnet_ids
  security_groups      = [module.network.ecs_security_group_id]
  target_group_arn     = module.alb.target_group_arn
  ecr_repository_url   = module.ecr.repository_url
  execution_role_arn   = module.iam.ecs_execution_role_arn
  task_role_arn        = module.iam.ecs_task_role_arn
  db_secret_arn        = module.secrets.db_password_secret_arn
  api_token_secret_arn = module.secrets.api_token_secret_arn
  task_cpu             = var.ecs_task_cpu
  task_memory          = var.ecs_task_memory
  desired_count        = var.ecs_desired_count
  min_capacity         = var.ecs_min_count
  max_capacity         = var.ecs_max_count
  container_port       = var.container_port
  log_group_name       = local.ecs_log_group_name

  depends_on = [module.alb, module.rds, aws_cloudwatch_log_group.ecs]
}

#------------------------------------------------------------------------------
# Module: CloudFront + S3 (Frontend)
#------------------------------------------------------------------------------
module "cloudfront" {
  source = "../cloudfront"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  name_prefix   = local.name_prefix
  alb_dns_name  = module.alb.alb_dns_name
  alb_origin_id = "alb-api"
  s3_origin_id  = "s3-frontend"
  price_class   = var.cloudfront_price_class
  default_ttl   = var.cloudfront_default_ttl
  max_ttl       = var.cloudfront_max_ttl
}

#------------------------------------------------------------------------------
# Module: CloudWatch (Monitoring & Alarms)
#------------------------------------------------------------------------------
module "cloudwatch" {
  source = "../cloudwatch"

  name_prefix              = local.name_prefix
  ecs_cluster_name         = module.ecs.cluster_name
  ecs_service_name         = module.ecs.service_name
  alb_arn_suffix           = module.alb.alb_arn_suffix
  target_group_arn_suffix  = module.alb.target_group_arn_suffix
  log_retention_days       = var.log_retention_days
  alarm_evaluation_periods = var.alarm_evaluation_periods
  cpu_threshold            = var.cpu_alarm_threshold
  memory_threshold         = var.memory_alarm_threshold
  error_threshold          = var.error_alarm_threshold
  response_time_threshold  = var.response_time_alarm_threshold
}

#------------------------------------------------------------------------------
# Module: Cognito (Authentication)
#------------------------------------------------------------------------------
module "cognito" {
  source = "../cognito"

  name_prefix           = local.name_prefix
  cognito_domain_prefix = var.cognito_domain_prefix

  callback_urls = concat(
    ["https://${module.cloudfront.distribution_domain_name}/auth/callback"],
    var.cognito_additional_callback_urls
  )

  logout_urls = concat(
    ["https://${module.cloudfront.distribution_domain_name}/login"],
    var.cognito_additional_logout_urls
  )

  mfa_configuration            = var.cognito_mfa_configuration
  access_token_validity        = var.cognito_access_token_validity
  id_token_validity            = var.cognito_id_token_validity
  refresh_token_validity       = var.cognito_refresh_token_validity
  allow_admin_create_user_only = var.cognito_allow_admin_create_user_only
  deletion_protection          = var.cognito_deletion_protection
  create_user_groups           = var.cognito_create_user_groups

  tags = {
    Name = "${local.name_prefix}-cognito"
  }

  depends_on = [module.cloudfront]
}
