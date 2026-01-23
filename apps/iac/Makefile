#------------------------------------------------------------------------------
# Terraform Infrastructure Makefile
#------------------------------------------------------------------------------
# Usage: make <target> ENV=<environment>
# Example: make plan ENV=dev
#          make apply ENV=prod
#------------------------------------------------------------------------------

.PHONY: help init plan apply destroy deploy-api deploy-frontend setup-backend validate fmt

# Default environment
ENV ?= dev

# Scripts directory
SCRIPTS_DIR := ./scripts

help:
	@echo "Usage: make <target> ENV=<environment>"
	@echo ""
	@echo "Targets:"
	@echo "  init            Initialize Terraform for the environment"
	@echo "  validate        Validate Terraform configuration"
	@echo "  fmt             Format Terraform files"
	@echo "  plan            Create Terraform execution plan"
	@echo "  apply           Apply Terraform changes"
	@echo "  destroy         Destroy infrastructure (use with caution!)"
	@echo "  deploy-api      Build and deploy API to ECS"
	@echo "  deploy-frontend Build and deploy frontend to S3/CloudFront"
	@echo "  setup-backend   Create S3 bucket and DynamoDB for state"
	@echo ""
	@echo "Examples:"
	@echo "  make plan ENV=dev"
	@echo "  make apply ENV=dev"
	@echo "  make deploy-api ENV=dev"
	@echo "  make deploy-frontend ENV=prod"

init:
	@echo "Initializing Terraform for $(ENV)..."
	cd envs/$(ENV) && terraform init -upgrade

validate:
	@echo "Validating Terraform configuration for $(ENV)..."
	cd envs/$(ENV) && terraform validate

fmt:
	@echo "Formatting Terraform files..."
	terraform fmt -recursive

plan:
	@$(SCRIPTS_DIR)/deploy.sh $(ENV) plan

apply:
	@$(SCRIPTS_DIR)/deploy.sh $(ENV) apply

destroy:
	@$(SCRIPTS_DIR)/deploy.sh $(ENV) destroy

deploy-api:
	@$(SCRIPTS_DIR)/deploy-api.sh $(ENV) $(TAG)

deploy-frontend:
	@$(SCRIPTS_DIR)/deploy-frontend.sh $(ENV)

setup-backend:
	@$(SCRIPTS_DIR)/setup-backend.sh $(ENV)

# Shortcuts for dev environment
dev-plan:
	@$(MAKE) plan ENV=dev

dev-apply:
	@$(MAKE) apply ENV=dev

dev-destroy:
	@$(MAKE) destroy ENV=dev

# Shortcuts for prod environment
prod-plan:
	@$(MAKE) plan ENV=prod

prod-apply:
	@$(MAKE) apply ENV=prod
