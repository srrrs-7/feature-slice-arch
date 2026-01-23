#------------------------------------------------------------------------------
# Terraform Backend Configuration - Development
#------------------------------------------------------------------------------
# Uncomment and configure to use S3 backend for state management.
# This is recommended for team collaboration.
#
# Prerequisites:
# 1. Create S3 bucket for state: aws s3 mb s3://todo-app-terraform-state-dev
# 2. Create DynamoDB table for locking:
#    aws dynamodb create-table \
#      --table-name todo-app-terraform-locks-dev \
#      --attribute-definitions AttributeName=LockID,AttributeType=S \
#      --key-schema AttributeName=LockID,KeyType=HASH \
#      --billing-mode PAY_PER_REQUEST
# 3. Uncomment the backend configuration below
# 4. Run: terraform init -migrate-state
#------------------------------------------------------------------------------

# terraform {
#   backend "s3" {
#     bucket         = "todo-app-terraform-state-dev"
#     key            = "dev/terraform.tfstate"
#     region         = "ap-northeast-1"
#     encrypt        = true
#     dynamodb_table = "todo-app-terraform-locks-dev"
#   }
# }
