# frozen_string_literal: true

# Custom (non-CRUD) controller demonstrating the Rhino resource-scope resolver
# in EXPLICIT mode. This controller is NOT part of the Rhino before_action chain
# (no ResolveOrganizationFromRoute middleware, no auth hooks), so req.user /
# req.organization are NOT populated. We resolve the org from the route param and
# the user from the bearer token ourselves, then build an explicit tenant context
# with Rhino.for_user(user).in_organization(org).run { ... }.
#
# Inside the block, Rhino.query(Model) applies the SAME organization scoping as
# CRUD (org column, for_organization, or auto-detected belongs_to path) plus the
# model's default scopes. It fails CLOSED: an org-scopable model with no context
# raises Rhino::MissingTenantContext instead of leaking rows across tenants.
class DashboardController < ActionController::API
  def summary
    user = current_user_from_token
    return render(json: { message: "Invalid credentials" }, status: :unauthorized) unless user

    org = Organization.find_by(slug: params[:organization])
    return render(json: { message: "Organization not found" }, status: :not_found) unless org

    data = Rhino.for_user(user).in_organization(org).run do
      {
        organization:    org.slug,
        as_user:         user.email,
        projects_total:  Rhino.query(Project).count,
        tasks_total:     Rhino.query(Task).count,
        tasks_by_status: Rhino.query(Task).group(:status).count,
        labels_total:    Rhino.query(Label).count
      }
    end

    render json: data
  end

  # Demonstrates the FAIL-CLOSED behavior of the resolver: calling Rhino.query on
  # an org-scopable model with NO tenant context in scope raises
  # Rhino::MissingTenantContext rather than returning every tenant's rows.
  def unscoped_probe
    count = Rhino.query(Task).count
    render json: { leaked: true, tasks_total: count }
  rescue Rhino::MissingTenantContext => e
    render json: { fail_closed: true, error: "MissingTenantContext", model: e.message }, status: :unprocessable_entity
  end

  private

  def current_user_from_token
    token = request.headers["Authorization"].to_s.sub(/\ABearer /, "")
    return nil if token.blank?

    User.find_by(api_token: token)
  end
end
