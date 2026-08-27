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

  # Back office. It has NO tenant boundary: its operators are meant to see every
  # organization's rows, so `tenant: false` tells Rhino.query not to require an
  # organization there (and not to raise). The tenant group above is untouched
  # and keeps failing closed.
  #
  # `models: []` on purpose: this group exists to declare the boundary for the
  # CUSTOM admin controller, not to expose a second, unscoped copy of the CRUD
  # API. A real back office would list the models it administers across tenants.
  config.route_group :admin,
    prefix: "admin",
    tenant: false,
    models: []

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
