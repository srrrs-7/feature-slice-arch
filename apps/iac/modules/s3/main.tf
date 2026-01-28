# =============================================================================
# S3 Module
# =============================================================================
# Creates S3 bucket for file uploads with presigned URL support.
# =============================================================================

# -----------------------------------------------------------------------------
# S3 Bucket (File Uploads)
# -----------------------------------------------------------------------------
resource "aws_s3_bucket" "uploads" {
  bucket = "${var.name_prefix}-uploads-${var.account_id}"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-uploads"
  })
}

# -----------------------------------------------------------------------------
# Versioning (Protection against accidental deletion)
# -----------------------------------------------------------------------------
resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  versioning_configuration {
    status = "Enabled"
  }
}

# -----------------------------------------------------------------------------
# Public Access Block (Security best practice)
# -----------------------------------------------------------------------------
resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -----------------------------------------------------------------------------
# Server-Side Encryption (AES256)
# -----------------------------------------------------------------------------
resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# -----------------------------------------------------------------------------
# CORS Configuration (For presigned URL browser uploads)
# -----------------------------------------------------------------------------
resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# -----------------------------------------------------------------------------
# Lifecycle Rules (Cleanup expired uploads)
# -----------------------------------------------------------------------------
resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "cleanup-expired-uploads"
    status = "Enabled"

    filter {
      prefix = "uploads/"
    }

    expiration {
      days = var.upload_expiration_days
    }
  }
}
