# frozen_string_literal: true

# Lifecycle hooks for the `agency` route group (GROUP_AUTH_DESIGN.md §7).
#
# Runs AFTER each successful auth action on the agency sign-in. This demo logs a
# distinct tag so the agency vs vendor sign-ins are observably different; a real
# app might audit, attach agency-specific claims, or reject suspended agencies
# (raise Rhino::AuthRejected to revoke the just-issued token and 403).
class AgencyAuthHooks < Rhino::AuthHooks
  def after_login(user, context = {})
    org = context[:organization]
    Rails.logger.info(
      "[agency] login user_id=#{user.id} route_group=#{context[:route_group]} " \
      "organization=#{org&.slug.inspect}"
    )
  end
end
