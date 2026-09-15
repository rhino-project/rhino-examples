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
  #
  # An attribute may also declare PARAMETERS the client supplies, using the
  # same bracket wire form named scopes use:
  #
  #   ?computed_attributes=comment_count,is_overdue      legacy comma list
  #   ?computed_attributes[comment_count]=               bracket, no arguments
  #   ?computed_attributes[is_due_before]=2026-01-01     one declared parameter
  #   ?computed_attributes[is_due_before][date]=...      named parameter
  #
  # Bound arguments arrive after the user, in the order `params:` declares them.
  def rhino_record_computed_attributes
    {
      "comment_count" => ->(record, _user) { record.comments.count },
      "is_overdue" => lambda { |record, _user|
        record.due_date.present? && record.status != "done" && record.due_date < Date.current
      },

      # Parameterised record attribute: is this row due before the
      # client-supplied date?
      "is_due_before" => {
        params: [:date],
        with: ->(record, _user, date) { record.due_date.present? && record.due_date < Date.parse(date.to_s) }
      }
    }
  end

  # COLLECTION-level aggregates: evaluated ONCE per request over the scoped,
  # filtered relation. Served by GET /api/{org}/tasks/computed?attributes=...
  #
  #   ?attributes=total_count,done_tasks_count            legacy comma list
  #   ?attributes[total_count]=                           bracket, no arguments
  #   ?attributes[count_by_status]=todo                   one declared parameter
  #   ?attributes[tasks_due_between][from]=a&...[to]=b    named parameters
  #
  # A bare GET /computed still returns everything the policy allows, minus any
  # attribute with a REQUIRED parameter — those are skipped silently, so adding
  # one here never breaks a client that asks for everything.
  def self.rhino_collection_computed_attributes
    {
      "total_count" => ->(scope, _user) { scope.count },
      "open_tasks_count" => ->(scope, _user) { scope.where.not(status: "done").count },
      "done_tasks_count" => ->(scope, _user) { scope.where(status: "done").count },
      "high_priority_count" => ->(scope, _user) { scope.where(priority: "high").count },
      "estimated_hours_total" => ->(scope, _user) { scope.sum(:estimated_hours).to_f },

      # Two required parameters: skipped by a bare /computed.
      "tasks_due_between" => {
        params: %i[from to],
        with: ->(scope, _user, from, to) { scope.where(due_date: from..to).count }
      },

      # One required parameter, so the bare-value form binds it:
      # ?attributes[count_by_status]=todo
      "count_by_status" => {
        params: [:status],
        with: ->(scope, _user, status) { scope.where(status: status).count }
      },

      # Every parameter optional: evaluated with no arguments by a bare
      # /computed, and narrowed when the client supplies a window.
      # 'only_high_priority' also shows "true"/"false" coercing to a real
      # boolean before the callable sees it.
      "windowed_task_count" => {
        params: %i[from to only_high_priority],
        optional: %i[from to only_high_priority],
        with: lambda { |scope, _user, from = nil, to = nil, only_high_priority = false|
          scope = scope.where("due_date >= ?", from) if from
          scope = scope.where("due_date <= ?", to) if to
          scope = scope.where(priority: "high") if only_high_priority == true
          scope.count
        }
      }
    }
  end

  belongs_to :project
  belongs_to :assignee, class_name: "User", optional: true
  has_many :comments, dependent: :destroy
  has_and_belongs_to_many :labels, join_table: :task_labels
end
