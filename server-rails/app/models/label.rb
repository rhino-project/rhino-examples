# frozen_string_literal: true

class Label < Rhino::RhinoModel
  include Rhino::BelongsToOrganization
  include Discard::Model

  rhino_filters :name
  rhino_sorts :name
  rhino_default_sort "created_at"
  rhino_fields :id, :name, :slug, :color, :created_at, :updated_at

  rhino_except_actions :forceDelete

  # Route Key: member endpoints match slug instead of the numeric id
  # (GET /api/{org}/labels/{slug}; numeric ids no longer match).
  rhino_route_key :slug

  validates :name, length: { maximum: 255 }, allow_nil: true

  has_and_belongs_to_many :tasks, join_table: :task_labels
end
