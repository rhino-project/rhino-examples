# frozen_string_literal: true

class UserRole < ApplicationRecord
  belongs_to :user
  # Non-tenant group memberships (e.g. the `personal` group) have no org, so
  # organization_id is nullable after AddGroupMembership. Tenant-group rows
  # (agency/vendor) still carry an org.
  belongs_to :organization, optional: true
  belongs_to :role

  # A membership is keyed by (user, organization, route_group) per the canonical
  # group-auth schema (GROUP_AUTH_DESIGN.md §3). This lets the same user hold
  # distinct memberships in agency vs vendor vs personal.
  validates :user_id, uniqueness: { scope: [:organization_id, :route_group] }
end
