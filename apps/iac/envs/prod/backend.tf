#------------------------------------------------------------------------------
# Terraform Backend Configuration - Production
#------------------------------------------------------------------------------
# Uncomment and configure to use S3 backend for state management.
# This is REQUIRED for production environments.
#
# Prerequisites:
# 1. Create S3 bucket for state: aws s3 mb s3://todo-app-terraform-state-prod
# 2. Enable versioning: aws s3api put-bucket-versioning --bucket todo-app-terraform-state-prod --versioning-configuration Status=Enabled
# 3. Create DynamoDB table for locking:
#    aws dynamodb create-table \
#      --table-name todo-app-terraform-locks-prod \
#      --attribute-definitions AttributeName=LockID,AttributeType=S \
#      --key-schema AttributeName=LockID,KeyType=HASH \
#      --billing-mode PAY_PER_REQUEST
# 4. Uncomment the backend configuration below
# 5. Run: terraform init -migrate-state
#------------------------------------------------------------------------------

# terraform {
#   backend "s3" {
#     bucket         = "todo-app-terraform-state-prod"
#     key            = "prod/terraform.tfstate"
#     region         = "ap-northeast-1"
#     encrypt        = true
#     dynamodb_table = "todo-app-terraform-locks-prod"
#   }
# }
