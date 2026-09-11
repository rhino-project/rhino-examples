# frozen_string_literal: true

# Rhino Configuration
# This file is used to configure Rhino for your Rails application.

Rhino.configure do |config|
  # ---------------------------------------------------------------
  # Models
  # ---------------------------------------------------------------
  # How many named scopes one request may combine (403 over the cap).
  config.max_scopes_per_request = 3

  config.model :organizations, "Organization"
  config.model :roles, "Role"
  config.model :projects, "Project"
  config.model :tasks, "Task"
  config.model :comments, "Comment"
  config.model :labels, "Label"

  # ---------------------------------------------------------------
  # Route Groups
  # ---------------------------------------------------------------
  config.route_group :tenant,
    prefix: ":organization",
    middleware: [Rhino::Middleware::ResolveOrganizationFromRoute],
    models: :all

  # ---------------------------------------------------------------
  # Multi-tenant
  # ---------------------------------------------------------------
  config.multi_tenant = {
    organization_identifier_column: "slug"
  }

  # ---------------------------------------------------------------
  # Invitations
  # ---------------------------------------------------------------
  config.invitations = {
    expires_days: 7,
    allowed_roles: nil
  }

  # ---------------------------------------------------------------
  # Nested Operations
  # ---------------------------------------------------------------
  config.nested = {
    path: "nested",
    max_operations: 50,
    allowed_models: nil
  }

  # ---------------------------------------------------------------
  # Test Framework
  # ---------------------------------------------------------------
  config.test_framework = "rspec"
end
