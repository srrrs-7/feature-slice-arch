#!/bin/bash
#------------------------------------------------------------------------------
# Terraform Deploy Script
#------------------------------------------------------------------------------
# Usage: ./deploy.sh <environment> [plan|apply|destroy]
# Example: ./deploy.sh dev plan
#          ./deploy.sh dev apply
#          ./deploy.sh prod apply
#------------------------------------------------------------------------------

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Validate arguments
if [ -z "$1" ]; then
    log_error "Environment is required. Usage: ./deploy.sh <environment> [plan|apply|destroy]"
fi

ENVIRONMENT=$1
ACTION=${2:-plan}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_DIR="${SCRIPT_DIR}/../envs/${ENVIRONMENT}"

# Validate environment
if [ ! -d "$ENV_DIR" ]; then
    log_error "Environment '${ENVIRONMENT}' not found. Available: dev, prod"
fi

# Validate action
if [[ ! "$ACTION" =~ ^(plan|apply|destroy)$ ]]; then
    log_error "Invalid action '${ACTION}'. Available: plan, apply, destroy"
fi

log_info "Environment: ${ENVIRONMENT}"
log_info "Action: ${ACTION}"
log_info "Working directory: ${ENV_DIR}"

# Change to environment directory
cd "$ENV_DIR"

# Check Terraform installation
if ! command -v terraform &> /dev/null; then
    log_error "Terraform is not installed. Please install Terraform >= 1.9.0"
fi

TERRAFORM_VERSION=$(terraform version -json | jq -r '.terraform_version')
log_info "Terraform version: ${TERRAFORM_VERSION}"

# Initialize Terraform
log_info "Initializing Terraform..."
terraform init -upgrade

# Validate configuration
log_info "Validating Terraform configuration..."
terraform validate

# Execute action
case $ACTION in
    plan)
        log_info "Creating execution plan..."
        terraform plan -out=tfplan
        log_success "Plan created successfully. Review the plan above."
        log_info "To apply: ./deploy.sh ${ENVIRONMENT} apply"
        ;;
    apply)
        if [ -f "tfplan" ]; then
            log_info "Applying saved plan..."
            terraform apply tfplan
            rm -f tfplan
        else
            log_warning "No saved plan found. Running plan and apply..."
            terraform plan -out=tfplan
            echo ""
            read -p "Do you want to apply this plan? (yes/no): " CONFIRM
            if [ "$CONFIRM" = "yes" ]; then
                terraform apply tfplan
                rm -f tfplan
            else
                log_warning "Apply cancelled."
                rm -f tfplan
                exit 0
            fi
        fi
        log_success "Infrastructure deployed successfully!"
        echo ""
        log_info "Deployment Information:"
        terraform output -no-color
        ;;
    destroy)
        log_warning "This will DESTROY all infrastructure in ${ENVIRONMENT}!"
        read -p "Are you sure you want to destroy? Type '${ENVIRONMENT}' to confirm: " CONFIRM
        if [ "$CONFIRM" = "$ENVIRONMENT" ]; then
            terraform destroy
            log_success "Infrastructure destroyed."
        else
            log_warning "Destroy cancelled."
            exit 0
        fi
        ;;
esac

log_success "Done!"
