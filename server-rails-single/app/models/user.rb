# frozen_string_literal: true

# Single-tenant TaskFlow user.
#
# There is NO Organization / Role / UserRole in this variant. A user simply owns
# their own rows (Projects, and Tasks/Comments via their parent Project). The
# Label catalog is a shared global resource with no owner.
#
# This variant intentionally does NOT include Rhino::HasPermissions (which
# assumes the Organization/UserRole machinery). Because the user does not respond
# to #has_permission?, Rhino::ResourcePolicy falls through to "allow" — so
# authorization is purely OWNERSHIP-based, applied by the per-model query scopes
# in app/models/scopes (user_id == current user).
class User < ApplicationRecord
  has_secure_password

  has_many :projects, dependent: :destroy

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true

  has_secure_token :api_token
end
