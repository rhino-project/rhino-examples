# frozen_string_literal: true

# Single-tenant ProjectPolicy.
#
# No roles in this variant — authorization is ownership-based and enforced by
# Scopes::ProjectScope (a user only ever queries their own rows). The policy is
# therefore fully permissive on attributes; action-level checks pass because the
# User omits HasPermissions so Rhino::ResourcePolicy falls through to "allow".
class ProjectPolicy < Rhino::ResourcePolicy
  def permitted_attributes_for_show(_user) = ["*"]
  def hidden_attributes_for_show(_user) = []
  def permitted_attributes_for_create(_user) = ["*"]
  def permitted_attributes_for_update(_user) = ["*"]
end
