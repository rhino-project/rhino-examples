# frozen_string_literal: true

class Project < Rhino::RhinoModel
  include Rhino::HasAuditTrail
  include Rhino::BelongsToOrganization
  include Discard::Model

  # 'budget' is queryable here, but the policy hides it from members and
  # viewers — for them ?filter[budget]= and ?sort=budget return 403.
  rhino_filters :title, :status, :budget
  rhino_sorts :title, :status, :budget, :starts_at, :ends_at
  # 'internal_notes' is hidden from everyone but owners and admins, so for
  # everyone else ?search= quietly skips it and only matches on the title.
  rhino_search :title, :internal_notes
  rhino_default_sort "created_at"
  rhino_fields :id, :title, :description, :status, :budget, :internal_notes, :starts_at, :ends_at, :created_at, :updated_at

  validates :title, length: { maximum: 255 }, allow_nil: true
  validates :status, inclusion: { in: %w[draft active completed archived] }, allow_nil: true

  has_many :tasks, dependent: :destroy
end
