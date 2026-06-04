# frozen_string_literal: true

# Single-tenant TaskPolicy — permissive on attributes; ownership enforced by
# Scopes::TaskScope (tasks of the current user's projects). See ProjectPolicy.
class TaskPolicy < Rhino::ResourcePolicy
  def permitted_attributes_for_show(_user) = ["*"]
  def hidden_attributes_for_show(_user) = []
  def permitted_attributes_for_create(_user) = ["*"]
  def permitted_attributes_for_update(_user) = ["*"]
end
