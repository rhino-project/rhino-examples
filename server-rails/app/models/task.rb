# frozen_string_literal: true

class Task < Rhino::RhinoModel
  include Rhino::HasAuditTrail
  include Discard::Model

  rhino_filters :title, :status, :priority
  rhino_sorts :title, :status, :priority, :due_date
  rhino_default_sort "created_at"

  # ---------------------------------------------------------------
  # Named scopes selectable with ?scope=
  # ---------------------------------------------------------------
  #
  #   ?scope=assignedToMe                                  no arguments
  #   ?scope[dueBefore]=2026-12-31                         one declared parameter
  #   ?scope[dueBetween][from]=a&scope[dueBetween][to]=b   named parameters
  #   ?scope[byStatus][status]=todo                        'priority' is optional
  #
  rhino_scopes :active,
               assigned_to_me: { with: lambda { |relation, user|
                 user ? relation.where(assignee_id: user.id) : relation.none
               } },
               due_before: { params: [:date] },
               due_between: { params: %i[from to] },
               by_status: { params: %i[status priority], optional: [:priority] }
  rhino_default_scope :active

  scope :active, -> { where.not(status: "done") }
  scope :due_before, ->(date) { where.not(due_date: nil).where("due_date < ?", date) }
  scope :due_between, ->(from, to) { where(due_date: from..to) }
  scope :by_status, lambda { |status, priority = nil|
    relation = where(status: status)
    priority ? relation.where(priority: priority) : relation
  }

  # ---------------------------------------------------------------
  # Named scopes selectable with ?scope=
  # ---------------------------------------------------------------
  #
  #   ?scope=assignedToMe                                  no arguments
  #   ?scope[dueBefore]=2026-12-31                         one declared parameter
  #   ?scope[dueBetween][from]=a&scope[dueBetween][to]=b   named parameters
  #   ?scope[byStatus][status]=todo                        'priority' is optional
  #
  rhino_scopes :active,
               assigned_to_me: { with: lambda { |relation, user|
                 user ? relation.where(assignee_id: user.id) : relation.none
               } },
               due_before: { params: [:date] },
               due_between: { params: %i[from to] },
               by_status: { params: %i[status priority], optional: [:priority] }
  rhino_default_scope :active

  scope :active, -> { where.not(status: "done") }
  scope :due_before, ->(date) { where.not(due_date: nil).where("due_date < ?", date) }
  scope :due_between, ->(from, to) { where(due_date: from..to) }
  scope :by_status, lambda { |status, priority = nil|
    relation = where(status: status)
    priority ? relation.where(priority: priority) : relation
  }
  rhino_fields :id, :hash_id, :title, :description, :status, :priority, :estimated_hours, :due_date, :project_id, :assignee_id, :created_at, :updated_at
  rhino_includes :project, :assignee

  # Route Key: member endpoints match hash_id instead of the numeric id
  # (GET /api/{org}/tasks/{hash_id}; numeric ids no longer match).
  rhino_route_key :hash_id

  validates :title, length: { maximum: 255 }, allow_nil: true
  validates :status, inclusion: { in: %w[todo in_progress in_review done] }, allow_nil: true
  validates :priority, inclusion: { in: %w[low medium high critical] }, allow_nil: true

  # ---------------------------------------------------------------
  # Computed attributes (see "Computed Attributes" in the Rhino docs)
  # ---------------------------------------------------------------

  # OPT-IN per-row values: nothing is evaluated unless the client asks for it
  # by name via ?computed_attributes=comment_count,is_overdue
  def rhino_record_computed_attributes
    {
      "comment_count" => ->(record, _user) { record.comments.count },
      "is_overdue" => lambda { |record, _user|
        record.due_date.present? && record.status != "done" && record.due_date < Date.current
      }
    }
  end

  # COLLECTION-level aggregates: evaluated ONCE per request over the scoped,
  # filtered relation. Served by GET /api/{org}/tasks/computed?attributes=...
  def self.rhino_collection_computed_attributes
    {
      "total_count" => ->(scope, _user) { scope.count },
      "open_tasks_count" => ->(scope, _user) { scope.where.not(status: "done").count },
      "done_tasks_count" => ->(scope, _user) { scope.where(status: "done").count },
      "high_priority_count" => ->(scope, _user) { scope.where(priority: "high").count },
      "estimated_hours_total" => ->(scope, _user) { scope.sum(:estimated_hours).to_f }
    }
  end

  belongs_to :project
  belongs_to :assignee, class_name: "User", optional: true
  has_many :comments, dependent: :destroy
  has_and_belongs_to_many :labels, join_table: :task_labels
end
