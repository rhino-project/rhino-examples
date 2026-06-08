# frozen_string_literal: true

class OrgRolePermission < ApplicationRecord
  belongs_to :organization
  belongs_to :role
end
