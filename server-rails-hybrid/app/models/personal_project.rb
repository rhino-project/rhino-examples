# frozen_string_literal: true

# PersonalProject — user-owned model for the `personal` route group.
#
# Owned by user_id (no organization). Read/write isolation is enforced by
# Scopes::PersonalProjectScope (auto-discovered default scope). user_id is
# auto-stamped from the authenticated user on create. Served only by the
# `personal` group; the org-owned Project table serves agency/vendor.
class PersonalProject < Rhino::RhinoModel
  include Discard::Model

  rhino_filters :title, :status
  rhino_sorts :title, :status
  rhino_default_sort "created_at"
  rhino_fields :id, :user_id, :title, :description, :status, :created_at, :updated_at
  rhino_includes :user

  validates :title, length: { maximum: 255 }, allow_nil: true
  validates :status, inclusion: { in: %w[draft active completed archived] }, allow_nil: true

  belongs_to :user

  before_validation :auto_set_user_id, on: :create

  private

  def auto_set_user_id
    return if user_id.present?
    return unless defined?(RequestStore)

    current_user = RequestStore.store[:rhino_current_user]
    self.user_id = current_user.id if current_user
  end
end
