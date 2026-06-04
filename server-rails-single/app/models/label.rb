# frozen_string_literal: true

# Label — SHARED GLOBAL catalog in the single-tenant variant.
#
# Labels are NOT user-owned: there is no BelongsToOrganization and no
# Scopes::LabelScope, so every authenticated user sees the same catalog. This
# demonstrates "the user owns everything except shared/global tables."
class Label < Rhino::RhinoModel
  include Discard::Model

  rhino_filters :name
  rhino_sorts :name
  rhino_default_sort "created_at"
  rhino_fields :id, :name, :color, :created_at, :updated_at

  rhino_except_actions :forceDelete

  validates :name, length: { maximum: 255 }, allow_nil: true

  has_and_belongs_to_many :tasks, join_table: :task_labels
end
