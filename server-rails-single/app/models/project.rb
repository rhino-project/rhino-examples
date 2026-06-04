# frozen_string_literal: true

# Project — top-level user-owned model in the single-tenant variant.
#
# Ownership is by user_id. On create, user_id is auto-stamped from the
# authenticated user (RequestStore). Read/write isolation is enforced by
# Scopes::ProjectScope, which constrains every query to the current user's rows.
class Project < Rhino::RhinoModel
  include Rhino::HasAuditTrail
  include Discard::Model

  rhino_filters :title, :status
  rhino_sorts :title, :status, :starts_at, :ends_at
  rhino_default_sort "created_at"
  rhino_fields :id, :user_id, :title, :description, :status, :budget, :internal_notes, :starts_at, :ends_at, :created_at, :updated_at

  validates :title, length: { maximum: 255 }, allow_nil: true
  validates :status, inclusion: { in: %w[draft active completed archived] }, allow_nil: true

  belongs_to :user
  has_many :tasks, dependent: :destroy

  # Auto-stamp ownership from the authenticated user on create. Skipped when
  # user_id is already set (seeds) or when there is no request user (console).
  before_validation :auto_set_user_id, on: :create

  private

  def auto_set_user_id
    return if user_id.present?
    return unless defined?(RequestStore)

    current_user = RequestStore.store[:rhino_current_user]
    self.user_id = current_user.id if current_user
  end
end
