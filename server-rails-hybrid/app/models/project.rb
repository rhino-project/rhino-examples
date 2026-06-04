# frozen_string_literal: true

class Project < Rhino::RhinoModel
  include Rhino::HasAuditTrail
  include Rhino::BelongsToOrganization
  include Discard::Model

  rhino_filters :title, :status
  rhino_sorts :title, :status, :starts_at, :ends_at
  rhino_default_sort "created_at"
  rhino_fields :id, :title, :description, :status, :budget, :internal_notes, :starts_at, :ends_at, :created_at, :updated_at

  validates :title, length: { maximum: 255 }, allow_nil: true
  validates :status, inclusion: { in: %w[draft active completed archived] }, allow_nil: true

  has_many :tasks, dependent: :destroy
end
