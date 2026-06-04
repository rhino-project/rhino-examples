# frozen_string_literal: true

# Single-tenant CommentPolicy — permissive on attributes; ownership enforced by
# Scopes::CommentScope (comments under the current user's projects).
class CommentPolicy < Rhino::ResourcePolicy
  def permitted_attributes_for_show(_user) = ["*"]
  def hidden_attributes_for_show(_user) = []
  def permitted_attributes_for_create(_user) = %w[body task_id]
  def permitted_attributes_for_update(_user) = %w[body]
end
