# frozen_string_literal: true

# Single-tenant LabelPolicy.
#
# Labels are a SHARED GLOBAL catalog (no owner, no LabelScope), so every
# authenticated user can read and manage the shared set. Permissive on
# attributes; action-level checks pass via the permissive-policy fallback.
class LabelPolicy < Rhino::ResourcePolicy
  def permitted_attributes_for_show(_user) = ["*"]
  def hidden_attributes_for_show(_user) = []
  def permitted_attributes_for_create(_user) = %w[name color]
  def permitted_attributes_for_update(_user) = %w[name color]
end
