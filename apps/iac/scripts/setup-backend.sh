#!/bin/bash
#------------------------------------------------------------------------------
# Terraform Backend Setup Script
#------------------------------------------------------------------------------
# Creates S3 bucket and DynamoDB table for Terraform state management
# Usage: ./setup-backend.sh <environment>
# Example: ./setup-backend.sh dev
#          ./setup-backend.sh prod
#------------------------------------------------------------------------------

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Validate arguments
if [ -z "$1" ]; then
    log_error "Environment is required. Usage: ./setup-backend.sh <environment>"
fi

ENVIRONMENT=$1
PROJECT_NAME="todo-app"
AWS_REGION=${AWS_REGION:-ap-northeast-1}

S3_BUCKET="${PROJECT_NAME}-terraform-state-${ENVIRONMENT}"
DYNAMODB_TABLE="${PROJECT_NAME}-terraform-locks-${ENVIRONMENT}"

log_info "Setting up Terraform backend for ${ENVIRONMENT}..."
log_info "S3 Bucket: ${S3_BUCKET}"
log_info "DynamoDB Table: ${DYNAMODB_TABLE}"
log_info "AWS Region: ${AWS_REGION}"

# Create S3 bucket
log_info "Creating S3 bucket..."
if aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
    log_warning "S3 bucket already exists"
else
    aws s3api create-bucket \
        --bucket "$S3_BUCKET" \
        --region "$AWS_REGION" \
        --create-bucket-configuration LocationConstraint="$AWS_REGION"
    log_success "S3 bucket created"
fi

# Enable versioning
log_info "Enabling S3 versioning..."
aws s3api put-bucket-versioning \
    --bucket "$S3_BUCKET" \
    --versioning-configuration Status=Enabled

# Enable encryption
log_info "Enabling S3 encryption..."
aws s3api put-bucket-encryption \
    --bucket "$S3_BUCKET" \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            },
            "BucketKeyEnabled": true
        }]
    }'

# Block public access
log_info "Blocking public access..."
aws s3api put-public-access-block \
    --bucket "$S3_BUCKET" \
    --public-access-block-configuration '{
        "BlockPublicAcls": true,
        "IgnorePublicAcls": true,
        "BlockPublicPolicy": true,
        "RestrictPublicBuckets": true
    }'

# Create DynamoDB table
log_info "Creating DynamoDB table..."
if aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION" 2>/dev/null; then
    log_warning "DynamoDB table already exists"
else
    aws dynamodb create-table \
        --table-name "$DYNAMODB_TABLE" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "$AWS_REGION"
    
    log_info "Waiting for table to be active..."
    aws dynamodb wait table-exists --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION"
    log_success "DynamoDB table created"
fi

log_success "Terraform backend setup completed!"
echo ""
log_info "Next steps:"
echo "1. Uncomment the backend configuration in envs/${ENVIRONMENT}/backend.tf"
echo "2. Run: cd envs/${ENVIRONMENT} && terraform init -migrate-state"
