# frozen_string_literal: true

# Rhino Configuration — SINGLE-TENANT variant.
#
# No Organization / Role / UserRole. Domain models are owned by user_id
# (Project directly; Task/Comment inherit ownership via their parent Project).
# Label is a shared global catalog (no owner). Ownership isolation is enforced
# by the Scopes::{Model}Scope default scopes, not by any organization.
Rhino.configure do |config|
  # ---------------------------------------------------------------
  # Models (no organizations / roles)
  # ---------------------------------------------------------------
  config.model :projects, "Project"
  config.model :tasks, "Task"
  config.model :comments, "Comment"
  config.model :labels, "Label"

  # ---------------------------------------------------------------
  # Route Groups
  # ---------------------------------------------------------------
  # One `default` route group: empty prefix, no domain, no org middleware. Auth
  # is the standard global /api/auth/* set (the legacy auth routes map to the
  # :default group). All models are served by it.
  config.route_group :default,
    prefix: "",
    models: :all

  # ---------------------------------------------------------------
  # Auth / Group membership
  # ---------------------------------------------------------------
  # No groups/roles to enforce — membership enforcement stays off. Permissions
  # are not role-based: the User model omits HasPermissions, so the policy falls
  # through to "allow" and ownership is enforced entirely by the model scopes.
  config.auth = { enforce_group_membership: false }

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
