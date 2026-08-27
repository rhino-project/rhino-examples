# frozen_string_literal: true

# Back-office controller: the SAME Rhino.query resolver as DashboardController,
# but serving the `admin` route group, which config/initializers/rhino.rb
# declares `tenant: false`.
#
# There is no :organization in the URL and no ResolveOrganizationFromRoute
# middleware here, so no organization is ever resolved. In a tenant group that
# would raise Rhino::MissingTenantContext (fail closed). Because this controller
# publishes the non-tenant `admin` group — via Rhino::RouteGroupContext below —
# the resolver applies no organization filter instead, and these aggregates
# legitimately span every tenant.
#
# What still applies here: the models' own scopes and the policies. Only the
# organization filter is lifted.
class AdminDashboardController < ActionController::API
  include Rhino::RouteGroupContext
  rhino_route_group :admin

  # Aggregates across EVERY organization.
  def summary
    render json: {
      scope:            "all-organizations",
      route_group:      Rhino::Context.route_group,
      projects_total:   Rhino.query(Project).count,
      tasks_total:      Rhino.query(Task).count,
      projects_by_org:  Rhino.query(Project).group(:organization_id).count
    }
  end

  # The contrast, on the SAME resolver call: this action publishes the TENANT
  # group and is reached with no organization resolved, so Rhino.query must fail
  # closed rather than return every tenant's rows.
  def tenant_probe
    RequestStore.store[:rhino_route_group] = "tenant"

    render json: { leaked: true, tasks_total: Rhino.query(Task).count }
  rescue Rhino::MissingTenantContext => e
    render json: { fail_closed: true, error: "MissingTenantContext", message: e.message },
           status: :unprocessable_entity
  end
end
