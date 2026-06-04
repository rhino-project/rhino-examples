# frozen_string_literal: true

# PersonalProjectPolicy — the `personal` group's user-owned model.
#
# Action-level authorization runs through the normal permission machinery
# (the personal membership row grants `personal-projects.*`). Row isolation is
# enforced by Scopes::PersonalProjectScope, so the policy is permissive on
# attributes.
class PersonalProjectPolicy < Rhino::ResourcePolicy
  def permitted_attributes_for_show(_user) = ["*"]
  def hidden_attributes_for_show(_user) = []
  def permitted_attributes_for_create(_user) = %w[title description status]
  def permitted_attributes_for_update(_user) = %w[title description status]
end
