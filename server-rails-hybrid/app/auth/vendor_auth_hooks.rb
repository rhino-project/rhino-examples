# frozen_string_literal: true

# Lifecycle hooks for the `vendor` route group (GROUP_AUTH_DESIGN.md §7).
#
# A DIFFERENT post-auth behavior from the agency sign-in: this demo records a
# distinct vendor tag. A real app might enforce vendor onboarding state and
# reject (raise Rhino::AuthRejected) for not-yet-approved vendors.
class VendorAuthHooks < Rhino::AuthHooks
  def after_login(user, context = {})
    org = context[:organization]
    Rails.logger.info(
      "[vendor] login user_id=#{user.id} route_group=#{context[:route_group]} " \
      "organization=#{org&.slug.inspect}"
    )
  end
end
