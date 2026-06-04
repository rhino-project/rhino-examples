# frozen_string_literal: true

# Rhino Configuration — HYBRID variant (GROUP_AUTH_DESIGN.md).
#
# Three route groups coexist in one app, with enforce_group_membership ON:
#
#   * personal — user-owned, NO org. Served at the apex host app.lvh.me. Its own
#     sign-in (auth: true). Serves only the user-owned PersonalProject model.
#     A distinguishing domain is REQUIRED: an empty-prefix + no-domain auth group
#     would collide with the legacy /api/auth/* routes, so route_group=personal
#     would never resolve and membership would 403. Pinning app.lvh.me avoids it.
#   * agency   — org-scoped multitenant on {organization}.agency.lvh.me, its OWN
#     sign-in + AgencyAuthHooks, ResolveOrganizationFromRoute, membership.
#   * vendor   — org-scoped multitenant on {organization}.vendor.lvh.me, a
#     DIFFERENT sign-in + VendorAuthHooks. A distinct membership from agency.
#
# agency and vendor share the empty prefix but are disambiguated by their
# distinct domains (host-sets are disjoint), so RouteGroupValidator passes.
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
  # User-owned model served ONLY by the personal group.
  config.model :"personal-projects", "PersonalProject"

  # ---------------------------------------------------------------
  # Route Groups
  # ---------------------------------------------------------------
  config.route_group :personal,
    prefix: "",
    domain: "app.lvh.me",
    auth: true,
    models: [:"personal-projects"]

  config.route_group :agency,
    prefix: "",
    domain: "{organization}.agency.lvh.me",
    auth: true,
    # String (not the constant) so the hook class is resolved lazily at request
    # time — app/auth is not autoloaded yet when this initializer runs.
    hooks: "AgencyAuthHooks",
    middleware: [Rhino::Middleware::ResolveOrganizationFromRoute],
    models: [:organizations, :roles, :projects, :tasks, :comments, :labels]

  config.route_group :vendor,
    prefix: "",
    domain: "{organization}.vendor.lvh.me",
    auth: true,
    hooks: "VendorAuthHooks",
    middleware: [Rhino::Middleware::ResolveOrganizationFromRoute],
    models: [:organizations, :roles, :projects, :tasks, :comments, :labels]

  # ---------------------------------------------------------------
  # Auth / Group membership (ENFORCED)
  # ---------------------------------------------------------------
  # Each group's users are isolated: an authenticated user must hold a
  # user_roles row matching the request's route_group (and, for the tenant
  # agency/vendor groups, the resolved organization) — else 403.
  config.auth = { enforce_group_membership: true }

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
