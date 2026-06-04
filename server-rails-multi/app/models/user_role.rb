# frozen_string_literal: true

class UserRole < ApplicationRecord
  belongs_to :user
  # organization_id is nullable after AddGroupMembership (non-tenant group
  # memberships have no org). Tenant-group rows still carry an org.
  belongs_to :organization, optional: true
  belongs_to :role

  # A membership is keyed by (user, organization, route_group) per the canonical
  # group-auth schema (GROUP_AUTH_DESIGN.md §3).
  validates :user_id, uniqueness: { scope: [:organization_id, :route_group] }
end
