# frozen_string_literal: true

class Comment < Rhino::RhinoModel
  include Rhino::HasUuid
  include Discard::Model

  rhino_default_sort "created_at"
  rhino_fields :id, :body, :task_id, :user_id, :uuid, :created_at, :updated_at
  rhino_includes :task, :user

  validates :body, presence: true, allow_nil: true

  # Scope for organization filtering (avoids framework join bug with 3-level nesting)
  def self.for_organization(organization)
    joins(task: :project).where(projects: { organization_id: organization.id })
  end

  belongs_to :task
  belongs_to :user, optional: true

  before_validation :auto_set_user_id, on: :create

  private

  def auto_set_user_id
    return if user_id.present?
    return unless defined?(RequestStore)

    current_user = RequestStore.store[:rhino_current_user]
    self.user_id = current_user.id if current_user
  end
end
