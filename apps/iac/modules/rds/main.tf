# =============================================================================
# RDS Aurora Module
# =============================================================================
# Creates Aurora Serverless v2 PostgreSQL cluster.
# =============================================================================

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------
data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = var.master_password_secret_arn
}

# IAM Role for Enhanced Monitoring
data "aws_iam_role" "rds_monitoring" {
  count = var.enable_enhanced_monitoring ? 1 : 0
  name  = "${var.name_prefix}-rds-monitoring-role"
}

# -----------------------------------------------------------------------------
# DB Subnet Group
# -----------------------------------------------------------------------------
resource "aws_db_subnet_group" "main" {
  name       = "${var.name_prefix}-aurora-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-aurora-subnet-group"
  })
}

# -----------------------------------------------------------------------------
# Aurora Cluster Parameter Group
# -----------------------------------------------------------------------------
resource "aws_rds_cluster_parameter_group" "main" {
  family = "aurora-postgresql16"
  name   = "${var.name_prefix}-aurora-cluster-pg"

  parameter {
    name  = "timezone"
    value = "Asia/Tokyo"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries taking more than 1 second
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-aurora-cluster-pg"
  })
}

# -----------------------------------------------------------------------------
# Aurora DB Parameter Group
# -----------------------------------------------------------------------------
resource "aws_db_parameter_group" "main" {
  family = "aurora-postgresql16"
  name   = "${var.name_prefix}-aurora-db-pg"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-aurora-db-pg"
  })
}

# -----------------------------------------------------------------------------
# Aurora Serverless v2 Cluster
# -----------------------------------------------------------------------------
resource "aws_rds_cluster" "main" {
  cluster_identifier = "${var.name_prefix}-aurora-cluster"
  engine             = "aurora-postgresql"
  engine_mode        = "provisioned"
  engine_version     = var.engine_version
  database_name      = var.db_name
  master_username    = var.master_username
  master_password    = data.aws_secretsmanager_secret_version.db_password.secret_string

  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = var.security_groups
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.main.name

  # Serverless v2 scaling configuration
  serverlessv2_scaling_configuration {
    min_capacity = var.min_capacity
    max_capacity = var.max_capacity
  }

  # Backup configuration
  backup_retention_period = var.backup_retention_period
  preferred_backup_window = "03:00-04:00"

  # Maintenance window
  preferred_maintenance_window = "Mon:04:00-Mon:05:00"

  # Storage encryption
  storage_encrypted = true

  # Deletion protection
  deletion_protection       = var.deletion_protection
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.name_prefix}-final-snapshot"

  # Enable CloudWatch Logs export
  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-aurora-cluster"
  })

  lifecycle {
    ignore_changes = [
      master_password
    ]
  }
}

# -----------------------------------------------------------------------------
# Aurora Serverless v2 Instance
# -----------------------------------------------------------------------------
resource "aws_rds_cluster_instance" "main" {
  identifier         = "${var.name_prefix}-aurora-instance-1"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  db_parameter_group_name = aws_db_parameter_group.main.name

  # Performance Insights
  performance_insights_enabled          = var.enable_performance_insights
  performance_insights_retention_period = var.enable_performance_insights ? 7 : null

  # Enhanced Monitoring
  monitoring_interval = var.enable_enhanced_monitoring ? 60 : 0
  monitoring_role_arn = var.enable_enhanced_monitoring ? data.aws_iam_role.rds_monitoring[0].arn : null

  # Auto minor version upgrade
  auto_minor_version_upgrade = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-aurora-instance-1"
  })
}
