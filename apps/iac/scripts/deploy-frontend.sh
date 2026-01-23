#!/bin/bash
#------------------------------------------------------------------------------
# Frontend Deployment Script
#------------------------------------------------------------------------------
# Builds and deploys the frontend to S3 with CloudFront invalidation
# Usage: ./deploy-frontend.sh <environment>
# Example: ./deploy-frontend.sh dev
#          ./deploy-frontend.sh prod
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
    log_error "Environment is required. Usage: ./deploy-frontend.sh <environment>"
fi

ENVIRONMENT=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/../../../.."
ENV_DIR="${SCRIPT_DIR}/../envs/${ENVIRONMENT}"
WEB_DIR="${PROJECT_ROOT}/apps/web"

# Validate environment
if [ ! -d "$ENV_DIR" ]; then
    log_error "Environment '${ENVIRONMENT}' not found."
fi

log_info "Environment: ${ENVIRONMENT}"

# Change to environment directory to get outputs
cd "$ENV_DIR"

# Get Terraform outputs
log_info "Getting deployment information from Terraform..."
S3_BUCKET=$(terraform output -raw s3_frontend_bucket 2>/dev/null || log_error "Could not get S3 bucket name")
CLOUDFRONT_DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || true)
CLOUDFRONT_URL=$(terraform output -raw cloudfront_url 2>/dev/null || log_error "Could not get CloudFront URL")
API_URL=$(terraform output -raw api_url 2>/dev/null || log_error "Could not get API URL")

log_info "S3 Bucket: ${S3_BUCKET}"
log_info "CloudFront URL: ${CLOUDFRONT_URL}"
log_info "API URL: ${API_URL}"

# Build frontend
log_info "Building frontend..."
cd "$WEB_DIR"

# Set API URL for build
export VITE_API_URL="$CLOUDFRONT_URL"
bun run build

# Verify build output
if [ ! -d "dist" ]; then
    log_error "Build failed - dist directory not found"
fi

# Sync to S3
log_info "Syncing to S3..."
aws s3 sync dist/ "s3://${S3_BUCKET}" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "index.html" \
    --exclude "*.json"

# Upload index.html and JSON files with no-cache
aws s3 cp dist/index.html "s3://${S3_BUCKET}/index.html" \
    --cache-control "no-cache, no-store, must-revalidate"

# Upload any JSON files (like manifest)
find dist -name "*.json" -exec aws s3 cp {} "s3://${S3_BUCKET}/" \
    --cache-control "no-cache" \;

# Invalidate CloudFront cache
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    log_info "Invalidating CloudFront cache..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    log_info "Invalidation ID: ${INVALIDATION_ID}"
    log_info "Waiting for invalidation to complete..."
    
    aws cloudfront wait invalidation-completed \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --id "$INVALIDATION_ID"
fi

log_success "Frontend deployment completed successfully!"
log_info "URL: ${CLOUDFRONT_URL}"
