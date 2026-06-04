# frozen_string_literal: true

# Rhino Configuration
# This file is used to configure Rhino for your Rails application.

Rhino.configure do |config|
  # ---------------------------------------------------------------
  # Models
  # ---------------------------------------------------------------
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
  # Auth / Group membership
  # ---------------------------------------------------------------
  # Multitenant-only variant: membership enforcement stays OFF, so behavior is
  # byte-for-byte the original example. The user_roles.route_group column exists
  # (additive AddGroupMembership migration) to match the canonical group-auth
  # schema; with enforcement off, NULL route_group rows are wildcards and never
  # gate anyone out.
  config.auth = { enforce_group_membership: false }

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
