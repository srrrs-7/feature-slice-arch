#!/bin/bash
#------------------------------------------------------------------------------
# API Deployment Script
#------------------------------------------------------------------------------
# Builds and deploys the API Docker image to ECS
# Usage: ./deploy-api.sh <environment> [image-tag]
# Example: ./deploy-api.sh dev latest
#          ./deploy-api.sh prod v1.2.3
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
    log_error "Environment is required. Usage: ./deploy-api.sh <environment> [image-tag]"
fi

ENVIRONMENT=$1
IMAGE_TAG=${2:-latest}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/../../../.."
ENV_DIR="${SCRIPT_DIR}/../envs/${ENVIRONMENT}"

# Validate environment
if [ ! -d "$ENV_DIR" ]; then
    log_error "Environment '${ENVIRONMENT}' not found."
fi

log_info "Environment: ${ENVIRONMENT}"
log_info "Image Tag: ${IMAGE_TAG}"

# Change to environment directory to get outputs
cd "$ENV_DIR"

# Get Terraform outputs
log_info "Getting deployment information from Terraform..."
ECR_REPOSITORY_URL=$(terraform output -raw ecr_repository_url 2>/dev/null || log_error "Could not get ECR repository URL")
ECS_CLUSTER_NAME=$(terraform output -raw ecs_cluster_name 2>/dev/null || log_error "Could not get ECS cluster name")
ECS_SERVICE_NAME=$(terraform output -raw ecs_service_name 2>/dev/null || log_error "Could not get ECS service name")

# Extract region from ECR URL
AWS_REGION=$(echo "$ECR_REPOSITORY_URL" | cut -d'.' -f4)

log_info "ECR Repository: ${ECR_REPOSITORY_URL}"
log_info "ECS Cluster: ${ECS_CLUSTER_NAME}"
log_info "ECS Service: ${ECS_SERVICE_NAME}"
log_info "AWS Region: ${AWS_REGION}"

# Login to ECR
log_info "Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | \
    docker login --username AWS --password-stdin "$ECR_REPOSITORY_URL"

# Build Docker image
log_info "Building Docker image..."
cd "$PROJECT_ROOT/apps/api"
docker build -t "${ECR_REPOSITORY_URL}:${IMAGE_TAG}" .

# Tag as latest if not already
if [ "$IMAGE_TAG" != "latest" ]; then
    docker tag "${ECR_REPOSITORY_URL}:${IMAGE_TAG}" "${ECR_REPOSITORY_URL}:latest"
fi

# Push to ECR
log_info "Pushing image to ECR..."
docker push "${ECR_REPOSITORY_URL}:${IMAGE_TAG}"
if [ "$IMAGE_TAG" != "latest" ]; then
    docker push "${ECR_REPOSITORY_URL}:latest"
fi

# Update ECS service
log_info "Updating ECS service..."
aws ecs update-service \
    --cluster "$ECS_CLUSTER_NAME" \
    --service "$ECS_SERVICE_NAME" \
    --force-new-deployment \
    --region "$AWS_REGION" > /dev/null

log_info "Waiting for deployment to complete..."
aws ecs wait services-stable \
    --cluster "$ECS_CLUSTER_NAME" \
    --services "$ECS_SERVICE_NAME" \
    --region "$AWS_REGION"

log_success "API deployment completed successfully!"
